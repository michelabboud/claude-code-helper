/**
 * Unit tests for api-specialist-mcp server.
 *
 * Because the source file does not export its schemas, helper functions, or
 * utility functions, we re-create the Zod schemas here and test:
 *   - Schema validation for every tool input
 *   - sanitizePath integration (path-based tools)
 *   - sanitizeUrl integration (URL-based tools)
 *   - URL sanitization: blocks localhost, private IPs, non-http protocols
 *   - Path sanitization: blocks traversal attempts and null bytes
 *   - errorResponse formatting
 *   - successResponse formatting
 */

import { z } from "zod";
import {
  sanitizePath,
  sanitizeUrl,
  SanitizationError,
  errorResponse,
  successResponse,
} from "mcp-shared";
import { loadSpec, computeResponseTimeStats } from "./lib.js";

// ---------------------------------------------------------------------------
// Re-created Zod schemas (mirrors index.ts exactly)
// ---------------------------------------------------------------------------

const ValidateOpenAPISchema = z.object({
  specPath: z.string().describe("Path to OpenAPI/Swagger spec file (JSON or YAML)"),
  version: z.enum(["2.0", "3.0", "3.1"]).optional().describe("OpenAPI version to validate against"),
  strict: z.boolean().optional().describe("Enable strict validation mode"),
});

const TestEndpointSchema = z.object({
  url: z.string().describe("Full endpoint URL"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).describe("HTTP method"),
  headers: z.record(z.string()).optional().describe("Request headers as key-value pairs"),
  body: z.string().optional().describe("Request body (JSON string)"),
  auth: z
    .object({
      type: z.enum(["bearer", "basic", "apikey"]),
      token: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
      apikey: z.string().optional(),
      header: z.string().optional().describe("Header name for API key (default: X-API-Key)"),
    })
    .optional()
    .describe("Authentication configuration"),
  timeout: z.number().optional().describe("Request timeout in milliseconds (default: 5000)"),
});

const CheckAPISecuritySchema = z.object({
  apiUrl: z.string().describe("Base API URL to check"),
  endpoints: z.array(z.string()).optional().describe("Specific endpoints to test (relative paths)"),
  checks: z
    .array(
      z.enum([
        "authentication",
        "cors",
        "rate_limiting",
        "https",
        "headers",
        "sql_injection",
      ])
    )
    .optional()
    .describe("Security checks to perform"),
});

const AnalyzeAPIStructureSchema = z.object({
  specPath: z.string().describe("Path to API specification file"),
  framework: z.enum(["rest", "graphql", "grpc"]).optional().describe("API framework type"),
  standards: z
    .array(
      z.enum([
        "rest_naming",
        "http_methods",
        "status_codes",
        "versioning",
        "pagination",
        "filtering",
        "error_handling",
      ])
    )
    .optional()
    .describe("Standards to check against"),
});

const LoadTestSchema = z.object({
  url: z.string().describe("Endpoint URL to load test"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).describe("HTTP method"),
  duration: z.number().describe("Test duration in seconds"),
  concurrency: z.number().describe("Number of concurrent requests"),
  headers: z.record(z.string()).optional().describe("Request headers"),
  body: z.string().optional().describe("Request body for POST/PUT"),
});

const GenerateAPIDocsSchema = z.object({
  specPath: z.string().describe("Path to OpenAPI spec"),
  format: z.enum(["markdown", "html", "postman"]).describe("Output format"),
  includeExamples: z.boolean().optional().describe("Include request/response examples"),
});

const SuggestImprovementsSchema = z.object({
  specPath: z.string().describe("Path to API specification"),
  focusAreas: z
    .array(
      z.enum([
        "performance",
        "security",
        "design",
        "documentation",
        "error_handling",
        "versioning",
      ])
    )
    .optional()
    .describe("Areas to focus improvement suggestions on"),
});

const ValidateAPIResponseSchema = z.object({
  response: z.string().describe("API response JSON to validate"),
  schema: z.string().describe("Expected JSON schema"),
  strict: z.boolean().optional().describe("Strict validation mode"),
});

// ===========================================================================
// Tests
// ===========================================================================

describe("Zod schema validation", () => {
  // --- ValidateOpenAPISchema -----------------------------------------------

  describe("ValidateOpenAPISchema", () => {
    it("accepts valid minimal input with only specPath", () => {
      const result = ValidateOpenAPISchema.parse({ specPath: "/tmp/spec.json" });
      expect(result.specPath).toBe("/tmp/spec.json");
      expect(result.version).toBeUndefined();
      expect(result.strict).toBeUndefined();
    });

    it("accepts full input with all optional fields", () => {
      const result = ValidateOpenAPISchema.parse({
        specPath: "/tmp/spec.yaml",
        version: "3.1",
        strict: true,
      });
      expect(result.version).toBe("3.1");
      expect(result.strict).toBe(true);
    });

    it("rejects missing specPath", () => {
      expect(() => ValidateOpenAPISchema.parse({})).toThrow();
    });

    it("rejects invalid version enum value", () => {
      expect(() =>
        ValidateOpenAPISchema.parse({ specPath: "/tmp/spec.json", version: "4.0" })
      ).toThrow();
    });
  });

  // --- TestEndpointSchema --------------------------------------------------

  describe("TestEndpointSchema", () => {
    it("accepts valid minimal input", () => {
      const result = TestEndpointSchema.parse({
        url: "https://api.example.com/users",
        method: "GET",
      });
      expect(result.url).toBe("https://api.example.com/users");
      expect(result.method).toBe("GET");
    });

    it("accepts full input with auth, headers, body, and timeout", () => {
      const result = TestEndpointSchema.parse({
        url: "https://api.example.com/users",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"name":"test"}',
        auth: { type: "bearer", token: "abc123" },
        timeout: 10000,
      });
      expect(result.auth?.type).toBe("bearer");
      expect(result.timeout).toBe(10000);
    });

    it("rejects an invalid HTTP method", () => {
      expect(() =>
        TestEndpointSchema.parse({ url: "https://example.com", method: "INVALID" })
      ).toThrow();
    });

    it("rejects missing required fields", () => {
      expect(() => TestEndpointSchema.parse({ url: "https://example.com" })).toThrow();
      expect(() => TestEndpointSchema.parse({ method: "GET" })).toThrow();
    });
  });

  // --- CheckAPISecuritySchema ----------------------------------------------

  describe("CheckAPISecuritySchema", () => {
    it("accepts valid minimal input", () => {
      const result = CheckAPISecuritySchema.parse({
        apiUrl: "https://api.example.com",
      });
      expect(result.apiUrl).toBe("https://api.example.com");
    });

    it("accepts full input with endpoints and checks", () => {
      const result = CheckAPISecuritySchema.parse({
        apiUrl: "https://api.example.com",
        endpoints: ["/users", "/admin"],
        checks: ["authentication", "cors", "https"],
      });
      expect(result.checks).toHaveLength(3);
    });

    it("rejects invalid check enum value", () => {
      expect(() =>
        CheckAPISecuritySchema.parse({
          apiUrl: "https://api.example.com",
          checks: ["nonexistent"],
        })
      ).toThrow();
    });

    it("rejects 'xss' as a check — removed because it was never implemented", () => {
      expect(() =>
        CheckAPISecuritySchema.parse({
          apiUrl: "https://api.example.com",
          checks: ["xss"],
        })
      ).toThrow();
    });
  });

  // --- LoadTestSchema ------------------------------------------------------

  describe("LoadTestSchema", () => {
    it("accepts valid full input", () => {
      const result = LoadTestSchema.parse({
        url: "https://api.example.com/health",
        method: "GET",
        duration: 10,
        concurrency: 5,
      });
      expect(result.duration).toBe(10);
      expect(result.concurrency).toBe(5);
    });

    it("rejects missing required fields (duration, concurrency)", () => {
      expect(() =>
        LoadTestSchema.parse({
          url: "https://api.example.com",
          method: "GET",
        })
      ).toThrow();
    });
  });

  // --- GenerateAPIDocsSchema -----------------------------------------------

  describe("GenerateAPIDocsSchema", () => {
    it("accepts valid input", () => {
      const result = GenerateAPIDocsSchema.parse({
        specPath: "/tmp/openapi.json",
        format: "markdown",
      });
      expect(result.format).toBe("markdown");
    });

    it("rejects invalid format enum", () => {
      expect(() =>
        GenerateAPIDocsSchema.parse({ specPath: "/tmp/spec.json", format: "pdf" })
      ).toThrow();
    });
  });

  // --- SuggestImprovementsSchema -------------------------------------------

  describe("SuggestImprovementsSchema", () => {
    it("accepts valid input with focus areas", () => {
      const result = SuggestImprovementsSchema.parse({
        specPath: "/tmp/spec.json",
        focusAreas: ["performance", "security"],
      });
      expect(result.focusAreas).toEqual(["performance", "security"]);
    });

    it("accepts input without optional focusAreas", () => {
      const result = SuggestImprovementsSchema.parse({ specPath: "/tmp/spec.json" });
      expect(result.focusAreas).toBeUndefined();
    });
  });

  // --- ValidateAPIResponseSchema -------------------------------------------

  describe("ValidateAPIResponseSchema", () => {
    it("accepts valid input", () => {
      const result = ValidateAPIResponseSchema.parse({
        response: '{"id":1}',
        schema: '{"type":"object","properties":{"id":{"type":"number"}}}',
      });
      expect(result.response).toBe('{"id":1}');
    });

    it("rejects missing schema", () => {
      expect(() =>
        ValidateAPIResponseSchema.parse({ response: '{"id":1}' })
      ).toThrow();
    });
  });
});

// ===========================================================================
// sanitizePath integration tests (path-based tools: specPath params)
// ===========================================================================

describe("sanitizePath integration for path-based tools", () => {
  it("resolves a valid absolute path unchanged", () => {
    const result = sanitizePath("/home/user/project/openapi.json");
    expect(result).toBe("/home/user/project/openapi.json");
  });

  it("resolves a relative path to an absolute path", () => {
    const result = sanitizePath("specs/openapi.json");
    expect(result).toMatch(/^\/.*specs\/openapi\.json$/);
  });

  it("blocks null bytes in path", () => {
    expect(() => sanitizePath("/tmp/spec\0.json")).toThrow(SanitizationError);
    expect(() => sanitizePath("/tmp/spec\0.json")).toThrow("null bytes");
  });

  it("rejects an empty path", () => {
    expect(() => sanitizePath("")).toThrow(SanitizationError);
    expect(() => sanitizePath("")).toThrow("empty");
  });

  it("rejects a whitespace-only path", () => {
    expect(() => sanitizePath("   ")).toThrow(SanitizationError);
  });

  it("blocks directory traversal when basePath is supplied", () => {
    expect(() => sanitizePath("../../etc/passwd", "/home/user/project")).toThrow(
      SanitizationError
    );
  });

  it("allows a path within the basePath", () => {
    const result = sanitizePath("/home/user/project/sub/spec.json", "/home/user/project");
    expect(result).toBe("/home/user/project/sub/spec.json");
  });

  it("handles path with trailing slashes", () => {
    const result = sanitizePath("/tmp/specs/");
    expect(result).toBe("/tmp/specs");
  });
});

// ===========================================================================
// sanitizeUrl integration tests (URL-based tools: url, apiUrl, baseUrl)
// ===========================================================================

describe("sanitizeUrl integration for URL-based tools", () => {
  it("accepts a valid https URL", () => {
    const result = sanitizeUrl("https://api.example.com/v1/users");
    expect(result).toBe("https://api.example.com/v1/users");
  });

  it("accepts a valid http URL", () => {
    const result = sanitizeUrl("http://api.example.com");
    expect(result).toBe("http://api.example.com/");
  });

  it("blocks localhost", () => {
    expect(() => sanitizeUrl("http://localhost:3000/api")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("http://localhost:3000/api")).toThrow("internal/private");
  });

  it("blocks 127.0.0.1 (loopback)", () => {
    expect(() => sanitizeUrl("http://127.0.0.1:8080")).toThrow(SanitizationError);
  });

  it("blocks 10.x.x.x private range", () => {
    expect(() => sanitizeUrl("http://10.0.0.1/api")).toThrow(SanitizationError);
  });

  it("blocks 172.16-31.x.x private range", () => {
    expect(() => sanitizeUrl("http://172.16.0.1/api")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("http://172.31.255.255/api")).toThrow(SanitizationError);
  });

  it("blocks 192.168.x.x private range", () => {
    expect(() => sanitizeUrl("http://192.168.1.1/api")).toThrow(SanitizationError);
  });

  it("blocks 0.x.x.x range", () => {
    expect(() => sanitizeUrl("http://0.0.0.0/api")).toThrow(SanitizationError);
  });

  it("blocks 169.254.x.x link-local range", () => {
    expect(() => sanitizeUrl("http://169.254.169.254/latest/meta-data")).toThrow(
      SanitizationError
    );
  });

  it("blocks ftp protocol", () => {
    expect(() => sanitizeUrl("ftp://files.example.com/spec.json")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("ftp://files.example.com/spec.json")).toThrow("Disallowed protocol");
  });

  it("blocks file protocol", () => {
    expect(() => sanitizeUrl("file:///etc/passwd")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("file:///etc/passwd")).toThrow("Disallowed protocol");
  });

  it("blocks javascript protocol", () => {
    expect(() => sanitizeUrl("javascript:alert(1)")).toThrow(SanitizationError);
  });

  it("rejects an empty URL", () => {
    expect(() => sanitizeUrl("")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("")).toThrow("empty");
  });

  it("rejects a malformed URL", () => {
    expect(() => sanitizeUrl("not-a-url")).toThrow(SanitizationError);
    expect(() => sanitizeUrl("not-a-url")).toThrow("Invalid URL");
  });

  it("preserves query parameters and fragments", () => {
    const result = sanitizeUrl("https://api.example.com/search?q=test&page=1#results");
    expect(result).toContain("q=test");
    expect(result).toContain("page=1");
    expect(result).toContain("#results");
  });

  it("trims whitespace from the URL", () => {
    const result = sanitizeUrl("  https://api.example.com  ");
    expect(result).toBe("https://api.example.com/");
  });
});

// ===========================================================================
// errorResponse formatting
// ===========================================================================

describe("errorResponse formatting", () => {
  it("formats an Error object with context", () => {
    const err = new Error("Something went wrong");
    const response = errorResponse(err, "test_endpoint");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe("Error in test_endpoint: Something went wrong");
  });

  it("formats an Error object without context", () => {
    const err = new Error("Bad input");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: Bad input");
  });

  it("formats a string error value", () => {
    const response = errorResponse("plain string error", "validate_openapi");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in validate_openapi: plain string error");
  });

  it("formats a SanitizationError with context", () => {
    const err = new SanitizationError("Path contains null bytes", "path", "/tmp\0");
    const response = errorResponse(err, "analyze_api_structure");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("null bytes");
    expect(response.content[0].text).toContain("analyze_api_structure");
  });
});

// ===========================================================================
// successResponse formatting
// ===========================================================================

describe("successResponse formatting", () => {
  it("returns a well-formed tool response", () => {
    const response = successResponse("Operation completed successfully");
    expect(response.isError).toBeUndefined();
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe("Operation completed successfully");
  });

  it("handles multiline text", () => {
    const text = "Line 1\nLine 2\nLine 3";
    const response = successResponse(text);
    expect(response.content[0].text).toBe(text);
  });

  it("handles empty string", () => {
    const response = successResponse("");
    expect(response.content[0].text).toBe("");
  });
});

// ===========================================================================
// End-to-end integration: schema parse -> sanitize pipeline
// ===========================================================================

describe("schema parse -> sanitize pipeline", () => {
  it("ValidateOpenAPISchema + sanitizePath: valid path passes through", () => {
    const parsed = ValidateOpenAPISchema.parse({ specPath: "/home/user/api.json" });
    const safePath = sanitizePath(parsed.specPath);
    expect(safePath).toBe("/home/user/api.json");
  });

  it("TestEndpointSchema + sanitizeUrl: valid URL passes through", () => {
    const parsed = TestEndpointSchema.parse({
      url: "https://api.example.com/v1/users",
      method: "GET",
    });
    const safeUrl = sanitizeUrl(parsed.url);
    expect(safeUrl).toBe("https://api.example.com/v1/users");
  });

  it("CheckAPISecuritySchema + sanitizeUrl: localhost is blocked", () => {
    const parsed = CheckAPISecuritySchema.parse({
      apiUrl: "http://localhost:8080/api",
    });
    expect(() => sanitizeUrl(parsed.apiUrl)).toThrow(SanitizationError);
  });

  it("LoadTestSchema + sanitizeUrl: private IP is blocked", () => {
    const parsed = LoadTestSchema.parse({
      url: "http://192.168.1.100:3000/api",
      method: "GET",
      duration: 5,
      concurrency: 2,
    });
    expect(() => sanitizeUrl(parsed.url)).toThrow(SanitizationError);
  });

  it("AnalyzeAPIStructureSchema + sanitizePath: traversal with basePath is blocked", () => {
    const parsed = AnalyzeAPIStructureSchema.parse({
      specPath: "../../etc/shadow",
      framework: "rest",
    });
    expect(() => sanitizePath(parsed.specPath, "/home/user/project")).toThrow(
      SanitizationError
    );
  });

  it("GenerateAPIDocsSchema + sanitizePath: null byte in specPath is blocked", () => {
    expect(() =>
      GenerateAPIDocsSchema.parse({ specPath: "/tmp/spec\0.json", format: "markdown" })
    ).not.toThrow(); // Zod passes it through; sanitizePath catches it
    const parsed = GenerateAPIDocsSchema.parse({
      specPath: "/tmp/spec\0.json",
      format: "markdown",
    });
    expect(() => sanitizePath(parsed.specPath)).toThrow(SanitizationError);
  });
});

// ===========================================================================
// loadSpec: JSON + YAML OpenAPI/Swagger spec parsing (src/lib.ts)
// ===========================================================================

describe("loadSpec", () => {
  it("parses a valid JSON spec", () => {
    const json = JSON.stringify({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      paths: { "/users": { get: { responses: { "200": { description: "OK" } } } } },
    });
    const result = loadSpec(json);
    expect(result.openapi).toBe("3.0.0");
    expect((result.info as Record<string, unknown>).title).toBe("Test API");
  });

  it("parses a valid YAML spec", () => {
    const yamlSpec = [
      "openapi: 3.0.0",
      "info:",
      "  title: Test API",
      "  version: 1.0.0",
      "paths:",
      "  /users:",
      "    get:",
      "      responses:",
      "        '200':",
      "          description: OK",
      "",
    ].join("\n");
    const result = loadSpec(yamlSpec);
    expect(result.openapi).toBe("3.0.0");
    expect((result.info as Record<string, unknown>).title).toBe("Test API");
    const paths = result.paths as Record<string, unknown>;
    expect(paths).toHaveProperty("/users");
  });

  it("parses a YAML spec using Swagger 2.0 flow-style mappings", () => {
    const yamlSpec = "swagger: '2.0'\ninfo: {title: Flow API, version: '2.0'}\npaths: {}\n";
    const result = loadSpec(yamlSpec);
    expect(result.swagger).toBe("2.0");
    expect((result.info as Record<string, unknown>).title).toBe("Flow API");
  });

  it("throws a clear error for content that is neither valid JSON nor valid YAML", () => {
    // A single unquoted colon-less "{" is invalid JSON, and unbalanced flow
    // mapping syntax is also invalid YAML.
    const garbage = "{ this is not: valid: json: or: yaml: [[[";
    expect(() => loadSpec(garbage)).toThrow(/Failed to parse spec/);
    expect(() => loadSpec(garbage)).toThrow(/JSON error/);
    expect(() => loadSpec(garbage)).toThrow(/YAML error/);
  });

  it("throws a clear error for empty content", () => {
    expect(() => loadSpec("")).toThrow(/empty/);
    expect(() => loadSpec("   \n  ")).toThrow(/empty/);
  });

  it("includes the source label in the error message when provided", () => {
    expect(() => loadSpec("{ broken", "openapi.yaml")).toThrow(/openapi\.yaml/);
  });

  it("rejects YAML that parses to a scalar instead of an object", () => {
    // "true" is valid YAML (parses to boolean `true`) but not a usable spec object.
    expect(() => loadSpec("true")).toThrow(/Failed to parse spec/);
  });

  it("rejects a top-level JSON array (valid JSON, not a usable spec object)", () => {
    expect(() => loadSpec("[1, 2, 3]")).toThrow(/Failed to parse spec/);
  });

  it("rejects a top-level YAML array (valid YAML, not a usable spec object)", () => {
    expect(() => loadSpec("- one\n- two\n- three\n")).toThrow(/Failed to parse spec/);
  });
});

// ===========================================================================
// computeResponseTimeStats: load_test statistics (src/lib.ts)
// ===========================================================================

describe("computeResponseTimeStats", () => {
  it("computes min/max/avg/percentiles for a normal set of response times", () => {
    const stats = computeResponseTimeStats([100, 200, 300, 400, 500]);
    expect(stats).not.toHaveProperty("note");
    const typed = stats as { min: number; max: number; avg: string; p50: number; p95: number; p99: number };
    expect(typed.min).toBe(100);
    expect(typed.max).toBe(500);
    expect(typed.avg).toBe("300.00");
    expect(typed.p50).toBe(300);
  });

  it("returns a 'no data' note instead of NaN/Infinity when all requests failed (empty response times)", () => {
    const stats = computeResponseTimeStats([]);
    expect(stats).toEqual({
      note: "All requests failed before a response was received — no response time data available.",
    });
    // Explicitly assert the historical bug (NaN/Infinity) cannot resurface:
    expect(JSON.stringify(stats)).not.toMatch(/NaN|Infinity/);
  });

  it("does not mutate the input array", () => {
    const input = [300, 100, 200];
    computeResponseTimeStats(input);
    expect(input).toEqual([300, 100, 200]);
  });

  it("handles a single response time without division errors", () => {
    const stats = computeResponseTimeStats([42]);
    const typed = stats as { min: number; max: number; avg: string };
    expect(typed.min).toBe(42);
    expect(typed.max).toBe(42);
    expect(typed.avg).toBe("42.00");
  });
});
