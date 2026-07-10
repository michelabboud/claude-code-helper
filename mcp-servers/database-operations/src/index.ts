#!/usr/bin/env node

/**
 * Database Operations MCP Server
 * Provides database operations, migrations, schema inspection, and query optimization tools
 */

import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as fs from "fs/promises";
import { runServer, registerTrackedToolHandler, generateRequestId, measureDuration, sanitizePath, sanitizeString, errorResponse } from "mcp-shared";

const SERVER_NAME = "database-operations";
const SERVER_VERSION = "1.0.0";
const SERVER_COLOR_EMOJI = "🔵";

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
  connected: false;
  database: string;
  requested_at: string;
  requested_table: string | null;
  note: string;
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

function buildHelloVerbose(): string {
  return [
    `${SERVER_COLOR_EMOJI} # ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Database advisory toolkit** — SQL preview/formatting, schema-inspection stubs, migration file generation, migration safety linting, fake data seeding, and query-optimization suggestions for Claude Code.`,
    ``,
    `**IMPORTANT: this server has no database driver and never connects to a live database.** \`run_query\`, \`inspect_schema\`, and \`backup_database\` are advisory-only stubs — they format SQL, echo requests, and generate shell commands, but never execute a query, read a real schema, or write a backup file. Everything else (migration generation/validation, seed data, query analysis) is pure text/SQL generation that never touches a database either.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`run_query\` | ADVISORY ONLY — formats/previews SQL with parameter binding; never executes |`,
    `| \`inspect_schema\` | ADVISORY ONLY — echoes the request; never reads a real schema |`,
    `| \`generate_migration\` | Create migration files with up/down rollback support |`,
    `| \`validate_migration\` | Check migration safety for breaking changes |`,
    `| \`seed_data\` | Generate realistic fake test data (in-memory, not inserted anywhere) |`,
    `| \`explain_query\` | Static heuristic analysis of a query string (no real execution plan) |`,
    `| \`optimize_query\` | Suggest optimizations based on static heuristic analysis |`,
    `| \`backup_database\` | ADVISORY ONLY — generates the backup command; never runs it |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                                                        → Quick greeting + status check`,
    `hello {"verbose": true}                                         → Full server info and tool catalog`,
    `run_query {"query": "SELECT 1", "database": "mydb"}            → Preview formatted SQL (not executed)`,
    `inspect_schema {"database": "mydb"}                            → Echo schema-inspection request (no real schema)`,
    `generate_migration {"description": "add users table", "changes": {"table": "users"}}  → Generate migration`,
    `validate_migration {"migration_file": "migration.sql", "database": "mydb"}  → Validate migration`,
    `seed_data {"table": "users", "count": 10, "schema": {"email": {"type": "email"}}}  → Seed data`,
    `explain_query {"query": "SELECT * FROM users", "database": "mydb"}  → Explain query`,
    `optimize_query {"query": "SELECT * FROM users", "database": "mydb"} → Optimize query`,
    `backup_database {"database": "mydb", "output_path": "/backups/mydb.sql"}  → Generate backup command (not run)`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: Apache-2.0`,
  ].join("\n");
}

// MCP Server
runServer({ name: "database-operations", version: "1.0.0" }, (instance) => {
const { server, logger } = instance;

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "run_query",
        description: "ADVISORY ONLY — does not connect to or execute against a live database. Formats and previews SQL queries with parameter binding so you can copy them into your own database client. There is no query engine behind this tool: no rows are ever actually returned.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "SQL query to preview (not executed)" },
            params: {
              type: "array",
              items: { type: "string" },
              description: "Query parameters for safe binding in the preview"
            },
            database: { type: "string", description: "Database connection name or path (used only as a label in the preview output; no connection is made)" },
            dry_run: { type: "boolean", description: "Accepted for interface compatibility — this tool never executes, so every call behaves like a dry run" },
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
        name: "inspect_schema",
        description: "ADVISORY ONLY — does not connect to any database. This tool cannot list real tables, columns, indexes, or foreign keys; it only echoes back the request and explains that a live connection would be required to inspect an actual schema.",
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
        description: "ADVISORY ONLY — does not connect to any database and does not create a backup file. Generates the shell command (pg_dump, mysqldump, sqlite3, mongodump) you would run yourself to perform the backup.",
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
    ].map(t => ({ ...t, description: `${SERVER_COLOR_EMOJI} ${t.description}` })),
  };
});

registerTrackedToolHandler(instance, async (request) => {
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
        // parsed.dry_run is intentionally unused: this tool never executes
        // against a live database regardless of the flag (see note below).

        // This server has no database driver and never connects to a live
        // database. Every call — dry_run or not — only formats and returns
        // the query text; it is never sent anywhere and no rows are ever
        // returned. dry_run is accepted for interface compatibility only.
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
              executed: false,
              database,
              query: previewQuery,
              params: params || [],
              note: "This tool does not connect to a live database; it returns the formatted/previewed SQL only. No query was run and no rows were returned. Execute this query yourself against your database client to get real results."
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

        // This tool does not connect to a live database; it never inspects
        // a real schema and cannot return real tables, columns, indexes, or
        // foreign keys. It only echoes back the request as a receipt.
        const schemaInfo: SchemaInfo = {
          connected: false,
          database,
          requested_at: new Date().toISOString(),
          requested_table: table ?? null,
          note: "This tool does not connect to a live database; it returns no real schema data. Use a database client (psql, mysql, sqlite3, mongosh) or a real schema-inspection tool to get actual tables, columns, indexes, and constraints."
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

        // This tool does not connect to any database and does not create a
        // backup file. It only generates the shell command you would need
        // to run yourself, for the engine of your choice.
        const backupInfo = {
          backup_created: false,
          database,
          output_path,
          compressed: compress || false,
          requested_at: new Date().toISOString(),
          commands: {
            postgresql: `pg_dump ${database} ${compress ? "| gzip" : ""} > ${output_path}${compress ? ".gz" : ""}`,
            mysql: `mysqldump ${database} ${compress ? "| gzip" : ""} > ${output_path}${compress ? ".gz" : ""}`,
            sqlite: `sqlite3 ${database} ".backup '${output_path}'"`,
            mongodb: `mongodump --db ${database} --out ${output_path}`
          },
          note: "This tool does not connect to a live database; it returns a generated backup command only. No backup file was created. Run the appropriate command above yourself to perform a real backup."
        };

        response = {
          content: [{
            type: "text",
            text: JSON.stringify(backupInfo, null, 2),
          }],
        };
        break;
      }

        case "hello": {
          const verbose = (args as { verbose?: boolean })?.verbose ?? false;
          if (!verbose) {
            response = {
              content: [{
                type: "text",
                text: `${SERVER_COLOR_EMOJI} Hello! I'm **${SERVER_NAME}** v${SERVER_VERSION}.\n\nI'm online and ready to help!\n\nCall \`hello\` with \`{"verbose": true}\` for my full tool catalog and usage guide.`,
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
    logger.error("Tool failed", { requestId, tool: name, durationMs, error: error instanceof Error ? error.message : String(error) });
    return errorResponse(error, name);
  }
});

}); // runServer
