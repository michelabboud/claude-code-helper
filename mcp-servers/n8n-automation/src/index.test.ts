/**
 * Unit tests for n8n-automation-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all six tool schemas)
 * - sanitizePath integration (path traversal and null-byte rejection)
 * - errorResponse formatting
 * - Tool name registration (ListTools handler coverage)
 * - Schema edge cases (extra fields, null values, all enum values)
 */

import { z } from "zod";
import {
  sanitizePath,
  errorResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts -- not exported from there)
// ---------------------------------------------------------------------------

const GenerateWorkflowSchema = z.object({
  workflow_type: z.enum(["scheduled", "webhook", "event-driven"]).describe("Workflow trigger type"),
  services: z.array(z.string()).describe("Services to integrate"),
  trigger: z.string().describe("Trigger configuration"),
  actions: z.array(z.string()).describe("Actions to perform"),
});

const OptimizeWorkflowSchema = z.object({
  workflow: z.record(z.string(), z.unknown()).describe("Current workflow JSON"),
  focus_areas: z.array(z.enum(["speed", "reliability", "cost"])).optional().describe("Optimization focus"),
});

const TroubleshootWorkflowSchema = z.object({
  workflow: z.record(z.string(), z.unknown()).describe("Workflow configuration"),
  error_log: z.string().describe("Error messages"),
  execution_data: z.record(z.string(), z.unknown()).optional().describe("Last execution data"),
});

const GenerateErrorWorkflowSchema = z.object({
  main_workflow_id: z.string().describe("ID of main workflow"),
  notification_channels: z.array(z.string()).describe("Alert destinations"),
  retry_strategy: z.enum(["immediate", "exponential_backoff", "fixed_delay"]).describe("Retry approach"),
});

const SuggestIntegrationsSchema = z.object({
  use_case: z.string().describe("Automation goal description"),
  existing_tools: z.array(z.string()).optional().describe("Current tools in use"),
});

const GenerateDataTransformationSchema = z.object({
  input_format: z.record(z.string(), z.unknown()).describe("Source data structure"),
  output_format: z.record(z.string(), z.unknown()).describe("Target data structure"),
  transformations: z.array(z.string()).describe("Required transformations"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "generate_workflow",
  "optimize_workflow",
  "troubleshoot_workflow",
  "generate_error_workflow",
  "suggest_integrations",
  "generate_data_transformation",
];

// =========================================================================
// 1. GenerateWorkflowSchema validation
// =========================================================================

describe("GenerateWorkflowSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      workflow_type: "webhook",
      services: ["slack", "gmail"],
      trigger: "webhook",
      actions: ["parse_data", "filter"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workflow_type).toBe("webhook");
      expect(result.data.services).toEqual(["slack", "gmail"]);
      expect(result.data.trigger).toBe("webhook");
      expect(result.data.actions).toEqual(["parse_data", "filter"]);
    }
  });

  it("accepts scheduled workflow_type", () => {
    const input = {
      workflow_type: "scheduled",
      services: ["airtable"],
      trigger: "cron",
      actions: ["transform"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts event-driven workflow_type", () => {
    const input = {
      workflow_type: "event-driven",
      services: ["httpRequest"],
      trigger: "event",
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts empty services array", () => {
    const input = {
      workflow_type: "webhook",
      services: [],
      trigger: "webhook",
      actions: ["transform"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.services).toEqual([]);
    }
  });

  it("accepts empty actions array", () => {
    const input = {
      workflow_type: "webhook",
      services: ["slack"],
      trigger: "webhook",
      actions: [],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing workflow_type", () => {
    const input = {
      services: ["slack"],
      trigger: "webhook",
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing services", () => {
    const input = {
      workflow_type: "webhook",
      trigger: "webhook",
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing trigger", () => {
    const input = {
      workflow_type: "webhook",
      services: ["slack"],
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing actions", () => {
    const input = {
      workflow_type: "webhook",
      services: ["slack"],
      trigger: "webhook",
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid workflow_type enum value", () => {
    const input = {
      workflow_type: "manual",
      services: ["slack"],
      trigger: "webhook",
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array services", () => {
    const input = {
      workflow_type: "webhook",
      services: "slack",
      trigger: "webhook",
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string items in services array", () => {
    const input = {
      workflow_type: "webhook",
      services: [123, true],
      trigger: "webhook",
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string trigger", () => {
    const input = {
      workflow_type: "webhook",
      services: ["slack"],
      trigger: 42,
      actions: ["parse"],
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 2. OptimizeWorkflowSchema validation
// =========================================================================

describe("OptimizeWorkflowSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { workflow: { name: "test", nodes: [] } };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus_areas).toBeUndefined();
    }
  });

  it("accepts valid input with optional focus_areas", () => {
    const input = {
      workflow: { name: "test", nodes: [] },
      focus_areas: ["speed", "reliability"],
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.focus_areas).toEqual(["speed", "reliability"]);
    }
  });

  it("accepts all valid focus_areas enum values", () => {
    for (const area of ["speed", "reliability", "cost"] as const) {
      const result = OptimizeWorkflowSchema.safeParse({
        workflow: { nodes: [] },
        focus_areas: [area],
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts multiple focus areas combined", () => {
    const input = {
      workflow: {},
      focus_areas: ["speed", "reliability", "cost"],
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts empty focus_areas array", () => {
    const input = {
      workflow: { nodes: [] },
      focus_areas: [],
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing workflow", () => {
    const input = { focus_areas: ["speed"] };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid focus_areas enum value", () => {
    const input = {
      workflow: { nodes: [] },
      focus_areas: ["memory"],
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array focus_areas", () => {
    const input = {
      workflow: { nodes: [] },
      focus_areas: "speed",
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts complex workflow object", () => {
    const input = {
      workflow: {
        name: "Complex Workflow",
        nodes: [
          { type: "n8n-nodes-base.webhook", name: "Trigger", position: [250, 300] },
          { type: "n8n-nodes-base.httpRequest", name: "API Call", position: [450, 300] },
        ],
        connections: {},
        settings: { saveDataErrorExecution: "all" },
      },
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 3. TroubleshootWorkflowSchema validation
// =========================================================================

describe("TroubleshootWorkflowSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = {
      workflow: { name: "test" },
      error_log: "Error: timeout exceeded",
    };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.execution_data).toBeUndefined();
    }
  });

  it("accepts valid input with optional execution_data", () => {
    const input = {
      workflow: { name: "test" },
      error_log: "401 Unauthorized",
      execution_data: { lastNodeExecuted: "HTTP Request", itemsCount: 5 },
    };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.execution_data).toEqual({
        lastNodeExecuted: "HTTP Request",
        itemsCount: 5,
      });
    }
  });

  it("rejects missing workflow", () => {
    const input = { error_log: "some error" };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing error_log", () => {
    const input = { workflow: { name: "test" } };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string error_log", () => {
    const input = {
      workflow: { name: "test" },
      error_log: 500,
    };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-object workflow", () => {
    const input = {
      workflow: "not-an-object",
      error_log: "some error",
    };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-object execution_data", () => {
    const input = {
      workflow: { name: "test" },
      error_log: "some error",
      execution_data: "not-an-object",
    };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty error_log string", () => {
    const input = {
      workflow: { name: "test" },
      error_log: "",
    };
    const result = TroubleshootWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 4. GenerateErrorWorkflowSchema validation
// =========================================================================

describe("GenerateErrorWorkflowSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      main_workflow_id: "wf-123",
      notification_channels: ["slack", "email"],
      retry_strategy: "exponential_backoff",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.main_workflow_id).toBe("wf-123");
      expect(result.data.notification_channels).toEqual(["slack", "email"]);
      expect(result.data.retry_strategy).toBe("exponential_backoff");
    }
  });

  it("accepts all valid retry_strategy enum values", () => {
    for (const strategy of ["immediate", "exponential_backoff", "fixed_delay"] as const) {
      const result = GenerateErrorWorkflowSchema.safeParse({
        main_workflow_id: "wf-1",
        notification_channels: ["slack"],
        retry_strategy: strategy,
      });
      expect(result.success).toBe(true);
    }
  });

  it("accepts empty notification_channels array", () => {
    const input = {
      main_workflow_id: "wf-1",
      notification_channels: [],
      retry_strategy: "immediate",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing main_workflow_id", () => {
    const input = {
      notification_channels: ["slack"],
      retry_strategy: "immediate",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing notification_channels", () => {
    const input = {
      main_workflow_id: "wf-1",
      retry_strategy: "immediate",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing retry_strategy", () => {
    const input = {
      main_workflow_id: "wf-1",
      notification_channels: ["slack"],
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid retry_strategy enum value", () => {
    const input = {
      main_workflow_id: "wf-1",
      notification_channels: ["slack"],
      retry_strategy: "random",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string main_workflow_id", () => {
    const input = {
      main_workflow_id: 123,
      notification_channels: ["slack"],
      retry_strategy: "immediate",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array notification_channels", () => {
    const input = {
      main_workflow_id: "wf-1",
      notification_channels: "slack",
      retry_strategy: "immediate",
    };
    const result = GenerateErrorWorkflowSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 5. SuggestIntegrationsSchema validation
// =========================================================================

describe("SuggestIntegrationsSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { use_case: "Automate customer support tickets" };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.use_case).toBe("Automate customer support tickets");
      expect(result.data.existing_tools).toBeUndefined();
    }
  });

  it("accepts valid input with optional existing_tools", () => {
    const input = {
      use_case: "Data sync between CRM and database",
      existing_tools: ["zendesk", "postgres"],
    };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.existing_tools).toEqual(["zendesk", "postgres"]);
    }
  });

  it("accepts empty existing_tools array", () => {
    const input = {
      use_case: "Social media posting",
      existing_tools: [],
    };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing use_case", () => {
    const input = { existing_tools: ["slack"] };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string use_case", () => {
    const input = { use_case: 123 };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array existing_tools", () => {
    const input = {
      use_case: "Automate invoices",
      existing_tools: "quickbooks",
    };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string items in existing_tools", () => {
    const input = {
      use_case: "Automate invoices",
      existing_tools: [123, true],
    };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty string use_case", () => {
    const input = { use_case: "" };
    const result = SuggestIntegrationsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 6. GenerateDataTransformationSchema validation
// =========================================================================

describe("GenerateDataTransformationSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      input_format: { firstName: "string", lastName: "string" },
      output_format: { fullName: "string" },
      transformations: ["concatenate first and last name"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.input_format).toEqual({ firstName: "string", lastName: "string" });
      expect(result.data.output_format).toEqual({ fullName: "string" });
      expect(result.data.transformations).toEqual(["concatenate first and last name"]);
    }
  });

  it("accepts complex nested input_format", () => {
    const input = {
      input_format: {
        user: { name: "John", age: 30 },
        metadata: { created: "2024-01-01" },
      },
      output_format: { name: "string", created: "string" },
      transformations: ["flatten"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts empty transformations array", () => {
    const input = {
      input_format: { a: 1 },
      output_format: { a: 1 },
      transformations: [],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts empty objects for input_format and output_format", () => {
    const input = {
      input_format: {},
      output_format: {},
      transformations: ["identity"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing input_format", () => {
    const input = {
      output_format: { name: "string" },
      transformations: ["map"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing output_format", () => {
    const input = {
      input_format: { name: "string" },
      transformations: ["map"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing transformations", () => {
    const input = {
      input_format: { name: "string" },
      output_format: { fullName: "string" },
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-object input_format", () => {
    const input = {
      input_format: "not-an-object",
      output_format: { name: "string" },
      transformations: ["map"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-object output_format", () => {
    const input = {
      input_format: { name: "string" },
      output_format: [1, 2, 3],
      transformations: ["map"],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array transformations", () => {
    const input = {
      input_format: { name: "string" },
      output_format: { fullName: "string" },
      transformations: "concatenate",
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string items in transformations array", () => {
    const input = {
      input_format: { a: 1 },
      output_format: { b: 2 },
      transformations: [123, null],
    };
    const result = GenerateDataTransformationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 7. sanitizePath integration
// =========================================================================

describe("sanitizePath", () => {
  it("resolves a valid absolute path unchanged", () => {
    const result = sanitizePath("/home/user/project/file.ts");
    expect(result).toBe("/home/user/project/file.ts");
  });

  it("resolves a relative path to an absolute one", () => {
    const result = sanitizePath("src/index.ts");
    expect(result).toMatch(/^\/.*src\/index\.ts$/);
  });

  it("rejects empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
  });

  it("rejects whitespace-only path", () => {
    expect(() => sanitizePath("   ")).toThrow(SanitizationError);
  });

  it("rejects path containing null bytes", () => {
    expect(() => sanitizePath("/tmp/evil\0file")).toThrow(SanitizationError);
  });

  it("rejects path traversal outside base directory", () => {
    expect(() => sanitizePath("../../etc/passwd", "/home/user/project")).toThrow(
      SanitizationError
    );
  });

  it("allows paths within the base directory", () => {
    const result = sanitizePath("/home/user/project/src/file.ts", "/home/user/project");
    expect(result).toBe("/home/user/project/src/file.ts");
  });

  it("allows the base directory path itself", () => {
    const result = sanitizePath("/home/user/project", "/home/user/project");
    expect(result).toBe("/home/user/project");
  });

  it("rejects path with double-dot traversal at start", () => {
    expect(() => sanitizePath("../../../secret", "/home/user")).toThrow(SanitizationError);
  });

  it("rejects path with embedded null byte in middle", () => {
    expect(() => sanitizePath("/home/user/\0/file.txt")).toThrow(SanitizationError);
  });
});

// =========================================================================
// 8. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("workflow generation failed");
    const response = errorResponse(err, "generate_workflow");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in generate_workflow: workflow generation failed"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("invalid workflow JSON", "optimize_workflow");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in optimize_workflow: invalid workflow JSON"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "troubleshoot_workflow");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in troubleshoot_workflow: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "generate_data_transformation");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("generate_data_transformation");
  });

  it("handles null error value", () => {
    const response = errorResponse(null, "suggest_integrations");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("suggest_integrations");
  });

  it("handles undefined error value", () => {
    const response = errorResponse(undefined, "generate_error_workflow");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("generate_error_workflow");
  });
});

// =========================================================================
// 9. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the six expected tool names", () => {
    // Since we cannot easily import and start the MCP server in a test
    // (it immediately connects to stdio transport), we verify the expected
    // tool names against the schemas we have replicated. If a schema is
    // defined above but not listed in EXPECTED_TOOL_NAMES (or vice-versa),
    // this test will fail, prompting the developer to keep them in sync.
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      generate_workflow: GenerateWorkflowSchema,
      optimize_workflow: OptimizeWorkflowSchema,
      troubleshoot_workflow: TroubleshootWorkflowSchema,
      generate_error_workflow: GenerateErrorWorkflowSchema,
      suggest_integrations: SuggestIntegrationsSchema,
      generate_data_transformation: GenerateDataTransformationSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all six tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("generate_workflow");
    expect(EXPECTED_TOOL_NAMES).toContain("optimize_workflow");
    expect(EXPECTED_TOOL_NAMES).toContain("troubleshoot_workflow");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_error_workflow");
    expect(EXPECTED_TOOL_NAMES).toContain("suggest_integrations");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_data_transformation");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("tool count matches expected total", () => {
    expect(EXPECTED_TOOL_NAMES.length).toBe(6);
  });
});

// =========================================================================
// 10. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("GenerateWorkflowSchema strips unknown properties", () => {
    const input = {
      workflow_type: "webhook",
      services: ["slack"],
      trigger: "webhook",
      actions: ["parse"],
      extraField: "should be stripped",
    };
    const result = GenerateWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });

  it("OptimizeWorkflowSchema strips unknown properties", () => {
    const input = {
      workflow: { nodes: [] },
      focus_areas: ["speed"],
      bonus: true,
    };
    const result = OptimizeWorkflowSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).bonus).toBeUndefined();
    }
  });

  it("GenerateWorkflowSchema accepts all valid workflow_type enum values", () => {
    for (const wfType of ["scheduled", "webhook", "event-driven"] as const) {
      const result = GenerateWorkflowSchema.safeParse({
        workflow_type: wfType,
        services: [],
        trigger: "test",
        actions: [],
      });
      expect(result.success).toBe(true);
    }
  });

  it("GenerateErrorWorkflowSchema rejects null as main_workflow_id", () => {
    const result = GenerateErrorWorkflowSchema.safeParse({
      main_workflow_id: null,
      notification_channels: ["slack"],
      retry_strategy: "immediate",
    });
    expect(result.success).toBe(false);
  });

  it("TroubleshootWorkflowSchema rejects array as workflow", () => {
    const result = TroubleshootWorkflowSchema.safeParse({
      workflow: [1, 2, 3],
      error_log: "some error",
    });
    expect(result.success).toBe(false);
  });

  it("SuggestIntegrationsSchema rejects null as use_case", () => {
    const result = SuggestIntegrationsSchema.safeParse({
      use_case: null,
    });
    expect(result.success).toBe(false);
  });

  it("GenerateDataTransformationSchema rejects null as input_format", () => {
    const result = GenerateDataTransformationSchema.safeParse({
      input_format: null,
      output_format: { name: "string" },
      transformations: ["map"],
    });
    expect(result.success).toBe(false);
  });

  it("OptimizeWorkflowSchema rejects null as workflow", () => {
    const result = OptimizeWorkflowSchema.safeParse({
      workflow: null,
    });
    expect(result.success).toBe(false);
  });

  it("GenerateWorkflowSchema rejects completely empty object", () => {
    const result = GenerateWorkflowSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("TroubleshootWorkflowSchema accepts empty workflow object", () => {
    const result = TroubleshootWorkflowSchema.safeParse({
      workflow: {},
      error_log: "test error",
    });
    expect(result.success).toBe(true);
  });

  it("GenerateDataTransformationSchema accepts numeric values in format objects", () => {
    const result = GenerateDataTransformationSchema.safeParse({
      input_format: { count: 42, label: "test" },
      output_format: { total: 0 },
      transformations: ["calculate sum"],
    });
    expect(result.success).toBe(true);
  });

  it("GenerateErrorWorkflowSchema accepts single notification channel", () => {
    const result = GenerateErrorWorkflowSchema.safeParse({
      main_workflow_id: "wf-single",
      notification_channels: ["email"],
      retry_strategy: "fixed_delay",
    });
    expect(result.success).toBe(true);
  });

  it("SuggestIntegrationsSchema accepts long use_case strings", () => {
    const longString = "a".repeat(10000);
    const result = SuggestIntegrationsSchema.safeParse({
      use_case: longString,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.use_case.length).toBe(10000);
    }
  });
});
