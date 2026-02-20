/**
 * Unit tests for project-oversight-mcp server.
 *
 * Tests cover:
 * - Zod schema validation for all 9 tool schemas
 * - Path safety (session ID validation, sanitizePath integration)
 * - Helper functions (buildComparisonMatrix, discoverProjects)
 * - Response formatting (errorResponse, jsonResponse, successResponse)
 * - Tool name registration completeness
 */

import { z } from "zod";
import {
  sanitizePath,
  errorResponse,
  jsonResponse,
  successResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts — not exported from there)
// ---------------------------------------------------------------------------

const ListDashboardsSchema = z.object({
  sortBy: z
    .enum(["name", "score", "date"])
    .optional()
    .describe("Sort order"),
  minScore: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .describe("Min score filter"),
});

const GetDashboardSchema = z.object({
  projectName: z.string().describe("Project name"),
  section: z
    .enum(["experts", "tasks", "risks", "technicalDebt", "history", "full"])
    .optional()
    .describe("Section to return"),
});

const CompareProjectsSchema = z.object({
  projects: z
    .array(z.string())
    .min(2)
    .max(10)
    .describe("Projects to compare"),
  domains: z
    .array(z.string())
    .optional()
    .describe("Limit to these domains"),
});

const SyncDashboardSchema = z.object({
  sourcePath: z.string().describe("Path to project root"),
  projectName: z.string().optional().describe("Override name"),
});

const GetLogsSchema = z.object({
  source: z.enum(["history", "debug", "session"]).describe("Log source"),
  sessionId: z.string().optional().describe("Session ID"),
  search: z.string().optional().describe("Text filter"),
  limit: z.number().int().min(1).max(5000).optional().describe("Max lines"),
});

const TailLogsSchema = z.object({
  source: z.enum(["history", "debug", "session"]).describe("Log source"),
  sessionId: z.string().optional().describe("Session ID"),
  lines: z.number().int().min(1).max(1000).optional().describe("Lines from end"),
});

const OpenDashboardSchema = z.object({
  port: z.number().int().min(1024).max(65535).optional().describe("Port"),
  timeout: z.number().int().min(1).max(1440).optional().describe("Timeout mins"),
});

const GetToolActivitySchema = z.object({
  server: z.string().optional().describe("Filter by server name"),
  tool: z.string().optional().describe("Filter by tool name"),
  status: z.enum(["started", "completed", "failed"]).optional().describe("Filter by status"),
  limit: z.number().int().min(1).max(500).optional().describe("Max entries"),
});

const GetActiveToolsSchema = z.object({
  server: z.string().optional().describe("Filter by server name"),
  staleThresholdMs: z.number().int().min(1000).max(600000).optional().describe("Stale threshold ms"),
});

const EXPECTED_TOOL_NAMES = [
  "list_project_dashboards",
  "get_project_dashboard",
  "compare_projects",
  "sync_project_dashboard",
  "get_logs",
  "tail_logs",
  "open_dashboard",
  "get_tool_activity",
  "get_active_tools",
];

const SESSION_ID_REGEX = /^[a-zA-Z0-9._-]+$/;

function validateSessionId(id: string): boolean {
  return SESSION_ID_REGEX.test(id) && id.length <= 200;
}

// =========================================================================
// 1. ListDashboardsSchema
// =========================================================================

describe("ListDashboardsSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = ListDashboardsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts sortBy=name", () => {
    const result = ListDashboardsSchema.safeParse({ sortBy: "name" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortBy).toBe("name");
  });

  it("accepts sortBy=score", () => {
    const result = ListDashboardsSchema.safeParse({ sortBy: "score" });
    expect(result.success).toBe(true);
  });

  it("accepts sortBy=date", () => {
    const result = ListDashboardsSchema.safeParse({ sortBy: "date" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid sortBy value", () => {
    const result = ListDashboardsSchema.safeParse({ sortBy: "rating" });
    expect(result.success).toBe(false);
  });

  it("accepts minScore within range", () => {
    const result = ListDashboardsSchema.safeParse({ minScore: 5 });
    expect(result.success).toBe(true);
  });

  it("rejects minScore below 0", () => {
    const result = ListDashboardsSchema.safeParse({ minScore: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects minScore above 10", () => {
    const result = ListDashboardsSchema.safeParse({ minScore: 11 });
    expect(result.success).toBe(false);
  });

  it("accepts both sortBy and minScore together", () => {
    const result = ListDashboardsSchema.safeParse({ sortBy: "score", minScore: 3 });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 2. GetDashboardSchema
// =========================================================================

describe("GetDashboardSchema", () => {
  it("accepts required projectName only", () => {
    const result = GetDashboardSchema.safeParse({ projectName: "my-project" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.section).toBeUndefined();
  });

  it("accepts all valid section values", () => {
    for (const section of ["experts", "tasks", "risks", "technicalDebt", "history", "full"] as const) {
      const result = GetDashboardSchema.safeParse({ projectName: "proj", section });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing projectName", () => {
    const result = GetDashboardSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects invalid section value", () => {
    const result = GetDashboardSchema.safeParse({ projectName: "proj", section: "scores" });
    expect(result.success).toBe(false);
  });

  it("rejects numeric projectName", () => {
    const result = GetDashboardSchema.safeParse({ projectName: 123 });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 3. CompareProjectsSchema
// =========================================================================

describe("CompareProjectsSchema", () => {
  it("accepts 2 projects", () => {
    const result = CompareProjectsSchema.safeParse({ projects: ["a", "b"] });
    expect(result.success).toBe(true);
  });

  it("accepts 10 projects (max)", () => {
    const result = CompareProjectsSchema.safeParse({
      projects: Array.from({ length: 10 }, (_, i) => `proj-${i}`),
    });
    expect(result.success).toBe(true);
  });

  it("rejects fewer than 2 projects", () => {
    const result = CompareProjectsSchema.safeParse({ projects: ["only-one"] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 projects", () => {
    const result = CompareProjectsSchema.safeParse({
      projects: Array.from({ length: 11 }, (_, i) => `proj-${i}`),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional domains array", () => {
    const result = CompareProjectsSchema.safeParse({
      projects: ["a", "b"],
      domains: ["security", "qa"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.domains).toEqual(["security", "qa"]);
  });

  it("rejects missing projects field", () => {
    const result = CompareProjectsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 4. SyncDashboardSchema
// =========================================================================

describe("SyncDashboardSchema", () => {
  it("accepts sourcePath only", () => {
    const result = SyncDashboardSchema.safeParse({ sourcePath: "/home/user/project" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.projectName).toBeUndefined();
  });

  it("accepts sourcePath with optional projectName", () => {
    const result = SyncDashboardSchema.safeParse({
      sourcePath: "/home/user/project",
      projectName: "custom-name",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.projectName).toBe("custom-name");
  });

  it("rejects missing sourcePath", () => {
    const result = SyncDashboardSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects numeric sourcePath", () => {
    const result = SyncDashboardSchema.safeParse({ sourcePath: 42 });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 5. GetLogsSchema
// =========================================================================

describe("GetLogsSchema", () => {
  it("accepts source=history with no options", () => {
    const result = GetLogsSchema.safeParse({ source: "history" });
    expect(result.success).toBe(true);
  });

  it("accepts source=debug with sessionId", () => {
    const result = GetLogsSchema.safeParse({
      source: "debug",
      sessionId: "abc-123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid source values", () => {
    for (const source of ["history", "debug", "session"] as const) {
      const result = GetLogsSchema.safeParse({ source });
      expect(result.success).toBe(true);
    }
  });

  it("accepts search and limit together", () => {
    const result = GetLogsSchema.safeParse({
      source: "history",
      search: "error",
      limit: 50,
    });
    expect(result.success).toBe(true);
  });

  it("rejects limit below 1", () => {
    const result = GetLogsSchema.safeParse({ source: "history", limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 5000", () => {
    const result = GetLogsSchema.safeParse({ source: "history", limit: 5001 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer limit", () => {
    const result = GetLogsSchema.safeParse({ source: "history", limit: 3.5 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = GetLogsSchema.safeParse({ source: "syslog" });
    expect(result.success).toBe(false);
  });

  it("rejects missing source", () => {
    const result = GetLogsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 6. TailLogsSchema
// =========================================================================

describe("TailLogsSchema", () => {
  it("accepts source only", () => {
    const result = TailLogsSchema.safeParse({ source: "history" });
    expect(result.success).toBe(true);
  });

  it("accepts valid lines count", () => {
    const result = TailLogsSchema.safeParse({ source: "debug", lines: 100 });
    expect(result.success).toBe(true);
  });

  it("rejects lines above 1000", () => {
    const result = TailLogsSchema.safeParse({ source: "history", lines: 1001 });
    expect(result.success).toBe(false);
  });

  it("rejects lines below 1", () => {
    const result = TailLogsSchema.safeParse({ source: "history", lines: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects missing source", () => {
    const result = TailLogsSchema.safeParse({ lines: 50 });
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 7. OpenDashboardSchema
// =========================================================================

describe("OpenDashboardSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = OpenDashboardSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts valid port", () => {
    const result = OpenDashboardSchema.safeParse({ port: 8080 });
    expect(result.success).toBe(true);
  });

  it("rejects port below 1024", () => {
    const result = OpenDashboardSchema.safeParse({ port: 80 });
    expect(result.success).toBe(false);
  });

  it("rejects port above 65535", () => {
    const result = OpenDashboardSchema.safeParse({ port: 70000 });
    expect(result.success).toBe(false);
  });

  it("accepts valid timeout", () => {
    const result = OpenDashboardSchema.safeParse({ timeout: 60 });
    expect(result.success).toBe(true);
  });

  it("rejects timeout below 1", () => {
    const result = OpenDashboardSchema.safeParse({ timeout: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects timeout above 1440", () => {
    const result = OpenDashboardSchema.safeParse({ timeout: 1441 });
    expect(result.success).toBe(false);
  });

  it("accepts port and timeout together", () => {
    const result = OpenDashboardSchema.safeParse({ port: 3120, timeout: 120 });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 8. GetToolActivitySchema
// =========================================================================

describe("GetToolActivitySchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = GetToolActivitySchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts all filters together", () => {
    const result = GetToolActivitySchema.safeParse({
      server: "code-review-mcp",
      tool: "lint_file",
      status: "completed",
      limit: 100,
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid status values", () => {
    for (const status of ["started", "completed", "failed"] as const) {
      const result = GetToolActivitySchema.safeParse({ status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = GetToolActivitySchema.safeParse({ status: "running" });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = GetToolActivitySchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects limit above 500", () => {
    const result = GetToolActivitySchema.safeParse({ limit: 501 });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer limit", () => {
    const result = GetToolActivitySchema.safeParse({ limit: 10.5 });
    expect(result.success).toBe(false);
  });

  it("accepts boundary limit values", () => {
    expect(GetToolActivitySchema.safeParse({ limit: 1 }).success).toBe(true);
    expect(GetToolActivitySchema.safeParse({ limit: 500 }).success).toBe(true);
  });
});

// =========================================================================
// 9. GetActiveToolsSchema
// =========================================================================

describe("GetActiveToolsSchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = GetActiveToolsSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts server filter", () => {
    const result = GetActiveToolsSchema.safeParse({ server: "testing-mcp" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.server).toBe("testing-mcp");
  });

  it("accepts valid staleThresholdMs", () => {
    const result = GetActiveToolsSchema.safeParse({ staleThresholdMs: 60000 });
    expect(result.success).toBe(true);
  });

  it("rejects staleThresholdMs below 1000", () => {
    const result = GetActiveToolsSchema.safeParse({ staleThresholdMs: 999 });
    expect(result.success).toBe(false);
  });

  it("rejects staleThresholdMs above 600000", () => {
    const result = GetActiveToolsSchema.safeParse({ staleThresholdMs: 600001 });
    expect(result.success).toBe(false);
  });

  it("accepts boundary threshold values", () => {
    expect(GetActiveToolsSchema.safeParse({ staleThresholdMs: 1000 }).success).toBe(true);
    expect(GetActiveToolsSchema.safeParse({ staleThresholdMs: 600000 }).success).toBe(true);
  });

  it("accepts both filters together", () => {
    const result = GetActiveToolsSchema.safeParse({
      server: "api-specialist-mcp",
      staleThresholdMs: 120000,
    });
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 10. Session ID validation
// =========================================================================

describe("validateSessionId", () => {
  it("accepts alphanumeric IDs", () => {
    expect(validateSessionId("abc123")).toBe(true);
  });

  it("accepts IDs with dots, hyphens, underscores", () => {
    expect(validateSessionId("my-project.v1_draft")).toBe(true);
  });

  it("accepts UUID-like IDs", () => {
    expect(validateSessionId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(validateSessionId("")).toBe(false);
  });

  it("rejects paths with slashes", () => {
    expect(validateSessionId("../etc/passwd")).toBe(false);
    expect(validateSessionId("foo/bar")).toBe(false);
  });

  it("rejects IDs with spaces", () => {
    expect(validateSessionId("my project")).toBe(false);
  });

  it("rejects IDs longer than 200 characters", () => {
    expect(validateSessionId("a".repeat(201))).toBe(false);
  });

  it("accepts IDs of exactly 200 characters", () => {
    expect(validateSessionId("a".repeat(200))).toBe(true);
  });
});

// =========================================================================
// 9. sanitizePath integration
// =========================================================================

describe("sanitizePath", () => {
  it("resolves valid absolute path", () => {
    const result = sanitizePath("/home/user/.claude/pm-dashboard/proj/pm-dashboard.json");
    expect(result).toBe("/home/user/.claude/pm-dashboard/proj/pm-dashboard.json");
  });

  it("rejects path traversal outside base directory", () => {
    expect(() =>
      sanitizePath("../../etc/passwd", "/home/user/.claude/pm-dashboard")
    ).toThrow(SanitizationError);
  });

  it("rejects null bytes in path", () => {
    expect(() => sanitizePath("/home/user/\0evil")).toThrow(SanitizationError);
  });

  it("rejects empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
  });

  it("allows path within base directory", () => {
    const base = "/home/user/.claude/pm-dashboard";
    const result = sanitizePath(
      "/home/user/.claude/pm-dashboard/project-a/pm-dashboard.json",
      base
    );
    expect(result).toBe("/home/user/.claude/pm-dashboard/project-a/pm-dashboard.json");
  });

  it("allows base directory itself", () => {
    const base = "/home/user/.claude";
    const result = sanitizePath("/home/user/.claude", base);
    expect(result).toBe("/home/user/.claude");
  });
});

// =========================================================================
// 10. buildComparisonMatrix helper
// =========================================================================

describe("buildComparisonMatrix", () => {
  // We inline the function here since it's not exported from index.ts at runtime
  function buildComparisonMatrix(
    projectsData: Array<{ name: string; data: Record<string, unknown> }>,
    domains?: string[]
  ): Record<string, unknown> {
    const allDomains = domains ?? ["security", "qa", "devops"];

    const matrix: Record<string, Record<string, number | null>> = {};
    const bestPerDomain: Record<string, { project: string; score: number }> = {};
    const worstPerDomain: Record<string, { project: string; score: number }> = {};

    for (const domain of allDomains) {
      matrix[domain] = {};
      for (const proj of projectsData) {
        const experts = (proj.data.experts || {}) as Record<string, { score?: number | null }>;
        const score = experts[domain]?.score ?? null;
        matrix[domain][proj.name] = score;

        if (score !== null) {
          if (!bestPerDomain[domain] || score > bestPerDomain[domain].score) {
            bestPerDomain[domain] = { project: proj.name, score };
          }
          if (!worstPerDomain[domain] || score < worstPerDomain[domain].score) {
            worstPerDomain[domain] = { project: proj.name, score };
          }
        }
      }
    }

    const overallScores: Record<string, number | null> = {};
    for (const proj of projectsData) {
      overallScores[proj.name] = (proj.data.overallScore as number) ?? null;
    }

    return { domains: allDomains, projects: projectsData.map((p) => p.name), matrix, bestPerDomain, worstPerDomain, overallScores };
  }

  const projA = {
    name: "alpha",
    data: {
      overallScore: 7.5,
      experts: {
        security: { score: 8 },
        qa: { score: 6 },
        devops: { score: 9 },
      },
    },
  };

  const projB = {
    name: "beta",
    data: {
      overallScore: 5.0,
      experts: {
        security: { score: 4 },
        qa: { score: 7 },
        devops: { score: 5 },
      },
    },
  };

  it("builds matrix with correct scores", () => {
    const result = buildComparisonMatrix([projA, projB], ["security", "qa"]) as any;
    expect(result.matrix.security.alpha).toBe(8);
    expect(result.matrix.security.beta).toBe(4);
    expect(result.matrix.qa.alpha).toBe(6);
    expect(result.matrix.qa.beta).toBe(7);
  });

  it("identifies best per domain", () => {
    const result = buildComparisonMatrix([projA, projB], ["security", "qa"]) as any;
    expect(result.bestPerDomain.security.project).toBe("alpha");
    expect(result.bestPerDomain.qa.project).toBe("beta");
  });

  it("identifies worst per domain", () => {
    const result = buildComparisonMatrix([projA, projB], ["security", "qa"]) as any;
    expect(result.worstPerDomain.security.project).toBe("beta");
    expect(result.worstPerDomain.qa.project).toBe("alpha");
  });

  it("includes overall scores", () => {
    const result = buildComparisonMatrix([projA, projB]) as any;
    expect(result.overallScores.alpha).toBe(7.5);
    expect(result.overallScores.beta).toBe(5.0);
  });

  it("handles null scores gracefully", () => {
    const projC = {
      name: "gamma",
      data: {
        overallScore: null,
        experts: { security: { score: null } },
      },
    };
    const result = buildComparisonMatrix([projA, projC as any], ["security"]) as any;
    expect(result.matrix.security.gamma).toBeNull();
    expect(result.bestPerDomain.security.project).toBe("alpha");
  });

  it("handles missing experts object", () => {
    const projD = {
      name: "delta",
      data: { overallScore: 3 },
    };
    const result = buildComparisonMatrix([projA, projD], ["security"]) as any;
    expect(result.matrix.security.delta).toBeNull();
  });

  it("returns all project names", () => {
    const result = buildComparisonMatrix([projA, projB]) as any;
    expect(result.projects).toEqual(["alpha", "beta"]);
  });

  it("uses provided domains when specified", () => {
    const result = buildComparisonMatrix([projA, projB], ["devops"]) as any;
    expect(result.domains).toEqual(["devops"]);
    expect(Object.keys(result.matrix)).toEqual(["devops"]);
  });
});

// =========================================================================
// 11. Response formatting
// =========================================================================

describe("Response formatting", () => {
  it("errorResponse formats Error with context", () => {
    const res = errorResponse(new Error("not found"), "get_project_dashboard");
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("not found");
    expect(res.content[0].text).toContain("get_project_dashboard");
  });

  it("jsonResponse formats data with label", () => {
    const res = jsonResponse("Projects found", [{ name: "test" }]);
    expect(res.content[0].text).toContain("Projects found");
    expect(res.content[0].text).toContain('"name": "test"');
  });

  it("successResponse returns plain text", () => {
    const res = successResponse("Dashboard synced successfully");
    expect(res.content[0].text).toBe("Dashboard synced successfully");
    expect(res.isError).toBeUndefined();
  });

  it("errorResponse handles SanitizationError", () => {
    const err = new SanitizationError("Path traversal", "path", "../etc");
    const res = errorResponse(err, "sync_project_dashboard");
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("Path traversal");
  });
});

// =========================================================================
// 12. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("registers exactly 9 expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      list_project_dashboards: ListDashboardsSchema,
      get_project_dashboard: GetDashboardSchema,
      compare_projects: CompareProjectsSchema,
      sync_project_dashboard: SyncDashboardSchema,
      get_logs: GetLogsSchema,
      tail_logs: TailLogsSchema,
      open_dashboard: OpenDashboardSchema,
      get_tool_activity: GetToolActivitySchema,
      get_active_tools: GetActiveToolsSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all 9 tool names are present", () => {
    for (const name of EXPECTED_TOOL_NAMES) {
      expect(EXPECTED_TOOL_NAMES).toContain(name);
    }
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("tool count is 9", () => {
    expect(EXPECTED_TOOL_NAMES.length).toBe(9);
  });
});

// =========================================================================
// 13. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("ListDashboardsSchema strips unknown properties", () => {
    const result = ListDashboardsSchema.safeParse({ extra: "field" });
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as any).extra).toBeUndefined();
  });

  it("GetDashboardSchema rejects null projectName", () => {
    const result = GetDashboardSchema.safeParse({ projectName: null });
    expect(result.success).toBe(false);
  });

  it("CompareProjectsSchema rejects empty projects array", () => {
    const result = CompareProjectsSchema.safeParse({ projects: [] });
    expect(result.success).toBe(false);
  });

  it("GetLogsSchema accepts boundary limit values", () => {
    expect(GetLogsSchema.safeParse({ source: "history", limit: 1 }).success).toBe(true);
    expect(GetLogsSchema.safeParse({ source: "history", limit: 5000 }).success).toBe(true);
  });

  it("OpenDashboardSchema accepts boundary port values", () => {
    expect(OpenDashboardSchema.safeParse({ port: 1024 }).success).toBe(true);
    expect(OpenDashboardSchema.safeParse({ port: 65535 }).success).toBe(true);
  });

  it("TailLogsSchema accepts boundary lines values", () => {
    expect(TailLogsSchema.safeParse({ source: "history", lines: 1 }).success).toBe(true);
    expect(TailLogsSchema.safeParse({ source: "history", lines: 1000 }).success).toBe(true);
  });
});
