---
skill_name: Database Design Patterns
description: "Database schema design, migration strategies, indexing, query optimization, and scaling patterns. Use when designing schemas, planning migrations, optimizing queries, choosing indexes, normalizing data, or scaling databases. Triggers on 'design schema', 'database migration', 'normalize', 'indexing strategy', 'query optimization', 'data modeling'."
category: Architecture
priority: P1
agent: database-expert
version: 1.0.0
argument-hint: 'hello | hello ID'
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Database Design Patterns Skill

## Overview

Comprehensive guide for database schema design, migration strategies, indexing, query optimization, and scaling patterns for relational and NoSQL databases.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/database-design-patterns
cp database-design-patterns.md ~/.claude/skills/database-design-patterns/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/database-design-patterns
cp database-design-patterns.md .claude/skills/database-design-patterns/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Skill Configuration

```yaml
---
skill_name: Database Design Patterns
description: Expert guidance on database schema design, migrations, optimization, and scaling
version: 1.0.0
priority: high
tags: [database, schema-design, migrations, optimization, sql, postgres, mysql]
---
```

## Core Concepts

### Database Design Philosophy

```
┌─────────────────────────────────────────────────────┐
│            Database Design Principles                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Normalization ←→ Denormalization                   │
│  (Data Integrity vs Performance)                    │
│                                                      │
│  ACID ←→ BASE                                       │
│  (Consistency vs Availability)                      │
│                                                      │
│  Vertical ←→ Horizontal Scaling                     │
│  (Single Server vs Distributed)                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## 1. Schema Design Patterns

### Normalization (1NF to 3NF)

**First Normal Form (1NF)**:
```sql
-- ❌ Bad: Multiple values in single column
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_name VARCHAR(100),
  items VARCHAR(500)  -- "Apple,Banana,Orange"
);

-- ✅ Good: Atomic values, separate table for items
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  price DECIMAL(10,2)
);
```

**Second Normal Form (2NF)**:
```sql
-- ❌ Bad: Partial dependency (product_name depends only on product_id)
CREATE TABLE order_items (
  order_id INTEGER,
  product_id INTEGER,
  product_name VARCHAR(100),  -- Dependent on product_id only
  quantity INTEGER,
  PRIMARY KEY (order_id, product_id)
);

-- ✅ Good: Remove partial dependencies
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2)
);

CREATE TABLE order_items (
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL(10,2),  -- Snapshot at order time
  PRIMARY KEY (order_id, product_id)
);
```

**Third Normal Form (3NF)**:
```sql
-- ❌ Bad: Transitive dependency (city/country depend on zip_code)
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  zip_code VARCHAR(10),
  city VARCHAR(100),      -- Depends on zip_code
  country VARCHAR(100)    -- Depends on zip_code
);

-- ✅ Good: Remove transitive dependencies
CREATE TABLE zip_codes (
  code VARCHAR(10) PRIMARY KEY,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100)
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  zip_code VARCHAR(10) REFERENCES zip_codes(code)
);
```

### Strategic Denormalization

**When to Denormalize**:
- Read-heavy workloads
- Complex joins become bottleneck
- Reporting/analytics queries
- Caching frequently accessed data

**Example: E-Commerce Order Summary**:
```sql
-- Normalized (requires 3 joins to get order total)
SELECT
  o.id,
  SUM(oi.quantity * oi.unit_price) as total
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Denormalized (pre-calculated)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  total_amount DECIMAL(10,2),  -- Denormalized
  item_count INTEGER,          -- Denormalized
  created_at TIMESTAMP DEFAULT NOW()
);

-- Maintain with trigger
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders SET
    total_amount = (
      SELECT SUM(quantity * unit_price)
      FROM order_items
      WHERE order_id = NEW.order_id
    ),
    item_count = (
      SELECT SUM(quantity)
      FROM order_items
      WHERE order_id = NEW.order_id
    )
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_totals();
```

## 2. Migration Strategies

### Zero-Downtime Migrations

**Expanding Columns (Safe)**:
```sql
-- Phase 1: Add new nullable column
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT NULL;

-- Phase 2: Backfill data (in batches)
DO $$
DECLARE
  batch_size INT := 1000;
  offset_val INT := 0;
BEGIN
  LOOP
    UPDATE users
    SET email_verified = false
    WHERE email_verified IS NULL
    AND id IN (
      SELECT id FROM users
      WHERE email_verified IS NULL
      LIMIT batch_size
    );

    EXIT WHEN NOT FOUND;
    offset_val := offset_val + batch_size;
    COMMIT;
    PERFORM pg_sleep(0.1);  -- Throttle to avoid locks
  END LOOP;
END $$;

-- Phase 3: Add NOT NULL constraint
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE users ALTER COLUMN email_verified SET DEFAULT false;
```

**Contracting Columns (Requires Care)**:
```sql
-- Phase 1: Make column nullable (if not already)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Phase 2: Deploy code that stops using the column
-- (Wait for deployment)

-- Phase 3: Drop column
ALTER TABLE users DROP COLUMN phone;
```

**Renaming Columns (Blue-Green Approach)**:
```sql
-- Phase 1: Add new column
ALTER TABLE users ADD COLUMN full_name VARCHAR(200);

-- Phase 2: Dual-write (application writes to both columns)
CREATE OR REPLACE FUNCTION sync_name_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.full_name := NEW.name;
  END IF;
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    NEW.name := NEW.full_name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_name_trigger
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION sync_name_columns();

-- Phase 3: Backfill
UPDATE users SET full_name = name WHERE full_name IS NULL;

-- Phase 4: Switch application to read from new column

-- Phase 5: Drop old column and trigger
DROP TRIGGER sync_name_trigger ON users;
DROP FUNCTION sync_name_columns();
ALTER TABLE users DROP COLUMN name;
```

### Alembic (Python) Migration Example

```python
"""add_user_roles

Revision ID: abc123def456
Revises: previous_migration
Create Date: 2026-01-10 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = 'abc123def456'
down_revision = 'previous_migration'
branch_labels = None
depends_on = None

def upgrade():
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('permissions', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index('idx_roles_name', 'roles', ['name'])

    # Add role_id to users (nullable first for zero-downtime)
    op.add_column('users', sa.Column('role_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_role_id', 'users', 'roles', ['role_id'], ['id'])

    # Insert default roles
    op.execute("""
        INSERT INTO roles (name, permissions) VALUES
        ('admin', '{"users": ["read", "write", "delete"], "posts": ["read", "write", "delete"]}'),
        ('user', '{"users": ["read"], "posts": ["read", "write"]}'),
        ('guest', '{"posts": ["read"]}')
    """)

    # Assign default role to existing users
    op.execute("""
        UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'user')
        WHERE role_id IS NULL
    """)

    # Make role_id NOT NULL after backfill
    op.alter_column('users', 'role_id', nullable=False)

def downgrade():
    op.drop_constraint('fk_users_role_id', 'users', type_='foreignkey')
    op.drop_column('users', 'role_id')
    op.drop_index('idx_roles_name', 'roles')
    op.drop_table('roles')
```

## 3. Indexing Strategies

### Index Types and Usage

**B-Tree Index (Default)**:
```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_customer_date ON orders(customer_id, created_at DESC);

-- Queries that can use the composite index:
SELECT * FROM orders WHERE customer_id = 123 ORDER BY created_at DESC;  -- ✅ Full index scan
SELECT * FROM orders WHERE customer_id = 123;  -- ✅ Uses first column
SELECT * FROM orders WHERE created_at > '2024-01-01';  -- ❌ Can't use index (not leftmost)
```

**Partial Index**:
```sql
-- Only index active users
CREATE INDEX idx_active_users_email ON users(email) WHERE is_active = true;

-- Useful for queries with WHERE is_active = true
SELECT * FROM users WHERE is_active = true AND email = 'user@example.com';
```

**GIN Index (for arrays, JSONB, full-text)**:
```sql
-- JSONB indexing
CREATE INDEX idx_users_preferences ON users USING GIN (preferences);

-- Query JSONB
SELECT * FROM users WHERE preferences @> '{"theme": "dark"}';
SELECT * FROM users WHERE preferences ? 'notifications';

-- Array indexing
CREATE INDEX idx_posts_tags ON posts USING GIN (tags);
SELECT * FROM posts WHERE tags @> ARRAY['javascript', 'typescript'];

-- Full-text search
CREATE INDEX idx_posts_content_fts ON posts USING GIN (to_tsvector('english', content));
SELECT * FROM posts WHERE to_tsvector('english', content) @@ to_tsquery('database & optimization');
```

**Expression Index**:
```sql
-- Index on computed value
CREATE INDEX idx_users_lower_email ON users(LOWER(email));

-- Enables case-insensitive search
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Date part index
CREATE INDEX idx_orders_month ON orders(DATE_TRUNC('month', created_at));
SELECT * FROM orders WHERE DATE_TRUNC('month', created_at) = '2024-01-01';
```

**Covering Index (Include Columns - PostgreSQL 11+)**:
```sql
-- Include non-key columns in index (avoid table lookup)
CREATE INDEX idx_users_email_covering ON users(email) INCLUDE (name, created_at);

-- This query uses index-only scan (faster)
SELECT name, created_at FROM users WHERE email = 'user@example.com';
```

**BRIN Index (for large sequential data)**:
```sql
-- Block Range Index - very small, good for time-series
CREATE INDEX idx_events_created_brin ON events USING BRIN (created_at);

-- Useful for queries on large tables with natural ordering
SELECT * FROM events WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';
```

### Index Maintenance

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,  -- Number of index scans
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- Unused indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- Drop unused indexes
DROP INDEX IF EXISTS idx_rarely_used;

-- Rebuild bloated index
REINDEX INDEX CONCURRENTLY idx_users_email;

-- Update statistics for better query planning
ANALYZE users;
```

## 4. Query Optimization

### N+1 Query Problem

**Problem**:
```python
# ❌ Bad: N+1 queries (1 + N)
posts = session.query(Post).all()  # 1 query
for post in posts:
    author = post.author  # N queries (lazy loading)
    print(f"{post.title} by {author.name}")
```

**Solution 1: Eager Loading**:
```python
# ✅ Good: 1 query with JOIN
posts = session.query(Post).options(
    joinedload(Post.author)
).all()

for post in posts:
    print(f"{post.title} by {post.author.name}")
```

**Solution 2: Select Related (Django)**:
```python
# ✅ Good: Single query with JOIN
posts = Post.objects.select_related('author').all()

for post in posts:
    print(f"{post.title} by {post.author.name}")
```

**Solution 3: DataLoader (GraphQL)**:
```typescript
// ✅ Good: Batches N queries into 1
const authorLoader = new DataLoader(async (authorIds) => {
  const authors = await db.author.findMany({
    where: { id: { in: authorIds } }
  })

  // Return in same order as requested
  return authorIds.map(id => authors.find(a => a.id === id))
})

// Usage
const posts = await db.post.findMany()
const authorsWithPosts = await Promise.all(
  posts.map(async post => ({
    ...post,
    author: await authorLoader.load(post.authorId)
  }))
)
```

### Query Performance Analysis

```sql
-- Explain query execution plan
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.author_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id, u.name
HAVING COUNT(p.id) > 5;

-- Look for:
-- 1. Seq Scan → Add index
-- 2. Nested Loop → Consider hash join
-- 3. High cost → Optimize query
-- 4. Rows mismatch → Update statistics (ANALYZE)
```

**Optimization Techniques**:
```sql
-- 1. Use covering index
CREATE INDEX idx_posts_author_id_covering ON posts(author_id) INCLUDE (id);

-- 2. Filter early (WHERE before JOIN when possible)
SELECT u.name, subq.post_count
FROM users u
JOIN (
  SELECT author_id, COUNT(*) as post_count
  FROM posts
  WHERE published = true  -- Filter before join
  GROUP BY author_id
  HAVING COUNT(*) > 5
) subq ON u.id = subq.author_id
WHERE u.created_at > '2024-01-01';

-- 3. Use EXISTS instead of IN for large sets
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM orders o
  WHERE o.customer_id = u.id
  AND o.created_at > '2024-01-01'
);

-- 4. Avoid SELECT *
SELECT u.id, u.name, u.email  -- Only needed columns
FROM users u;

-- 5. Use LIMIT for pagination
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;  -- Better: use cursor-based pagination
```

## 5. Pagination Patterns

### Offset-Based Pagination
```sql
-- Simple but slow for large offsets
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 20 OFFSET 1000;  -- Scans and skips 1000 rows

-- Problem: Performance degrades with high offset
```

### Cursor-Based Pagination (Keyset)
```sql
-- ✅ Better: Use cursor (last seen ID)
SELECT * FROM posts
WHERE created_at < '2024-01-15 10:30:00'
  OR (created_at = '2024-01-15 10:30:00' AND id < 12345)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Index to support this query
CREATE INDEX idx_posts_cursor ON posts(created_at DESC, id DESC);
```

**Application Implementation**:
```typescript
interface PaginationCursor {
  created_at: Date
  id: number
}

async function getPosts(cursor?: PaginationCursor, limit = 20) {
  const query = db.post.findMany({
    take: limit + 1,  // Fetch one extra to determine hasMore
    orderBy: [
      { created_at: 'desc' },
      { id: 'desc' }
    ]
  })

  if (cursor) {
    query.where = {
      OR: [
        { created_at: { lt: cursor.created_at } },
        {
          AND: [
            { created_at: cursor.created_at },
            { id: { lt: cursor.id } }
          ]
        }
      ]
    }
  }

  const posts = await query
  const hasMore = posts.length > limit

  if (hasMore) posts.pop()  // Remove extra item

  const nextCursor = posts.length > 0
    ? { created_at: posts[posts.length - 1].created_at, id: posts[posts.length - 1].id }
    : undefined

  return { posts, nextCursor, hasMore }
}
```

## 6. Scaling Patterns

### Read Replicas

```
┌──────────────┐
│   Primary    │  ← Writes
│   Database   │
└──────┬───────┘
       │ Replication
       ├─────────────┐
       │             │
┌──────▼───────┐ ┌──▼──────────┐
│   Replica 1  │ │  Replica 2  │  ← Reads
│   (Read)     │ │  (Read)     │
└──────────────┘ └─────────────┘
```

**Application Configuration**:
```python
# SQLAlchemy with read replicas
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Primary for writes
primary_engine = create_engine('postgresql://primary:5432/db')

# Replicas for reads
replica_engines = [
    create_engine('postgresql://replica1:5432/db'),
    create_engine('postgresql://replica2:5432/db')
]

class RoutingSession:
    def __init__(self):
        self.primary_session = sessionmaker(bind=primary_engine)()
        self.replica_sessions = [sessionmaker(bind=e)() for e in replica_engines]
        self.current_replica = 0

    def get_read_session(self):
        # Round-robin load balancing
        session = self.replica_sessions[self.current_replica]
        self.current_replica = (self.current_replica + 1) % len(self.replica_sessions)
        return session

    def get_write_session(self):
        return self.primary_session
```

### Sharding (Horizontal Partitioning)

**Range-Based Sharding**:
```python
def get_shard(user_id: int) -> str:
    """Shard by user ID range"""
    if user_id < 1000000:
        return 'shard1'
    elif user_id < 2000000:
        return 'shard2'
    else:
        return 'shard3'

# Each shard has same schema, different data
```

**Hash-Based Sharding**:
```python
import hashlib

def get_shard(user_id: int, num_shards: int = 4) -> int:
    """Consistent hashing"""
    hash_val = int(hashlib.md5(str(user_id).encode()).hexdigest(), 16)
    return hash_val % num_shards

# Shard 0, 1, 2, 3...
```

**PostgreSQL Declarative Partitioning**:
```sql
-- Create partitioned table
CREATE TABLE orders (
    id BIGSERIAL,
    customer_id INTEGER,
    total DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions
CREATE TABLE orders_2024_q1 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

CREATE TABLE orders_2024_q2 PARTITION OF orders
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');

CREATE TABLE orders_2024_q3 PARTITION OF orders
    FOR VALUES FROM ('2024-07-01') TO ('2024-10-01');

-- Create default partition for new data
CREATE TABLE orders_default PARTITION OF orders DEFAULT;

-- Queries automatically route to correct partition
SELECT * FROM orders WHERE created_at BETWEEN '2024-02-01' AND '2024-02-28';
```

### Caching Strategies

**Cache-Aside Pattern**:
```typescript
async function getUser(id: number): Promise<User> {
  // 1. Check cache
  const cached = await redis.get(`user:${id}`)
  if (cached) return JSON.parse(cached)

  // 2. Cache miss - fetch from database
  const user = await db.user.findUnique({ where: { id } })

  if (user) {
    // 3. Store in cache
    await redis.setex(`user:${id}`, 3600, JSON.stringify(user))
  }

  return user
}
```

**Write-Through Cache**:
```typescript
async function updateUser(id: number, data: Partial<User>): Promise<User> {
  // 1. Update database
  const user = await db.user.update({
    where: { id },
    data
  })

  // 2. Update cache
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user))

  return user
}
```

## 7. Database Constraints

### Check Constraints
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  discount_percent INTEGER CHECK (discount_percent BETWEEN 0 AND 100),
  stock INTEGER CHECK (stock >= 0),
  rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5)
);
```

### Unique Constraints
```sql
-- Single column
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Composite unique
ALTER TABLE order_items ADD CONSTRAINT unique_order_product
  UNIQUE (order_id, product_id);

-- Partial unique (PostgreSQL)
CREATE UNIQUE INDEX unique_active_email
  ON users(email) WHERE is_active = true;
```

### Foreign Key Constraints
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  content TEXT
);

-- ON DELETE options:
-- CASCADE: Delete related records
-- SET NULL: Set foreign key to NULL
-- RESTRICT: Prevent deletion (default)
-- NO ACTION: Similar to RESTRICT
-- SET DEFAULT: Set to default value
```

## When to Use This Skill

Apply Database Design Patterns when:

1. **Designing new database schemas**
2. **Optimizing slow queries**
3. **Planning migrations**
4. **Scaling databases**
5. **Implementing caching strategies**
6. **Troubleshooting performance issues**
7. **Designing multi-tenant architectures**

## Best Practices Summary

### Schema Design
- ✅ Normalize for data integrity, denormalize for performance
- ✅ Use appropriate data types
- ✅ Add constraints to enforce business rules
- ✅ Design for query patterns

### Migrations
- ✅ Always provide rollback (down migration)
- ✅ Test on production-sized datasets
- ✅ Use zero-downtime strategies
- ✅ Batch large data migrations

### Indexing
- ✅ Index foreign keys
- ✅ Index columns used in WHERE, JOIN, ORDER BY
- ✅ Use composite indexes strategically
- ✅ Monitor and remove unused indexes

### Querying
- ✅ Avoid N+1 queries
- ✅ Use EXPLAIN ANALYZE
- ✅ Select only needed columns
- ✅ Use appropriate JOIN types

## Related Resources

- **Database Operations MCP**: `mcp-servers/database-operations/`
- **Migration Command**: `commands/migrate.md`
- **Modern Web Stack Plugin**: `plugins/modern-web-stack-plugin.md`

**Last Updated**: 2026-01-10
**Maintained by**: Claude Code Helper Project

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

## Handshake Protocol

If invoked with argument `hello`:
> 👋 Hello! I'm **Database Design Patterns** v1.0.0. Database schema design, normalization, indexing strategies, and migration patterns. Use `/database-design-patterns hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: Database Design Patterns v1.0.0
- **What it covers**: Database schema design, migration strategies, indexing, query optimization, and scaling patterns for relational and NoSQL databases
- **How to invoke**: `/database-design-patterns` (Claude Code will load this skill as context)
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
