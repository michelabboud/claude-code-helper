---
plugin_name: Modern Web Stack Plugin
description: Complete React/Next.js + Node.js/TypeScript + PostgreSQL development toolkit
priority: P0
version: 1.0.1
tech_stack: Next.js, NestJS, PostgreSQL, TypeScript, Prisma
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Modern Web Stack Plugin

Complete full-stack development solution for modern web applications with React/Next.js frontend, Node.js/TypeScript backend, and PostgreSQL database.

## Overview

This plugin provides everything needed to build production-ready web applications using the modern JavaScript/TypeScript ecosystem. It bundles specialized agents, development workflows, automation tools, and quality gates into a cohesive development experience.

## Components Included

### Sub-Agents (3)
✅ **React/Next.js Expert**
- Modern React patterns (Server Components, Suspense)
- Next.js 14+ App Router
- State management (Zustand, React Query)
- Form handling and validation
- Performance optimization

✅ **Node.js/TypeScript Backend Expert**
- NestJS framework expertise
- RESTful API design
- TypeScript best practices
- Microservices architecture
- Real-time features (WebSockets)

✅ **Database Expert** (PostgreSQL focus)
- Schema design and optimization
- Prisma ORM
- Migrations and versioning
- Query optimization
- Data modeling patterns

### Skills (5)
✅ **API Design Patterns**
- RESTful API best practices
- GraphQL integration
- API versioning strategies
- Error handling patterns
- Documentation generation

✅ **Testing** (`/testing` with subcommands: tdd, e2e, bdd, contract, mutation, visual)
- Red-Green-Refactor workflow (tdd)
- Unit testing best practices
- Integration testing patterns
- Test doubles and mocking
- Coverage optimization

✅ **Refactoring Strategy**
- Safe refactoring process
- Common patterns (Extract Method, Move Class)
- Technical debt management
- Modernization strategies
- Breaking change handling

✅ **Database Design Patterns**
- Normalization strategies
- Migration best practices
- Indexing strategies
- Query optimization
- Data modeling

✅ **Project Scaffolding** (`/project-scaffolding`)
- React, Next.js, Express, and NestJS boilerplate generation
- TypeScript-first project templates
- Full-stack scaffolds (e.g. `nextjs-app`, `nestjs-api`)
- Sensible default project structure
- Interactive mode for guided setup

### Hooks (3)
✅ **Security Scan Hook** (PreToolUse)
- Secret detection
- Dependency vulnerability scanning
- SQL injection prevention
- XSS prevention
- CORS configuration check

✅ **Code Quality Gate Hook** (PreToolUse)
- ESLint enforcement
- TypeScript strict mode check
- Complexity threshold
- Test coverage requirements
- Import organization

✅ **Build Validation Hook** (PrePush)
- TypeScript compilation
- Linting checks
- Unit tests execution
- Build output verification
- Bundle size check

### MCP Servers (2)
✅ **Database Operations MCP**
- Query execution
- Schema inspection
- Migration generation
- Data seeding
- Query optimization

✅ **CI/CD Pipeline MCP**
- Pipeline generation (GitHub Actions, GitLab CI)
- Deployment workflows
- Test automation
- Build optimization
- Docker configuration

## Installation

### Manual Setup

1. **Install Sub-Agents**:
```bash
cp agents/domain-experts/react-nextjs-expert.md ~/.claude/agents/
cp agents/domain-experts/nodejs-typescript-backend-expert.md ~/.claude/agents/
cp agents/domain-experts/database-expert.md ~/.claude/agents/
```

2. **Install Skills**:
```bash
cp -r skills/api-design-patterns ~/.claude/skills/
cp -r skills/testing ~/.claude/skills/
cp -r skills/refactoring-strategy ~/.claude/skills/
cp -r skills/database-design-patterns ~/.claude/skills/
cp -r skills/project-scaffolding ~/.claude/skills/
```

3. **Install Hooks**:
```bash
cp hooks/security-scan.md ~/.claude/hooks/
cp hooks/code-quality-gate.md ~/.claude/hooks/
cp hooks/build-validation.md ~/.claude/hooks/
```

4. **Setup MCP Servers**:
```bash
cd mcp-servers/database-operations && npm install && npm run build
cd mcp-servers/cicd-pipeline && npm install && npm run build

# Add to Claude Desktop config
# See mcp-servers/README.md for configuration
```

## Configuration

### Suggested Project Configuration

This plugin is a documentation/reference bundle, not an installed package — there is no `~/.claude/plugins/` directory for Claude Code to read a config from. The JSON below is a reference you can save in your own project (e.g. `web-stack.config.json`) to document your stack choices and share as context when asking the agents/skills above for help:

```json
{
  "frontend": {
    "framework": "nextjs",
    "version": "14.x",
    "features": {
      "app_router": true,
      "server_components": true,
      "typescript": true,
      "tailwind": true
    },
    "state_management": "zustand",
    "data_fetching": "react-query"
  },
  "backend": {
    "framework": "nestjs",
    "version": "10.x",
    "features": {
      "typescript": true,
      "swagger": true,
      "validation": true,
      "caching": true
    },
    "orm": "prisma",
    "authentication": "passport-jwt"
  },
  "database": {
    "type": "postgresql",
    "version": "15.x",
    "features": {
      "migrations": true,
      "seeding": true,
      "rls": false
    }
  },
  "testing": {
    "unit": "jest",
    "e2e": "playwright",
    "coverage_threshold": 80
  },
  "ci_cd": {
    "platform": "github-actions",
    "auto_deploy": true,
    "environments": ["development", "staging", "production"]
  },
  "quality_gates": {
    "eslint": true,
    "typescript_strict": true,
    "test_coverage": 80,
    "complexity_max": 10
  }
}
```

## Features

### 🚀 Rapid Development

**Project Scaffolding**:
```bash
/project-scaffolding nextjs-app my-app-frontend --typescript --tailwind --auth
/project-scaffolding nestjs-api my-app-backend --typescript
```

Typical layout for a Next.js + NestJS full-stack app assembled this way:
```
my-app/
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/
│   │   ├── lib/
│   │   └── hooks/
│   ├── public/
│   └── tests/
├── backend/           # NestJS API
│   ├── src/
│   │   ├── modules/
│   │   ├── common/
│   │   └── config/
│   ├── prisma/
│   └── test/
├── docker-compose.yml
├── .github/
│   └── workflows/
└── README.md
```

**Component Generation**:
```bash
Ask React Expert: "Generate a data table component with sorting, filtering, and pagination"

# Creates:
# - Component file with TypeScript
# - Unit tests
# - Storybook stories
# - Documentation
```

### 🏗️ Full-Stack Architecture

**Frontend (Next.js 14+)**:
- Server Components for optimal performance
- Client Components for interactivity
- Server Actions for mutations
- Streaming UI with Suspense
- Optimistic updates
- Image optimization
- Font optimization

**Backend (NestJS)**:
- Module-based architecture
- Dependency injection
- Guards for authentication
- Interceptors for transformations
- Pipes for validation
- Exception filters
- Swagger API documentation

**Database (PostgreSQL + Prisma)**:
- Type-safe database client
- Migration system
- Seeding capabilities
- Connection pooling
- Query optimization
- Transaction support

### 🔒 Security Built-In

**Automated Security Scanning**:
- Dependency vulnerability checks (npm audit, Snyk)
- Secret detection (TruffleHog, Gitleaks)
- OWASP Top 10 checks
- SQL injection prevention
- XSS prevention
- CSRF protection

**Security Headers**:
```typescript
// Automatically configured in NestJS
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))
```

**Authentication & Authorization**:
- JWT token management
- Refresh token rotation
- Role-based access control (RBAC)
- API key authentication
- OAuth2 integration ready

### 🧪 Comprehensive Testing

**Test Generation**:
```bash
/testing src/modules/users

# Generates:
# - Unit tests for services
# - Integration tests for controllers
# - E2E tests for critical flows
# - Test fixtures and factories
```

**Test Pyramid**:
- **Unit Tests** (70%): Services, utilities, hooks
- **Integration Tests** (20%): API endpoints, database
- **E2E Tests** (10%): Critical user flows

**Testing Stack**:
- Jest for unit/integration tests
- Playwright for E2E tests
- React Testing Library for components
- Supertest for API testing
- MSW for API mocking

### 📊 Quality Gates

**Pre-Commit Checks**:
- ESLint (no errors)
- Prettier (formatted)
- TypeScript (no type errors)
- Unit tests (passing)
- Husky git hooks

**Pre-Push Checks**:
- Full test suite
- Build succeeds
- Coverage threshold met (80%)
- No security vulnerabilities

**Pull Request Checks**:
- All tests passing
- Code review required
- Coverage not decreased
- Build artifacts created

### 🚀 CI/CD Pipeline

**Auto-Generated Pipeline**:
```yaml
# .github/workflows/ci.yml (generated)
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
  
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:ci
      - run: npm run test:e2e
  
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
  
  deploy:
    needs: [lint, test, build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: ./deploy.sh production
```

### 📈 Performance Optimization

**Frontend Optimization**:
- Code splitting (automatic with App Router)
- Image optimization (next/image)
- Font optimization (next/font)
- Bundle size monitoring
- Lighthouse CI integration

**Backend Optimization**:
- Database connection pooling
- Redis caching layer
- Query optimization suggestions
- N+1 query prevention
- Response compression

**Database Optimization**:
- Automatic index suggestions
- Query performance analysis
- Migration performance testing
- Slow query logging

## Usage Examples

### Example 1: Building a Blog Platform

```bash
# 1. Scaffold project
/project-scaffolding nextjs-app blog-platform-frontend --typescript --tailwind --auth
/project-scaffolding nestjs-api blog-platform-backend --typescript

# 2. Ask for feature implementation
Ask React Expert: "Build a rich text editor component for blog posts with markdown support"

Ask Node.js Expert: "Implement blog post API with CRUD operations, draft support, and publishing workflow"

Ask Database Expert: "Design database schema for blog posts, categories, tags, and comments with full-text search"

# 3. Generate tests
/testing src/modules/posts

# 4. Create API documentation
/documentation api

# 5. Setup CI/CD
Ask: "Generate GitHub Actions workflow for testing and deployment"
```

### Example 2: Building a SaaS Dashboard

```bash
# 1. Scaffold with authentication
/project-scaffolding nextjs-app saas-dashboard-frontend --typescript --tailwind --auth
/project-scaffolding nestjs-api saas-dashboard-backend --typescript

# 2. Build frontend
Ask React Expert: "Create a dashboard with data visualization using recharts, real-time updates, and responsive layout"

# 3. Build backend
Ask Node.js Expert: "Implement multi-tenant API with row-level security, usage tracking, and webhook support"

# 4. Optimize performance
Ask: "Add Redis caching layer for frequently accessed data"
Ask: "Implement database query optimization for dashboard metrics"

# 5. Security review
Ask Security Expert: "Review the multi-tenant implementation for data isolation and security issues"
```

### Example 3: E-Commerce Store

```bash
# 1. Full scaffold
/project-scaffolding nextjs-app ecommerce-store-frontend --typescript --tailwind --auth
/project-scaffolding nestjs-api ecommerce-store-backend --typescript

# 2. Payment integration
Ask Node.js Expert: "Integrate Stripe for payment processing with webhook handling"

# 3. Product catalog
Ask React Expert: "Build product catalog with filters, search, and pagination"

# 4. Shopping cart
Ask React Expert: "Implement shopping cart with Zustand state management and localStorage persistence"

# 5. Testing
/testing src/modules/orders
/testing src/modules/payments

Ask QA Expert: "Create E2E tests for complete checkout flow"
```

## Workflows

### Development Workflow

```
1. Create feature branch
   ↓
2. /project-scaffolding <type> component-name (if needed)
   ↓
3. Implement feature with agent assistance
   ↓
4. /testing (automated tests)
   ↓
5. Run tests locally
   ↓
6. Code review (hooks enforce quality)
   ↓
7. Create pull request
   ↓
8. CI/CD pipeline runs
   ↓
9. Merge to main
   ↓
10. Auto-deploy to staging
    ↓
11. Manual approval for production
    ↓
12. Deploy to production
```

### Debugging Workflow

```
1. Reproduce issue locally
   ↓
2. Ask relevant expert:
   "Debug this error in [component/service]"
   ↓
3. Expert analyzes code and suggests fix
   ↓
4. Implement fix
   ↓
5. /testing (regression test)
   ↓
6. Verify fix works
   ↓
7. Deploy
```

## Best Practices

### Frontend Development

✅ **Use Server Components by default**
- Only add "use client" when needed (interactivity, hooks)
- Fetch data on the server for better performance
- Stream UI with Suspense boundaries

✅ **Type Safety**
- Use TypeScript strict mode
- Define Zod schemas for form validation
- Type API responses with shared types

✅ **Performance**
- Use next/image for images
- Use next/font for fonts
- Implement lazy loading for heavy components
- Monitor Core Web Vitals

### Backend Development

✅ **API Design**
- Follow RESTful conventions
- Version your API (/api/v1)
- Use DTOs for validation
- Document with Swagger

✅ **Database**
- Use Prisma migrations
- Add indexes for queries
- Use transactions for multi-step operations
- Implement soft deletes

✅ **Error Handling**
- Use exception filters
- Return consistent error format
- Log errors with context
- Don't expose sensitive data

### Testing

✅ **Test Pyramid**
- Many unit tests (fast, isolated)
- Some integration tests (API + DB)
- Few E2E tests (critical flows only)

✅ **Coverage**
- Aim for 80% overall coverage
- 100% for business logic
- Test error cases
- Test edge cases

### Security

✅ **Authentication**
- Use JWT with refresh tokens
- Implement rate limiting
- Use secure password hashing (bcrypt)
- Add CSRF protection

✅ **Validation**
- Validate all inputs
- Sanitize user content
- Use parameterized queries
- Implement request size limits

## Troubleshooting

### Common Issues

**Issue**: Tests failing in CI but passing locally
**Solution**: 
- Check database state isolation
- Use test database per runner
- Clear cache between runs

**Issue**: Build failing with type errors
**Solution**:
- Run `npm run type-check` locally
- Update TypeScript types
- Fix any `any` types

**Issue**: E2E tests flaky
**Solution**:
- Add proper wait conditions
- Use data-testid selectors
- Increase timeouts for CI
- Run in headless mode

**Issue**: Database migrations failing
**Solution**:
- Review migration SQL
- Test with production data copy
- Implement rollback strategy
- Use zero-downtime migrations

## Performance Metrics

### Target Metrics

**Frontend**:
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Cumulative Layout Shift (CLS): < 0.1

**Backend**:
- API Response Time (p95): < 200ms
- Database Query Time (p95): < 50ms
- Error Rate: < 0.1%
- Uptime: > 99.9%

**Build**:
- Build time: < 5 minutes
- Bundle size (gzipped): < 500KB
- Test suite: < 2 minutes

## Tech Stack Details

### Frontend Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+
- **State**: Zustand, React Query
- **Forms**: React Hook Form + Zod
- **Testing**: Jest, React Testing Library, Playwright
- **Build**: Turbopack (dev), Webpack (prod)

### Backend Stack
- **Framework**: NestJS 10+
- **Language**: TypeScript 5+
- **ORM**: Prisma 5+
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest, Supertest
- **Queue**: BullMQ (optional)

### Infrastructure
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+ (optional)
- **Container**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions, GitLab CI
- **Monitoring**: Prometheus + Grafana (optional)

## What You Get

✅ **Production-ready project structure**
✅ **Type-safe full-stack application**
✅ **Automated testing setup**
✅ **CI/CD pipeline configured**
✅ **Security best practices enforced**
✅ **Performance optimizations included**
✅ **API documentation generated**
✅ **Development workflow streamlined**

## Roadmap

### v1.1 (Coming Soon)
- [ ] GraphQL support
- [ ] Microservices templates
- [ ] Monorepo support (Turborepo)
- [ ] Advanced caching strategies
- [ ] Internationalization (i18n)

### v1.2 (Future)
- [ ] Mobile app integration (React Native)
- [ ] Real-time collaboration features
- [ ] Advanced analytics integration
- [ ] Multi-tenancy support
- [ ] Serverless deployment options

---

**Status**: Production Ready ✅
**Version**: 1.0.1
**Last Updated**: 2026-07-10
**Tech Stack**: Next.js 14, NestJS 10, PostgreSQL 15, TypeScript 5

## Changelog

### 1.0.1 (2026-07-10)
- Removed fictional `/scaffold`, `/test-generate`, and `/api-docs` slash-commands (no `commands/` directory exists in this repo) — replaced with real skill invocations (`/project-scaffolding`, `/testing`, `/documentation`)
- Added Project Scaffolding as a declared Skill component with an install path; fixed wrong agent filename `nodejs-typescript-expert.md` → `nodejs-typescript-backend-expert.md`
- Removed the fake `claude-code install` command and references to the nonexistent `plugins/modern-web-stack/` bundle directory; installation now uses only real `cp`/`cp -r` steps
- Resolved license inconsistency (previously stated 3 different ways, one incorrectly as MIT) — now Apache-2.0, stated once

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
