# Database Operations MCP Server

Production-ready MCP server for database operations, migrations, schema inspection, and query optimization.

## Overview

This MCP server provides comprehensive database tools for PostgreSQL, MySQL, SQLite, and MongoDB. It enables safe database operations, migration management, and query optimization directly from Claude Code.

## Tools Provided

### 1. `run_query`
Execute SQL queries with proper parameter binding and result formatting.

**Parameters**:
- `query` (string): SQL query to execute
- `params` (array): Query parameters for safe binding
- `database` (string): Database name/connection
- `dry_run` (boolean): Preview query without execution

**Returns**: Query results with row count and execution time

### 2. `inspect_schema`
Get detailed schema information including tables, columns, indexes, and foreign keys.

**Parameters**:
- `database` (string): Database to inspect
- `table` (string, optional): Specific table to inspect
- `include_indexes` (boolean): Include index information
- `include_constraints` (boolean): Include constraint information

**Returns**: Complete schema structure

### 3. `generate_migration`
Create migration files from schema changes with rollback support.

**Parameters**:
- `description` (string): Migration description
- `changes` (object): Schema changes to apply
- `migration_type` (string): up/down migration type

**Returns**: Generated migration file path and content

### 4. `validate_migration`
Check migration safety for breaking changes and performance impact.

**Parameters**:
- `migration_file` (string): Path to migration file
- `database` (string): Target database

**Returns**: Validation results with warnings and recommendations

### 5. `seed_data`
Generate realistic test data for development and testing.

**Parameters**:
- `table` (string): Table to seed
- `count` (number): Number of records
- `schema` (object): Data generation rules

**Returns**: Generated seed data

### 6. `explain_query`
Get query execution plans for optimization analysis.

**Parameters**:
- `query` (string): Query to analyze
- `database` (string): Database connection
- `format` (string): Output format (text/json/yaml)

**Returns**: Execution plan with cost analysis

### 7. `optimize_query`
Suggest query optimizations based on execution plan analysis.

**Parameters**:
- `query` (string): Query to optimize
- `database` (string): Database connection

**Returns**: Optimization suggestions with examples

### 8. `backup_database`
Create database backups with compression and verification.

**Parameters**:
- `database` (string): Database to backup
- `output_path` (string): Backup file location
- `compress` (boolean): Enable compression

**Returns**: Backup file path and size

## Installation

### Prerequisites
- Node.js 18+

### Setup

```bash
cd mcp-servers/database-operations
npm install
npm run build
```

### Configuration

Create `.env` file (optional, for database connections):

```env
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_database

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DB=your_database

# MongoDB
MONGODB_URI=mongodb://localhost:27017/your_database
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

## Usage Examples

### Execute Safe Query

```javascript
// Using parameterized query (safe from SQL injection)
await mcp.call('run_query', {
  query: 'SELECT * FROM users WHERE email = $1',
  params: ['user@example.com'],
  database: 'production'
})
```

### Inspect Database Schema

```javascript
// Get complete schema information
await mcp.call('inspect_schema', {
  database: 'production',
  include_indexes: true,
  include_constraints: true
})

// Inspect specific table
await mcp.call('inspect_schema', {
  database: 'production',
  table: 'users'
})
```

### Generate Migration

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
```

### Validate Migration Safety

```javascript
await mcp.call('validate_migration', {
  migration_file: './migrations/20260110_add_email_verified.sql',
  database: 'staging'
})
// Returns warnings about potential issues:
// - Breaking changes
// - Performance impact
// - Missing indexes
```

### Optimize Query

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
// Returns optimization suggestions:
// - Add index on users.created_at
// - Consider materialized view
// - Optimize JOIN strategy
```

## Security Best Practices

### Query Execution
- ✅ **Always use parameterized queries** to prevent SQL injection
- ✅ **Validate user input** before query execution
- ✅ **Use read-only connections** when possible
- ✅ **Implement query timeouts** to prevent long-running queries
- ✅ **Log all queries** for audit trail

### Migration Safety
- ✅ **Test migrations** on staging first
- ✅ **Always create rollback migrations**
- ✅ **Backup before migrations** in production
- ✅ **Use transactions** for atomic changes
- ✅ **Validate data integrity** after migration

### Access Control
- ✅ **Use least privilege** database users
- ✅ **Separate credentials** for different environments
- ✅ **Encrypt connections** with TLS/SSL
- ✅ **Rotate credentials** regularly
- ✅ **Audit database access** logs

## Error Handling

All tools include comprehensive error handling:

```javascript
try {
  const result = await mcp.call('run_query', {
    query: 'SELECT * FROM nonexistent_table',
    database: 'production'
  })
} catch (error) {
  if (error.code === 'TABLE_NOT_FOUND') {
    console.log('Table does not exist')
  } else if (error.code === 'CONNECTION_ERROR') {
    console.log('Database connection failed')
  } else {
    console.log('Unknown error:', error.message)
  }
}
```

## Performance Considerations

### Query Optimization
- Use `EXPLAIN ANALYZE` for execution plan analysis
- Monitor slow query logs
- Implement connection pooling
- Cache frequently accessed queries
- Use appropriate indexes

### Migration Performance
- Avoid table locks during peak hours
- Use concurrent indexes when possible
- Batch large data migrations
- Monitor replication lag
- Test on production-sized datasets

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test specific database
npm run test:postgres
npm run test:mysql
npm run test:mongodb
```

## Monitoring

The server logs all operations with:
- Query execution time
- Error rates
- Connection pool status
- Migration history
- Backup status

## Troubleshooting

### Connection Issues
```bash
# Test database connection
node scripts/test-connection.js postgres
node scripts/test-connection.js mysql
```

### Migration Issues
```bash
# Validate migration syntax
node scripts/validate-migration.js path/to/migration.sql

# Dry run migration
node scripts/run-migration.js --dry-run path/to/migration.sql
```

## API Reference

See [API.md](./API.md) for complete API documentation.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Version**: 1.0.0
**Status**: Production Ready ✅
**Support**: PostgreSQL, MySQL, SQLite, MongoDB

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
