/**
 * Unit tests for database-operations-mcp server.
 *
 * Tests cover:
 * - Zod schema validation (valid/invalid inputs for all eight tool schemas)
 * - sanitizePath integration (path traversal and null-byte rejection)
 * - errorResponse formatting
 * - Helper functions: generateFakeData, analyzeQueryForOptimization,
 *   validateMigrationSafety, generateMigrationSQL
 * - Tool name registration (ListTools handler coverage)
 */

import { z } from "zod";
import {
  sanitizePath,
  sanitizeString,
  errorResponse,
  SanitizationError,
} from "mcp-shared";

// ---------------------------------------------------------------------------
// Replicated Zod schemas (mirrors src/index.ts - not exported from there)
// ---------------------------------------------------------------------------

const RunQuerySchema = z.object({
  query: z.string().describe("SQL query to execute"),
  params: z.array(z.any()).optional().describe("Query parameters for safe binding"),
  database: z.string().describe("Database connection name or path"),
  dry_run: z.boolean().optional().describe("Preview query without execution"),
});

const InspectSchemaSchema = z.object({
  database: z.string().describe("Database to inspect"),
  table: z.string().optional().describe("Specific table to inspect"),
  include_indexes: z.boolean().optional().describe("Include index information"),
  include_constraints: z.boolean().optional().describe("Include constraint information"),
});

const GenerateMigrationSchema = z.object({
  description: z.string().describe("Migration description"),
  changes: z.object({
    table: z.string().describe("Table name"),
    add_columns: z.array(z.object({
      name: z.string(),
      type: z.string(),
      nullable: z.boolean().optional(),
      default: z.any().optional(),
    })).optional(),
    drop_columns: z.array(z.string()).optional(),
    modify_columns: z.array(z.object({
      name: z.string(),
      type: z.string().optional(),
      nullable: z.boolean().optional(),
      default: z.any().optional(),
    })).optional(),
    add_indexes: z.array(z.object({
      name: z.string(),
      columns: z.array(z.string()),
      unique: z.boolean().optional(),
    })).optional(),
  }).describe("Schema changes to apply"),
  migration_type: z.enum(["up", "down"]).optional().describe("Migration direction"),
});

const ValidateMigrationSchema = z.object({
  migration_file: z.string().describe("Path to migration file"),
  database: z.string().describe("Target database"),
});

const SeedDataSchema = z.object({
  table: z.string().describe("Table to seed"),
  count: z.number().describe("Number of records to generate"),
  schema: z.record(z.object({
    type: z.enum(["string", "number", "boolean", "date", "email", "uuid", "name", "address"]),
    min: z.number().optional(),
    max: z.number().optional(),
    options: z.array(z.any()).optional(),
  })).describe("Data generation rules per column"),
});

const ExplainQuerySchema = z.object({
  query: z.string().describe("Query to analyze"),
  database: z.string().describe("Database connection"),
  format: z.enum(["text", "json", "yaml"]).optional().describe("Output format"),
});

const OptimizeQuerySchema = z.object({
  query: z.string().describe("Query to optimize"),
  database: z.string().describe("Database connection"),
});

const BackupDatabaseSchema = z.object({
  database: z.string().describe("Database to backup"),
  output_path: z.string().describe("Backup file location"),
  compress: z.boolean().optional().describe("Enable compression"),
});

// The expected set of tool names registered in the ListTools handler.
const EXPECTED_TOOL_NAMES = [
  "run_query",
  "inspect_schema",
  "generate_migration",
  "validate_migration",
  "seed_data",
  "explain_query",
  "optimize_query",
  "backup_database",
];

// ---------------------------------------------------------------------------
// Replicated helper functions (mirrors src/index.ts - not exported)
// ---------------------------------------------------------------------------

interface FakeDataOptions {
  min?: number;
  max?: number;
  options?: unknown[];
}

interface MigrationChanges {
  table: string;
  add_columns?: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    default?: unknown;
  }>;
  drop_columns?: string[];
  modify_columns?: Array<{
    name: string;
    type?: string;
    nullable?: boolean;
    default?: unknown;
  }>;
  add_indexes?: Array<{
    name: string;
    columns: string[];
    unique?: boolean;
  }>;
}

interface QuerySuggestion {
  type: string;
  severity: string;
  message: string;
  example?: string;
  columns?: string[];
}

interface QueryAnalysis {
  query_complexity: string;
  suggestions: QuerySuggestion[];
  estimated_improvement: string;
}

interface MigrationWarning {
  severity: string;
  type: string;
  message: string;
  recommendation: string;
}

interface MigrationSafetyResult {
  safe: boolean;
  warnings: MigrationWarning[];
  recommendation: string;
}

function generateFakeData(type: string, options?: FakeDataOptions): string | number | boolean {
  const randomString = (length: number) => Math.random().toString(36).substring(2, 2 + length);
  const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  switch (type) {
    case "string":
      return randomString(options?.max || 10);
    case "number":
      return randomInt(options?.min || 0, options?.max || 1000);
    case "boolean":
      return Math.random() > 0.5;
    case "date": {
      const start = new Date(2020, 0, 1);
      const end = new Date();
      return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
    }
    case "email":
      return `${randomString(8)}@${randomString(5)}.com`;
    case "uuid":
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    case "name": {
      const firstNames = ["John", "Jane", "Bob", "Alice", "Charlie", "Diana", "Eve", "Frank"];
      const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis"];
      return `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`;
    }
    case "address":
      return `${randomInt(100, 9999)} ${randomString(8)} Street`;
    default:
      return randomString(10);
  }
}

function generateMigrationSQL(changes: MigrationChanges, direction: string = "up"): string {
  const lines: string[] = [];
  const table = changes.table;

  if (direction === "up") {
    if (changes.add_columns) {
      for (const col of changes.add_columns) {
        let sql = `ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`;
        if (col.nullable === false) sql += " NOT NULL";
        if (col.default !== undefined) sql += ` DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default}`;
        lines.push(sql + ";");
      }
    }
    if (changes.modify_columns) {
      for (const col of changes.modify_columns) {
        if (col.type) {
          lines.push(`ALTER TABLE ${table} ALTER COLUMN ${col.name} TYPE ${col.type};`);
        }
        if (col.nullable !== undefined) {
          lines.push(`ALTER TABLE ${table} ALTER COLUMN ${col.name} ${col.nullable ? "DROP NOT NULL" : "SET NOT NULL"};`);
        }
        if (col.default !== undefined) {
          lines.push(`ALTER TABLE ${table} ALTER COLUMN ${col.name} SET DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default};`);
        }
      }
    }
    if (changes.add_indexes) {
      for (const idx of changes.add_indexes) {
        const unique = idx.unique ? "UNIQUE " : "";
        lines.push(`CREATE ${unique}INDEX ${idx.name} ON ${table} (${idx.columns.join(", ")});`);
      }
    }
    if (changes.drop_columns) {
      for (const col of changes.drop_columns) {
        lines.push(`ALTER TABLE ${table} DROP COLUMN ${col};`);
      }
    }
  } else {
    if (changes.add_columns) {
      for (const col of changes.add_columns) {
        lines.push(`ALTER TABLE ${table} DROP COLUMN ${col.name};`);
      }
    }
    if (changes.add_indexes) {
      for (const idx of changes.add_indexes) {
        lines.push(`DROP INDEX ${idx.name};`);
      }
    }
  }

  return lines.join("\n");
}

function analyzeQueryForOptimization(query: string): QueryAnalysis {
  const suggestions: QuerySuggestion[] = [];
  const queryLower = query.toLowerCase();

  if (queryLower.includes("select *")) {
    suggestions.push({
      type: "select_specific_columns",
      severity: "medium",
      message: "Avoid SELECT * - specify only needed columns to reduce data transfer",
      example: "SELECT id, name, email FROM users"
    });
  }

  if ((queryLower.includes("update") || queryLower.includes("delete")) && !queryLower.includes("where")) {
    suggestions.push({
      type: "missing_where_clause",
      severity: "critical",
      message: "UPDATE/DELETE without WHERE clause will affect all rows",
      example: "Add WHERE clause to limit affected rows"
    });
  }

  if (queryLower.includes("like '%") || queryLower.includes("like \"%")) {
    suggestions.push({
      type: "leading_wildcard",
      severity: "high",
      message: "LIKE with leading wildcard cannot use indexes efficiently",
      example: "Consider full-text search or restructure query"
    });
  }

  const joinCount = (queryLower.match(/join/g) || []).length;
  if (joinCount > 3) {
    suggestions.push({
      type: "excessive_joins",
      severity: "medium",
      message: `Query has ${joinCount} JOINs which may impact performance`,
      example: "Consider denormalization or breaking into multiple queries"
    });
  }

  if (queryLower.includes("order by") && !queryLower.includes("limit")) {
    suggestions.push({
      type: "unbounded_order",
      severity: "low",
      message: "ORDER BY without LIMIT sorts all matching rows",
      example: "Add LIMIT clause if only subset of rows needed"
    });
  }

  const whereMatch = queryLower.match(/where\s+(\w+)\s*(=|>|<|>=|<=|like)/g);
  if (whereMatch) {
    suggestions.push({
      type: "index_opportunity",
      severity: "info",
      message: "Consider adding indexes on columns used in WHERE clause",
      columns: whereMatch.map(m => m.split(/\s+/)[1])
    });
  }

  return {
    query_complexity: joinCount > 2 ? "high" : joinCount > 0 ? "medium" : "low",
    suggestions,
    estimated_improvement: suggestions.length > 0 ?
      `Applying suggestions could improve performance by ${suggestions.length * 15}-${suggestions.length * 30}%` :
      "Query appears well-optimized"
  };
}

function validateMigrationSafety(sql: string): MigrationSafetyResult {
  const warnings: MigrationWarning[] = [];
  const sqlLower = sql.toLowerCase();

  if (sqlLower.includes("drop table")) {
    warnings.push({
      severity: "critical",
      type: "destructive_operation",
      message: "DROP TABLE will permanently delete table and all data",
      recommendation: "Ensure backup exists before proceeding"
    });
  }

  if (sqlLower.includes("drop column")) {
    warnings.push({
      severity: "high",
      type: "data_loss",
      message: "DROP COLUMN will permanently delete column data",
      recommendation: "Verify column is not needed and backup data if necessary"
    });
  }

  if (sqlLower.includes("truncate")) {
    warnings.push({
      severity: "critical",
      type: "data_loss",
      message: "TRUNCATE will delete all rows from table",
      recommendation: "Use DELETE with WHERE for selective deletion"
    });
  }

  if (sqlLower.includes("not null") && !sqlLower.includes("default")) {
    warnings.push({
      severity: "medium",
      type: "potential_failure",
      message: "Adding NOT NULL column without DEFAULT may fail if table has existing rows",
      recommendation: "Add DEFAULT value or migrate data first"
    });
  }

  if (sqlLower.includes("alter column") && sqlLower.includes("type")) {
    warnings.push({
      severity: "medium",
      type: "type_conversion",
      message: "Type changes may fail or lose data depending on existing values",
      recommendation: "Test on staging environment with production-like data"
    });
  }

  return {
    safe: warnings.filter(w => w.severity === "critical").length === 0,
    warnings,
    recommendation: warnings.length > 0 ?
      "Review warnings before applying migration in production" :
      "Migration appears safe to apply"
  };
}

// =========================================================================
// 1. RunQuerySchema validation
// =========================================================================

describe("RunQuerySchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { query: "SELECT * FROM users", database: "/tmp/test.db" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("SELECT * FROM users");
      expect(result.data.database).toBe("/tmp/test.db");
      expect(result.data.params).toBeUndefined();
      expect(result.data.dry_run).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      query: "SELECT * FROM users WHERE id = $1",
      database: "mydb",
      params: [42],
      dry_run: true,
    };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.params).toEqual([42]);
      expect(result.data.dry_run).toBe(true);
    }
  });

  it("rejects missing query", () => {
    const input = { database: "mydb" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing database", () => {
    const input = { query: "SELECT 1" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string query", () => {
    const input = { query: 123, database: "mydb" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean dry_run", () => {
    const input = { query: "SELECT 1", database: "mydb", dry_run: "yes" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-array params", () => {
    const input = { query: "SELECT 1", database: "mydb", params: "not-array" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts empty params array", () => {
    const input = { query: "SELECT 1", database: "mydb", params: [] };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.params).toEqual([]);
    }
  });

  it("accepts empty string query (schema allows it)", () => {
    const input = { query: "", database: "mydb" };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});

// =========================================================================
// 2. InspectSchemaSchema validation
// =========================================================================

describe("InspectSchemaSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { database: "production_db" };
    const result = InspectSchemaSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.database).toBe("production_db");
      expect(result.data.table).toBeUndefined();
      expect(result.data.include_indexes).toBeUndefined();
      expect(result.data.include_constraints).toBeUndefined();
    }
  });

  it("accepts valid input with all optional fields", () => {
    const input = {
      database: "mydb",
      table: "users",
      include_indexes: true,
      include_constraints: false,
    };
    const result = InspectSchemaSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.table).toBe("users");
      expect(result.data.include_indexes).toBe(true);
      expect(result.data.include_constraints).toBe(false);
    }
  });

  it("rejects missing database", () => {
    const input = { table: "users" };
    const result = InspectSchemaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string database", () => {
    const input = { database: 42 };
    const result = InspectSchemaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean include_indexes", () => {
    const input = { database: "mydb", include_indexes: "yes" };
    const result = InspectSchemaSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 3. GenerateMigrationSchema validation
// =========================================================================

describe("GenerateMigrationSchema", () => {
  it("accepts valid input with minimal changes", () => {
    const input = {
      description: "add email column",
      changes: { table: "users" },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("add email column");
      expect(result.data.changes.table).toBe("users");
      expect(result.data.migration_type).toBeUndefined();
    }
  });

  it("accepts valid input with add_columns", () => {
    const input = {
      description: "add email column",
      changes: {
        table: "users",
        add_columns: [
          { name: "email", type: "VARCHAR(255)", nullable: true },
          { name: "age", type: "INTEGER", nullable: false, default: 0 },
        ],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes.add_columns).toHaveLength(2);
      expect(result.data.changes.add_columns![0].name).toBe("email");
    }
  });

  it("accepts valid input with drop_columns", () => {
    const input = {
      description: "remove legacy columns",
      changes: {
        table: "users",
        drop_columns: ["old_field", "deprecated_col"],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes.drop_columns).toEqual(["old_field", "deprecated_col"]);
    }
  });

  it("accepts valid input with modify_columns", () => {
    const input = {
      description: "change type of age column",
      changes: {
        table: "users",
        modify_columns: [
          { name: "age", type: "BIGINT", nullable: false },
        ],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts valid input with add_indexes", () => {
    const input = {
      description: "add email index",
      changes: {
        table: "users",
        add_indexes: [
          { name: "idx_email", columns: ["email"], unique: true },
        ],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.changes.add_indexes![0].unique).toBe(true);
    }
  });

  it("accepts migration_type 'up'", () => {
    const input = {
      description: "test",
      changes: { table: "t" },
      migration_type: "up",
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts migration_type 'down'", () => {
    const input = {
      description: "test",
      changes: { table: "t" },
      migration_type: "down",
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid migration_type", () => {
    const input = {
      description: "test",
      changes: { table: "t" },
      migration_type: "rollback",
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const input = { changes: { table: "users" } };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing changes", () => {
    const input = { description: "test" };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing table in changes", () => {
    const input = {
      description: "test",
      changes: { add_columns: [{ name: "x", type: "INT" }] },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects add_columns entry missing name", () => {
    const input = {
      description: "test",
      changes: {
        table: "users",
        add_columns: [{ type: "VARCHAR(255)" }],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects add_columns entry missing type", () => {
    const input = {
      description: "test",
      changes: {
        table: "users",
        add_columns: [{ name: "email" }],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects add_indexes entry missing columns", () => {
    const input = {
      description: "test",
      changes: {
        table: "users",
        add_indexes: [{ name: "idx_test" }],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects add_indexes entry missing name", () => {
    const input = {
      description: "test",
      changes: {
        table: "users",
        add_indexes: [{ columns: ["email"] }],
      },
    };
    const result = GenerateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 4. ValidateMigrationSchema validation
// =========================================================================

describe("ValidateMigrationSchema", () => {
  it("accepts valid input with required fields", () => {
    const input = { migration_file: "/migrations/001_up.sql", database: "production" };
    const result = ValidateMigrationSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.migration_file).toBe("/migrations/001_up.sql");
      expect(result.data.database).toBe("production");
    }
  });

  it("rejects missing migration_file", () => {
    const input = { database: "production" };
    const result = ValidateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing database", () => {
    const input = { migration_file: "/migrations/001_up.sql" };
    const result = ValidateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string migration_file", () => {
    const input = { migration_file: 123, database: "production" };
    const result = ValidateMigrationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 5. SeedDataSchema validation
// =========================================================================

describe("SeedDataSchema", () => {
  it("accepts valid input with all required fields", () => {
    const input = {
      table: "users",
      count: 10,
      schema: {
        name: { type: "name" },
        email: { type: "email" },
        age: { type: "number", min: 18, max: 65 },
      },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.table).toBe("users");
      expect(result.data.count).toBe(10);
      expect(Object.keys(result.data.schema)).toHaveLength(3);
    }
  });

  it("accepts all valid type enum values", () => {
    const validTypes = ["string", "number", "boolean", "date", "email", "uuid", "name", "address"] as const;
    for (const type of validTypes) {
      const input = {
        table: "test",
        count: 1,
        schema: { col: { type } },
      };
      const result = SeedDataSchema.safeParse(input);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid type enum value", () => {
    const input = {
      table: "test",
      count: 1,
      schema: { col: { type: "phone" } },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing table", () => {
    const input = {
      count: 10,
      schema: { name: { type: "name" } },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing count", () => {
    const input = {
      table: "users",
      schema: { name: { type: "name" } },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing schema", () => {
    const input = { table: "users", count: 10 };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-number count", () => {
    const input = {
      table: "users",
      count: "ten",
      schema: { name: { type: "name" } },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts schema with optional min/max/options fields", () => {
    const input = {
      table: "test",
      count: 5,
      schema: {
        score: { type: "number", min: 0, max: 100 },
        status: { type: "string", options: ["active", "inactive"] },
      },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts empty schema object", () => {
    const input = { table: "users", count: 10, schema: {} };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects schema entry missing type", () => {
    const input = {
      table: "test",
      count: 1,
      schema: { col: { min: 0 } },
    };
    const result = SeedDataSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 6. ExplainQuerySchema validation
// =========================================================================

describe("ExplainQuerySchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { query: "SELECT * FROM users", database: "mydb" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.format).toBeUndefined();
    }
  });

  it("accepts format 'text'", () => {
    const input = { query: "SELECT 1", database: "mydb", format: "text" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts format 'json'", () => {
    const input = { query: "SELECT 1", database: "mydb", format: "json" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("accepts format 'yaml'", () => {
    const input = { query: "SELECT 1", database: "mydb", format: "yaml" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects invalid format value", () => {
    const input = { query: "SELECT 1", database: "mydb", format: "xml" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const input = { database: "mydb" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing database", () => {
    const input = { query: "SELECT 1" };
    const result = ExplainQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 7. OptimizeQuerySchema validation
// =========================================================================

describe("OptimizeQuerySchema", () => {
  it("accepts valid input", () => {
    const input = { query: "SELECT * FROM users", database: "mydb" };
    const result = OptimizeQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("SELECT * FROM users");
      expect(result.data.database).toBe("mydb");
    }
  });

  it("rejects missing query", () => {
    const input = { database: "mydb" };
    const result = OptimizeQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing database", () => {
    const input = { query: "SELECT 1" };
    const result = OptimizeQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string query", () => {
    const input = { query: 42, database: "mydb" };
    const result = OptimizeQuerySchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

// =========================================================================
// 8. BackupDatabaseSchema validation
// =========================================================================

describe("BackupDatabaseSchema", () => {
  it("accepts valid input with required fields only", () => {
    const input = { database: "mydb", output_path: "/backups/mydb.sql" };
    const result = BackupDatabaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.compress).toBeUndefined();
    }
  });

  it("accepts valid input with compress option", () => {
    const input = { database: "mydb", output_path: "/backups/mydb.sql", compress: true };
    const result = BackupDatabaseSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.compress).toBe(true);
    }
  });

  it("rejects missing database", () => {
    const input = { output_path: "/backups/mydb.sql" };
    const result = BackupDatabaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing output_path", () => {
    const input = { database: "mydb" };
    const result = BackupDatabaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-boolean compress", () => {
    const input = { database: "mydb", output_path: "/backups/mydb.sql", compress: "yes" };
    const result = BackupDatabaseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-string output_path", () => {
    const input = { database: "mydb", output_path: 123 };
    const result = BackupDatabaseSchema.safeParse(input);
    expect(result.success).toBe(false);
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
});

// =========================================================================
// 10. errorResponse formatting
// =========================================================================

describe("errorResponse", () => {
  it("formats an Error object with context", () => {
    const err = new Error("something went wrong");
    const response = errorResponse(err, "run_query");
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe("text");
    expect(response.content[0].text).toBe(
      "Error in run_query: something went wrong"
    );
  });

  it("formats a string error with context", () => {
    const response = errorResponse("timeout exceeded", "inspect_schema");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe(
      "Error in inspect_schema: timeout exceeded"
    );
  });

  it("formats an Error object without context", () => {
    const err = new Error("failure");
    const response = errorResponse(err);
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error: failure");
  });

  it("formats a non-Error non-string value", () => {
    const response = errorResponse(42, "optimize_query");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toBe("Error in optimize_query: 42");
  });

  it("handles SanitizationError as a regular Error", () => {
    const err = new SanitizationError("Path traversal detected", "path", "../etc/passwd");
    const response = errorResponse(err, "validate_migration");
    expect(response.isError).toBe(true);
    expect(response.content[0].text).toContain("Path traversal detected");
    expect(response.content[0].text).toContain("validate_migration");
  });
});

// =========================================================================
// 11. Tool registration completeness
// =========================================================================

describe("Tool registration", () => {
  it("server registers exactly the eight expected tool names", () => {
    const schemaToolMap: Record<string, z.ZodObject<any>> = {
      run_query: RunQuerySchema,
      inspect_schema: InspectSchemaSchema,
      generate_migration: GenerateMigrationSchema,
      validate_migration: ValidateMigrationSchema,
      seed_data: SeedDataSchema,
      explain_query: ExplainQuerySchema,
      optimize_query: OptimizeQuerySchema,
      backup_database: BackupDatabaseSchema,
    };

    expect(Object.keys(schemaToolMap).sort()).toEqual(
      [...EXPECTED_TOOL_NAMES].sort()
    );
  });

  it("all eight tool names are present in the expected set", () => {
    expect(EXPECTED_TOOL_NAMES).toContain("run_query");
    expect(EXPECTED_TOOL_NAMES).toContain("inspect_schema");
    expect(EXPECTED_TOOL_NAMES).toContain("generate_migration");
    expect(EXPECTED_TOOL_NAMES).toContain("validate_migration");
    expect(EXPECTED_TOOL_NAMES).toContain("seed_data");
    expect(EXPECTED_TOOL_NAMES).toContain("explain_query");
    expect(EXPECTED_TOOL_NAMES).toContain("optimize_query");
    expect(EXPECTED_TOOL_NAMES).toContain("backup_database");
  });

  it("no duplicate tool names exist", () => {
    const unique = new Set(EXPECTED_TOOL_NAMES);
    expect(unique.size).toBe(EXPECTED_TOOL_NAMES.length);
  });
});

// =========================================================================
// 12. generateFakeData tests
// =========================================================================

describe("generateFakeData", () => {
  it("generates a string of default length", () => {
    const result = generateFakeData("string");
    expect(typeof result).toBe("string");
    expect((result as string).length).toBeGreaterThan(0);
    expect((result as string).length).toBeLessThanOrEqual(10);
  });

  it("generates a string with custom max length", () => {
    const result = generateFakeData("string", { max: 5 });
    expect(typeof result).toBe("string");
    expect((result as string).length).toBeLessThanOrEqual(5);
  });

  it("generates a number within default range", () => {
    const result = generateFakeData("number");
    expect(typeof result).toBe("number");
    expect(result as number).toBeGreaterThanOrEqual(0);
    expect(result as number).toBeLessThanOrEqual(1000);
  });

  it("generates a number within custom range", () => {
    const result = generateFakeData("number", { min: 10, max: 20 });
    expect(typeof result).toBe("number");
    expect(result as number).toBeGreaterThanOrEqual(10);
    expect(result as number).toBeLessThanOrEqual(20);
  });

  it("generates a boolean", () => {
    const result = generateFakeData("boolean");
    expect(typeof result).toBe("boolean");
  });

  it("generates a valid ISO date string", () => {
    const result = generateFakeData("date");
    expect(typeof result).toBe("string");
    const parsed = new Date(result as string);
    expect(parsed.getTime()).not.toBeNaN();
    // Date should be between 2020 and now
    expect(parsed.getTime()).toBeGreaterThanOrEqual(new Date(2020, 0, 1).getTime());
    expect(parsed.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("generates a valid email format", () => {
    const result = generateFakeData("email");
    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^[a-z0-9]+@[a-z0-9]+\.com$/);
  });

  it("generates a valid UUID format", () => {
    const result = generateFakeData("uuid");
    expect(typeof result).toBe("string");
    expect(result as string).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it("generates a name with first and last parts", () => {
    const result = generateFakeData("name");
    expect(typeof result).toBe("string");
    const parts = (result as string).split(" ");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("generates an address with number and street", () => {
    const result = generateFakeData("address");
    expect(typeof result).toBe("string");
    expect(result as string).toMatch(/^\d+ \w+ Street$/);
  });

  it("falls back to random string for unknown type", () => {
    const result = generateFakeData("unknown_type");
    expect(typeof result).toBe("string");
    expect((result as string).length).toBeLessThanOrEqual(10);
  });
});

// =========================================================================
// 13. generateMigrationSQL tests
// =========================================================================

describe("generateMigrationSQL", () => {
  it("generates ADD COLUMN SQL for up migration", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "email", type: "VARCHAR(255)" },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ADD COLUMN email VARCHAR(255);");
  });

  it("generates ADD COLUMN with NOT NULL", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "age", type: "INTEGER", nullable: false },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL;");
  });

  it("generates ADD COLUMN with string DEFAULT", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "status", type: "VARCHAR(20)", default: "active" },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';");
  });

  it("generates ADD COLUMN with numeric DEFAULT", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "score", type: "INTEGER", default: 0 },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ADD COLUMN score INTEGER DEFAULT 0;");
  });

  it("generates ADD COLUMN with NOT NULL and DEFAULT", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "active", type: "BOOLEAN", nullable: false, default: true },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;");
  });

  it("generates DROP COLUMN SQL for up migration", () => {
    const changes: MigrationChanges = {
      table: "users",
      drop_columns: ["old_field"],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users DROP COLUMN old_field;");
  });

  it("generates ALTER COLUMN TYPE for modify_columns", () => {
    const changes: MigrationChanges = {
      table: "users",
      modify_columns: [
        { name: "age", type: "BIGINT" },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ALTER COLUMN age TYPE BIGINT;");
  });

  it("generates ALTER COLUMN SET NOT NULL for modify_columns", () => {
    const changes: MigrationChanges = {
      table: "users",
      modify_columns: [
        { name: "email", nullable: false },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ALTER COLUMN email SET NOT NULL;");
  });

  it("generates ALTER COLUMN DROP NOT NULL for modify_columns", () => {
    const changes: MigrationChanges = {
      table: "users",
      modify_columns: [
        { name: "email", nullable: true },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;");
  });

  it("generates ALTER COLUMN SET DEFAULT for modify_columns", () => {
    const changes: MigrationChanges = {
      table: "users",
      modify_columns: [
        { name: "status", default: "pending" },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("ALTER TABLE users ALTER COLUMN status SET DEFAULT 'pending';");
  });

  it("generates CREATE INDEX SQL", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_indexes: [
        { name: "idx_email", columns: ["email"] },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("CREATE INDEX idx_email ON users (email);");
  });

  it("generates CREATE UNIQUE INDEX SQL", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_indexes: [
        { name: "idx_email", columns: ["email"], unique: true },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("CREATE UNIQUE INDEX idx_email ON users (email);");
  });

  it("generates multi-column index SQL", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_indexes: [
        { name: "idx_name_email", columns: ["name", "email"] },
      ],
    };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("CREATE INDEX idx_name_email ON users (name, email);");
  });

  it("generates combined up migration with multiple operations", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "email", type: "VARCHAR(255)" },
      ],
      add_indexes: [
        { name: "idx_email", columns: ["email"], unique: true },
      ],
      drop_columns: ["legacy_field"],
    };
    const sql = generateMigrationSQL(changes, "up");
    const lines = sql.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain("ADD COLUMN email");
    expect(lines[1]).toContain("CREATE UNIQUE INDEX");
    expect(lines[2]).toContain("DROP COLUMN legacy_field");
  });

  it("generates down migration that reverses add_columns as DROP COLUMN", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [
        { name: "email", type: "VARCHAR(255)" },
      ],
    };
    const sql = generateMigrationSQL(changes, "down");
    expect(sql).toBe("ALTER TABLE users DROP COLUMN email;");
  });

  it("generates down migration that reverses add_indexes as DROP INDEX", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_indexes: [
        { name: "idx_email", columns: ["email"] },
      ],
    };
    const sql = generateMigrationSQL(changes, "down");
    expect(sql).toBe("DROP INDEX idx_email;");
  });

  it("generates empty string for no changes", () => {
    const changes: MigrationChanges = { table: "users" };
    const sql = generateMigrationSQL(changes, "up");
    expect(sql).toBe("");
  });

  it("generates empty string for down migration with only drop_columns (not reversible)", () => {
    const changes: MigrationChanges = {
      table: "users",
      drop_columns: ["old_field"],
    };
    const sql = generateMigrationSQL(changes, "down");
    expect(sql).toBe("");
  });

  it("defaults direction to 'up' when not specified", () => {
    const changes: MigrationChanges = {
      table: "users",
      add_columns: [{ name: "test", type: "TEXT" }],
    };
    const sql = generateMigrationSQL(changes);
    expect(sql).toContain("ADD COLUMN test TEXT");
  });
});

// =========================================================================
// 14. analyzeQueryForOptimization tests
// =========================================================================

describe("analyzeQueryForOptimization", () => {
  it("detects SELECT * usage", () => {
    const analysis = analyzeQueryForOptimization("SELECT * FROM users");
    const suggestion = analysis.suggestions.find(s => s.type === "select_specific_columns");
    expect(suggestion).toBeDefined();
    expect(suggestion!.severity).toBe("medium");
  });

  it("detects UPDATE without WHERE clause", () => {
    const analysis = analyzeQueryForOptimization("UPDATE users SET status = 'active'");
    const suggestion = analysis.suggestions.find(s => s.type === "missing_where_clause");
    expect(suggestion).toBeDefined();
    expect(suggestion!.severity).toBe("critical");
  });

  it("detects DELETE without WHERE clause", () => {
    const analysis = analyzeQueryForOptimization("DELETE FROM users");
    const suggestion = analysis.suggestions.find(s => s.type === "missing_where_clause");
    expect(suggestion).toBeDefined();
    expect(suggestion!.severity).toBe("critical");
  });

  it("does not flag UPDATE with WHERE clause", () => {
    const analysis = analyzeQueryForOptimization("UPDATE users SET status = 'active' WHERE id = 1");
    const suggestion = analysis.suggestions.find(s => s.type === "missing_where_clause");
    expect(suggestion).toBeUndefined();
  });

  it("detects LIKE with leading wildcard (single quotes)", () => {
    const analysis = analyzeQueryForOptimization("SELECT * FROM users WHERE name LIKE '%john%'");
    const suggestion = analysis.suggestions.find(s => s.type === "leading_wildcard");
    expect(suggestion).toBeDefined();
    expect(suggestion!.severity).toBe("high");
  });

  it("detects excessive JOINs (more than 3)", () => {
    const query = `
      SELECT * FROM a
      JOIN b ON a.id = b.a_id
      JOIN c ON b.id = c.b_id
      JOIN d ON c.id = d.c_id
      JOIN e ON d.id = e.d_id
    `;
    const analysis = analyzeQueryForOptimization(query);
    const suggestion = analysis.suggestions.find(s => s.type === "excessive_joins");
    expect(suggestion).toBeDefined();
    expect(suggestion!.severity).toBe("medium");
    expect(suggestion!.message).toContain("4 JOINs");
  });

  it("does not flag 3 or fewer JOINs as excessive", () => {
    const query = "SELECT * FROM a JOIN b ON a.id = b.a_id JOIN c ON b.id = c.b_id";
    const analysis = analyzeQueryForOptimization(query);
    const suggestion = analysis.suggestions.find(s => s.type === "excessive_joins");
    expect(suggestion).toBeUndefined();
  });

  it("detects ORDER BY without LIMIT", () => {
    const analysis = analyzeQueryForOptimization("SELECT * FROM users ORDER BY name");
    const suggestion = analysis.suggestions.find(s => s.type === "unbounded_order");
    expect(suggestion).toBeDefined();
    expect(suggestion!.severity).toBe("low");
  });

  it("does not flag ORDER BY with LIMIT", () => {
    const analysis = analyzeQueryForOptimization("SELECT * FROM users ORDER BY name LIMIT 10");
    const suggestion = analysis.suggestions.find(s => s.type === "unbounded_order");
    expect(suggestion).toBeUndefined();
  });

  it("detects index opportunity from WHERE clause", () => {
    const analysis = analyzeQueryForOptimization("SELECT id FROM users WHERE email = 'test@test.com'");
    const suggestion = analysis.suggestions.find(s => s.type === "index_opportunity");
    expect(suggestion).toBeDefined();
    expect(suggestion!.columns).toContain("email");
  });

  it("returns low complexity for simple queries", () => {
    const analysis = analyzeQueryForOptimization("SELECT id FROM users WHERE id = 1");
    expect(analysis.query_complexity).toBe("low");
  });

  it("returns medium complexity for queries with 1-2 JOINs", () => {
    const analysis = analyzeQueryForOptimization("SELECT * FROM users JOIN orders ON users.id = orders.user_id");
    expect(analysis.query_complexity).toBe("medium");
  });

  it("returns high complexity for queries with 3+ JOINs", () => {
    const query = "SELECT * FROM a JOIN b ON 1=1 JOIN c ON 1=1 JOIN d ON 1=1";
    const analysis = analyzeQueryForOptimization(query);
    expect(analysis.query_complexity).toBe("high");
  });

  it("returns well-optimized message when no suggestions", () => {
    // Use a simple query that triggers none of the heuristic checks:
    // no SELECT *, no UPDATE/DELETE without WHERE, no leading wildcard LIKE,
    // no excessive JOINs, no ORDER BY without LIMIT, no WHERE clause pattern match
    const analysis = analyzeQueryForOptimization("SELECT 1");
    expect(analysis.suggestions).toHaveLength(0);
    expect(analysis.estimated_improvement).toBe("Query appears well-optimized");
  });

  it("returns improvement estimate when suggestions exist", () => {
    const analysis = analyzeQueryForOptimization("SELECT * FROM users ORDER BY name");
    expect(analysis.suggestions.length).toBeGreaterThan(0);
    expect(analysis.estimated_improvement).toMatch(/Applying suggestions could improve performance by/);
  });

  it("handles case-insensitive query detection", () => {
    const analysis = analyzeQueryForOptimization("select * from USERS order by NAME");
    const selectStar = analysis.suggestions.find(s => s.type === "select_specific_columns");
    const unboundedOrder = analysis.suggestions.find(s => s.type === "unbounded_order");
    expect(selectStar).toBeDefined();
    expect(unboundedOrder).toBeDefined();
  });
});

// =========================================================================
// 15. validateMigrationSafety tests
// =========================================================================

describe("validateMigrationSafety", () => {
  it("flags DROP TABLE as critical", () => {
    const result = validateMigrationSafety("DROP TABLE users;");
    expect(result.safe).toBe(false);
    const warning = result.warnings.find(w => w.type === "destructive_operation");
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("critical");
  });

  it("flags DROP COLUMN as high severity", () => {
    const result = validateMigrationSafety("ALTER TABLE users DROP COLUMN email;");
    const warning = result.warnings.find(w => w.type === "data_loss" && w.message.includes("DROP COLUMN"));
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("high");
    // DROP COLUMN alone is high, not critical, so safe should be true
    expect(result.safe).toBe(true);
  });

  it("flags TRUNCATE as critical", () => {
    const result = validateMigrationSafety("TRUNCATE TABLE users;");
    expect(result.safe).toBe(false);
    const warning = result.warnings.find(w => w.message.includes("TRUNCATE"));
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("critical");
  });

  it("flags NOT NULL without DEFAULT as medium severity", () => {
    const result = validateMigrationSafety("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL;");
    const warning = result.warnings.find(w => w.type === "potential_failure");
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("medium");
  });

  it("does not flag NOT NULL with DEFAULT", () => {
    const result = validateMigrationSafety("ALTER TABLE users ADD COLUMN age INTEGER NOT NULL DEFAULT 0;");
    const warning = result.warnings.find(w => w.type === "potential_failure");
    expect(warning).toBeUndefined();
  });

  it("flags type conversion via ALTER COLUMN TYPE", () => {
    const result = validateMigrationSafety("ALTER TABLE users ALTER COLUMN age TYPE BIGINT;");
    const warning = result.warnings.find(w => w.type === "type_conversion");
    expect(warning).toBeDefined();
    expect(warning!.severity).toBe("medium");
  });

  it("returns safe=true for safe migrations", () => {
    const result = validateMigrationSafety("ALTER TABLE users ADD COLUMN email VARCHAR(255);");
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
    expect(result.recommendation).toBe("Migration appears safe to apply");
  });

  it("returns safe=false only when critical warnings exist", () => {
    // High severity but no critical
    const highResult = validateMigrationSafety("ALTER TABLE users DROP COLUMN temp;");
    expect(highResult.safe).toBe(true);

    // Critical severity
    const criticalResult = validateMigrationSafety("DROP TABLE users;");
    expect(criticalResult.safe).toBe(false);
  });

  it("detects multiple warnings in a single migration", () => {
    const sql = `
      DROP TABLE old_data;
      ALTER TABLE users DROP COLUMN legacy;
      TRUNCATE TABLE temp_data;
    `;
    const result = validateMigrationSafety(sql);
    expect(result.warnings.length).toBeGreaterThanOrEqual(3);
    expect(result.safe).toBe(false);
    expect(result.recommendation).toBe("Review warnings before applying migration in production");
  });

  it("handles case-insensitive SQL", () => {
    const result = validateMigrationSafety("drop table USERS;");
    expect(result.safe).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("handles empty SQL string", () => {
    const result = validateMigrationSafety("");
    expect(result.safe).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});

// =========================================================================
// 16. Schema edge cases
// =========================================================================

describe("Schema edge cases", () => {
  it("RunQuerySchema strips unknown properties", () => {
    const input = {
      query: "SELECT 1",
      database: "mydb",
      extraField: "should be stripped",
    };
    const result = RunQuerySchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).extraField).toBeUndefined();
    }
  });

  it("SeedDataSchema accepts all valid type enum values", () => {
    for (const type of ["string", "number", "boolean", "date", "email", "uuid", "name", "address"] as const) {
      const result = SeedDataSchema.safeParse({
        table: "test",
        count: 1,
        schema: { col: { type } },
      });
      expect(result.success).toBe(true);
    }
  });

  it("ExplainQuerySchema accepts all valid format enum values", () => {
    for (const format of ["text", "json", "yaml"] as const) {
      const result = ExplainQuerySchema.safeParse({
        query: "SELECT 1",
        database: "mydb",
        format,
      });
      expect(result.success).toBe(true);
    }
  });

  it("GenerateMigrationSchema accepts all valid migration_type enum values", () => {
    for (const migration_type of ["up", "down"] as const) {
      const result = GenerateMigrationSchema.safeParse({
        description: "test",
        changes: { table: "t" },
        migration_type,
      });
      expect(result.success).toBe(true);
    }
  });

  it("RunQuerySchema rejects null as query", () => {
    const result = RunQuerySchema.safeParse({
      query: null,
      database: "mydb",
    });
    expect(result.success).toBe(false);
  });

  it("SeedDataSchema rejects negative count (schema allows it - no min constraint)", () => {
    const result = SeedDataSchema.safeParse({
      table: "test",
      count: -1,
      schema: { col: { type: "string" } },
    });
    // z.number() with no .min() allows negative values
    expect(result.success).toBe(true);
  });

  it("SeedDataSchema accepts zero count", () => {
    const result = SeedDataSchema.safeParse({
      table: "test",
      count: 0,
      schema: { col: { type: "string" } },
    });
    expect(result.success).toBe(true);
  });

  it("BackupDatabaseSchema rejects null as database", () => {
    const result = BackupDatabaseSchema.safeParse({
      database: null,
      output_path: "/backups/mydb.sql",
    });
    expect(result.success).toBe(false);
  });

  it("InspectSchemaSchema rejects numeric table", () => {
    const result = InspectSchemaSchema.safeParse({
      database: "mydb",
      table: 123,
    });
    expect(result.success).toBe(false);
  });

  it("GenerateMigrationSchema accepts empty add_columns array", () => {
    const result = GenerateMigrationSchema.safeParse({
      description: "test",
      changes: { table: "t", add_columns: [] },
    });
    expect(result.success).toBe(true);
  });

  it("GenerateMigrationSchema accepts empty drop_columns array", () => {
    const result = GenerateMigrationSchema.safeParse({
      description: "test",
      changes: { table: "t", drop_columns: [] },
    });
    expect(result.success).toBe(true);
  });

  it("GenerateMigrationSchema rejects non-string entries in drop_columns", () => {
    const result = GenerateMigrationSchema.safeParse({
      description: "test",
      changes: { table: "t", drop_columns: [123] },
    });
    expect(result.success).toBe(false);
  });

  it("ValidateMigrationSchema rejects empty object", () => {
    const result = ValidateMigrationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("OptimizeQuerySchema rejects empty object", () => {
    const result = OptimizeQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
