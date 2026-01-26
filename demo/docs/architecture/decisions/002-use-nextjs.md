# ADR 002: Use Next.js 14 with App Router

## Status

Accepted

## Context

We need a React framework for Task Manager Pro that provides:

- Server-side rendering for SEO and performance
- API routes for backend logic
- Great developer experience
- Production-ready features (caching, optimization)
- Active maintenance and community

Options considered:
1. **Next.js** - Full-stack React framework
2. **Remix** - Full-stack React framework
3. **Create React App + Express** - Traditional setup
4. **Vite + Fastify** - Modern lightweight setup

## Decision

We will use **Next.js 14 with the App Router**.

## Rationale

### Pros of Next.js 14 App Router

1. **Server Components**: React Server Components reduce client-side JavaScript:
   ```tsx
   // Server Component (default)
   async function ProjectList() {
     const projects = await getProjects(); // Direct DB access
     return <ul>{projects.map(...)}</ul>;
   }
   ```

2. **Server Actions**: Simplify form handling without separate API routes:
   ```tsx
   async function createTask(formData: FormData) {
     'use server';
     await db.task.create({ data: { ... } });
   }
   ```

3. **Layouts**: Nested layouts for consistent UI:
   ```
   app/
     layout.tsx        # Root layout
     (auth)/
       layout.tsx      # Auth layout (no sidebar)
     (dashboard)/
       layout.tsx      # Dashboard layout (with sidebar)
   ```

4. **Streaming**: Progressive page loading with Suspense:
   ```tsx
   <Suspense fallback={<Loading />}>
     <SlowComponent />
   </Suspense>
   ```

5. **Built-in Optimizations**:
   - Image optimization
   - Font optimization
   - Script optimization
   - Automatic code splitting

6. **API Routes**: Collocated backend logic:
   ```
   app/
     api/
       auth/login/route.ts
       tasks/[id]/route.ts
   ```

### Why Not Alternatives

- **Remix**: Great framework, but smaller ecosystem and less corporate adoption.
- **CRA + Express**: No SSR, manual optimizations needed.
- **Vite + Fastify**: Good, but lacks full-stack conventions.

## Consequences

### Positive

- Unified full-stack development
- Excellent performance out of the box
- Strong TypeScript support
- Great deployment options (Vercel, Docker, Node.js)

### Negative

- App Router is newer, some patterns still evolving
- Requires understanding server vs client components
- Vercel-centric documentation (though works anywhere)

### Mitigations

- Clear component boundaries (mark 'use client' where needed)
- Comprehensive testing to catch SSR issues
- Use standalone output for Docker deployment

## Implementation Notes

1. Create project:
   ```bash
   npx create-next-app@latest --typescript --tailwind
   ```

2. File structure:
   ```
   src/
     app/           # App Router pages
     components/    # React components
     lib/          # Utilities
   ```

3. Server vs Client Components:
   - Default: Server Components (async, direct DB access)
   - Interactive: Add 'use client' for hooks, events

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

## Date

2024-01-01
