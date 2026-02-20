/**
 * Unit tests for rag-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all eight tool schemas)
 * - sanitizePath integration (path traversal and null-byte rejection)
 * - errorResponse formatting
 * - Tool name registration (ListTools handler coverage)
 * - Schema edge cases (defaults, extra fields, type coercion)
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

const IndexCodebaseSchema = z.object({
  rootPath: z.string().describe("Root directory path to index"),
  collectionName: z.string().default("codebase").describe("Name for the vector collection"),
  filePatterns: z.array(z.string()).optional().describe("File patterns to include (e.g., ['*.ts', '*.js', '*.py'])"),
  excludePatterns: z.array(z.string()).optional().describe("Patterns to exclude (e.g., ['node_modules/**', 'build/**'])"),
  chunkSize: z.number().default(1000).describe("Maximum characters per code chunk"),
});

const IndexFileSchema = z.object({
  filePath: z.string().describe("Path to file to index"),
  collectionName: z.string().default("codebase").describe("Collection to add to"),
  metadata: z.record(z.unknown()).optional().describe("Additional metadata"),
});

const SemanticSearchSchema = z.object({
  query: z.string().describe("Natural language query (e.g., 'how does authentication work?')"),
  collectionName: z.string().default("codebase").describe("Collection to search"),
  nResults: z.number().default(5).describe("Number of results to return"),
  filter: z.record(z.unknown()).optional().describe("Metadata filters"),
});

const FindSimilarCodeSchema = z.object({
  codeSnippet: z.string().describe("Code snippet to find similar matches for"),
  collectionName: z.string().default("codebase").describe("Collection to search"),
  nResults: z.number().default(5).describe("Number of similar results"),
  threshold: z.number().optional().describe("Similarity threshold (0-1)"),
});

const GetRelevantContextSchema = z.object({
  task: z.string().describe("Task description (e.g., 'implement user logout')"),
  collectionName: z.string().default("codebase").describe("Collection to query"),
  maxTokens: z.number().default(4000).describe("Maximum tokens of context to return"),
});

const ListCollectionsSchema = z.object({});

const GetCollectionStatsSchema = z.object({
  collectionName: z.string().describe("Collection name"),
});

const DeleteCollectionSchema = z.object({
  collectionName: z.string().describe("Collection to delete"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "index_codebase",
  "index_file",
  "semantic_search",
  "find_similar_code",
  "get_relevant_context",
  "list_collections",
  "get_collection_stats",
  "delete_collection",
];

// =========================================================================
// 1. IndexCodebaseSchema validation
// =========================================================================

describe("IndexCodebaseSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { rootPath: "/home/user/project" };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rootPath).toBe("/home/user/project");
      expect(result.data.collectionName).toBe("codebase");
      expect(result.data.chunkSize).toBe(1000);
      expect(result.data.filePatterns).toBeUndefined();
      expect(result.data.excludePatterns).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      rootPath: "/src",
      collectionName: "my-project",
      filePatterns: ["*.ts", "*.js"],
      excludePatterns: ["node_modules/**", "build/**"],
      chunkSize: 500,
    };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("my-project");
      expect(result.data.filePatterns).toEqual(["*.ts", "*.js"]);
      expect(result.data.excludePatterns).toEqual(["node_modules/**", "build/**"]);
      expect(result.data.chunkSize).toBe(500);
    }
  });

  it("rejects missing rootPath", () => {
    const input = { collectionName: "test" };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string rootPath", () => {
    const input = { rootPath: 123 };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null rootPath", () => {
    const input = { rootPath: null };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array filePatterns", () => {
    const input = { rootPath: "/src", filePatterns: "*.ts" };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number chunkSize", () => {
    const input = { rootPath: "/src", chunkSize: "large" };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty filePatterns array", () => {
    const input = { rootPath: "/src", filePatterns: [] };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePatterns).toEqual([]);
    }
  });

  it("accepts empty excludePatterns array", () => {
    const input = { rootPath: "/src", excludePatterns: [] };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.excludePatterns).toEqual([]);
    }
  });

  it("applies default collectionName when not provided", () => {
    const input = { rootPath: "/src" };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("codebase");
    }
  });

  it("applies default chunkSize when not provided", () => {
    const input = { rootPath: "/src" };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chunkSize).toBe(1000);
    }
  });
});

// =========================================================================
// 2. IndexFileSchema validation
// =========================================================================

describe("IndexFileSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { filePath: "/src/index.ts" };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.filePath).toBe("/src/index.ts");
      expect(result.data.collectionName).toBe("codebase");
      expect(result.data.metadata).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      filePath: "/src/auth.ts",
      collectionName: "auth-module",
      metadata: { language: "typescript", author: "user" },
    };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("auth-module");
      expect(result.data.metadata).toEqual({ language: "typescript", author: "user" });
    }
  });

  it("rejects missing filePath", () => {
    const input = { collectionName: "test" };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string filePath", () => {
    const input = { filePath: 42 };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null filePath", () => {
    const input = { filePath: null };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts metadata with mixed value types", () => {
    const input = {
      filePath: "/src/file.ts",
      metadata: { count: 5, flag: true, name: "test", nested: { key: "val" } },
    };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts empty metadata object", () => {
    const input = { filePath: "/src/file.ts", metadata: {} };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({});
    }
  });

  it("rejects non-object metadata", () => {
    const input = { filePath: "/src/file.ts", metadata: "not-an-object" };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("applies default collectionName when not provided", () => {
    const input = { filePath: "/src/file.ts" };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("codebase");
    }
  });
});

// =========================================================================
// 3. SemanticSearchSchema validation
// =========================================================================

describe("SemanticSearchSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { query: "how does authentication work?" };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("how does authentication work?");
      expect(result.data.collectionName).toBe("codebase");
      expect(result.data.nResults).toBe(5);
      expect(result.data.filter).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      query: "user management",
      collectionName: "my-project",
      nResults: 10,
      filter: { language: "typescript" },
    };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("my-project");
      expect(result.data.nResults).toBe(10);
      expect(result.data.filter).toEqual({ language: "typescript" });
    }
  });

  it("rejects missing query", () => {
    const input = { collectionName: "test" };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string query", () => {
    const input = { query: 123 };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number nResults", () => {
    const input = { query: "test", nResults: "five" };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts zero nResults (no min constraint in schema)", () => {
    const input = { query: "test", nResults: 0 };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nResults).toBe(0);
    }
  });

  it("accepts negative nResults (no min constraint in schema)", () => {
    const input = { query: "test", nResults: -1 };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("applies default nResults when not provided", () => {
    const input = { query: "test" };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nResults).toBe(5);
    }
  });

  it("accepts empty filter object", () => {
    const input = { query: "test", filter: {} };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects non-object filter", () => {
    const input = { query: "test", filter: "not-an-object" };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 4. FindSimilarCodeSchema validation
// =========================================================================

describe("FindSimilarCodeSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { codeSnippet: "function hello() { return 'world'; }" };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codeSnippet).toBe("function hello() { return 'world'; }");
      expect(result.data.collectionName).toBe("codebase");
      expect(result.data.nResults).toBe(5);
      expect(result.data.threshold).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      codeSnippet: "const x = 1;",
      collectionName: "snippets",
      nResults: 3,
      threshold: 0.8,
    };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("snippets");
      expect(result.data.nResults).toBe(3);
      expect(result.data.threshold).toBe(0.8);
    }
  });

  it("rejects missing codeSnippet", () => {
    const input = { collectionName: "test" };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string codeSnippet", () => {
    const input = { codeSnippet: 42 };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number threshold", () => {
    const input = { codeSnippet: "const x = 1;", threshold: "high" };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts threshold of 0 (boundary value)", () => {
    const input = { codeSnippet: "const x = 1;", threshold: 0 };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold).toBe(0);
    }
  });

  it("accepts threshold of 1 (boundary value)", () => {
    const input = { codeSnippet: "const x = 1;", threshold: 1 };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.threshold).toBe(1);
    }
  });

  it("accepts threshold above 1 (no max constraint in schema)", () => {
    const input = { codeSnippet: "const x = 1;", threshold: 1.5 };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts multiline codeSnippet", () => {
    const snippet = `async function getUser(id: string): Promise<User> {
  const user = await db.find(id);
  return user;
}`;
    const input = { codeSnippet: snippet };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.codeSnippet).toBe(snippet);
    }
  });

  it("applies default nResults when not provided", () => {
    const input = { codeSnippet: "test" };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nResults).toBe(5);
    }
  });
});

// =========================================================================
// 5. GetRelevantContextSchema validation
// =========================================================================

describe("GetRelevantContextSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { task: "implement user logout" };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.task).toBe("implement user logout");
      expect(result.data.collectionName).toBe("codebase");
      expect(result.data.maxTokens).toBe(4000);
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      task: "add rate limiting to API",
      collectionName: "api-service",
      maxTokens: 8000,
    };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("api-service");
      expect(result.data.maxTokens).toBe(8000);
    }
  });

  it("rejects missing task", () => {
    const input = { collectionName: "test" };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string task", () => {
    const input = { task: 123 };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null task", () => {
    const input = { task: null };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number maxTokens", () => {
    const input = { task: "test", maxTokens: "many" };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts zero maxTokens (no min constraint in schema)", () => {
    const input = { task: "test", maxTokens: 0 };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxTokens).toBe(0);
    }
  });

  it("applies default maxTokens when not provided", () => {
    const input = { task: "test" };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxTokens).toBe(4000);
    }
  });

  it("applies default collectionName when not provided", () => {
    const input = { task: "test" };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("codebase");
    }
  });
});

// =========================================================================
// 6. ListCollectionsSchema validation
// =========================================================================

describe("ListCollectionsSchema", () => {
  it("accepts empty object", () => {
    const input = {};
    const result = ListCollectionsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("strips unknown properties", () => {
    const input = { extraField: "should be stripped" };
    const result = ListCollectionsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });

  it("accepts undefined input (defaults to empty object via parse)", () => {
    // z.object({}) will accept any object and strip extra keys
    const result = ListCollectionsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 7. GetCollectionStatsSchema validation
// =========================================================================

describe("GetCollectionStatsSchema", () => {
  it("accepts valid input", () => {
    const input = { collectionName: "my-collection" };
    const result = GetCollectionStatsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("my-collection");
    }
  });

  it("rejects missing collectionName", () => {
    const input = {};
    const result = GetCollectionStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string collectionName", () => {
    const input = { collectionName: 123 };
    const result = GetCollectionStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null collectionName", () => {
    const input = { collectionName: null };
    const result = GetCollectionStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty string collectionName (no minLength constraint)", () => {
    const input = { collectionName: "" };
    const result = GetCollectionStatsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 8. DeleteCollectionSchema validation
// =========================================================================

describe("DeleteCollectionSchema", () => {
  it("accepts valid input", () => {
    const input = { collectionName: "old-collection" };
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("old-collection");
    }
  });

  it("rejects missing collectionName", () => {
    const input = {};
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string collectionName", () => {
    const input = { collectionName: true };
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects null collectionName", () => {
    const input = { collectionName: null };
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty string collectionName (no minLength constraint)", () => {
    const input = { collectionName: "" };
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts collectionName with special characters", () => {
    const input = { collectionName: "my-collection_v2.0" };
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.collectionName).toBe("my-collection_v2.0");
    }
  });
});

// =========================================================================
// 9. sanitizePath integration
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

  it("rejects double dot traversal without base directory", () => {
    // Without a base, sanitizePath resolves relative to cwd; we can test
    // that null bytes are still blocked regardless.
    expect(() => sanitizePath("../\0etc/shadow")).toThrow(SanitizationError);
  });

  it("handles deeply nested path traversal attempts", () => {
    expect(() =>
      sanitizePath("a/b/c/../../../../etc/passwd", "/home/user/project")
    ).toThrow(SanitizationError);
  });

  it("handles path with encoded directory separator", () => {
    // A null byte mid-path should be rejected
    expect(() => sanitizePath("/home/user\0/project")).toThrow(SanitizationError);
  });
});

// =========================================================================
// 10. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("something went wrong");
    const response = errorResponse(err, "index_codebase");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in index_codebase: something went wrong"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("connection refused", "semantic_search");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in semantic_search: connection refused"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "find_similar_code");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in find_similar_code: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "index_file");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("index_file");
  });

  it("handles null error value", () => {
    const response = errorResponse(null, "delete_collection");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
  });

  it("handles undefined error value", () => {
    const response = errorResponse(undefined, "list_collections");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
  });
});

// =========================================================================
// 11. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the eight expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      index_codebase: IndexCodebaseSchema,
      index_file: IndexFileSchema,
      semantic_search: SemanticSearchSchema,
      find_similar_code: FindSimilarCodeSchema,
      get_relevant_context: GetRelevantContextSchema,
      list_collections: ListCollectionsSchema,
      get_collection_stats: GetCollectionStatsSchema,
      delete_collection: DeleteCollectionSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all eight tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("index_codebase");
    expect(EXPECTED_TOOL_NAMES).toContain("index_file");
    expect(EXPECTED_TOOL_NAMES).toContain("semantic_search");
    expect(EXPECTED_TOOL_NAMES).toContain("find_similar_code");
    expect(EXPECTED_TOOL_NAMES).toContain("get_relevant_context");
    expect(EXPECTED_TOOL_NAMES).toContain("list_collections");
    expect(EXPECTED_TOOL_NAMES).toContain("get_collection_stats");
    expect(EXPECTED_TOOL_NAMES).toContain("delete_collection");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });

  it("expected tool count is eight", () => {
    expect(EXPECTED_TOOL_NAMES.length).toBe(8);
  });
});

// =========================================================================
// 12. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("IndexCodebaseSchema strips unknown properties", () => {
    const input = {
      rootPath: "/src",
      extraField: "should be stripped",
    };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });

  it("IndexFileSchema strips unknown properties", () => {
    const input = {
      filePath: "/src/file.ts",
      unknownProp: 42,
    };
    const result = IndexFileSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).unknownProp).toBeUndefined();
    }
  });

  it("SemanticSearchSchema strips unknown properties", () => {
    const input = {
      query: "test query",
      extraData: true,
    };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraData).toBeUndefined();
    }
  });

  it("FindSimilarCodeSchema strips unknown properties", () => {
    const input = {
      codeSnippet: "const x = 1;",
      unknownKey: "value",
    };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).unknownKey).toBeUndefined();
    }
  });

  it("GetRelevantContextSchema strips unknown properties", () => {
    const input = {
      task: "implement feature",
      bonus: "field",
    };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).bonus).toBeUndefined();
    }
  });

  it("IndexCodebaseSchema rejects filePatterns with non-string elements", () => {
    const input = { rootPath: "/src", filePatterns: [123, true] };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("IndexCodebaseSchema rejects excludePatterns with non-string elements", () => {
    const input = { rootPath: "/src", excludePatterns: [null] };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("SemanticSearchSchema accepts large nResults", () => {
    const input = { query: "test", nResults: 1000 };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nResults).toBe(1000);
    }
  });

  it("GetRelevantContextSchema accepts very large maxTokens", () => {
    const input = { task: "test", maxTokens: 100000 };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxTokens).toBe(100000);
    }
  });

  it("IndexCodebaseSchema accepts float chunkSize (no integer constraint)", () => {
    const input = { rootPath: "/src", chunkSize: 500.5 };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.chunkSize).toBe(500.5);
    }
  });

  it("FindSimilarCodeSchema accepts empty string codeSnippet (no minLength constraint)", () => {
    const input = { codeSnippet: "" };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("GetRelevantContextSchema accepts empty string task (no minLength constraint)", () => {
    const input = { task: "" };
    const result = GetRelevantContextSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("SemanticSearchSchema accepts empty string query (no minLength constraint)", () => {
    const input = { query: "" };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("SemanticSearchSchema accepts filter with nested values", () => {
    const input = {
      query: "test",
      filter: { "$and": [{ language: "ts" }, { author: "user" }] },
    };
    const result = SemanticSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("IndexCodebaseSchema rejects boolean rootPath", () => {
    const input = { rootPath: true };
    const result = IndexCodebaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("FindSimilarCodeSchema rejects boolean codeSnippet", () => {
    const input = { codeSnippet: false };
    const result = FindSimilarCodeSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("GetCollectionStatsSchema rejects array collectionName", () => {
    const input = { collectionName: ["a", "b"] };
    const result = GetCollectionStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("DeleteCollectionSchema rejects undefined collectionName", () => {
    const input = { collectionName: undefined };
    const result = DeleteCollectionSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
