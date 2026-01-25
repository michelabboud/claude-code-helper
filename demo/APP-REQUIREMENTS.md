# Demo App Requirements - Task Management System

A full-stack task management application designed to test Claude Code's Agent Triggers system.

## Overview

Build a **Task Manager Pro** - a modern task management app with teams, real-time updates, and AI-powered task suggestions.

---

## Phase 1: Foundation & Database

### Database Schema (PostgreSQL)
- `users` table - id, email, password_hash, name, avatar_url, created_at
- `teams` table - id, name, owner_id, created_at
- `team_members` table - team_id, user_id, role (admin/member)
- `projects` table - id, team_id, name, description, status, created_at
- `tasks` table - id, project_id, title, description, status, priority, assignee_id, due_date, created_at
- `comments` table - id, task_id, user_id, content, created_at
- `activity_log` table - id, entity_type, entity_id, action, user_id, metadata, created_at

### Files to Create
- `prisma/schema.prisma` - Database schema
- `src/db/migrations/` - Migration files
- `src/db/seed.ts` - Seed data

**Expected Triggers:** `database-expert`, `nodejs-typescript-backend-expert`

---

## Phase 2: Backend API

### REST API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/teams
POST   /api/teams
GET    /api/teams/:id
PUT    /api/teams/:id
DELETE /api/teams/:id

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/:id
PUT    /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/comments
```

### Files to Create
- `src/api/routes/auth.ts`
- `src/api/routes/teams.ts`
- `src/api/routes/projects.ts`
- `src/api/routes/tasks.ts`
- `src/api/middleware/auth.ts`
- `src/api/middleware/validation.ts`

**Expected Triggers:** `api-expert`, `nodejs-typescript-backend-expert`, `security-expert`

---

## Phase 3: Frontend - React/Next.js

### Pages
- `/` - Landing page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard
- `/projects/[id]` - Project detail with task board
- `/tasks/[id]` - Task detail modal/page
- `/settings` - User settings

### Components
- `src/components/ui/Button.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Card.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/tasks/TaskCard.tsx`
- `src/components/tasks/TaskBoard.tsx`
- `src/components/tasks/TaskForm.tsx`
- `src/components/projects/ProjectList.tsx`

**Expected Triggers:** `react-nextjs-expert`, `css-tailwind-expert`, `design-system-guardian`

---

## Phase 4: Styling & Design System

### Tailwind Configuration
- Custom color palette (primary, secondary, accent)
- Custom spacing scale
- Dark mode support
- Custom animations

### Files to Create
- `tailwind.config.ts`
- `src/styles/globals.css`
- `src/styles/components.css`
- `src/lib/design-tokens.ts`

**Expected Triggers:** `css-tailwind-expert`, `design-system-guardian`, `uiux-reviewer`

---

## Phase 5: Authentication & Security

### Features
- JWT-based authentication
- Password hashing with bcrypt
- CSRF protection
- Rate limiting
- Input sanitization
- XSS prevention

### Files to Create
- `src/lib/auth/jwt.ts`
- `src/lib/auth/password.ts`
- `src/lib/security/csrf.ts`
- `src/lib/security/rate-limit.ts`
- `src/lib/security/sanitize.ts`

**Expected Triggers:** `security-expert`, `nodejs-typescript-backend-expert`

---

## Phase 6: Real-time Features

### WebSocket Events
- `task:created` - New task notification
- `task:updated` - Task status change
- `task:assigned` - Assignment notification
- `comment:added` - New comment notification
- `user:online` - Presence indicator

### Files to Create
- `src/lib/websocket/server.ts`
- `src/lib/websocket/events.ts`
- `src/hooks/useWebSocket.ts`
- `src/hooks/usePresence.ts`

**Expected Triggers:** `nodejs-typescript-backend-expert`, `react-nextjs-expert`

---

## Phase 7: Testing

### Test Coverage
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- E2E tests for critical user flows
- Component tests for React components

### Files to Create
- `src/__tests__/api/auth.test.ts`
- `src/__tests__/api/tasks.test.ts`
- `src/__tests__/components/TaskCard.test.tsx`
- `src/__tests__/e2e/login.spec.ts`
- `src/__tests__/e2e/task-crud.spec.ts`

**Expected Triggers:** `qa-testing-expert`, `react-nextjs-expert`

---

## Phase 8: DevOps & Deployment

### Infrastructure
- Dockerfile for containerization
- docker-compose.yml for local development
- GitHub Actions CI/CD pipeline
- Kubernetes manifests for production

### Files to Create
- `Dockerfile`
- `docker-compose.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `k8s/deployment.yaml`
- `k8s/service.yaml`

**Expected Triggers:** `devops-infrastructure-expert`, `cicd-engineer`

---

## Phase 9: Performance & Optimization

### Optimizations
- Database query optimization with indexes
- Redis caching for frequent queries
- Image optimization
- Bundle size optimization
- Lazy loading components

### Files to Create
- `src/lib/cache/redis.ts`
- `src/lib/cache/strategies.ts`
- `next.config.js` (optimization settings)

**Expected Triggers:** `performance-optimizer`, `redis-expert`, `database-expert`

---

## Phase 10: Documentation

### Documentation
- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- Architecture decision records
- README and setup guide

### Files to Create
- `docs/api/openapi.yaml`
- `docs/architecture/decisions/`
- `README.md`
- `CONTRIBUTING.md`

**Expected Triggers:** `documentation-expert`, `api-expert`

---

## Tech Stack Summary

| Layer | Technology | Agent Trigger |
|-------|------------|---------------|
| Frontend | Next.js 14, React 18, TypeScript | `react-nextjs-expert` |
| Styling | Tailwind CSS, CSS Modules | `css-tailwind-expert` |
| Backend | Node.js, Express/tRPC | `nodejs-typescript-backend-expert` |
| Database | PostgreSQL, Prisma ORM | `database-expert` |
| Cache | Redis | `redis-expert` |
| Auth | JWT, bcrypt | `security-expert` |
| Real-time | WebSockets (Socket.io) | `nodejs-typescript-backend-expert` |
| Testing | Jest, Playwright, Testing Library | `qa-testing-expert` |
| DevOps | Docker, GitHub Actions, K8s | `devops-infrastructure-expert` |
| Docs | OpenAPI, Storybook | `documentation-expert` |

---

## File Structure

```
demo/
├── APP-REQUIREMENTS.md      # This file (tracked)
├── .gitkeep                 # Keep folder in git
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   └── middleware/      # Auth, validation
│   ├── components/
│   │   ├── ui/              # Base components
│   │   ├── layout/          # Layout components
│   │   └── tasks/           # Feature components
│   ├── lib/
│   │   ├── auth/            # Authentication
│   │   ├── cache/           # Caching
│   │   ├── security/        # Security utils
│   │   └── websocket/       # Real-time
│   ├── hooks/               # React hooks
│   ├── styles/              # CSS/Tailwind
│   └── __tests__/           # Tests
├── docs/
│   ├── api/                 # API docs
│   └── architecture/        # ADRs
├── k8s/                     # Kubernetes
├── .github/
│   └── workflows/           # CI/CD
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Testing the Trigger System

When implementing this app, the following file patterns should trigger agents:

| File Pattern | Expected Agent |
|--------------|----------------|
| `*.tsx` in `components/` | `react-nextjs-expert`, `design-system-guardian` |
| `*.ts` in `api/routes/` | `api-expert`, `nodejs-typescript-backend-expert` |
| `schema.prisma` | `database-expert` |
| `*.test.ts`, `*.spec.ts` | `qa-testing-expert` |
| `Dockerfile`, `docker-compose.yml` | `devops-infrastructure-expert` |
| `.github/workflows/*.yml` | `devops-infrastructure-expert`, `cicd-engineer` |
| `tailwind.config.ts`, `*.css` | `css-tailwind-expert` |
| `**/security/**`, `**/auth/**` | `security-expert` |
| `redis.ts`, `cache/**` | `redis-expert` |

---

*This requirements document is designed to test Claude Code's Agent Triggers system by including files and patterns that match various agent triggers.*
