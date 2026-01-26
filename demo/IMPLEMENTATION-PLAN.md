# Task Manager Pro - Implementation Plan

**Project Goal:** Build a full-stack task management app to test Claude Code's Agent Triggers system

**Success Criteria:**
- All 10 phases trigger the correct agents
- Trigger system demonstrates automatic agent selection
- Each file pattern matches expected agents
- Visual indicators show agent suggestions

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Database** | PostgreSQL + Prisma | Type-safe ORM, excellent migrations |
| **Backend** | Node.js + Express | Simple REST API, TypeScript support |
| **Frontend** | Next.js 14 + React 18 | SSR, routing, modern React features |
| **Styling** | Tailwind CSS | Utility-first, design system integration |
| **Auth** | JWT + bcrypt | Stateless, secure password hashing |
| **Real-time** | Socket.io | WebSocket abstraction, fallbacks |
| **Cache** | Redis | Fast in-memory caching |
| **Testing** | Jest + Playwright | Unit + E2E coverage |
| **DevOps** | Docker + K8s | Containerization, orchestration |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Browser                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Next.js App (React 18)                  │  │
│  │  • Pages Router                                   │  │
│  │  • React Components (Tailwind)                   │  │
│  │  • Socket.io Client                              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────┼────────────────────────────────────┐
│                    ▼                                     │
│              API Gateway (Express)                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │  • Auth Middleware (JWT)                         │  │
│  │  • Validation Middleware                         │  │
│  │  • Rate Limiting                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                     │                                    │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐               │
│  │  Auth   │  │  Teams  │  │  Tasks   │               │
│  │ Routes  │  │ Routes  │  │  Routes  │               │
│  └─────────┘  └─────────┘  └──────────┘               │
│       │             │             │                     │
│       └─────────────┼─────────────┘                     │
│                     ▼                                    │
│            Prisma Client (ORM)                          │
│                     │                                    │
│       ┌─────────────┼─────────────┐                     │
│       ▼             ▼             ▼                     │
│  ┌─────────────┐ ┌──────────┐ ┌──────────┐            │
│  │ PostgreSQL  │ │  Redis   │ │ Socket.io│            │
│  │  Database   │ │  Cache   │ │  Server  │            │
│  └─────────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## Phase-by-Phase Implementation Plan

### Phase 1: Foundation & Database ✓

**Duration:** 30 minutes
**Files:** 3
**Expected Triggers:** `database-expert`, `nodejs-typescript-backend-expert`

#### Tasks

1. **Setup Prisma** (5 min)
   - Create `prisma/schema.prisma`
   - Define datasource (PostgreSQL)
   - Define generator (Prisma Client)
   - **Trigger Test:** Should show `database-expert`

2. **Define Schema** (15 min)
   - User model (id, email, passwordHash, name, avatarUrl)
   - Team model (id, name, ownerId)
   - TeamMember junction table (teamId, userId, role enum)
   - Project model (id, teamId, name, description, status enum)
   - Task model (id, projectId, title, status, priority, assigneeId, dueDate)
   - Comment model (id, taskId, userId, content)
   - ActivityLog model (id, entityType, entityId, action, userId, metadata)
   - Define enums: TeamRole, ProjectStatus, TaskStatus, TaskPriority
   - Add indexes for performance

3. **Migration Setup** (5 min)
   - Create `src/db/migrations/` directory
   - Generate initial migration: `npx prisma migrate dev --name init`

4. **Seed Data** (5 min)
   - Create `src/db/seed.ts`
   - Sample users, teams, projects, tasks
   - Run seed: `npx prisma db seed`

**Validation:**
- Schema compiles without errors
- Migration applies successfully
- Seed data loads correctly

---

### Phase 2: Backend API

**Duration:** 2 hours
**Files:** 6
**Expected Triggers:** `api-expert`, `nodejs-typescript-backend-expert`, `security-expert`

#### Tasks

1. **Auth Routes** (30 min)
   - `src/api/routes/auth.ts`
   - POST /api/auth/register - bcrypt password hashing
   - POST /api/auth/login - JWT token generation
   - POST /api/auth/logout - token invalidation
   - GET /api/auth/me - current user info
   - **Trigger Test:** `api-expert`, `security-expert`

2. **Teams Routes** (20 min)
   - `src/api/routes/teams.ts`
   - CRUD operations with ownership checks
   - Team member management
   - **Trigger Test:** `api-expert`

3. **Projects Routes** (20 min)
   - `src/api/routes/projects.ts`
   - CRUD with team membership validation
   - Status updates

4. **Tasks Routes** (30 min)
   - `src/api/routes/tasks.ts`
   - CRUD with project access checks
   - Assignment logic
   - Comments endpoint

5. **Auth Middleware** (15 min)
   - `src/api/middleware/auth.ts`
   - JWT verification
   - User context injection
   - **Trigger Test:** `security-expert`

6. **Validation Middleware** (15 min)
   - `src/api/middleware/validation.ts`
   - Request validation with Zod
   - Input sanitization

**Validation:**
- All endpoints return correct status codes
- Authentication works end-to-end
- Authorization prevents unauthorized access

---

### Phase 3: Frontend - React/Next.js

**Duration:** 3 hours
**Files:** 13
**Expected Triggers:** `react-nextjs-expert`, `css-tailwind-expert`, `design-system-guardian`

#### Tasks

1. **Base UI Components** (45 min)
   - `src/components/ui/Button.tsx` - variants, sizes, loading state
   - `src/components/ui/Input.tsx` - controlled, validation
   - `src/components/ui/Modal.tsx` - portal, overlay, focus trap
   - `src/components/ui/Card.tsx` - container with variants
   - **Trigger Test:** All 4 should trigger `react-nextjs-expert`, `design-system-guardian`

2. **Layout Components** (30 min)
   - `src/components/layout/Header.tsx` - navigation, user menu
   - `src/components/layout/Sidebar.tsx` - team/project navigation

3. **Task Components** (60 min)
   - `src/components/tasks/TaskCard.tsx` - task display, status badge
   - `src/components/tasks/TaskBoard.tsx` - Kanban board, drag-drop
   - `src/components/tasks/TaskForm.tsx` - create/edit form

4. **Project Components** (20 min)
   - `src/components/projects/ProjectList.tsx` - grid/list view

5. **Pages** (45 min)
   - `pages/index.tsx` - landing page
   - `pages/login.tsx` - login form
   - `pages/register.tsx` - registration form
   - `pages/dashboard.tsx` - project overview
   - `pages/projects/[id].tsx` - project detail with task board
   - `pages/settings.tsx` - user settings

**Validation:**
- All components render without errors
- Navigation works correctly
- Forms validate input

---

### Phase 4: Styling & Design System

**Duration:** 1.5 hours
**Files:** 4
**Expected Triggers:** `css-tailwind-expert`, `design-system-guardian`, `uiux-reviewer`

#### Tasks

1. **Tailwind Config** (30 min)
   - `tailwind.config.ts`
   - Custom color palette (primary: blue, secondary: gray, accent: green)
   - Custom spacing scale
   - Dark mode setup
   - Custom animations (fade, slide, spin)
   - **Trigger Test:** `css-tailwind-expert`

2. **Global Styles** (20 min)
   - `src/styles/globals.css`
   - CSS reset
   - Typography base
   - Dark mode variables

3. **Component Styles** (20 min)
   - `src/styles/components.css`
   - Complex component-specific styles
   - Utility combinations

4. **Design Tokens** (20 min)
   - `src/lib/design-tokens.ts`
   - TypeScript constants for colors, spacing, typography
   - Export for programmatic access

**Validation:**
- Dark mode toggles correctly
- All components match design system
- Responsive on mobile/tablet/desktop

---

### Phase 5: Authentication & Security

**Duration:** 2 hours
**Files:** 5
**Expected Triggers:** `security-expert`, `nodejs-typescript-backend-expert`

#### Tasks

1. **JWT Library** (30 min)
   - `src/lib/auth/jwt.ts`
   - Token generation with expiry
   - Token verification
   - Refresh token logic
   - **Trigger Test:** `security-expert`

2. **Password Hashing** (20 min)
   - `src/lib/auth/password.ts`
   - bcrypt with salt rounds
   - Password strength validation

3. **CSRF Protection** (30 min)
   - `src/lib/security/csrf.ts`
   - Token generation per session
   - Middleware integration

4. **Rate Limiting** (25 min)
   - `src/lib/security/rate-limit.ts`
   - Redis-backed rate limiter
   - Per-IP and per-user limits

5. **Input Sanitization** (15 min)
   - `src/lib/security/sanitize.ts`
   - XSS prevention
   - SQL injection prevention (via Prisma)

**Validation:**
- JWT tokens expire correctly
- Passwords hash/verify successfully
- Rate limiting blocks excessive requests
- XSS attempts are sanitized

---

### Phase 6: Real-time Features

**Duration:** 2 hours
**Files:** 4
**Expected Triggers:** `nodejs-typescript-backend-expert`, `react-nextjs-expert`

#### Tasks

1. **WebSocket Server** (45 min)
   - `src/lib/websocket/server.ts`
   - Socket.io server setup
   - Authentication middleware
   - Room management (per-project)
   - **Trigger Test:** `nodejs-typescript-backend-expert`

2. **Event Handlers** (45 min)
   - `src/lib/websocket/events.ts`
   - task:created, task:updated, task:assigned
   - comment:added
   - user:online, user:offline

3. **Client Hook** (20 min)
   - `src/hooks/useWebSocket.ts`
   - React hook for WebSocket connection
   - Auto-reconnect logic
   - **Trigger Test:** `react-nextjs-expert`

4. **Presence Hook** (10 min)
   - `src/hooks/usePresence.ts`
   - Track online users
   - Typing indicators

**Validation:**
- WebSocket connects successfully
- Events broadcast to correct rooms
- Presence updates in real-time

---

### Phase 7: Testing

**Duration:** 3 hours
**Files:** 5
**Expected Triggers:** `qa-testing-expert`, `react-nextjs-expert`

#### Tasks

1. **API Tests** (60 min)
   - `src/__tests__/api/auth.test.ts`
   - Registration flow
   - Login flow
   - Token validation
   - **Trigger Test:** `qa-testing-expert`

2. **API Integration Tests** (45 min)
   - `src/__tests__/api/tasks.test.ts`
   - CRUD operations
   - Authorization checks
   - Edge cases (invalid data, missing fields)

3. **Component Tests** (45 min)
   - `src/__tests__/components/TaskCard.test.tsx`
   - Rendering
   - User interactions
   - Props validation

4. **E2E Login Test** (15 min)
   - `src/__tests__/e2e/login.spec.ts`
   - Full login flow with Playwright

5. **E2E Task CRUD** (15 min)
   - `src/__tests__/e2e/task-crud.spec.ts`
   - Create, edit, delete task flow

**Validation:**
- All unit tests pass (>80% coverage)
- Integration tests pass
- E2E tests run successfully

---

### Phase 8: DevOps & Deployment

**Duration:** 2 hours
**Files:** 5
**Expected Triggers:** `devops-infrastructure-expert`, `cicd-engineer`

#### Tasks

1. **Dockerfile** (30 min)
   - Multi-stage build (build → production)
   - Node.js optimization
   - **Trigger Test:** `devops-infrastructure-expert`

2. **Docker Compose** (20 min)
   - `docker-compose.yml`
   - App, PostgreSQL, Redis services
   - Volume mounts, networks

3. **CI Pipeline** (40 min)
   - `.github/workflows/ci.yml`
   - Lint, test, build on PR
   - **Trigger Test:** `cicd-engineer`

4. **Deploy Pipeline** (20 min)
   - `.github/workflows/deploy.yml`
   - Build Docker image
   - Push to registry
   - Deploy to K8s

5. **Kubernetes Manifests** (10 min)
   - `k8s/deployment.yaml` - app deployment
   - `k8s/service.yaml` - load balancer

**Validation:**
- Docker builds successfully
- docker-compose starts all services
- CI pipeline runs on PR
- K8s manifests are valid

---

### Phase 9: Performance & Optimization

**Duration:** 1.5 hours
**Files:** 3
**Expected Triggers:** `performance-optimizer`, `redis-expert`, `database-expert`

#### Tasks

1. **Redis Cache** (45 min)
   - `src/lib/cache/redis.ts`
   - Connection setup
   - Get/Set/Delete operations
   - TTL management
   - **Trigger Test:** `redis-expert`

2. **Cache Strategies** (30 min)
   - `src/lib/cache/strategies.ts`
   - Cache-aside pattern
   - Cache warming
   - Invalidation strategies
   - **Trigger Test:** `performance-optimizer`

3. **Next.js Config** (15 min)
   - `next.config.js`
   - Image optimization
   - Bundle analysis
   - Compression

**Validation:**
- Cache hits/misses logged
- Response times improve with cache
- Bundle size optimized

---

### Phase 10: Documentation

**Duration:** 1 hour
**Files:** 4
**Expected Triggers:** `documentation-expert`, `api-expert`

#### Tasks

1. **OpenAPI Spec** (30 min)
   - `docs/api/openapi.yaml`
   - All endpoints documented
   - Request/response schemas
   - Authentication flows
   - **Trigger Test:** `api-expert`, `documentation-expert`

2. **Architecture Decisions** (15 min)
   - `docs/architecture/decisions/001-use-prisma.md`
   - ADR format
   - Rationale for tech choices

3. **README** (10 min)
   - Project overview
   - Setup instructions
   - Development guide

4. **Contributing Guide** (5 min)
   - `CONTRIBUTING.md`
   - PR process
   - Code style

**Validation:**
- OpenAPI spec validates
- README has clear setup steps
- ADRs are complete

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Agent triggers don't fire** | Low | High | Fixed YAML parsing, tested patterns |
| **Database migrations fail** | Low | Medium | Use Prisma's safe migrations |
| **WebSocket connection issues** | Medium | Medium | Implement fallback polling |
| **Performance bottlenecks** | Medium | Medium | Add Redis caching early |
| **Security vulnerabilities** | Low | High | Security expert agent, OWASP checklist |

---

## Implementation Timeline

```
Week 1:
  Mon: Phase 1 (Database) ✓
  Tue: Phase 2 (Backend API)
  Wed: Phase 3 (Frontend - Components)
  Thu: Phase 3 (Frontend - Pages)
  Fri: Phase 4 (Styling)

Week 2:
  Mon: Phase 5 (Security)
  Tue: Phase 6 (Real-time)
  Wed: Phase 7 (Testing)
  Thu: Phase 8 (DevOps)
  Fri: Phase 9 (Performance) + Phase 10 (Docs)
```

**Total Estimated Time:** 18-20 hours of development

---

## Success Metrics

### Agent Trigger System

| Metric | Target | Current |
|--------|--------|---------|
| Trigger match rate | 100% | 0% (not started) |
| Agent suggestions | 5-10 per phase | TBD |
| False positives | <5% | TBD |
| Pattern coverage | All file types | TBD |

### Application Quality

| Metric | Target |
|--------|--------|
| Test coverage | >80% |
| API response time | <200ms (cached), <500ms (uncached) |
| Bundle size | <300KB initial load |
| Lighthouse score | >90 |

---

## Next Steps

1. **Start Phase 1** - Create Prisma schema
2. **Watch for triggers** - `database-expert` should appear
3. **Document trigger behavior** - Note which agents fire
4. **Iterate through phases** - Complete all 10 phases
5. **Final review** - Validate trigger coverage

---

**Ready to begin implementation!**
