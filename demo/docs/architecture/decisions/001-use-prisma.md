# ADR 001: Use Prisma as ORM

## Status

Accepted

## Context

We need to choose an ORM (Object-Relational Mapping) solution for Task Manager Pro to interact with our PostgreSQL database. The ORM should provide:

- Type safety with TypeScript
- Good developer experience
- Migration management
- Query performance
- Active community and maintenance

Options considered:
1. **Prisma** - Modern TypeScript ORM
2. **TypeORM** - Traditional ORM with decorators
3. **Drizzle** - Lightweight SQL-first ORM
4. **Knex.js** - SQL query builder
5. **Raw SQL** with node-postgres

## Decision

We will use **Prisma** as our ORM.

## Rationale

### Pros of Prisma

1. **Type Safety**: Generates TypeScript types from the schema, providing excellent autocompletion and compile-time error checking.

2. **Declarative Schema**: The Prisma Schema Language is intuitive and readable:
   ```prisma
   model User {
     id    String @id @default(cuid())
     email String @unique
     tasks Task[]
   }
   ```

3. **Migrations**: Built-in migration system that tracks schema changes:
   ```bash
   npx prisma migrate dev
   npx prisma migrate deploy
   ```

4. **Developer Experience**:
   - Prisma Studio for database browsing
   - Excellent documentation
   - Active Discord community
   - VS Code extension

5. **Query Performance**:
   - Efficient relation loading
   - Query batching
   - Connection pooling

6. **Next.js Compatibility**: Works seamlessly with Next.js API routes and server components.

### Cons of Prisma

1. **Additional Build Step**: Requires `prisma generate` to create the client.

2. **Limited Raw Query Support**: While raw queries are possible, they lose type safety.

3. **Learning Curve**: Prisma's query syntax differs from traditional ORMs.

4. **Bundle Size**: Client adds to the bundle, though this is mitigated in server-only code.

### Why Not Alternatives

- **TypeORM**: Decorator-based approach is more verbose; less TypeScript-native.
- **Drizzle**: Newer with smaller ecosystem; we value Prisma's maturity.
- **Knex.js**: No automatic type generation; more manual work.
- **Raw SQL**: Loses type safety and developer productivity.

## Consequences

### Positive

- Strong type safety throughout the data layer
- Faster development with auto-generated types
- Easy schema management with migrations
- Great debugging with Prisma Studio

### Negative

- Team needs to learn Prisma's query syntax
- Must run `prisma generate` after schema changes
- Lock-in to Prisma's way of doing things

### Mitigations

- Raw queries available via `$queryRaw` when needed
- Schema is portable (standard relational concepts)
- Prisma has strong backing and unlikely to be abandoned

## Implementation Notes

1. Install Prisma:
   ```bash
   npm install prisma @prisma/client
   ```

2. Initialize schema at `prisma/schema.prisma`

3. Generate client after schema changes:
   ```bash
   npx prisma generate
   ```

4. Create singleton instance for connection reuse:
   ```typescript
   // src/lib/db.ts
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();
   export default prisma;
   ```

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides)
- [Next.js with Prisma](https://www.prisma.io/nextjs)

## Date

2024-01-01
