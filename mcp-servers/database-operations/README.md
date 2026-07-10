# Database Operations MCP Server

Advisory MCP server for SQL generation, schema-planning, migration authoring, and query-optimization guidance.

## Overview

This MCP server helps you **write and reason about** database work — generating migration files, linting migration safety, formatting SQL previews, producing fake seed data, and suggesting query optimizations. It has **no database driver** (no `pg`, `mysql2`, `sqlite3`, or `mongodb` dependency) and **never connects to, executes against, or reads from a live database**. Every tool either does pure text/SQL generation or returns an explicit "no live connection" advisory response. Treat its output as a starting point to copy into your own database client (`psql`, `mysql`, `sqlite3`, `mongosh`), migration runner, or backup tooling — not as a report of real query results, real schema state, or a real backup having been taken.

## Tools Provided

### 1. `run_query` — ADVISORY ONLY, no execution
Formats and previews a SQL query with parameter binding substituted in. Does not connect to any database; no rows are ever returned.

**Parameters**:
- `query` (string): SQL query to preview
- `params` (array): Parameters to substitute into the preview
- `database` (string): Label only — no connection is made
- `dry_run` (boolean): Accepted for interface compatibility; every call behaves like a dry run regardless of this flag

**Returns**: The formatted query text and an explicit note that no execution occurred.

### 2. `inspect_schema` — ADVISORY ONLY, no real schema
Echoes back the inspection request. Cannot list real tables, columns, indexes, or foreign keys because it has no connection to any database.

**Parameters**:
- `database` (string): Label only — no connection is made
- `table` (string, optional): Echoed back, not looked up
- `include_indexes` (boolean): Echoed back, not looked up
- `include_constraints` (boolean): Echoed back, not looked up

**Returns**: A receipt of the request plus a note directing you to a real database client for actual schema data.

### 3. `generate_migration`
Generates up/down migration SQL text from a description of schema changes (add/modify/drop columns, add indexes). Pure text generation — writes no files to disk and does not apply anything to a database.

**Parameters**:
- `description` (string): Migration description
- `changes` (object): Schema changes to express as SQL
- `migration_type` (string): up/down migration type

**Returns**: Generated migration SQL (as text in the response, not written to disk) plus a safety validation summary.

### 4. `validate_migration`
Reads a migration file from disk (this is real file I/O, not a database operation) and runs static heuristic checks — looks for `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `NOT NULL` without `DEFAULT`, and type changes.

**Parameters**:
- `migration_file` (string): Path to migration file on disk
- `database` (string): Label only — no connection is made

**Returns**: Warnings and a safe/unsafe recommendation based on static text analysis of the SQL, not a real database's actual state.

### 5. `seed_data`
Generates realistic-looking fake data in memory (names, emails, UUIDs, dates, etc.) and formats it as `INSERT` statements. Does not insert anything into a database.

**Parameters**:
- `table` (string): Table name to reference in generated `INSERT` statements
- `count` (number): Number of records to generate (capped at 100 in the response preview)
- `schema` (object): Data generation rules per column

**Returns**: Generated sample records and `INSERT` SQL text you can run yourself.

### 6. `explain_query`
Runs static heuristic analysis on the query text (`SELECT *`, missing `WHERE`, leading-wildcard `LIKE`, JOIN count, unbounded `ORDER BY`, etc.). This is **not** a real `EXPLAIN`/`EXPLAIN ANALYZE` execution plan from a database engine — it is pattern matching on the SQL string.

**Parameters**:
- `query` (string): Query text to analyze
- `database` (string): Label only — no connection is made
- `format` (string): Output format (text/json/yaml) — currently only affects the echoed `format` field, not the actual response shape

**Returns**: Heuristic findings and a rough complexity/cost estimate, explicitly noted as requiring a real database connection for an actual execution plan.

### 7. `optimize_query`
Runs the same static heuristic analysis as `explain_query` and reformats it as optimization suggestions.

**Parameters**:
- `query` (string): Query text to analyze
- `database` (string): Label only — no connection is made

**Returns**: Optimization suggestions derived from pattern matching, not from a real query planner.

### 8. `backup_database` — ADVISORY ONLY, no backup taken
Generates the shell command (`pg_dump`, `mysqldump`, `sqlite3 .backup`, or `mongodump`) appropriate for common database engines. Does not connect to any database and does not create a backup file.

**Parameters**:
- `database` (string): Database name to substitute into the generated command
- `output_path` (string): Path to substitute into the generated command
- `compress` (boolean): Whether to append gzip piping to the generated command

**Returns**: Generated backup commands for PostgreSQL, MySQL, SQLite, and MongoDB, plus an explicit note that no backup was performed — you must run the command yourself.

## Installation

### Prerequisites
- Node.js 18+

### Setup

```bash
cd mcp-servers/database-operations
npm install
npm run build
```

### Register with Claude Code

Add to `~/.claude/config/mcp.json`:

```json
{
  "mcpServers": {
    "database-operations": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/database-operations/build/index.js"]
    }
  }
}
```

No environment variables or connection strings are required or used — this server never opens a database connection.

## Usage Examples

### Preview a Query (not executed)

```javascript
// Formats the query with parameters substituted; nothing is run
await mcp.call('run_query', {
  query: 'SELECT * FROM users WHERE email = $1',
  params: ['user@example.com'],
  database: 'production'
})
// => { executed: false, query: "...", note: "This tool does not connect to a live database..." }
```

### Request a Schema "Inspection" (echoes the request only)

```javascript
await mcp.call('inspect_schema', {
  database: 'production',
  include_indexes: true,
  include_constraints: true
})
// => { connected: false, note: "This tool does not connect to a live database..." }
```

### Generate a Migration

```javascript
await mcp.call('generate_migration', {
  description: 'Add email_verified column to users',
  changes: {
    table: 'users',
    add_columns: [
      {
        name: 'email_verified',
        type: 'BOOLEAN',
        default: false,
        nullable: false
      }
    ]
  }
})
// Returns generated SQL text (not written to disk, not applied to any database)
```

### Validate Migration Safety (static analysis of a file already on disk)

```javascript
await mcp.call('validate_migration', {
  migration_file: './migrations/20260110_add_email_verified.sql',
  database: 'staging'
})
// Returns heuristic warnings based on the SQL text:
// - Breaking changes (DROP TABLE / DROP COLUMN / TRUNCATE)
// - NOT NULL without DEFAULT
// - Type changes
```

### Optimize Query (static heuristics, not a real query planner)

```javascript
await mcp.call('optimize_query', {
  query: `
    SELECT u.*, COUNT(o.id) as order_count
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.created_at > '2024-01-01'
    GROUP BY u.id
  `,
  database: 'production'
})
// Returns pattern-matched suggestions:
// - Add index on users.created_at
// - Consider materialized view
// - Optimize JOIN strategy
```

## What This Server Does NOT Do

- It does **not** ship or depend on any database driver (no `pg`, `mysql2`, `sqlite3`, `mongodb`).
- It does **not** open a network or file-based connection to any database.
- `run_query` never executes SQL against anything — it only formats/echoes the query text.
- `inspect_schema` never reads a real schema — it only echoes the request.
- `backup_database` never creates a backup file — it only generates the shell command you would run yourself.
- `explain_query` / `optimize_query` never obtain a real execution plan from a query planner — they run static pattern matching on the query string.
- `generate_migration` / `seed_data` never write to or modify a database — they generate SQL/text you can review and run yourself.

If you need real query execution, live schema introspection, or an actual database backup, use a proper database client, migration runner, or backup tool — this server is a text/SQL generation and planning aid only.

## Testing

```bash
npm test
```

Tests cover Zod schema validation, the static-analysis helper functions (`analyzeQueryForOptimization`, `validateMigrationSafety`, `generateMigrationSQL`, `generateFakeData`), path/string sanitization, error formatting, and tool registration. There is no database to mock because no tool connects to one.

## API Reference

See [mcp-shared API Reference](../mcp-shared/API.md) for shared library documentation.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

Apache-2.0 - see [LICENSE](../../LICENSE) for details.

---

**Version**: 1.0.0
**Status**: Advisory / SQL-generation only — no live database execution
**Covers**: PostgreSQL, MySQL, SQLite, MongoDB (command/SQL generation only; no drivers)

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 14+ skills, 11 MCP servers, and comprehensive guides.
