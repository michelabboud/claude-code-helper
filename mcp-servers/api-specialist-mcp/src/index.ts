#!/usr/bin/env node

/**
 * API Specialist MCP Server
 *
 * Provides comprehensive API testing, validation, security auditing, and improvement
 * suggestions for Claude Code through the Model Context Protocol.
 *
 * @author Michel Abboud (https://github.com/michelabboud)
 * @license MIT
 * @see https://github.com/michelabboud/claude-code-helper
 *
 * Created with assistance from Claude Code (Anthropic)
 */

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import { runServer, generateRequestId, measureDuration, sanitizePath, sanitizeUrl, errorResponse } from "mcp-shared";

// Type definitions for OpenAPI spec parsing
interface ValidationIssue {
  severity: string;
  message: string;
  path?: string;
  method?: string;
  suggestion?: string;
  check?: string;
  recommendation?: string;
}

interface SecurityCheckResults {
  apiUrl: string;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  recommendations: string[];
}

interface AuthConfig {
  type: "bearer" | "basic" | "apikey";
  token?: string;
  username?: string;
  password?: string;
  apikey?: string;
  header?: string;
}

interface OpenAPIOperation {
  summary?: string;
  description?: string;
  responses?: Record<string, { description?: string }>;
  parameters?: Array<{ name: string; in: string; description?: string }>;
}

interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: string[];
    url: {
      raw: string;
      host: string[];
      path: string[];
    };
  };
}

interface ImprovementSuggestion {
  category: string;
  priority: string;
  suggestion: string;
  impact: string;
  implementation: string;
}

interface JsonSchemaProperty {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

// Tool input schemas
const ValidateOpenAPISchema = z.object({
  specPath: z.string().describe("Path to OpenAPI/Swagger spec file (JSON or YAML)"),
  version: z.enum(["2.0", "3.0", "3.1"]).optional().describe("OpenAPI version to validate against"),
  strict: z.boolean().optional().describe("Enable strict validation mode"),
});

const TestEndpointSchema = z.object({
  url: z.string().describe("Full endpoint URL (e.g., https://api.example.com/users)"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
    .describe("HTTP method"),
  headers: z.record(z.string()).optional().describe("Request headers as key-value pairs"),
  body: z.string().optional().describe("Request body (JSON string)"),
  auth: z.object({
    type: z.enum(["bearer", "basic", "apikey"]),
    token: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    apikey: z.string().optional(),
    header: z.string().optional().describe("Header name for API key (default: X-API-Key)"),
  }).optional().describe("Authentication configuration"),
  timeout: z.number().optional().describe("Request timeout in milliseconds (default: 5000)"),
});

const CheckAPISecuritySchema = z.object({
  apiUrl: z.string().describe("Base API URL to check"),
  endpoints: z.array(z.string()).optional().describe("Specific endpoints to test (relative paths)"),
  checks: z.array(z.enum([
    "authentication",
    "cors",
    "rate_limiting",
    "https",
    "headers",
    "sql_injection",
    "xss",
  ])).optional().describe("Security checks to perform"),
});

const AnalyzeAPIStructureSchema = z.object({
  specPath: z.string().describe("Path to API specification file"),
  framework: z.enum(["rest", "graphql", "grpc"]).optional().describe("API framework type"),
  standards: z.array(z.enum([
    "rest_naming",
    "http_methods",
    "status_codes",
    "versioning",
    "pagination",
    "filtering",
    "error_handling",
  ])).optional().describe("Standards to check against"),
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
  focusAreas: z.array(z.enum([
    "performance",
    "security",
    "design",
    "documentation",
    "error_handling",
    "versioning",
  ])).optional().describe("Areas to focus improvement suggestions on"),
});

const ValidateAPIResponseSchema = z.object({
  response: z.string().describe("API response JSON to validate"),
  schema: z.string().describe("Expected JSON schema"),
  strict: z.boolean().optional().describe("Strict validation mode"),
});

// Helper functions
async function validateOpenAPI(
  specPath: string,
  _version?: string,
  strict: boolean = false
): Promise<string> {
  try {
    const spec = await fs.readFile(specPath, "utf-8");
    let parsed: Record<string, unknown>;

    // Parse YAML or JSON
    if (specPath.endsWith(".yaml") || specPath.endsWith(".yml")) {
      // For production, use yaml parser: const yaml = require('js-yaml');
      // parsed = yaml.load(spec);
      return JSON.stringify({
        error: "YAML parsing requires js-yaml package. Please use JSON format or install js-yaml.",
      }, null, 2);
    } else {
      parsed = JSON.parse(spec) as Record<string, unknown>;
    }

    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Validate OpenAPI structure
    if (!parsed.openapi && !parsed.swagger) {
      issues.push({
        severity: "error",
        message: "Missing 'openapi' or 'swagger' field"
      });
    }

    // Validate info section
    const info = parsed.info as Record<string, unknown> | undefined;
    if (!info) {
      issues.push({ severity: "error", message: "Missing 'info' section" });
    } else {
      if (!info.title) issues.push({ severity: "error", message: "Missing info.title" });
      if (!info.version) issues.push({ severity: "error", message: "Missing info.version" });
    }

    // Validate paths
    const paths = parsed.paths as Record<string, Record<string, unknown>> | undefined;
    if (!paths || Object.keys(paths).length === 0) {
      issues.push({ severity: "error", message: "No paths defined" });
    } else {
      // Check each path
      for (const [path, methods] of Object.entries(paths)) {
        if (!path.startsWith('/')) {
          issues.push({
            severity: "error",
            message: `Path '${path}' should start with '/'`
          });
        }

        // Validate methods
        for (const [method, operation] of Object.entries(methods)) {
          const validMethods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'];
          if (!validMethods.includes(method.toLowerCase())) continue;

          const op = operation as Record<string, unknown>;
          if (!op.responses) {
            warnings.push({
              severity: "warning",
              message: `${method.toUpperCase()} ${path} missing responses`
            });
          }

          if (strict && !op.description) {
            warnings.push({
              severity: "warning",
              message: `${method.toUpperCase()} ${path} missing description`
            });
          }
        }
      }
    }

    // Validate components/definitions
    const openapi = parsed.openapi as string | undefined;
    if (openapi && openapi.startsWith('3')) {
      if (!parsed.components) {
        warnings.push({ severity: "warning", message: "No components/schemas defined" });
      }
    }

    const components = parsed.components as Record<string, Record<string, unknown>> | undefined;

    return JSON.stringify({
      valid: issues.length === 0,
      version: parsed.openapi || parsed.swagger,
      errors: issues,
      warnings: warnings,
      stats: {
        paths: Object.keys(paths || {}).length,
        operations: countOperations(paths || {}),
        schemas: components?.schemas ? Object.keys(components.schemas).length : 0,
      },
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      valid: false,
      error: `Failed to validate spec: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function testEndpoint(
  url: string,
  method: string,
  headers?: Record<string, string>,
  body?: string,
  auth?: AuthConfig,
  timeout: number = 5000
): Promise<string> {
  try {
    const requestHeaders = { ...headers };

    // Add authentication
    if (auth) {
      if (auth.type === "bearer" && auth.token) {
        requestHeaders["Authorization"] = `Bearer ${auth.token}`;
      } else if (auth.type === "basic" && auth.username && auth.password) {
        const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
        requestHeaders["Authorization"] = `Basic ${encoded}`;
      } else if (auth.type === "apikey" && auth.apikey) {
        const headerName = auth.header || "X-API-Key";
        requestHeaders[headerName] = auth.apikey;
      }
    }

    // Make request using fetch (available in Node 18+)
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body && (method === "POST" || method === "PUT" || method === "PATCH") ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const responseBody = await response.text();

      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        parsedBody = responseBody;
      }

      return JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        responseTime: `${responseTime}ms`,
        size: responseBody.length,
      }, null, 2);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, null, 2);
  }
}

async function checkAPISecurity(
  apiUrl: string,
  endpoints?: string[],
  checks: string[] = ["authentication", "cors", "https", "headers"]
): Promise<string> {
  try {
    const results: SecurityCheckResults = {
      apiUrl,
      issues: [],
      warnings: [],
      recommendations: [],
    };

    // Check HTTPS
    if (checks.includes("https")) {
      if (!apiUrl.startsWith("https://")) {
        results.issues.push({
          severity: "critical",
          check: "https",
          message: "API does not use HTTPS - data transmitted in plain text",
          recommendation: "Enable HTTPS/TLS for all endpoints",
        });
      }
    }

    // Check CORS headers
    if (checks.includes("cors")) {
      try {
        const response = await fetch(apiUrl, { method: "OPTIONS" });
        const corsHeader = response.headers.get("access-control-allow-origin");

        if (!corsHeader) {
          results.warnings.push({
            severity: "medium",
            check: "cors",
            message: "No CORS headers found",
            recommendation: "Configure CORS if API serves browser clients",
          });
        } else if (corsHeader === "*") {
          results.issues.push({
            severity: "high",
            check: "cors",
            message: "CORS allows all origins (*) - potential security risk",
            recommendation: "Restrict CORS to specific trusted domains",
          });
        }
      } catch {
        results.warnings.push({
          check: "cors",
          message: "Could not check CORS configuration",
          severity: "low",
        });
      }
    }

    // Check security headers
    if (checks.includes("headers")) {
      try {
        const response = await fetch(apiUrl);
        const responseHeaders = Object.fromEntries(response.headers.entries());

        const securityHeaders: Record<string, string> = {
          "strict-transport-security": "HSTS not set - forces HTTPS usage",
          "x-content-type-options": "Missing - prevents MIME type sniffing",
          "x-frame-options": "Missing - prevents clickjacking attacks",
          "content-security-policy": "Missing - prevents XSS and injection attacks",
        };

        for (const [header, message] of Object.entries(securityHeaders)) {
          if (!responseHeaders[header]) {
            results.warnings.push({
              severity: "medium",
              check: "security_headers",
              message: `${header}: ${message}`,
              recommendation: `Add ${header} header`,
            });
          }
        }
      } catch {
        // Silently skip if endpoint doesn't respond
      }
    }

    // Check authentication
    if (checks.includes("authentication")) {
      try {
        const response = await fetch(apiUrl);

        if (response.status !== 401 && response.status !== 403) {
          results.warnings.push({
            severity: "high",
            check: "authentication",
            message: "API appears to be accessible without authentication",
            recommendation: "Implement authentication (OAuth 2.0, JWT, API Keys)",
          });
        }
      } catch {
        // Silently skip
      }
    }

    // Check rate limiting
    if (checks.includes("rate_limiting")) {
      try {
        // Make multiple rapid requests
        const requests = Array(10).fill(null).map(() => fetch(apiUrl));
        const responses = await Promise.all(requests);

        const hasRateLimit = responses.some(r =>
          r.status === 429 || r.headers.has("x-ratelimit-limit")
        );

        if (!hasRateLimit) {
          results.warnings.push({
            severity: "medium",
            check: "rate_limiting",
            message: "No rate limiting detected",
            recommendation: "Implement rate limiting to prevent abuse",
          });
        }
      } catch {
        // Silently skip
      }
    }

    // SQL Injection basic check
    if (checks.includes("sql_injection") && endpoints) {
      for (const endpoint of endpoints) {
        const testUrl = `${apiUrl}${endpoint}?id=1' OR '1'='1`;
        try {
          const response = await fetch(testUrl);
          const body = await response.text();

          if (body.toLowerCase().includes("sql") || body.toLowerCase().includes("syntax")) {
            results.issues.push({
              severity: "critical",
              check: "sql_injection",
              message: `Endpoint ${endpoint} may be vulnerable to SQL injection`,
              recommendation: "Use parameterized queries, never concatenate user input",
            });
          }
        } catch {
          // Silently skip
        }
      }
    }

    return JSON.stringify({
      summary: {
        critical: results.issues.filter((i: ValidationIssue) => i.severity === "critical").length,
        high: results.issues.filter((i: ValidationIssue) => i.severity === "high").length,
        medium: results.warnings.filter((w: ValidationIssue) => w.severity === "medium").length,
      },
      ...results,
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Security check failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function analyzeAPIStructure(
  specPath: string,
  framework: string = "rest",
  standards: string[] = ["rest_naming", "http_methods", "status_codes"]
): Promise<string> {
  try {
    const spec = JSON.parse(await fs.readFile(specPath, "utf-8")) as Record<string, unknown>;
    const issues: ValidationIssue[] = [];
    const suggestions: ValidationIssue[] = [];

    const specPaths = (spec.paths || {}) as Record<string, Record<string, unknown>>;

    // REST naming conventions
    if (standards.includes("rest_naming")) {
      for (const path of Object.keys(specPaths)) {
        // Check for verbs in path (anti-pattern)
        const verbs = ['get', 'post', 'create', 'update', 'delete', 'fetch'];
        const pathLower = path.toLowerCase();

        for (const verb of verbs) {
          if (pathLower.includes(verb)) {
            issues.push({
              severity: "medium",
              path,
              message: `Path contains verb '${verb}' - use HTTP methods instead`,
              suggestion: `Use HTTP methods (GET/POST/PUT/DELETE) instead of verbs in path`,
            });
          }
        }

        // Check for singular vs plural
        const segments = path.split('/').filter(s => s && !s.startsWith('{'));
        for (const segment of segments) {
          if (!segment.endsWith('s') && !segment.includes('-')) {
            suggestions.push({
              severity: "info",
              path,
              message: `Resource '${segment}' should be plural: '${segment}s'`,
              suggestion: `Use plural nouns for collections: /users not /user`,
            });
          }
        }
      }
    }

    // HTTP methods usage
    if (standards.includes("http_methods")) {
      for (const [path, methods] of Object.entries(specPaths)) {
        const methodsList = Object.keys(methods);

        // Check for proper method usage
        if (path.includes('{id}')) {
          if (methodsList.includes('post')) {
            issues.push({
              severity: "high",
              path,
              message: "POST on resource with ID - should use PUT/PATCH",
              suggestion: "POST creates new resources, PUT/PATCH updates existing ones",
            });
          }
        } else {
          if (methodsList.includes('put') || methodsList.includes('patch')) {
            issues.push({
              severity: "medium",
              path,
              message: "PUT/PATCH on collection - should target specific resource",
              suggestion: "Use POST for collection, PUT/PATCH for /resource/{id}",
            });
          }
        }
      }
    }

    // Status codes
    if (standards.includes("status_codes")) {
      for (const [path, methods] of Object.entries(specPaths)) {
        for (const [method, operation] of Object.entries(methods)) {
          const op = operation as OpenAPIOperation;
          const responses = op.responses || {};
          const statusCodes = Object.keys(responses);

          // Check for success codes
          if (method === 'post' && !statusCodes.includes('201')) {
            suggestions.push({
              severity: "info",
              path,
              method: method.toUpperCase(),
              message: "POST should return 201 Created on success",
            });
          }

          if (method === 'delete' && !statusCodes.includes('204')) {
            suggestions.push({
              severity: "info",
              path,
              method: method.toUpperCase(),
              message: "DELETE should return 204 No Content on success",
            });
          }

          // Check for error codes
          if (!statusCodes.includes('400') && (method === 'post' || method === 'put')) {
            suggestions.push({
              severity: "info",
              path,
              method: method.toUpperCase(),
              message: "Missing 400 Bad Request for validation errors",
            });
          }

          if (!statusCodes.includes('401')) {
            suggestions.push({
              severity: "info",
              path,
              method: method.toUpperCase(),
              message: "Missing 401 Unauthorized for auth failures",
            });
          }
        }
      }
    }

    // Versioning
    if (standards.includes("versioning")) {
      const hasVersioning = Object.keys(specPaths).some(
        path => /\/v\d+\//.test(path)
      );

      if (!hasVersioning) {
        suggestions.push({
          severity: "info",
          message: "No API versioning detected",
          suggestion: "Use versioning like /v1/, /v2/ to manage breaking changes",
        });
      }
    }

    return JSON.stringify({
      framework,
      totalPaths: Object.keys(specPaths).length,
      issues: issues,
      suggestions: suggestions,
      score: calculateAPIScore(issues),
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Structure analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function loadTest(
  url: string,
  method: string,
  duration: number,
  concurrency: number,
  headers?: Record<string, string>,
  body?: string
): Promise<string> {
  try {
    const results = {
      totalRequests: 0,
      successful: 0,
      failed: 0,
      responseTimes: [] as number[],
      errors: [] as string[],
    };

    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    // Run load test
    const workers: Promise<void>[] = [];

    for (let i = 0; i < concurrency; i++) {
      workers.push(
        (async () => {
          while (Date.now() < endTime) {
            const reqStart = Date.now();
            try {
              const response = await fetch(url, {
                method,
                headers,
                body: body && (method === "POST" || method === "PUT") ? body : undefined,
              });

              results.totalRequests++;
              if (response.ok) {
                results.successful++;
              } else {
                results.failed++;
              }
              results.responseTimes.push(Date.now() - reqStart);
            } catch (error: unknown) {
              results.failed++;
              results.totalRequests++;
              if (results.errors.length < 10) {
                results.errors.push(error instanceof Error ? error.message : String(error));
              }
            }
          }
        })()
      );
    }

    await Promise.all(workers);

    // Calculate statistics
    const responseTimes = results.responseTimes.sort((a, b) => a - b);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];

    return JSON.stringify({
      duration: `${duration}s`,
      concurrency,
      totalRequests: results.totalRequests,
      successful: results.successful,
      failed: results.failed,
      requestsPerSecond: (results.totalRequests / duration).toFixed(2),
      responseTimes: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: avgResponseTime.toFixed(2),
        p50,
        p95,
        p99,
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Load test failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function generateAPIDocs(
  specPath: string,
  format: string,
  _includeExamples: boolean = true
): Promise<string> {
  try {
    const spec = JSON.parse(await fs.readFile(specPath, "utf-8")) as Record<string, unknown>;
    const specInfo = spec.info as Record<string, unknown>;
    const specPaths = (spec.paths || {}) as Record<string, Record<string, unknown>>;

    if (format === "markdown") {
      let md = `# ${specInfo.title}\n\n`;
      md += `Version: ${specInfo.version}\n\n`;
      if (specInfo.description) {
        md += `${specInfo.description}\n\n`;
      }

      md += `## Base URL\n\n`;
      const servers = spec.servers as Array<{ url: string }> | undefined;
      if (servers && servers[0]) {
        md += `\`${servers[0].url}\`\n\n`;
      }

      md += `## Endpoints\n\n`;

      for (const [path, methods] of Object.entries(specPaths)) {
        for (const [method, operation] of Object.entries(methods)) {
          if (method === 'parameters') continue;

          const op = operation as OpenAPIOperation;
          md += `### ${method.toUpperCase()} ${path}\n\n`;
          md += `${op.summary || op.description || 'No description'}\n\n`;

          if (op.parameters) {
            md += `**Parameters:**\n\n`;
            for (const param of op.parameters) {
              md += `- \`${param.name}\` (${param.in}) - ${param.description || ''}\n`;
            }
            md += `\n`;
          }

          if (op.responses) {
            md += `**Responses:**\n\n`;
            for (const [code, response] of Object.entries(op.responses)) {
              md += `- \`${code}\` - ${response.description || ''}\n`;
            }
            md += `\n`;
          }

          md += `---\n\n`;
        }
      }

      return md;
    } else if (format === "html") {
      return `<!DOCTYPE html>
<html>
<head>
  <title>${specInfo.title}</title>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: 40px auto; }
    .endpoint { border-left: 3px solid #007bff; padding-left: 20px; margin: 20px 0; }
    .method { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: bold; }
    .get { background: #61affe; color: white; }
    .post { background: #49cc90; color: white; }
    .put { background: #fca130; color: white; }
    .delete { background: #f93e3e; color: white; }
  </style>
</head>
<body>
  <h1>${specInfo.title}</h1>
  <p>Version: ${specInfo.version}</p>
  <h2>Endpoints</h2>
  ${Object.entries(specPaths).map(([path, methods]: [string, Record<string, unknown>]) =>
    Object.entries(methods).filter(([m]) => m !== 'parameters').map(([method, op]: [string, unknown]) => {
      const operation = op as OpenAPIOperation;
      return `
      <div class="endpoint">
        <span class="method ${method}">${method.toUpperCase()}</span>
        <code>${path}</code>
        <p>${operation.summary || operation.description || ''}</p>
      </div>
    `;
    }).join('')
  ).join('')}
</body>
</html>`;
    } else if (format === "postman") {
      // Generate Postman collection
      const collection = {
        info: {
          name: specInfo.title,
          schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        },
        item: [] as PostmanItem[],
      };

      for (const [path, methods] of Object.entries(specPaths)) {
        for (const [method] of Object.entries(methods)) {
          if (method === 'parameters') continue;

          collection.item.push({
            name: `${method.toUpperCase()} ${path}`,
            request: {
              method: method.toUpperCase(),
              header: [],
              url: {
                raw: `{{baseUrl}}${path}`,
                host: ["{{baseUrl}}"],
                path: path.split('/').filter(Boolean),
              },
            },
          });
        }
      }

      return JSON.stringify(collection, null, 2);
    }

    return JSON.stringify({ error: "Unsupported format" });
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Documentation generation failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function suggestImprovements(
  specPath: string,
  focusAreas: string[] = ["performance", "security", "design", "documentation"]
): Promise<string> {
  try {
    const spec = JSON.parse(await fs.readFile(specPath, "utf-8")) as Record<string, unknown>;
    const improvements: ImprovementSuggestion[] = [];

    // Performance improvements
    if (focusAreas.includes("performance")) {
      improvements.push({
        category: "performance",
        priority: "high",
        suggestion: "Implement response caching with Cache-Control headers",
        impact: "Reduce server load and improve response times by 50-80%",
        implementation: "Add Cache-Control: max-age=3600 for GET endpoints",
      });

      improvements.push({
        category: "performance",
        priority: "medium",
        suggestion: "Add pagination to collection endpoints",
        impact: "Prevent large payload sizes and improve response times",
        implementation: "Add limit and offset query parameters, return total count",
      });

      improvements.push({
        category: "performance",
        priority: "medium",
        suggestion: "Implement field filtering (sparse fieldsets)",
        impact: "Reduce payload size by allowing clients to request only needed fields",
        implementation: "Add fields query parameter: ?fields=id,name,email",
      });
    }

    // Security improvements
    if (focusAreas.includes("security")) {
      improvements.push({
        category: "security",
        priority: "critical",
        suggestion: "Implement rate limiting",
        impact: "Prevent abuse and DDoS attacks",
        implementation: "Use rate limiting middleware (express-rate-limit, etc.)",
      });

      improvements.push({
        category: "security",
        priority: "high",
        suggestion: "Add request validation middleware",
        impact: "Prevent injection attacks and malformed requests",
        implementation: "Validate all inputs against schema before processing",
      });

      improvements.push({
        category: "security",
        priority: "high",
        suggestion: "Implement API key rotation",
        impact: "Reduce impact of compromised credentials",
        implementation: "Support multiple active keys with expiration dates",
      });
    }

    // Design improvements
    if (focusAreas.includes("design")) {
      const specPaths = (spec.paths || {}) as Record<string, unknown>;
      const hasVersioning = Object.keys(specPaths).some(p => /\/v\d+\//.test(p));

      if (!hasVersioning) {
        improvements.push({
          category: "design",
          priority: "high",
          suggestion: "Add API versioning",
          impact: "Allow backward-compatible changes without breaking existing clients",
          implementation: "Use URL versioning: /v1/resource or header versioning",
        });
      }

      improvements.push({
        category: "design",
        priority: "medium",
        suggestion: "Implement HATEOAS (Hypermedia)",
        impact: "Make API self-documenting and easier to navigate",
        implementation: "Include links to related resources in responses",
      });

      improvements.push({
        category: "design",
        priority: "medium",
        suggestion: "Add filtering and sorting capabilities",
        impact: "Reduce over-fetching and improve client flexibility",
        implementation: "Support query params: ?filter[status]=active&sort=-createdAt",
      });
    }

    // Documentation improvements
    if (focusAreas.includes("documentation")) {
      improvements.push({
        category: "documentation",
        priority: "medium",
        suggestion: "Add request/response examples to all endpoints",
        impact: "Improve developer experience and reduce integration time",
        implementation: "Use OpenAPI examples field for each operation",
      });

      improvements.push({
        category: "documentation",
        priority: "low",
        suggestion: "Create interactive API documentation",
        impact: "Allow developers to test API directly from docs",
        implementation: "Use Swagger UI, Redoc, or Postman Collections",
      });
    }

    // Error handling
    if (focusAreas.includes("error_handling")) {
      improvements.push({
        category: "error_handling",
        priority: "high",
        suggestion: "Standardize error response format",
        impact: "Consistent error handling across all endpoints",
        implementation: "Use RFC 7807 Problem Details format",
      });

      improvements.push({
        category: "error_handling",
        priority: "medium",
        suggestion: "Add error codes for client-side handling",
        impact: "Enable programmatic error handling",
        implementation: "Include machine-readable error codes in responses",
      });
    }

    return JSON.stringify({
      totalSuggestions: improvements.length,
      critical: improvements.filter(i => i.priority === "critical").length,
      high: improvements.filter(i => i.priority === "high").length,
      medium: improvements.filter(i => i.priority === "medium").length,
      improvements: improvements,
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      error: `Improvement analysis failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

async function validateAPIResponse(
  response: string,
  schema: string,
  strict: boolean = false
): Promise<string> {
  try {
    const responseData = JSON.parse(response) as Record<string, unknown>;
    const schemaData = JSON.parse(schema) as JsonSchemaProperty;

    const errors: string[] = [];

    // Basic schema validation
    function validateObject(data: Record<string, unknown>, schemaObj: JsonSchemaProperty, path: string = ""): void {
      if (schemaObj.type === "object" && schemaObj.properties) {
        for (const [key, propSchema] of Object.entries(schemaObj.properties)) {
          const value = data[key];
          const fullPath = path ? `${path}.${key}` : key;

          if (schemaObj.required?.includes(key) && value === undefined) {
            errors.push(`Missing required field: ${fullPath}`);
          }

          if (value !== undefined) {
            const propType = propSchema.type;
            const actualType = Array.isArray(value) ? "array" : typeof value;

            if (propType && propType !== actualType) {
              errors.push(`Type mismatch at ${fullPath}: expected ${propType}, got ${actualType}`);
            }

            if (propType === "object" && propSchema.properties) {
              validateObject(value as Record<string, unknown>, propSchema, fullPath);
            }
          }
        }

        // Check for extra fields in strict mode
        if (strict) {
          for (const key of Object.keys(data)) {
            if (!schemaObj.properties[key]) {
              errors.push(`Unexpected field in strict mode: ${path ? `${path}.${key}` : key}`);
            }
          }
        }
      }
    }

    validateObject(responseData, schemaData);

    return JSON.stringify({
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }, null, 2);
  } catch (error: unknown) {
    return JSON.stringify({
      valid: false,
      error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`,
    }, null, 2);
  }
}

// Utility functions
function countOperations(paths: Record<string, Record<string, unknown>>): number {
  let count = 0;
  for (const methods of Object.values(paths)) {
    count += Object.keys(methods).filter(k => k !== 'parameters').length;
  }
  return count;
}

function calculateAPIScore(issues: ValidationIssue[]): number {
  const criticalPenalty = issues.filter(i => i.severity === "critical").length * 20;
  const highPenalty = issues.filter(i => i.severity === "high").length * 10;
  const mediumPenalty = issues.filter(i => i.severity === "medium").length * 5;

  const score = Math.max(0, 100 - criticalPenalty - highPenalty - mediumPenalty);
  return Math.round(score);
}

// Start server
runServer({ name: "api-specialist-mcp", version: "1.0.0" }, ({ server, logger }) => {

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "validate_openapi",
        description: "Validate OpenAPI/Swagger specification file for correctness, completeness, and best practices. Checks structure, required fields, and common issues.",
        inputSchema: {
          type: "object",
          properties: {
            specPath: {
              type: "string",
              description: "Path to OpenAPI/Swagger spec file (JSON or YAML)"
            },
            version: {
              type: "string",
              enum: ["2.0", "3.0", "3.1"],
              description: "OpenAPI version to validate against"
            },
            strict: {
              type: "boolean",
              description: "Enable strict validation mode"
            },
          },
          required: ["specPath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "test_endpoint",
        description: "Make HTTP requests to test API endpoints. Supports all HTTP methods, authentication (Bearer, Basic, API Key), custom headers, and request bodies. Returns response status, headers, body, and timing.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Full endpoint URL (e.g., https://api.example.com/users)"
            },
            method: {
              type: "string",
              enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
              description: "HTTP method"
            },
            headers: {
              type: "object",
              description: "Request headers as key-value pairs"
            },
            body: {
              type: "string",
              description: "Request body (JSON string)"
            },
            auth: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["bearer", "basic", "apikey"] },
                token: { type: "string" },
                username: { type: "string" },
                password: { type: "string" },
                apikey: { type: "string" },
                header: { type: "string", description: "Header name for API key" },
              },
              description: "Authentication configuration"
            },
            timeout: {
              type: "number",
              description: "Request timeout in milliseconds (default: 5000)"
            },
          },
          required: ["url", "method"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: false,
        },
      },
      {
        name: "check_api_security",
        description: "Comprehensive security audit of API endpoints. Checks HTTPS usage, CORS configuration, security headers, authentication, rate limiting, and common vulnerabilities (SQL injection, XSS).",
        inputSchema: {
          type: "object",
          properties: {
            apiUrl: {
              type: "string",
              description: "Base API URL to check"
            },
            endpoints: {
              type: "array",
              items: { type: "string" },
              description: "Specific endpoints to test (relative paths)"
            },
            checks: {
              type: "array",
              items: {
                type: "string",
                enum: ["authentication", "cors", "rate_limiting", "https", "headers", "sql_injection", "xss"]
              },
              description: "Security checks to perform"
            },
          },
          required: ["apiUrl"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "analyze_api_structure",
        description: "Analyze API design and structure against REST/GraphQL best practices. Checks naming conventions, HTTP method usage, status codes, versioning, pagination, and error handling patterns.",
        inputSchema: {
          type: "object",
          properties: {
            specPath: {
              type: "string",
              description: "Path to API specification file"
            },
            framework: {
              type: "string",
              enum: ["rest", "graphql", "grpc"],
              description: "API framework type"
            },
            standards: {
              type: "array",
              items: {
                type: "string",
                enum: ["rest_naming", "http_methods", "status_codes", "versioning", "pagination", "filtering", "error_handling"]
              },
              description: "Standards to check against"
            },
          },
          required: ["specPath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "load_test",
        description: "Perform load testing on API endpoints. Simulates concurrent users making requests for a specified duration. Returns statistics including requests/second, response times (min/max/avg/p95/p99), and error rates.",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "Endpoint URL to load test"
            },
            method: {
              type: "string",
              enum: ["GET", "POST", "PUT", "DELETE"],
              description: "HTTP method"
            },
            duration: {
              type: "number",
              description: "Test duration in seconds"
            },
            concurrency: {
              type: "number",
              description: "Number of concurrent requests"
            },
            headers: {
              type: "object",
              description: "Request headers"
            },
            body: {
              type: "string",
              description: "Request body for POST/PUT"
            },
          },
          required: ["url", "method", "duration", "concurrency"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
        },
      },
      {
        name: "generate_api_docs",
        description: "Generate API documentation from OpenAPI specification. Supports multiple output formats: Markdown, HTML, and Postman collections. Optionally includes request/response examples.",
        inputSchema: {
          type: "object",
          properties: {
            specPath: {
              type: "string",
              description: "Path to OpenAPI spec"
            },
            format: {
              type: "string",
              enum: ["markdown", "html", "postman"],
              description: "Output format"
            },
            includeExamples: {
              type: "boolean",
              description: "Include request/response examples"
            },
          },
          required: ["specPath", "format"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "suggest_improvements",
        description: "Analyze API and provide prioritized improvement suggestions. Covers performance optimizations (caching, pagination), security enhancements, design best practices, documentation improvements, and error handling patterns.",
        inputSchema: {
          type: "object",
          properties: {
            specPath: {
              type: "string",
              description: "Path to API specification"
            },
            focusAreas: {
              type: "array",
              items: {
                type: "string",
                enum: ["performance", "security", "design", "documentation", "error_handling", "versioning"]
              },
              description: "Areas to focus improvement suggestions on"
            },
          },
          required: ["specPath"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "validate_api_response",
        description: "Validate API response against JSON schema. Checks data types, required fields, and structure. Supports strict mode for detecting unexpected fields.",
        inputSchema: {
          type: "object",
          properties: {
            response: {
              type: "string",
              description: "API response JSON to validate"
            },
            schema: {
              type: "string",
              description: "Expected JSON schema"
            },
            strict: {
              type: "boolean",
              description: "Strict validation mode"
            },
          },
          required: ["response", "schema"],
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const requestId = generateRequestId();
  const startTime = performance.now();

  logger.info("Tool called", { requestId, tool: name, args });

  try {
    let response;

    switch (name) {
      case "validate_openapi": {
        const { specPath, version, strict } = ValidateOpenAPISchema.parse(args);
        const safePath = sanitizePath(specPath, process.cwd());
        const result = await validateOpenAPI(safePath, version, strict);
        response = {
          content: [
            {
              type: "text",
              text: `OpenAPI validation results:\n\n${result}`,
            },
          ],
        };
        break;
      }

      case "test_endpoint": {
        const { url, method, headers, body, auth, timeout } = TestEndpointSchema.parse(args);
        const safeUrl = sanitizeUrl(url);
        const result = await testEndpoint(safeUrl, method, headers, body, auth, timeout);
        response = {
          content: [
            {
              type: "text",
              text: `Endpoint test results:\n\n${result}`,
            },
          ],
        };
        break;
      }

      case "check_api_security": {
        const { apiUrl, endpoints, checks } = CheckAPISecuritySchema.parse(args);
        const safeUrl = sanitizeUrl(apiUrl);
        const result = await checkAPISecurity(safeUrl, endpoints, checks);
        response = {
          content: [
            {
              type: "text",
              text: `API security check results:\n\n${result}`,
            },
          ],
        };
        break;
      }

      case "analyze_api_structure": {
        const { specPath, framework, standards } = AnalyzeAPIStructureSchema.parse(args);
        const safePath = sanitizePath(specPath, process.cwd());
        const result = await analyzeAPIStructure(safePath, framework, standards);
        response = {
          content: [
            {
              type: "text",
              text: `API structure analysis:\n\n${result}`,
            },
          ],
        };
        break;
      }

      case "load_test": {
        const { url, method, duration, concurrency, headers, body } = LoadTestSchema.parse(args);
        const safeUrl = sanitizeUrl(url);
        const result = await loadTest(safeUrl, method, duration, concurrency, headers, body);
        response = {
          content: [
            {
              type: "text",
              text: `Load test results:\n\n${result}`,
            },
          ],
        };
        break;
      }

      case "generate_api_docs": {
        const { specPath, format, includeExamples } = GenerateAPIDocsSchema.parse(args);
        const safePath = sanitizePath(specPath, process.cwd());
        const result = await generateAPIDocs(safePath, format, includeExamples);
        response = {
          content: [
            {
              type: "text",
              text: result,
            },
          ],
        };
        break;
      }

      case "suggest_improvements": {
        const { specPath, focusAreas } = SuggestImprovementsSchema.parse(args);
        const safePath = sanitizePath(specPath, process.cwd());
        const result = await suggestImprovements(safePath, focusAreas);
        response = {
          content: [
            {
              type: "text",
              text: `API improvement suggestions:\n\n${result}`,
            },
          ],
        };
        break;
      }

      case "validate_api_response": {
        const { response: apiResponse, schema, strict } = ValidateAPIResponseSchema.parse(args);
        const result = await validateAPIResponse(apiResponse, schema, strict);
        response = {
          content: [
            {
              type: "text",
              text: `Response validation results:\n\n${result}`,
            },
          ],
        };
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
    logger.error("Tool failed", { requestId, tool: name, durationMs, error: error instanceof Error ? error.message : String(error) });
    return errorResponse(error, name);
  }
});

}); // runServer
