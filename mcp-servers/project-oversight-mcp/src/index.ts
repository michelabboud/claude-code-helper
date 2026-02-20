#!/usr/bin/env node

/**
 * Project Oversight MCP Server
 *
 * Provides multi-project health oversight — dashboard aggregation, cross-project
 * comparison, log access, and live streaming through the Model Context Protocol.
 *
 * @author Michel Abboud (https://github.com/michelabboud)
 * @license Apache-2.0
 * @see https://github.com/michelabboud/claude-code-helper
 *
 * Created with assistance from Claude Code (Anthropic)
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { homedir } from "os";
import path from "node:path";
import { readdir, readFile, mkdir, copyFile, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import {
  runServer,
  registerTrackedToolHandler,
  generateRequestId,
  measureDuration,
  sanitizePath,
  errorResponse,
  jsonResponse,
  successResponse,
  ACTIVITY_LOG_PATH,
} from "mcp-shared";
import type { ActivityEntry } from "mcp-shared";

const SERVER_NAME = "project-oversight-mcp";
const SERVER_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOME = homedir();
const CLAUDE_DIR = path.join(HOME, ".claude");
const CENTRAL_STORE = path.join(CLAUDE_DIR, "pm-dashboard");
const SESSION_ID_REGEX = /^[a-zA-Z0-9._-]+$/;

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const ListDashboardsSchema = z.object({
  sortBy: z
    .enum(["name", "score", "date"])
    .optional()
    .describe("Sort order: name (alphabetical), score (descending), date (most recent)"),
  minScore: z
    .number()
    .min(0)
    .max(10)
    .optional()
    .describe("Only return projects with overall score >= this value"),
});

export const GetDashboardSchema = z.object({
  projectName: z.string().describe("Name of the project directory in ~/.claude/pm-dashboard/"),
  section: z
    .enum(["experts", "tasks", "risks", "technicalDebt", "history", "full"])
    .optional()
    .describe("Return only this section (default: full dashboard)"),
});

export const CompareProjectsSchema = z.object({
  projects: z
    .array(z.string())
    .min(2)
    .max(10)
    .describe("List of project names to compare"),
  domains: z
    .array(z.string())
    .optional()
    .describe("Limit comparison to these expert domains (e.g. ['security', 'qa'])"),
});

export const SyncDashboardSchema = z.object({
  sourcePath: z
    .string()
    .describe("Path to project root containing .claude/pm-dashboard.json"),
  projectName: z
    .string()
    .optional()
    .describe("Override project name for central store (default: basename of sourcePath)"),
});

export const GetLogsSchema = z.object({
  source: z
    .enum(["history", "debug", "session"])
    .describe("Log source: history (history.jsonl), debug (latest debug log), session (specific session)"),
  sessionId: z
    .string()
    .optional()
    .describe("Session ID (required for source=session, optional for source=debug)"),
  search: z.string().optional().describe("Filter log lines containing this text"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(5000)
    .optional()
    .describe("Max lines to return (default: 100)"),
});

export const TailLogsSchema = z.object({
  source: z
    .enum(["history", "debug", "session"])
    .describe("Log source to tail"),
  sessionId: z.string().optional().describe("Session ID for session/debug sources"),
  lines: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .describe("Number of lines from end (default: 50)"),
});

export const OpenDashboardSchema = z.object({
  port: z
    .number()
    .int()
    .min(1024)
    .max(65535)
    .optional()
    .describe("HTTP server port (default: 3120)"),
  timeout: z
    .number()
    .int()
    .min(1)
    .max(1440)
    .optional()
    .describe("Auto-shutdown timeout in minutes (default: 120)"),
});

export const GetToolActivitySchema = z.object({
  server: z.string().optional().describe("Filter by MCP server name (e.g. 'code-review-mcp')"),
  tool: z.string().optional().describe("Filter by tool name (e.g. 'lint_file')"),
  status: z
    .enum(["started", "completed", "failed"])
    .optional()
    .describe("Filter by status"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .describe("Max entries to return (default: 50)"),
});

export const GetActiveToolsSchema = z.object({
  server: z.string().optional().describe("Filter by MCP server name"),
  staleThresholdMs: z
    .number()
    .int()
    .min(1000)
    .max(600000)
    .optional()
    .describe("Consider 'started' entries older than this as stale (default: 300000 = 5 min)"),
});

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/** Validate a session ID to prevent path traversal */
function validateSessionId(id: string): boolean {
  return SESSION_ID_REGEX.test(id) && id.length <= 200;
}

/** Read and parse a PM dashboard JSON file */
async function readDashboard(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await readFile(filePath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Discover all project dashboards in the central store */
export async function discoverProjects(): Promise<Array<{ name: string; path: string; data: Record<string, unknown> }>> {
  const projects: Array<{ name: string; path: string; data: Record<string, unknown> }> = [];

  try {
    const entries = await readdir(CENTRAL_STORE, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dashPath = path.join(CENTRAL_STORE, entry.name, "pm-dashboard.json");
      const data = await readDashboard(dashPath);
      if (data) {
        projects.push({ name: entry.name, path: dashPath, data });
      }
    }
  } catch {
    // Central store doesn't exist yet — that's fine
  }

  return projects;
}

/** Resolve a log file path based on source type */
function resolveLogPath(source: string, sessionId?: string): string {
  switch (source) {
    case "history":
      return path.join(CLAUDE_DIR, "history.jsonl");
    case "debug": {
      if (sessionId) {
        return sanitizePath(
          path.join(CLAUDE_DIR, "debug", `${sessionId}.log`),
          path.join(CLAUDE_DIR, "debug")
        );
      }
      // Default: latest debug log will be found by caller
      return path.join(CLAUDE_DIR, "debug");
    }
    case "session": {
      if (!sessionId) throw new Error("sessionId is required for source=session");
      return sanitizePath(
        path.join(CLAUDE_DIR, "projects", sessionId),
        path.join(CLAUDE_DIR, "projects")
      );
    }
    default:
      throw new Error(`Unknown log source: ${source}`);
  }
}

/** Read log lines from a file with optional search filter */
async function readLogLines(
  filePath: string,
  limit: number,
  search?: string,
  fromEnd = false
): Promise<{ lines: string[]; totalLines: number; filePath: string }> {
  try {
    const content = await readFile(filePath, "utf-8");
    let allLines = content.split("\n").filter((l) => l.trim() !== "");

    if (search) {
      const searchLower = search.toLowerCase();
      allLines = allLines.filter((l) => l.toLowerCase().includes(searchLower));
    }

    const totalLines = allLines.length;

    if (fromEnd) {
      allLines = allLines.slice(-limit);
    } else {
      allLines = allLines.slice(0, limit);
    }

    return { lines: allLines, totalLines, filePath };
  } catch {
    return { lines: [], totalLines: 0, filePath };
  }
}

/** Find the most recent file in a directory */
async function findLatestFile(dirPath: string): Promise<string | null> {
  try {
    const entries = await readdir(dirPath);
    let latest: { name: string; mtime: number } | null = null;

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const info = await stat(fullPath);
      if (info.isFile() && (!latest || info.mtimeMs > latest.mtime)) {
        latest = { name: entry, mtime: info.mtimeMs };
      }
    }

    return latest ? path.join(dirPath, latest.name) : null;
  } catch {
    return null;
  }
}

/** Read and parse activity log entries */
async function readActivityEntries(limit: number): Promise<ActivityEntry[]> {
  const entries: ActivityEntry[] = [];

  // Read from both current and rotated log
  for (const filePath of [ACTIVITY_LOG_PATH, `${ACTIVITY_LOG_PATH}.1`]) {
    try {
      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim() !== "");
      for (const line of lines) {
        try {
          entries.push(JSON.parse(line) as ActivityEntry);
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // File doesn't exist
    }
  }

  // Sort by timestamp descending (most recent first)
  entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return entries.slice(0, limit);
}

/** Find tools that are currently running (started but not completed/failed) */
async function findActiveTools(staleThresholdMs: number): Promise<ActivityEntry[]> {
  const allEntries = await readActivityEntries(5000);
  const now = Date.now();

  // Track started tools and remove ones that have completed/failed
  const startedById = new Map<string, ActivityEntry>();
  const completedIds = new Set<string>();

  // Process in chronological order (entries are desc, so reverse)
  for (let i = allEntries.length - 1; i >= 0; i--) {
    const entry = allEntries[i];
    if (entry.status === "started") {
      startedById.set(entry.id, entry);
    } else {
      completedIds.add(entry.id);
    }
  }

  // Filter to only truly running tools (started but no completion entry)
  const active: ActivityEntry[] = [];
  for (const [id, entry] of startedById) {
    if (completedIds.has(id)) continue;

    // Check if stale
    const entryTime = new Date(entry.timestamp).getTime();
    if (now - entryTime > staleThresholdMs) continue;

    active.push(entry);
  }

  // Sort by timestamp descending
  active.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return active;
}

/** Build a comparison matrix across projects */
export function buildComparisonMatrix(
  projectsData: Array<{ name: string; data: Record<string, unknown> }>,
  domains?: string[]
): Record<string, unknown> {
  const allDomains = domains ?? [
    "qa", "uiux", "security", "devops", "networking", "development",
    "architecture", "product", "api", "monitoring", "database",
    "performance", "documentation", "specifications", "projectDocs", "progress",
  ];

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

  // Overall scores
  const overallScores: Record<string, number | null> = {};
  for (const proj of projectsData) {
    overallScores[proj.name] = (proj.data.overallScore as number) ?? null;
  }

  return {
    domains: allDomains,
    projects: projectsData.map((p) => p.name),
    matrix,
    bestPerDomain,
    worstPerDomain,
    overallScores,
  };
}

// ---------------------------------------------------------------------------
// Hello Verbose
// ---------------------------------------------------------------------------

function buildHelloVerbose(): string {
  return [
    `# ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Project health monitoring** — multi-project dashboards, score comparison, log access, MCP activity tracking.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`list_project_dashboards\` | Discover all projects with PM dashboard data in the central store |`,
    `| \`get_project_dashboard\` | Read a specific project's full PM dashboard or a section |`,
    `| \`compare_projects\` | Compare health scores across multiple projects |`,
    `| \`sync_project_dashboard\` | Copy a project's dashboard to the central store |`,
    `| \`get_logs\` | Read Claude Code logs (history, debug, session) with optional search filter |`,
    `| \`tail_logs\` | Return the last N lines from a Claude Code log source |`,
    `| \`open_dashboard\` | Launch the multi-project HTTP dashboard server in the browser |`,
    `| \`get_tool_activity\` | Query recent MCP tool activity across all servers |`,
    `| \`get_active_tools\` | Show MCP tools that are currently running right now |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                                           → Quick greeting + status check`,
    `hello {"verbose": true}                                            → Full server info and tool catalog`,
    `list_project_dashboards {}                                         → List all tracked projects`,
    `get_project_dashboard {"projectName": "my-app"}                   → Full dashboard for a project`,
    `compare_projects {"projects": ["my-app", "other-app"]}            → Compare project scores`,
    `sync_project_dashboard {"sourcePath": "/path/to/project"}         → Sync dashboard to central store`,
    `get_logs {"source": "history"}                                     → Read history log`,
    `tail_logs {"source": "debug", "lines": 100}                       → Tail debug log`,
    `open_dashboard {}                                                  → Open browser dashboard`,
    `get_tool_activity {"server": "code-review-mcp", "limit": 20}      → Recent tool activity`,
    `get_active_tools {}                                                → Currently running tools`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

runServer(
  {
    name: "project-oversight-mcp",
    version: "1.0.0",
  },
  (instance) => {
    const { server, logger } = instance;
    // -----------------------------------------------------------------------
    // List Tools
    // -----------------------------------------------------------------------
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_project_dashboards",
            description:
              "Discover all projects with PM dashboard data in the central store (~/.claude/pm-dashboard/). Returns a summary array with project names, overall scores, and assessment dates.",
            inputSchema: {
              type: "object",
              properties: {
                sortBy: {
                  type: "string",
                  enum: ["name", "score", "date"],
                  description: "Sort order: name (alphabetical), score (descending), date (most recent)",
                },
                minScore: {
                  type: "number",
                  description: "Only return projects with overall score >= this value",
                },
              },
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "get_project_dashboard",
            description:
              "Read a specific project's full PM dashboard or a particular section (experts, tasks, risks, technicalDebt, history).",
            inputSchema: {
              type: "object",
              properties: {
                projectName: {
                  type: "string",
                  description: "Name of the project directory in ~/.claude/pm-dashboard/",
                },
                section: {
                  type: "string",
                  enum: ["experts", "tasks", "risks", "technicalDebt", "history", "full"],
                  description: "Return only this section (default: full dashboard)",
                },
              },
              required: ["projectName"],
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "compare_projects",
            description:
              "Compare health scores across multiple projects. Builds a matrix showing each domain score per project and identifies best/worst performers per domain.",
            inputSchema: {
              type: "object",
              properties: {
                projects: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of project names to compare (2-10)",
                },
                domains: {
                  type: "array",
                  items: { type: "string" },
                  description: "Limit comparison to these expert domains",
                },
              },
              required: ["projects"],
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "sync_project_dashboard",
            description:
              "Copy a project's .claude/pm-dashboard.json to the central store (~/.claude/pm-dashboard/<name>/). This enables multi-project discovery and comparison.",
            inputSchema: {
              type: "object",
              properties: {
                sourcePath: {
                  type: "string",
                  description: "Path to project root containing .claude/pm-dashboard.json",
                },
                projectName: {
                  type: "string",
                  description: "Override project name for central store (default: basename of sourcePath)",
                },
              },
              required: ["sourcePath"],
            },
            annotations: {
              readOnlyHint: false,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "get_logs",
            description:
              "Read Claude Code logs from various sources. Supports history.jsonl, debug logs, and session-specific logs. Can filter by text search.",
            inputSchema: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  enum: ["history", "debug", "session"],
                  description: "Log source: history (history.jsonl), debug (latest debug log), session (specific session)",
                },
                sessionId: {
                  type: "string",
                  description: "Session ID (required for source=session)",
                },
                search: {
                  type: "string",
                  description: "Filter log lines containing this text",
                },
                limit: {
                  type: "number",
                  description: "Max lines to return (default: 100, max: 5000)",
                },
              },
              required: ["source"],
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "tail_logs",
            description:
              "Return the last N lines from a Claude Code log source. Includes file size and modification time metadata.",
            inputSchema: {
              type: "object",
              properties: {
                source: {
                  type: "string",
                  enum: ["history", "debug", "session"],
                  description: "Log source to tail",
                },
                sessionId: {
                  type: "string",
                  description: "Session ID for session/debug sources",
                },
                lines: {
                  type: "number",
                  description: "Number of lines from end (default: 50, max: 1000)",
                },
              },
              required: ["source"],
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "open_dashboard",
            description:
              "Launch the multi-project HTTP dashboard server and open it in the browser. The server auto-discovers projects and provides live log streaming via SSE. Auto-shuts down after inactivity.",
            inputSchema: {
              type: "object",
              properties: {
                port: {
                  type: "number",
                  description: "HTTP server port (default: 3120)",
                },
                timeout: {
                  type: "number",
                  description: "Auto-shutdown timeout in minutes (default: 120)",
                },
              },
            },
            annotations: {
              readOnlyHint: false,
              destructiveHint: false,
              idempotentHint: false,
            },
          },
          {
            name: "get_tool_activity",
            description:
              "Query recent MCP tool activity across all servers. Shows which tools ran, on which server, in which project, with what arguments, duration, and outcome. Filter by server, tool name, or status.",
            inputSchema: {
              type: "object",
              properties: {
                server: {
                  type: "string",
                  description: "Filter by MCP server name (e.g. 'code-review-mcp')",
                },
                tool: {
                  type: "string",
                  description: "Filter by tool name (e.g. 'lint_file')",
                },
                status: {
                  type: "string",
                  enum: ["started", "completed", "failed"],
                  description: "Filter by status",
                },
                limit: {
                  type: "number",
                  description: "Max entries to return (default: 50, max: 500)",
                },
              },
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "get_active_tools",
            description:
              "Show MCP tools that are currently running right now. Identifies tools that have started but not yet completed or failed. Useful for understanding what's happening across all MCP servers in real time.",
            inputSchema: {
              type: "object",
              properties: {
                server: {
                  type: "string",
                  description: "Filter by MCP server name",
                },
                staleThresholdMs: {
                  type: "number",
                  description: "Consider 'started' entries older than this (ms) as stale/stuck (default: 300000 = 5 min)",
                },
              },
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
          {
            name: "hello",
            description: "Handshake check — verify this server is online. Returns a greeting. Pass verbose=true for the full tool catalog, usage guide, and server info.",
            inputSchema: {
              type: "object",
              properties: {
                verbose: { type: "boolean", description: "If true, return full server info, all tools with descriptions, and usage guide" },
              },
              required: [],
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
            },
          },
        ],
      };
    });

    // -----------------------------------------------------------------------
    // Call Tool (auto-tracked via registerTrackedToolHandler)
    // -----------------------------------------------------------------------
    registerTrackedToolHandler(instance, async (request) => {
      const { name, arguments: args } = request.params;
      const requestId = generateRequestId();
      const startTime = performance.now();

      logger.info("Tool called", { requestId, tool: name, args });

      try {
        let response;

        switch (name) {
          // -----------------------------------------------------------------
          // list_project_dashboards
          // -----------------------------------------------------------------
          case "list_project_dashboards": {
            const { sortBy, minScore } = ListDashboardsSchema.parse(args);
            let projects = await discoverProjects();

            // Filter by minScore
            if (minScore !== undefined) {
              projects = projects.filter((p) => {
                const score = p.data.overallScore as number | null | undefined;
                return score !== null && score !== undefined && score >= minScore;
              });
            }

            // Sort
            if (sortBy === "score") {
              projects.sort((a, b) => {
                const sa = (a.data.overallScore as number) ?? -1;
                const sb = (b.data.overallScore as number) ?? -1;
                return sb - sa;
              });
            } else if (sortBy === "date") {
              projects.sort((a, b) => {
                const da = (a.data.lastAssessment as string) ?? "";
                const db = (b.data.lastAssessment as string) ?? "";
                return db.localeCompare(da);
              });
            } else {
              projects.sort((a, b) => a.name.localeCompare(b.name));
            }

            const summary = projects.map((p) => ({
              name: p.name,
              overallScore: p.data.overallScore ?? null,
              lastAssessment: p.data.lastAssessment ?? null,
              assessmentCount: p.data.assessmentCount ?? 0,
              taskCount: Array.isArray(p.data.tasks) ? p.data.tasks.length : 0,
              riskCount: Array.isArray(p.data.risks) ? p.data.risks.length : 0,
            }));

            response = jsonResponse(
              `Found ${summary.length} project dashboard${summary.length !== 1 ? "s" : ""}`,
              summary
            );
            break;
          }

          // -----------------------------------------------------------------
          // get_project_dashboard
          // -----------------------------------------------------------------
          case "get_project_dashboard": {
            const { projectName, section } = GetDashboardSchema.parse(args);

            if (!validateSessionId(projectName)) {
              throw new Error(`Invalid project name: "${projectName}"`);
            }

            const dashPath = sanitizePath(
              path.join(CENTRAL_STORE, projectName, "pm-dashboard.json"),
              CENTRAL_STORE
            );
            const data = await readDashboard(dashPath);

            if (!data) {
              throw new Error(
                `Dashboard not found for project "${projectName}". Run sync_project_dashboard first.`
              );
            }

            if (section && section !== "full") {
              const sectionData = data[section];
              if (sectionData === undefined) {
                throw new Error(`Section "${section}" not found in dashboard for "${projectName}"`);
              }
              response = jsonResponse(`${projectName} — ${section}`, sectionData);
            } else {
              response = jsonResponse(`${projectName} — full dashboard`, data);
            }
            break;
          }

          // -----------------------------------------------------------------
          // compare_projects
          // -----------------------------------------------------------------
          case "compare_projects": {
            const { projects: projectNames, domains } = CompareProjectsSchema.parse(args);

            // Validate all names
            for (const pn of projectNames) {
              if (!validateSessionId(pn)) {
                throw new Error(`Invalid project name: "${pn}"`);
              }
            }

            // Load each project's data
            const projectsData: Array<{ name: string; data: Record<string, unknown> }> = [];
            const notFound: string[] = [];

            for (const pn of projectNames) {
              const dashPath = sanitizePath(
                path.join(CENTRAL_STORE, pn, "pm-dashboard.json"),
                CENTRAL_STORE
              );
              const data = await readDashboard(dashPath);
              if (data) {
                projectsData.push({ name: pn, data });
              } else {
                notFound.push(pn);
              }
            }

            if (projectsData.length < 2) {
              throw new Error(
                `Need at least 2 projects with data to compare. Not found: ${notFound.join(", ")}`
              );
            }

            const comparison = buildComparisonMatrix(projectsData, domains);

            if (notFound.length > 0) {
              (comparison as Record<string, unknown>).warnings = `Projects not found: ${notFound.join(", ")}`;
            }

            response = jsonResponse(
              `Comparison of ${projectsData.length} projects`,
              comparison
            );
            break;
          }

          // -----------------------------------------------------------------
          // sync_project_dashboard
          // -----------------------------------------------------------------
          case "sync_project_dashboard": {
            const { sourcePath, projectName } = SyncDashboardSchema.parse(args);

            const resolvedSource = path.resolve(sourcePath);
            const sourceFile = path.join(resolvedSource, ".claude", "pm-dashboard.json");

            // Verify source exists
            try {
              await stat(sourceFile);
            } catch {
              throw new Error(
                `Dashboard file not found at ${sourceFile}. Run /pm-dashboard update first.`
              );
            }

            // Determine project name
            const name = projectName ?? path.basename(resolvedSource);
            if (!validateSessionId(name)) {
              throw new Error(`Invalid project name: "${name}". Use only alphanumeric, dots, hyphens, underscores.`);
            }

            // Create target directory and copy
            const targetDir = path.join(CENTRAL_STORE, name);
            await mkdir(targetDir, { recursive: true });
            const targetFile = path.join(targetDir, "pm-dashboard.json");
            await copyFile(sourceFile, targetFile);

            // Verify the copy
            const data = await readDashboard(targetFile);
            const score = data?.overallScore ?? "unknown";

            response = successResponse(
              `Synced dashboard for "${name}" to central store.\n` +
              `  Source: ${sourceFile}\n` +
              `  Target: ${targetFile}\n` +
              `  Overall score: ${score}`
            );
            break;
          }

          // -----------------------------------------------------------------
          // get_logs
          // -----------------------------------------------------------------
          case "get_logs": {
            const { source, sessionId, search, limit } = GetLogsSchema.parse(args);
            const maxLines = limit ?? 100;

            if (sessionId && !validateSessionId(sessionId)) {
              throw new Error(`Invalid session ID: "${sessionId}"`);
            }

            let logPath: string;

            if (source === "debug" && !sessionId) {
              // Find latest debug log
              const debugDir = path.join(CLAUDE_DIR, "debug");
              const latest = await findLatestFile(debugDir);
              if (!latest) throw new Error("No debug logs found");
              logPath = latest;
            } else {
              logPath = resolveLogPath(source, sessionId);
            }

            const result = await readLogLines(logPath, maxLines, search);

            response = jsonResponse(`Logs from ${source}`, {
              source,
              filePath: result.filePath,
              totalLines: result.totalLines,
              returnedLines: result.lines.length,
              search: search ?? null,
              lines: result.lines,
            });
            break;
          }

          // -----------------------------------------------------------------
          // tail_logs
          // -----------------------------------------------------------------
          case "tail_logs": {
            const { source, sessionId, lines: lineCount } = TailLogsSchema.parse(args);
            const numLines = lineCount ?? 50;

            if (sessionId && !validateSessionId(sessionId)) {
              throw new Error(`Invalid session ID: "${sessionId}"`);
            }

            let logPath: string;

            if (source === "debug" && !sessionId) {
              const debugDir = path.join(CLAUDE_DIR, "debug");
              const latest = await findLatestFile(debugDir);
              if (!latest) throw new Error("No debug logs found");
              logPath = latest;
            } else {
              logPath = resolveLogPath(source, sessionId);
            }

            const result = await readLogLines(logPath, numLines, undefined, true);

            // Get file stats
            let fileStats: { size: number; modified: string } | null = null;
            try {
              const info = await stat(logPath);
              fileStats = {
                size: info.size,
                modified: info.mtime.toISOString(),
              };
            } catch {
              // File might not exist
            }

            response = jsonResponse(`Last ${result.lines.length} lines from ${source}`, {
              source,
              filePath: result.filePath,
              totalLines: result.totalLines,
              returnedLines: result.lines.length,
              fileStats,
              lines: result.lines,
            });
            break;
          }

          // -----------------------------------------------------------------
          // open_dashboard
          // -----------------------------------------------------------------
          case "open_dashboard": {
            const { port, timeout } = OpenDashboardSchema.parse(args);
            const serverPort = port ?? 3120;
            const timeoutMin = timeout ?? 120;

            // Find the serve.js script (sibling to this file in build/)
            const serveScript = path.join(
              path.dirname(new URL(import.meta.url).pathname),
              "serve.js"
            );

            // Spawn detached HTTP server
            const child = spawn(
              "node",
              [serveScript, `--port=${serverPort}`, `--timeout=${timeoutMin}`],
              {
                detached: true,
                stdio: "ignore",
              }
            );
            child.unref();

            // Try to open browser
            const url = `http://127.0.0.1:${serverPort}`;
            const openCmd =
              process.platform === "darwin"
                ? "open"
                : process.platform === "win32"
                  ? "start"
                  : "xdg-open";

            try {
              const browser = spawn(openCmd, [url], {
                detached: true,
                stdio: "ignore",
              });
              browser.unref();
            } catch {
              // Browser open is best-effort
            }

            response = successResponse(
              `Dashboard server started at ${url}\n` +
              `  Port: ${serverPort}\n` +
              `  Auto-shutdown: ${timeoutMin} minutes\n` +
              `  PID: ${child.pid ?? "unknown"}\n\n` +
              `The server will auto-discover projects from ~/.claude/pm-dashboard/ and\n` +
              `stream live logs via SSE at ${url}/api/logs/stream`
            );
            break;
          }

          // -----------------------------------------------------------------
          // get_tool_activity
          // -----------------------------------------------------------------
          case "get_tool_activity": {
            const { server: serverFilter, tool: toolFilter, status: statusFilter, limit } =
              GetToolActivitySchema.parse(args);
            const maxEntries = limit ?? 50;

            let entries = await readActivityEntries(maxEntries * 5); // read extra for filtering

            if (serverFilter) {
              entries = entries.filter((e) => e.server === serverFilter);
            }
            if (toolFilter) {
              entries = entries.filter((e) => e.tool === toolFilter);
            }
            if (statusFilter) {
              entries = entries.filter((e) => e.status === statusFilter);
            }

            entries = entries.slice(0, maxEntries);

            // Build summary stats
            const servers = new Set(entries.map((e) => e.server));
            const tools = new Set(entries.map((e) => e.tool));
            const failedCount = entries.filter((e) => e.status === "failed").length;

            response = jsonResponse(
              `Tool activity: ${entries.length} entries from ${servers.size} server(s)`,
              {
                totalEntries: entries.length,
                uniqueServers: [...servers],
                uniqueTools: [...tools],
                failedCount,
                entries,
              }
            );
            break;
          }

          // -----------------------------------------------------------------
          // get_active_tools
          // -----------------------------------------------------------------
          case "get_active_tools": {
            const { server: serverFilter, staleThresholdMs } =
              GetActiveToolsSchema.parse(args);
            const threshold = staleThresholdMs ?? 300000;

            let active = await findActiveTools(threshold);

            if (serverFilter) {
              active = active.filter((e) => e.server === serverFilter);
            }

            const serverSummary: Record<string, string[]> = {};
            for (const entry of active) {
              if (!serverSummary[entry.server]) {
                serverSummary[entry.server] = [];
              }
              serverSummary[entry.server].push(entry.tool);
            }

            response = jsonResponse(
              active.length === 0
                ? "No tools currently running"
                : `${active.length} tool(s) currently running`,
              {
                activeCount: active.length,
                byServer: serverSummary,
                tools: active,
              }
            );
            break;
          }

          case "hello": {
            const verbose = (args as { verbose?: boolean })?.verbose ?? false;
            if (!verbose) {
              response = {
                content: [{
                  type: "text",
                  text: `👋 Hello! I'm **${SERVER_NAME}** v${SERVER_VERSION}.\n\nI'm online and ready to help!\n\nCall \`hello\` with \`{"verbose": true}\` for my full tool catalog and usage guide.`,
                }],
              };
            } else {
              response = {
                content: [{
                  type: "text",
                  text: buildHelloVerbose(),
                }],
              };
            }
            break;
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        const durationMs = measureDuration(startTime);
        logger.info("Tool completed", { requestId, tool: name, durationMs });
        return response;
      } catch (error: unknown) {
        const durationMs = measureDuration(startTime);
        logger.error("Tool failed", {
          requestId,
          tool: name,
          durationMs,
          error: error instanceof Error ? error.message : String(error),
        });
        return errorResponse(error, name);
      }
    });
  }
);
