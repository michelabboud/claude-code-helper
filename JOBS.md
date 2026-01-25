# JOBS - Active Work Tracker
<!-- AI-RESUMABLE: This file is designed for AI model consumption -->
<!-- LAST_UPDATED: 2026-01-25T17:30:00Z -->
<!-- SESSION_CONTEXT: Testing Agent Triggers with demo app implementation -->

## ACTIVE_JOBS

### JOB:demo-app-triggers-test
- STATUS: in_progress
- PRIORITY: high
- STARTED: 2026-01-25
- PLAN_DOC: demo/APP-REQUIREMENTS.md
- CURRENT_PHASE: Phase 1 - Database Schema
- PHASES:
  - [ ] Phase 1: Database Schema (IN_PROGRESS) <-- CURRENT
    - Create prisma/schema.prisma
    - Expected triggers: database-expert
  - [ ] Phase 2: REST API
    - Create src/api/routes/*.ts
    - Expected triggers: api-expert, security-expert
  - [ ] Phase 3: React/Next.js Frontend
    - Create src/components/**/*.tsx
    - Expected triggers: react-nextjs-expert, design-system-guardian
  - [ ] Phase 4: Styling & Design System
    - Create tailwind.config.ts, CSS files
    - Expected triggers: css-tailwind-expert
  - [ ] Phase 5: Authentication & Security
    - Create src/lib/auth/*, src/lib/security/*
    - Expected triggers: security-expert
  - [ ] Phase 6: Real-time Features
    - Create WebSocket server and hooks
    - Expected triggers: nodejs-typescript-backend-expert
  - [ ] Phase 7: Testing
    - Create __tests__/**/*.test.ts
    - Expected triggers: qa-testing-expert
  - [ ] Phase 8: DevOps & Deployment
    - Create Dockerfile, docker-compose.yml, .github/workflows/*
    - Expected triggers: devops-infrastructure-expert
  - [ ] Phase 9: Performance & Caching
    - Create src/lib/cache/redis.ts
    - Expected triggers: performance-optimizer, redis-expert
  - [ ] Phase 10: Documentation
    - Create docs/api/openapi.yaml
    - Expected triggers: documentation-expert
- BLOCKED_BY: null
- NEXT_ACTION: Create demo/prisma/schema.prisma to test database-expert trigger
- CONTEXT: |
    Testing the Agent Triggers system implemented in v1.0.0.

    Purpose: Verify that file pattern triggers correctly identify
    and suggest relevant agents when creating/editing files.

    The demo app is a "Task Manager Pro" - full-stack task management
    with teams, real-time updates, and multiple technology layers.

    Each phase targets different agent triggers based on file patterns.

    Requirements doc: demo/APP-REQUIREMENTS.md

    User needs to restart Claude Code first to load hooks from settings.json.
    After restart, resume this job and start Phase 1.
- ARTIFACTS:
    - created: [demo/APP-REQUIREMENTS.md, demo/.gitkeep]
    - modified: [.gitignore]
    - pending: [demo/prisma/schema.prisma, demo/src/**/*]

---

## RECENTLY_COMPLETED

### JOB:agent-triggers-v1
- STATUS: completed
- COMPLETED: 2026-01-25
- RELEASED: v1.0.0
- RELEASE_URL: https://github.com/michelabboud/claude-code-helper/releases/tag/v1.0.0
- SUMMARY: |
    Implemented comprehensive Agent Triggers System with 6 phases:
    - Phase 1: Keyword triggers + visual indicators (45 agents updated)
    - Phase 2: File pattern triggers with glob matching
    - Phase 3: Event triggers (9 event types)
    - Phase 4: Global configuration with JSON Schema
    - Phase 5: Agent chains (sequential/parallel execution)
    - Phase 6: MCP integration with before/after hooks

    Final stats: 188 passing tests, 77 files changed, 12,716 lines added
    License changed from MIT to Apache-2.0

    See CHANGELOG.md for complete release notes.
