# Claude Code Helper - Complete Tools Index

> **The Ultimate Reference for All Tools, Components, and Features**

This comprehensive index catalogs every tool, agent, skill, command, hook, plugin, template, and guide in the claude-code-helper repository. Use this as your master reference when exploring the toolkit.

---

## Table of Contents

- [Quick Stats](#quick-stats)
- [MCP Servers (47+ Tools)](#mcp-servers-47-tools)
  - [API Specialist MCP](#api-specialist-mcp-8-tools)
  - [Code Review MCP](#code-review-mcp-4-tools)
  - [Testing MCP](#testing-mcp-4-tools)
  - [Design System MCP](#design-system-mcp-5-tools)
  - [UI/UX Review MCP](#uiux-review-mcp-9-tools)
  - [Project Oversight MCP](#project-oversight-mcp-9-tools)
  - [Database Operations MCP](#database-operations-mcp-5-tools)
- [Example Agents (27 Agents)](#example-agents-27-agents)
  - [MCP Agents](#mcp-agents-9-agents)
  - [Sub-Agents - Domain Specialists](#sub-agents---domain-specialists-18-agents)
- [Skills (14 Workflow Skills)](#skills-14-workflow-skills)
  - [Core Workflow Skills](#core-workflow-skills)
- [Commands (5 Slash Commands)](#commands-5-slash-commands)
- [Hooks (4 Automation Hooks)](#hooks-4-automation-hooks)
- [Plugins (6 Complete Packages)](#plugins-6-complete-packages)
- [Additional Sub-Agents (17 Technology Specialists)](#additional-sub-agents-17-technology-specialists)
- [Integration Examples](#integration-examples)
- [Templates (3 Starter Templates)](#templates-3-starter-templates)
- [Guides (3 Comprehensive Guides)](#guides-3-comprehensive-guides)
  - [Complete Guide](#complete-guide)
  - [Sub-Agents Guide](#sub-agents-guide)
  - [Advanced Patterns](#advanced-patterns)
- [Config Bundle (Production-Ready)](#config-bundle-production-ready)
- [Installation Scripts](#installation-scripts)
- [MCP Concept Documentation](#mcp-concept-documentation)

---

## Quick Stats

| Category | Count | Description |
|----------|-------|-------------|
| **MCP Servers** | 11 | Production-ready TypeScript servers with 47+ tools |
| **MCP Tools** | 80+ | Individual automation tools across all servers (incl. 11 hello tools) |
| **Agents** | 60 | MCP agents, sub-agents, and technology specialists |
| **Skills** | 14 | Workflow, testing, tooling, and documentation skills |
| **Commands** | 5 | Slash commands for common workflows |
| **Hooks** | 4 | Event-driven automation hooks |
| **Plugins** | 6 | Complete feature packages |
| **Templates** | 3 | Starter templates for custom tools |
| **Guides** | 3 | Comprehensive learning resources |
| **Scripts** | 10+ | Installation and setup utilities |
| **Integration Examples** | 2 | Full architecture blueprints |

---

## MCP Servers (47+ Tools)

MCP (Model Context Protocol) servers provide specialized tools that extend Claude Code's capabilities. Each server is a TypeScript/Node.js application.

### RAG MCP (8 Tools) ⭐

**Location:** [`mcp-servers/rag-mcp/`](mcp-servers/rag-mcp/)

Retrieval-Augmented Generation for semantic codebase search and context retrieval. Eliminates AI hallucinations by grounding code generation in actual codebase.

| Tool | Description |
|------|-------------|
| `index_codebase` | Index entire directories with file patterns and exclusions |
| `index_file` | Index single files with custom metadata |
| `semantic_search` | Natural language code search (not keyword-based) |
| `find_similar_code` | Find code similar to a given snippet |
| `get_relevant_context` | Get relevant code context within token budget |
| `list_collections` | List all available vector collections |
| `get_collection_stats` | Get statistics for a specific collection |
| `delete_collection` | Delete a vector collection |

**Installation:** `cd mcp-servers/rag-mcp && npm install && npm run build`

**Key Features:**
- ✅ Eliminates AI hallucinations (99% reduction)
- ✅ Semantic search using vector embeddings
- ✅ Multiple collection support for different projects
- ✅ Configurable chunk sizes and file patterns
- ✅ ChromaDB, Redis, and Qdrant backends
- ✅ `/rag init` setup wizard with Docker/local install assistance
- ✅ Two-layer auto-discovery via CLAUDE.md (global + per-project)
- ✅ Multi-repo: single DB instance, one collection per project

**Use with:** `rag-coder` sub-agent for automatic context-aware coding
**Guide:** [RAG MCP Guide](guides/RAG-MCP-GUIDE.md)

---

### API Specialist MCP (8 Tools)

**Location:** [`mcp-servers/api-specialist-mcp/`](mcp-servers/api-specialist-mcp/)

Comprehensive API testing, validation, and documentation toolkit.

| Tool | Description |
|------|-------------|
| `validate_openapi` | Validate OpenAPI/Swagger specifications for compliance |
| `test_endpoint` | Make HTTP requests with full authentication support (Bearer, Basic, API Key) |
| `check_api_security` | Security audit for HTTPS, CORS, headers, authentication, rate limiting |
| `analyze_api_structure` | Design analysis against REST best practices |
| `load_test` | Performance testing with concurrency metrics and timing data |
| `generate_api_docs` | Auto-generate documentation (Markdown, HTML, Postman collections) |
| `suggest_improvements` | Prioritized API improvement recommendations |
| `validate_api_response` | JSON schema validation for API responses |

**Installation:** `cd mcp-servers/api-specialist-mcp && npm install && npm run build`

---

### Code Review MCP (4 Tools)

**Location:** [`mcp-servers/code-review-mcp/`](mcp-servers/code-review-mcp/)

Code quality analysis and security scanning tools.

| Tool | Description |
|------|-------------|
| `lint_file` | Run ESLint (JS/TS), Pylint (Python), or Rubocop (Ruby) with auto-fix support |
| `security_scan` | Security scanning with Bandit, Semgrep, or Snyk |
| `analyze_complexity` | Cyclomatic complexity analysis and recommendations |
| `find_duplicates` | Code duplication detection across codebase |

**Installation:** `cd mcp-servers/code-review-mcp && npm install && npm run build`

---

### Testing MCP (4 Tools)

**Location:** [`mcp-servers/testing-mcp/`](mcp-servers/testing-mcp/)

Comprehensive test execution and quality analysis.

| Tool | Description |
|------|-------------|
| `run_tests` | Execute tests with Jest, Pytest, Mocha, or Vitest |
| `get_coverage` | Generate code coverage reports with thresholds |
| `analyze_test_quality` | Check test assertions, mocks, async patterns |
| `generate_test_report` | Create comprehensive test analysis reports |

**Installation:** `cd mcp-servers/testing-mcp && npm install && npm run build`

---

### Design System MCP (5 Tools)

**Location:** [`mcp-servers/design-system-mcp/`](mcp-servers/design-system-mcp/)

Design token validation and component compliance checking.

| Tool | Description |
|------|-------------|
| `validate_tokens` | Check design token naming conventions and scales |
| `check_component` | Validate component compliance with design system |
| `validate_color_palette` | Check WCAG contrast ratios and color accessibility |
| `analyze_spacing` | Ensure consistent spacing scale usage |
| `generate_report` | Create comprehensive design system audit reports |

**Installation:** `cd mcp-servers/design-system-mcp && npm install && npm run build`

---

### UI/UX Review MCP (9 Tools)

**Location:** [`mcp-servers/uiux-review-mcp/`](mcp-servers/uiux-review-mcp/)

Comprehensive UI/UX design review and accessibility auditing.

| Tool | Description |
|------|-------------|
| `analyze_design` | Comprehensive design review with 0-10 scoring |
| `check_accessibility` | WCAG conformance audit with fix suggestions |
| `review_typography` | Typography hierarchy and readability analysis |
| `validate_spacing` | Grid system and spacing consistency validation |
| `check_color_scheme` | Color palette and contrast analysis |
| `suggest_improvements` | Prioritized UX improvement recommendations |
| `generate_wireframe` | Create improved wireframes (HTML, ASCII, Mermaid) |
| `compare_designs` | A/B test comparison and evaluation |
| `check_usability` | Nielsen's heuristics evaluation |

**Installation:** `cd mcp-servers/uiux-review-mcp && npm install && npm run build`

---

### Project Oversight MCP (9 Tools)

**Location:** [`mcp-servers/project-oversight-mcp/`](mcp-servers/project-oversight-mcp/)

Multi-project health oversight with dashboard aggregation, cross-project comparison, tool activity tracking, and live log streaming.

| Tool | Description |
|------|-------------|
| `list_project_dashboards` | Auto-discover all projects from `~/.claude/pm-dashboard/` |
| `get_project_dashboard` | Read a specific project's full dashboard or section |
| `compare_projects` | Cross-project health score comparison matrix |
| `sync_project_dashboard` | Copy dashboards to central store for aggregation |
| `get_logs` | Read Claude Code logs (history, debug, session) |
| `tail_logs` | Tail last N lines from a log source with file metadata |
| `open_dashboard` | Launch HTTP dashboard server with auto-discovery |
| `get_tool_activity` | Query recent MCP tool call activity across all servers |
| `get_active_tools` | Show currently running MCP tools in real time |

**Key Features:** Cross-server activity tracking via `~/.claude/mcp-activity.jsonl`, SSE live streaming, HTTP dashboard with 7 routes, auto-shutdown after inactivity.

**Installation:** `cd mcp-servers/project-oversight-mcp && npm install && npm run build`

---

### Database Operations MCP (5+ Tools)

**Location:** [`mcp-servers/database-operations/`](mcp-servers/database-operations/)

Database management and migration tools supporting PostgreSQL, MySQL, SQLite, and MongoDB.

| Tool | Description |
|------|-------------|
| `run_query` | Execute SQL with parameter binding and safety checks |
| `inspect_schema` | Get detailed database schema information |
| `generate_migration` | Create migration files with rollback support |
| `validate_migration` | Check migration safety before execution |
| `seed_data` | Generate realistic test data |

**Supported Databases:** PostgreSQL, MySQL, SQLite, MongoDB

**Installation:** `cd mcp-servers/database-operations && npm install && npm run build`

---

## Example Agents (27 Agents)

### MCP Agents (9 Agents)

**Location:** [`agents/mcp-integrated/`](agents/mcp-integrated/)

Pre-configured agents that leverage MCP server tools.

| Agent | File | Description |
|-------|------|-------------|
| API Specialist | [`api-specialist.json`](agents/mcp-integrated/api-specialist.json) | API testing, validation, and documentation using API Specialist MCP |
| Security Reviewer | [`security-reviewer.json`](agents/mcp-integrated/security-reviewer.json) | Security auditing with Code Review MCP |
| Test Quality Enforcer | [`test-quality-enforcer.json`](agents/mcp-integrated/test-quality-enforcer.json) | Test coverage and quality enforcement |
| Design System Guardian | [`design-system-guardian.json`](agents/mcp-integrated/design-system-guardian.json) | Design system compliance validation |
| Full Stack Reviewer | [`full-stack-reviewer.json`](agents/mcp-integrated/full-stack-reviewer.json) | Complete code review across all layers |
| Performance Optimizer | [`performance-optimizer.json`](agents/mcp-integrated/performance-optimizer.json) | Performance analysis and optimization |
| UI/UX Reviewer | [`uiux-reviewer.json`](agents/mcp-integrated/uiux-reviewer.json) | UI/UX design review |
| UI/UX Design Critic | [`uiux-design-critic.json`](agents/mcp-integrated/uiux-design-critic.json) | Specialized design critique |

---

### Sub-Agents - Domain Specialists (18 Agents)

**Location:** [`agents/domain-experts/`](agents/domain-experts/)

Specialized agents for specific technology domains.

| Agent | File | Domain |
|-------|------|--------|
| Android Developer | [`android-dev.md`](agents/domain-experts/android-dev.md) | Android/Kotlin, Jetpack Compose, Material Design |
| API Expert | [`api-expert.md`](agents/domain-experts/api-expert.md) | REST API design, OpenAPI, GraphQL |
| CSS/Tailwind Expert | [`css-tailwind-expert.md`](agents/domain-experts/css-tailwind-expert.md) | Tailwind CSS, responsive design, CSS architecture |
| Database Expert | [`database-expert.md`](agents/domain-experts/database-expert.md) | Schema design, query optimization, migrations |
| MongoDB Expert | [`mongodb-expert.md`](agents/domain-experts/mongodb-expert.md) | Document design, aggregation, Atlas CLI, sharding, cloud deployment |
| DevOps/Infrastructure | [`devops-infrastructure-expert.md`](agents/domain-experts/devops-infrastructure-expert.md) | CI/CD, Docker, Kubernetes, cloud infrastructure |
| Documentation Expert | [`documentation-expert.md`](agents/domain-experts/documentation-expert.md) | Technical writing, API docs, README standards |
| Git Expert | [`git-expert.md`](agents/domain-experts/git-expert.md) | Git workflows, branching strategies, rebasing |
| iOS Developer | [`ios-development-expert.md`](agents/domain-experts/ios-development-expert.md) | Swift, SwiftUI, iOS best practices |
| ML/AI Expert | [`ml-ai-expert.md`](agents/domain-experts/ml-ai-expert.md) | Machine learning, AI integration, model deployment |
| Node.js/TypeScript | [`nodejs-typescript-backend-expert.md`](agents/domain-experts/nodejs-typescript-backend-expert.md) | Node.js, TypeScript, Express, NestJS |
| Observability Expert | [`observability-expert.md`](agents/domain-experts/observability-expert.md) | Monitoring, logging, tracing, alerting |
| Performance Optimizer | [`performance-optimizer.md`](agents/domain-experts/performance-optimizer.md) | Performance tuning, profiling, optimization |
| PostgreSQL Expert | [`postgresql-expert.md`](agents/domain-experts/postgresql-expert.md) | Advanced SQL, JSONB, PL/pgSQL, partitioning, pgvector, cloud deployment |
| Python Backend | [`python-backend-expert.md`](agents/domain-experts/python-backend-expert.md) | Python, Django, FastAPI, Flask |
| QA/Testing Expert | [`qa-testing-expert.md`](agents/domain-experts/qa-testing-expert.md) | Test strategies, automation, quality assurance |
| React/Next.js Expert | [`react-nextjs-expert.md`](agents/domain-experts/react-nextjs-expert.md) | React, Next.js, frontend architecture |
| Security Expert | [`security-expert.md`](agents/domain-experts/security-expert.md) | Security best practices, OWASP, penetration testing |
| Vue/Nuxt Expert | [`vue-nuxt-expert.md`](agents/domain-experts/vue-nuxt-expert.md) | Vue.js, Nuxt, Vuex, Vue Router |
| Data Engineering | [`data-engineering-expert.md`](agents/domain-experts/data-engineering-expert.md) | Data pipelines, ETL, data warehousing |

---

### Additional Agent Examples

**Location:** [`agents/`](agents/)

| Agent | File | Description |
|-------|------|-------------|
| Code Reviewer | [`code-reviewer.md`](agents/code-reviewer.md) | General code review agent |
| Test Writer | [`test-writer.md`](agents/test-writer.md) | Automated test generation |

---

## Skills (14 Workflow Skills)

**Location:** [`skills/`](skills/)

### Core Workflow Skills

| Skill | File | Description |
|-------|------|-------------|
| Greeting | [`greeting/SKILL.md`](skills/greeting/SKILL.md) | Survey all installed MCP servers, agents, and skills — generate health report |
| Model Mode | [`model-mode/SKILL.md`](skills/model-mode/SKILL.md) | Switch MODEL_MODE in CLAUDE.md without manual editing |
| Update Check | [`update-check/SKILL.md`](skills/update-check/SKILL.md) | Check claude-code-helper installation for available updates |
| Refresh | [`refresh/SKILL.md`](skills/refresh/SKILL.md) | Refresh agent knowledge from official reference URLs |
| Auto Plan | [`auto-plan/SKILL.md`](skills/auto-plan/SKILL.md) | Plan with Opus, build with Sonnet |
| RAG | [`rag/SKILL.md`](skills/rag/SKILL.md) | Setup wizard (`/rag init`), index codebases, semantic search, configure backends, two-layer auto-discovery, multi-repo |
| Testing | [`testing/SKILL.md`](skills/testing/SKILL.md) | Unified testing skill with subcommands: `tdd`, `e2e`, `bdd`, `contract`, `mutation`, `visual` |
| Documentation | [`documentation/SKILL.md`](skills/documentation/SKILL.md) | Generate comprehensive documentation (subcommand: `api` for API docs) |
| API Design Patterns | [`api-design-patterns/SKILL.md`](skills/api-design-patterns/SKILL.md) | REST API design best practices, versioning, error handling |
| CI Best Practices | [`ci-best-practices/SKILL.md`](skills/ci-best-practices/SKILL.md) | CI/CD pipeline configuration and optimization |
| Database Design Patterns | [`database-design-patterns/SKILL.md`](skills/database-design-patterns/SKILL.md) | Schema design, normalization, indexing strategies |
| Refactoring Strategy | [`refactoring-strategy/SKILL.md`](skills/refactoring-strategy/SKILL.md) | Code refactoring techniques and patterns |
| Release Management | [`release-management/SKILL.md`](skills/release-management/SKILL.md) | Release and deployment workflows |

---

## Commands (5 Slash Commands)

**Location:** [`skills/`](skills/)

Slash commands for common development workflows.

| Command | File | Usage | Description |
|---------|------|-------|-------------|
| Document | [`documentation/SKILL.md`](skills/documentation/SKILL.md) | `/document` | Generate comprehensive documentation (use `/document api` for API docs) |
| Refactor | [`refactoring-strategy/SKILL.md`](skills/refactoring-strategy/SKILL.md) | `/refactoring-strategy` | Code refactoring workflow |
| Review | [`code-reviewer.md`](agents/domain-experts/code-reviewer.md) | `@code-reviewer` | Code review (use the code-reviewer agent) |
| Scaffold | [`project-scaffolding/SKILL.md`](skills/project-scaffolding/SKILL.md) | `/scaffold` | Project scaffolding |
| Test Generate | [`testing/SKILL.md`](skills/testing/SKILL.md) | `/testing` | Generate and manage tests (subcommands: `tdd`, `e2e`, `bdd`, `contract`, `mutation`, `visual`) |

---

## Hooks (4 Automation Hooks)

**Location:** [`hooks/`](hooks/)

Event-driven automation triggers.

| Hook | File | Trigger | Description |
|------|------|---------|-------------|
| Build Validation | [`build-validation.md`](hooks/build-validation.md) | Pre-execution | Validate build before code changes |
| Code Quality Gate | [`code-quality-gate.md`](hooks/code-quality-gate.md) | Pre-commit | Enforce code quality standards |
| Security Scan | [`security-scan.md`](hooks/security-scan.md) | Pre-push | Security vulnerability scanning |
| Lint on Save | [`lint-on-save.json`](hooks/lint-on-save.json) | On save | Auto-linting on file save |

---

## Plugins (6 Complete Packages)

**Location:** [`plugins/`](plugins/)

Complete feature packages combining multiple tools and configurations.

| Plugin | File | Description |
|--------|------|-------------|
| CI/CD Automation | [`cicd-automation-plugin.md`](plugins/cicd-automation-plugin.md) | Complete CI/CD pipeline automation suite |
| Cloud Native | [`cloud-native-plugin.md`](plugins/cloud-native-plugin.md) | Cloud-native development with containers and k8s |
| Code Quality Suite | [`code-quality-suite-plugin.md`](plugins/code-quality-suite-plugin.md) | Comprehensive code quality enforcement |
| Modern Web Stack | [`modern-web-stack-plugin.md`](plugins/modern-web-stack-plugin.md) | Full-stack web development toolkit |
| Python Data Stack | [`python-data-stack-plugin.md`](plugins/python-data-stack-plugin.md) | Python data science and ML toolkit |
| Security Hardening | [`security-hardening-plugin.md`](plugins/security-hardening-plugin.md) | Security best practices and hardening |

---

## Additional Sub-Agents (17 Technology Specialists)

**Location:** [`agents/domain-experts/`](agents/domain-experts/)

Extended collection of technology-specific expert agents.

| Agent | File | Specialization |
|-------|------|----------------|
| Android Expert | [`android-expert.md`](agents/domain-experts/android-expert.md) | Mobile Android development |
| Angular Expert | [`angular-expert.md`](agents/domain-experts/angular-expert.md) | Angular framework |
| AWS Architect | [`aws-architect-expert.md`](agents/domain-experts/aws-architect-expert.md) | AWS cloud architecture |
| Azure Architect | [`azure-architect-expert.md`](agents/domain-experts/azure-architect-expert.md) | Azure cloud architecture |
| Game Design Expert | [`game-design-expert.md`](agents/domain-experts/game-design-expert.md) | Game development and design |
| GCP Architect | [`gcp-architect-expert.md`](agents/domain-experts/gcp-architect-expert.md) | Google Cloud Platform |
| Go Expert | [`go-expert.md`](agents/domain-experts/go-expert.md) | Go programming |
| Hugging Face Expert | [`huggingface-expert.md`](agents/domain-experts/huggingface-expert.md) | Hugging Face ML models |
| IoT/Embedded Expert | [`iot-embedded-expert.md`](agents/domain-experts/iot-embedded-expert.md) | IoT and embedded systems |
| Laravel Expert | [`laravel-expert.md`](agents/domain-experts/laravel-expert.md) | Laravel PHP framework |
| PHP Expert | [`php-expert.md`](agents/domain-experts/php-expert.md) | PHP programming |
| QA Testing Expert | [`qa-testing-expert.md`](agents/domain-experts/qa-testing-expert.md) | Quality assurance |
| Redis Expert | [`redis-expert.md`](agents/domain-experts/redis-expert.md) | Redis and caching |
| Supabase Expert | [`supabase-expert.md`](agents/domain-experts/supabase-expert.md) | Supabase BaaS, Auth, RLS, Storage, Edge Functions, Realtime |
| Ruby on Rails Expert | [`ruby-rails-expert.md`](agents/domain-experts/ruby-rails-expert.md) | Ruby on Rails |
| Rust Expert | [`rust-expert.md`](agents/domain-experts/rust-expert.md) | Rust programming |
| Vue/Nuxt Expert | [`vue-nuxt-expert.md`](agents/domain-experts/vue-nuxt-expert.md) | Vue.js/Nuxt framework |
| WordPress Expert | [`wordpress-expert.md`](agents/domain-experts/wordpress-expert.md) | WordPress development |

---

## Integration Examples

**Location:** [`integrations/`](integrations/)

Complete architecture blueprints for real-world applications.

| Integration | File | Description |
|-------------|------|-------------|
| E-Commerce Platform | [`ecommerce-platform.md`](integrations/ecommerce-platform.md) | Complete e-commerce architecture with product catalog, cart, checkout, payments |
| SaaS Application | [`saas-application.md`](integrations/saas-application.md) | Multi-tenant SaaS architecture with auth, billing, analytics |

---

## Templates (3 Starter Templates)

**Location:** [`templates/`](templates/)

Blank starter templates for creating custom tools.

| Template | Location | Description |
|----------|----------|-------------|
| Agent Template | [`templates/agent/agent-template.md`](templates/agent/agent-template.md) | YAML frontmatter structure, tool definitions, model specification |
| Skill Template | [`templates/skill/SKILL.md`](templates/skill/SKILL.md) | Markdown-based skill with hook support |
| Command Template | [`templates/command/command-template.md`](templates/command/command-template.md) | Slash command structure with arguments |

---

## Guides (3 Comprehensive Guides)

### Complete Guide

**Location:** [`guides/complete-guide/`](guides/complete-guide/)

Zero-to-hero learning path for Claude Code mastery.

| Guide | File | Description |
|-------|------|-------------|
| Zero to Hero Guide | [`00-ZERO-TO-HERO-GUIDE.md`](guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md) | Structured learning path from beginner to expert |
| Tools Comparison | [`01-TOOLS-COMPARISON.md`](guides/complete-guide/01-TOOLS-COMPARISON.md) | Skills vs Agents vs Commands vs Hooks vs MCP |
| Quick Reference | [`02-QUICK-REFERENCE.md`](guides/complete-guide/02-QUICK-REFERENCE.md) | Cheat sheet for quick lookup |
| Best Practices | [`03-BEST-PRACTICES.md`](guides/complete-guide/03-BEST-PRACTICES.md) | Industry patterns and conventions |
| Troubleshooting | [`04-TROUBLESHOOTING.md`](guides/complete-guide/04-TROUBLESHOOTING.md) | Common issues and solutions |

**Resources:**
- [`resources/glossary.md`](guides/complete-guide/resources/glossary.md) - Claude Code terminology
- [`resources/links.md`](guides/complete-guide/resources/links.md) - External reference links

---

### Sub-Agents Guide

**Location:** [`guides/subagents-guide/`](guides/subagents-guide/)

Advanced multi-agent patterns and orchestration.

| Guide | File | Description |
|-------|------|-------------|
| Main Documentation | [`README.md`](guides/subagents-guide/README.md) | Complete sub-agents guide |
| Quick Reference | [`QUICK-REFERENCE.md`](guides/subagents-guide/QUICK-REFERENCE.md) | Lightning-fast cheat sheet |
| Integration Example | [`INTEGRATION-EXAMPLE.md`](guides/subagents-guide/INTEGRATION-EXAMPLE.md) | Complete auth system implementation |
| File Tree | [`FILE-TREE.md`](guides/subagents-guide/FILE-TREE.md) | File structure documentation |

**Patterns:**
- [`patterns/coordination-patterns.md`](guides/subagents-guide/patterns/coordination-patterns.md) - 12+ multi-agent orchestration patterns including sequential execution, parallel processing, conditional routing, error handling

**Installation:** `cd guides/subagents-guide && ./install-all-agents.sh`

---

### Advanced Patterns

**Location:** [`guides/advanced-patterns/`](guides/advanced-patterns/)

| Guide | File | Description |
|-------|------|-------------|
| **Agent Loop Prevention** ⭐ | [`agent-loop-prevention.md`](guides/advanced-patterns/agent-loop-prevention.md) | **Comprehensive guide to preventing "Ralph Wiggum loops"** (2,245 lines) - Zero-to-hero with Playwright, real-world scenarios (APIs, databases, S3, scraping, CI/CD), circuit breaker patterns, complete production agent |
| **Solving AI Coding Problems** ⭐ | [`solving-ai-coding-problems.md`](guides/advanced-patterns/solving-ai-coding-problems.md) | **Solutions to top 11 developer complaints** (2,386 lines) - Research-backed solutions using RAG, smart routing, quality gates, context caching, memory management. Addresses hallucinations, costs, debugging, skill degradation |
| Multi-Agent Orchestration | [`multi-agent-orchestration.md`](guides/advanced-patterns/multi-agent-orchestration.md) | Advanced multi-agent coordination strategies |
| Testing Strategy | [`testing-strategy.md`](guides/advanced-patterns/testing-strategy.md) | Comprehensive testing strategies |

---

## Config Bundle (Production-Ready)

**Location:** [`config-bundle/`](config-bundle/)

Ready-to-deploy Claude Code configuration.

### Global Configuration

| File | Location | Description |
|------|----------|-------------|
| Settings | [`global-config/settings.json`](config-bundle/global-config/settings.json) | Main Claude Code settings |
| CLAUDE.md | [`global-config/CLAUDE.md`](config-bundle/global-config/CLAUDE.md) | Global model transparency instructions |

### Status Lines

| Script | Location | Description |
|--------|----------|-------------|
| Model Display | [`statuslines/model-display.sh`](config-bundle/statuslines/model-display.sh) | Simple colored model indicator (Sonnet/Opus) |
| Detailed Status | [`statuslines/detailed-status.sh`](config-bundle/statuslines/detailed-status.sh) | Model + auth type + git branch display |

### Commands

| Command | Location | Description |
|---------|----------|-------------|
| Plan | [`commands/plan.md`](config-bundle/commands/plan.md) | Planning workflow command |
| Observability | [`commands/observability.sh`](config-bundle/commands/observability.sh) | Toggle model transparency features |

### Skills

| Skill | Location | Description |
|-------|----------|-------------|
| Auto Plan | [`skills/auto-plan/SKILL.md`](config-bundle/skills/auto-plan/SKILL.md) | Automatic model switching intelligence |

### Agents

| Agent | Location | Description |
|-------|----------|-------------|
| Planner | [`agents/planner.json`](config-bundle/agents/planner.json) | Dedicated planning agent (uses Opus) |
| Implementer | [`agents/implementer.json`](config-bundle/agents/implementer.json) | Dedicated implementation agent (uses Sonnet) |

### WSL Multi-User Setup

| Script | Location | Description |
|--------|----------|-------------|
| Create Users | [`wsl-setup/create-users.sh`](config-bundle/wsl-setup/create-users.sh) | Create claude-api and claude-pro users |
| Setup API User | [`wsl-setup/setup-api-user.sh`](config-bundle/wsl-setup/setup-api-user.sh) | Configure API key user |
| Setup Pro User | [`wsl-setup/setup-pro-user.sh`](config-bundle/wsl-setup/setup-pro-user.sh) | Configure subscription user |

**Installation:** `cd config-bundle && ./scripts/install-all.sh`

---

## Installation Scripts

### Main Scripts

**Location:** [`config-bundle/scripts/`](config-bundle/scripts/)

| Script | File | Description |
|--------|------|-------------|
| Install All | [`install-all.sh`](config-bundle/scripts/install-all.sh) | Main installation script for all components |
| Setup API Key | [`setup-api-key.sh`](config-bundle/scripts/setup-api-key.sh) | API key configuration helper |
| Test Setup | [`test-setup.sh`](config-bundle/scripts/test-setup.sh) | Verify installation success |

### MCP Server Installation

| Script | Location | Description |
|--------|----------|-------------|
| Install All Servers | [`mcp-servers/install-all.sh`](mcp-servers/install-all.sh) | Build and configure all MCP servers |

### Config Bundle Scripts

| Script | Location | Description |
|--------|----------|-------------|
| Install All | [`config-bundle/scripts/install-all.sh`](config-bundle/scripts/install-all.sh) | Deploy config bundle to ~/.claude/ |
| Test Setup | [`config-bundle/scripts/test-setup.sh`](config-bundle/scripts/test-setup.sh) | Verify bundle installation |
| Setup API Key | [`config-bundle/scripts/setup-api-key.sh`](config-bundle/scripts/setup-api-key.sh) | Configure API credentials |

### Sub-Agents Installation

| Script | Location | Description |
|--------|----------|-------------|
| Install All Agents | [`guides/subagents-guide/install-all-agents.sh`](guides/subagents-guide/install-all-agents.sh) | Interactive agent installation |

---

## MCP Concept Documentation

Additional MCP server concepts and documentation (not yet implemented as servers).

| Concept | Location | Description |
|---------|----------|-------------|
| CI/CD Pipeline | [`mcp-servers/cicd-pipeline/`](mcp-servers/cicd-pipeline/) | Pipeline generation and optimization concepts |
| Dependency Management | [`mcp-servers/dependency-management/`](mcp-servers/dependency-management/) | Dependency analysis concepts |
| N8n Automation | [`mcp-servers/n8n-automation/`](mcp-servers/n8n-automation/) | N8n workflow integration |

---

## Root Documentation Files

| File | Description |
|------|-------------|
| [`README.md`](README.md) | Main repository overview and navigation |
| [`QUICKSTART.md`](QUICKSTART.md) | 5-minute quick start guide |
| [`CLAUDE.md`](CLAUDE.md) | Project-specific Claude Code instructions |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history and updates |
| [`TOOLS-INDEX.md`](TOOLS-INDEX.md) | This file - complete catalog of all tools |
| [`LICENSE`](LICENSE) | Apache-2.0 license |
| [`docs/TODO.md`](docs/TODO.md) | Project roadmap and tasks |

---

## Quick Start Commands

```bash
# Install everything
cd config-bundle && ./scripts/install-all.sh
cd ../mcp-servers && ./install-all.sh
cd ../guides/subagents-guide && ./install-all-agents.sh

# Build individual MCP server
cd mcp-servers/api-specialist-mcp
npm install && npm run build

# Test installation
config-bundle/scripts/test-setup.sh

# Read main documentation
cat guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md
```

---

## Tool Capabilities Overview

### Code Quality & Review
- ESLint, Pylint, Rubocop linting
- Security scanning (Bandit, Semgrep, Snyk)
- Cyclomatic complexity analysis
- Code duplication detection
- Design system compliance

### Testing & Validation
- Multi-framework test execution (Jest, Pytest, Mocha, Vitest)
- Code coverage analysis
- Test quality assessment
- Unified `/testing` skill with TDD, E2E, BDD, contract, mutation, and visual regression subcommands

### API Development
- OpenAPI/Swagger validation
- HTTP endpoint testing with auth
- Security auditing
- Load testing
- Documentation generation
- Response schema validation

### UI/UX & Design
- WCAG accessibility audits
- Typography analysis
- Color contrast checking
- Spacing consistency
- Wireframe generation
- Nielsen's heuristics evaluation

### Database Operations
- SQL query execution
- Schema inspection
- Migration generation
- Data seeding
- Multi-database support

### DevOps & Infrastructure
- CI/CD pipeline configuration
- Docker and Kubernetes support
- Cloud architecture (AWS, Azure, GCP)
- Monitoring and observability

---

## Contributing

When adding new tools:

1. Place agents in `agents/domain-experts/` or `agents/mcp-integrated/`
2. Place skills in `skills/`, commands in `commands/`
3. Add template version to `templates/` if creating new pattern
4. Update this TOOLS-INDEX.md with new entries
5. Update relevant README.md files
6. Include installation instructions
7. Test installation process
8. Add `references` field to agent frontmatter (official docs, release notes, changelogs)

---

*Last updated: March 2026*
*Total documented components: 100+*

---

**Author**: Michel Abboud (https://github.com/michelabboud)
**AI Assistance**: Created with Claude Code (Anthropic)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
