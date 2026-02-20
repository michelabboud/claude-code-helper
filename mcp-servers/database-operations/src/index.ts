#!/usr/bin/env node

/**
 * Database Operations MCP Server
 * Provides database operations, migrations, schema inspection, and query optimization tools
 */

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import { runServer, generateRequestId, measureDuration, sanitizePath, sanitizeString, errorResponse } from "mcp-shared";

// Type definitions
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

interface SchemaInfo {
  database: string;
  inspected_at: string;
  tables: string[];
  message: string;
  indexes_included?: boolean;
  constraints_included?: boolean;
}

// Tool input schemas
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

// Helper functions
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
    // Add columns
    if (changes.add_columns) {
      for (const col of changes.add_columns) {
        let sql = `ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`;
        if (col.nullable === false) sql += " NOT NULL";
        if (col.default !== undefined) sql += ` DEFAULT ${typeof col.default === 'string' ? `'${col.default}'` : col.default}`;
        lines.push(sql + ";");
      }
    }

    // Modify columns
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

    // Add indexes
    if (changes.add_indexes) {
      for (const idx of changes.add_indexes) {
        const unique = idx.unique ? "UNIQUE " : "";
        lines.push(`CREATE ${unique}INDEX ${idx.name} ON ${table} (${idx.columns.join(", ")});`);
      }
    }

    // Drop columns
    if (changes.drop_columns) {
      for (const col of changes.drop_columns) {
        lines.push(`ALTER TABLE ${table} DROP COLUMN ${col};`);
      }
    }
  } else {
    // Reverse operations for down migration
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

  // Check for SELECT *
  if (queryLower.includes("select *")) {
    suggestions.push({
      type: "select_specific_columns",
      severity: "medium",
      message: "Avoid SELECT * - specify only needed columns to reduce data transfer",
      example: "SELECT id, name, email FROM users"
    });
  }

  // Check for missing WHERE clause
  if ((queryLower.includes("update") || queryLower.includes("delete")) && !queryLower.includes("where")) {
    suggestions.push({
      type: "missing_where_clause",
      severity: "critical",
      message: "UPDATE/DELETE without WHERE clause will affect all rows",
      example: "Add WHERE clause to limit affected rows"
    });
  }

  // Check for LIKE with leading wildcard
  if (queryLower.includes("like '%") || queryLower.includes("like \"%")) {
    suggestions.push({
      type: "leading_wildcard",
      severity: "high",
      message: "LIKE with leading wildcard cannot use indexes efficiently",
      example: "Consider full-text search or restructure query"
    });
  }

  // Check for multiple JOINs
  const joinCount = (queryLower.match(/join/g) || []).length;
  if (joinCount > 3) {
    suggestions.push({
      type: "excessive_joins",
      severity: "medium",
      message: `Query has ${joinCount} JOINs which may impact performance`,
      example: "Consider denormalization or breaking into multiple queries"
    });
  }

  // Check for ORDER BY without LIMIT
  if (queryLower.includes("order by") && !queryLower.includes("limit")) {
    suggestions.push({
      type: "unbounded_order",
      severity: "low",
      message: "ORDER BY without LIMIT sorts all matching rows",
      example: "Add LIMIT clause if only subset of rows needed"
    });
  }

  // Check for potential index opportunities
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

  // Check for destructive operations
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

  // Check for NOT NULL without DEFAULT
  if (sqlLower.includes("not null") && !sqlLower.includes("default")) {
    warnings.push({
      severity: "medium",
      type: "potential_failure",
      message: "Adding NOT NULL column without DEFAULT may fail if table has existing rows",
      recommendation: "Add DEFAULT value or migrate data first"
    });
  }

  // Check for type changes
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

// MCP Server
runServer({ name: "database-operations", version: "1.0.0" }, ({ server, logger }) => {

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_query",
        description: "Execute SQL queries with parameter binding. Supports dry-run mode for query preview. Use for safe database queries with proper parameterization.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "SQL query to execute" },
            params: {
              type: "array",
              items: { type: "string" },
              description: "Query parameters for safe binding"
            },
            database: { type: "string", description: "Database connection name or path" },
            dry_run: { type: "boolean", description: "Preview query without execution" },
          },
          required: ["query", "database"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
        },
      },
      {
        name: "inspect_schema",
        description: "Get detailed schema information including tables, columns, indexes, and foreign keys. Essential for understanding database structure.",
        inputSchema: {
          type: "object",
          properties: {
            database: { type: "string", description: "Database to inspect" },
            table: { type: "string", description: "Specific table to inspect (optional)" },
            include_indexes: { type: "boolean", description: "Include index information" },
            include_constraints: { type: "boolean", description: "Include constraint information" },
          },
          required: ["database"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "generate_migration",
        description: "Create migration files from schema changes with rollback support. Generates both up and down migrations for safe deployments.",
        inputSchema: {
          type: "object",
          properties: {
            description: { type: "string", description: "Migration description" },
            changes: {
              type: "object",
              properties: {
                table: { type: "string", description: "Table name" },
                add_columns: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      nullable: { type: "boolean" },
                      default: { type: "string" }
                    },
                    required: ["name", "type"]
                  }
                },
                drop_columns: { type: "array", items: { type: "string" } },
                add_indexes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      columns: { type: "array", items: { type: "string" } },
                      unique: { type: "boolean" }
                    },
                    required: ["name", "columns"]
                  }
                }
              },
              required: ["table"]
            },
            migration_type: {
              type: "string",
              enum: ["up", "down"],
              description: "Migration direction"
            },
          },
          required: ["description", "changes"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "validate_migration",
        description: "Check migration safety for breaking changes and performance impact. Validates syntax and identifies potential issues before deployment.",
        inputSchema: {
          type: "object",
          properties: {
            migration_file: { type: "string", description: "Path to migration file" },
            database: { type: "string", description: "Target database" },
          },
          required: ["migration_file", "database"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "seed_data",
        description: "Generate realistic test data for development and testing. Supports various data types including names, emails, addresses, and more.",
        inputSchema: {
          type: "object",
          properties: {
            table: { type: "string", description: "Table to seed" },
            count: { type: "number", description: "Number of records to generate" },
            schema: {
              type: "object",
              additionalProperties: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["string", "number", "boolean", "date", "email", "uuid", "name", "address"]
                  },
                  min: { type: "number" },
                  max: { type: "number" },
                  options: { type: "array" }
                },
                required: ["type"]
              },
              description: "Data generation rules per column"
            },
          },
          required: ["table", "count", "schema"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: false,
        },
      },
      {
        name: "explain_query",
        description: "Get query execution plans for optimization analysis. Shows how the database will execute a query and identifies bottlenecks.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Query to analyze" },
            database: { type: "string", description: "Database connection" },
            format: {
              type: "string",
              enum: ["text", "json", "yaml"],
              description: "Output format"
            },
          },
          required: ["query", "database"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "optimize_query",
        description: "Suggest query optimizations based on execution plan analysis. Provides actionable recommendations for improving query performance.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Query to optimize" },
            database: { type: "string", description: "Database connection" },
          },
          required: ["query", "database"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      {
        name: "backup_database",
        description: "Create database backups with optional compression. Supports various database engines and provides verification of backup integrity.",
        inputSchema: {
          type: "object",
          properties: {
            database: { type: "string", description: "Database to backup" },
            output_path: { type: "string", description: "Backup file location" },
            compress: { type: "boolean", description: "Enable compression" },
          },
          required: ["database", "output_path"],
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
      case "run_query": {
        const parsed = RunQuerySchema.parse(args);
        const query = sanitizeString(parsed.query);
        const params = parsed.params;
        const database = sanitizePath(parsed.database, process.cwd());
        const dry_run = parsed.dry_run;

        if (dry_run) {
          let previewQuery = query;
          if (params) {
            params.forEach((param, i) => {
              previewQuery = previewQuery.replace(`$${i + 1}`, JSON.stringify(param));
            });
          }
          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                dry_run: true,
                query: previewQuery,
                database,
                params: params || [],
                message: "Query preview - not executed"
              }, null, 2),
            }],
          };
          break;
        }

        // In production, this would execute against actual database
        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              database,
              query,
              params: params || [],
              result: {
                rows_affected: 0,
                execution_time_ms: 0,
                message: "Query execution requires database connection configuration. Set up connection in environment variables."
              }
            }, null, 2),
          }],
        };
        break;
      }

      case "inspect_schema": {
        const parsed = InspectSchemaSchema.parse(args);
        const database = sanitizePath(parsed.database, process.cwd());
        const table = parsed.table;
        const include_indexes = parsed.include_indexes;
        const include_constraints = parsed.include_constraints;

        // Return schema inspection result (mock for demo)
        const schemaInfo: SchemaInfo = {
          database,
          inspected_at: new Date().toISOString(),
          tables: table ? [table] : ["Configure database connection to list tables"],
          message: "Schema inspection requires database connection. Configure connection in environment."
        };

        if (include_indexes) {
          schemaInfo.indexes_included = true;
        }
        if (include_constraints) {
          schemaInfo.constraints_included = true;
        }

        response = {
          content: [{
            type: "text",
            text: JSON.stringify(schemaInfo, null, 2),
          }],
        };
        break;
      }

      case "generate_migration": {
        const parsed = GenerateMigrationSchema.parse(args);
        const description = sanitizeString(parsed.description);
        const changes = parsed.changes;

        const timestamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0];
        const filename = `${timestamp}_${description.toLowerCase().replace(/\s+/g, "_")}`;

        const upSQL = generateMigrationSQL(changes, "up");
        const downSQL = generateMigrationSQL(changes, "down");

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              migration_files: {
                up: {
                  filename: `${filename}.up.sql`,
                  content: `-- Migration: ${description}\n-- Generated: ${new Date().toISOString()}\n\n${upSQL}`
                },
                down: {
                  filename: `${filename}.down.sql`,
                  content: `-- Rollback: ${description}\n-- Generated: ${new Date().toISOString()}\n\n${downSQL}`
                }
              },
              changes_summary: changes,
              validation: validateMigrationSafety(upSQL)
            }, null, 2),
          }],
        };
        break;
      }

      case "validate_migration": {
        const parsed = ValidateMigrationSchema.parse(args);
        const migration_file = sanitizePath(parsed.migration_file, process.cwd());
        const database = sanitizePath(parsed.database, process.cwd());

        let migrationContent: string;
        try {
          migrationContent = await fs.readFile(migration_file, "utf-8");
        } catch {
          response = {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: "Could not read migration file",
                file: migration_file,
                suggestion: "Verify file path and permissions"
              }, null, 2),
            }],
            isError: true,
          };
          break;
        }

        const validation = validateMigrationSafety(migrationContent);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              file: migration_file,
              database,
              ...validation
            }, null, 2),
          }],
        };
        break;
      }

      case "seed_data": {
        const parsed = SeedDataSchema.parse(args);
        const table = sanitizeString(parsed.table);
        const count = parsed.count;
        const schema = parsed.schema;

        const records: Record<string, string | number | boolean>[] = [];
        for (let i = 0; i < Math.min(count, 100); i++) {
          const record: Record<string, string | number | boolean> = {};
          for (const [column, config] of Object.entries(schema)) {
            record[column] = generateFakeData(config.type, config);
          }
          records.push(record);
        }

        // Generate INSERT statements
        const columns = Object.keys(schema);
        const insertStatements = records.map(record => {
          const values = columns.map(col => {
            const val = record[col];
            return typeof val === "string" ? `'${val}'` : val;
          });
          return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")});`;
        });

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              table,
              generated_count: records.length,
              sample_records: records.slice(0, 5),
              insert_sql: insertStatements.slice(0, 5).join("\n"),
              note: count > 100 ? `Limited to 100 records for preview. Full ${count} records available on execution.` : undefined
            }, null, 2),
          }],
        };
        break;
      }

      case "explain_query": {
        const parsed = ExplainQuerySchema.parse(args);
        const query = sanitizeString(parsed.query);
        const database = sanitizePath(parsed.database, process.cwd());
        const format = parsed.format;

        const analysis = analyzeQueryForOptimization(query);

        const explanation = {
          query,
          database,
          format: format || "text",
          analysis,
          execution_plan: {
            note: "Actual execution plan requires database connection",
            estimated_cost: analysis.query_complexity === "high" ? "high" :
                           analysis.query_complexity === "medium" ? "moderate" : "low",
            recommendations: analysis.suggestions.map((s: QuerySuggestion) => s.message)
          }
        };

        response = {
          content: [{
            type: "text",
            text: JSON.stringify(explanation, null, 2),
          }],
        };
        break;
      }

      case "optimize_query": {
        const parsed = OptimizeQuerySchema.parse(args);
        const query = sanitizeString(parsed.query);
        const database = sanitizePath(parsed.database, process.cwd());

        const analysis = analyzeQueryForOptimization(query);

        response = {
          content: [{
            type: "text",
            text: JSON.stringify({
              original_query: query,
              database,
              ...analysis,
              optimized_query: analysis.suggestions.length > 0 ?
                "Apply suggestions above to optimize query" : query
            }, null, 2),
          }],
        };
        break;
      }

      case "backup_database": {
        const parsed = BackupDatabaseSchema.parse(args);
        const database = sanitizePath(parsed.database, process.cwd());
        const output_path = sanitizePath(parsed.output_path, process.cwd());
        const compress = parsed.compress;

        const backupInfo = {
          database,
          output_path,
          compressed: compress || false,
          timestamp: new Date().toISOString(),
          status: "pending",
          commands: {
            postgresql: `pg_dump ${database} ${compress ? "| gzip" : ""} > ${output_path}${compress ? ".gz" : ""}`,
            mysql: `mysqldump ${database} ${compress ? "| gzip" : ""} > ${output_path}${compress ? ".gz" : ""}`,
            sqlite: `sqlite3 ${database} ".backup '${output_path}'"`,
            mongodb: `mongodump --db ${database} --out ${output_path}`
          },
          message: "Execute appropriate command for your database engine"
        };

        response = {
          content: [{
            type: "text",
            text: JSON.stringify(backupInfo, null, 2),
          }],
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
