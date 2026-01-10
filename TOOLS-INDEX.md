# Claude Code Helper - Complete Tools Index

> **The Ultimate Reference for All Tools, Components, and Features**

This comprehensive index catalogs every tool, agent, skill, command, hook, plugin, template, and guide in the claude-code-helper repository. Use this as your master reference when exploring the toolkit.

---

## Table of Contents

- [Quick Stats](#quick-stats)
- [MCP Servers (30+ Tools)](#mcp-servers-30-tools)
  - [API Specialist MCP](#api-specialist-mcp-8-tools)
  - [Code Review MCP](#code-review-mcp-4-tools)
  - [Testing MCP](#testing-mcp-4-tools)
  - [Design System MCP](#design-system-mcp-5-tools)
  - [UI/UX Review MCP](#uiux-review-mcp-9-tools)
  - [Database Operations MCP](#database-operations-mcp-5-tools)
- [Example Agents (27 Agents)](#example-agents-27-agents)
  - [MCP Agents](#mcp-agents-9-agents)
  - [Sub-Agents - Domain Specialists](#sub-agents---domain-specialists-18-agents)
- [Skills (15+ Workflow Skills)](#skills-15-workflow-skills)
  - [Core Workflow Skills](#core-workflow-skills)
  - [Advanced Testing Skills](#advanced-testing-skills)
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
- [MCP Server Example Agents](#mcp-server-example-agents)
- [MCP Concept Documentation](#mcp-concept-documentation)

---

## Quick Stats

| Category | Count | Description |
|----------|-------|-------------|
| **MCP Servers** | 6 | Production-ready TypeScript servers with 30+ tools |
| **MCP Tools** | 35+ | Individual automation tools across all servers |
| **Agents** | 44+ | MCP agents, sub-agents, and technology specialists |
| **Skills** | 15+ | Workflow and testing skills |
| **Commands** | 5 | Slash commands for common workflows |
| **Hooks** | 4 | Event-driven automation hooks |
| **Plugins** | 6 | Complete feature packages |
| **Templates** | 3 | Starter templates for custom tools |
| **Guides** | 3 | Comprehensive learning resources |
| **Scripts** | 10+ | Installation and setup utilities |
| **Integration Examples** | 2 | Full architecture blueprints |

---

## MCP Servers (30+ Tools)

MCP (Model Context Protocol) servers provide specialized tools that extend Claude Code's capabilities. Each server is a TypeScript/Node.js application.

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

**Location:** [`examples/agents/mcp-agents/`](examples/agents/mcp-agents/)

Pre-configured agents that leverage MCP server tools.

| Agent | File | Description |
|-------|------|-------------|
| API Specialist | [`api-specialist.json`](examples/agents/mcp-agents/api-specialist.json) | API testing, validation, and documentation using API Specialist MCP |
| Security Reviewer | [`security-reviewer.json`](examples/agents/mcp-agents/security-reviewer.json) | Security auditing with Code Review MCP |
| Test Quality Enforcer | [`test-quality-enforcer.json`](examples/agents/mcp-agents/test-quality-enforcer.json) | Test coverage and quality enforcement |
| Design System Guardian | [`design-system-guardian.json`](examples/agents/mcp-agents/design-system-guardian.json) | Design system compliance validation |
| Full Stack Reviewer | [`full-stack-reviewer.json`](examples/agents/mcp-agents/full-stack-reviewer.json) | Complete code review across all layers |
| Performance Optimizer | [`performance-optimizer.json`](examples/agents/mcp-agents/performance-optimizer.json) | Performance analysis and optimization |
| UI/UX Reviewer | [`uiux-reviewer.json`](examples/agents/mcp-agents/uiux-reviewer.json) | UI/UX design review |
| UI/UX Design Critic | [`uiux-design-critic.json`](examples/agents/mcp-agents/uiux-design-critic.json) | Specialized design critique |

---

### Sub-Agents - Domain Specialists (18 Agents)

**Location:** [`examples/agents/subagents/`](examples/agents/subagents/)

Specialized agents for specific technology domains.

| Agent | File | Domain |
|-------|------|--------|
| Android Developer | [`android-dev.md`](examples/agents/subagents/android-dev.md) | Android/Kotlin, Jetpack Compose, Material Design |
| API Expert | [`api-expert.md`](examples/agents/subagents/api-expert.md) | REST API design, OpenAPI, GraphQL |
| CSS/Tailwind Expert | [`css-tailwind-expert.md`](examples/agents/subagents/css-tailwind-expert.md) | Tailwind CSS, responsive design, CSS architecture |
| Database Expert | [`database-expert.md`](examples/agents/subagents/database-expert.md) | Schema design, query optimization, migrations |
| DevOps/Infrastructure | [`devops-infrastructure-expert.md`](examples/agents/subagents/devops-infrastructure-expert.md) | CI/CD, Docker, Kubernetes, cloud infrastructure |
| Documentation Expert | [`documentation-expert.md`](examples/agents/subagents/documentation-expert.md) | Technical writing, API docs, README standards |
| Git Expert | [`git-expert.md`](examples/agents/subagents/git-expert.md) | Git workflows, branching strategies, rebasing |
| iOS Developer | [`ios-development-expert.md`](examples/agents/subagents/ios-development-expert.md) | Swift, SwiftUI, iOS best practices |
| ML/AI Expert | [`ml-ai-expert.md`](examples/agents/subagents/ml-ai-expert.md) | Machine learning, AI integration, model deployment |
| Node.js/TypeScript | [`nodejs-typescript-backend-expert.md`](examples/agents/subagents/nodejs-typescript-backend-expert.md) | Node.js, TypeScript, Express, NestJS |
| Observability Expert | [`observability-expert.md`](examples/agents/subagents/observability-expert.md) | Monitoring, logging, tracing, alerting |
| Performance Optimizer | [`performance-optimizer.md`](examples/agents/subagents/performance-optimizer.md) | Performance tuning, profiling, optimization |
| Python Backend | [`python-backend-expert.md`](examples/agents/subagents/python-backend-expert.md) | Python, Django, FastAPI, Flask |
| QA/Testing Expert | [`qa-testing-expert.md`](examples/agents/subagents/qa-testing-expert.md) | Test strategies, automation, quality assurance |
| React/Next.js Expert | [`react-nextjs-expert.md`](examples/agents/subagents/react-nextjs-expert.md) | React, Next.js, frontend architecture |
| Security Expert | [`security-expert.md`](examples/agents/subagents/security-expert.md) | Security best practices, OWASP, penetration testing |
| Vue/Nuxt Expert | [`vue-nuxt-expert.md`](examples/agents/subagents/vue-nuxt-expert.md) | Vue.js, Nuxt, Vuex, Vue Router |
| Data Engineering | [`data-engineering-expert.md`](examples/agents/subagents/data-engineering-expert.md) | Data pipelines, ETL, data warehousing |

---

### Additional Agent Examples

**Location:** [`examples/agents/`](examples/agents/)

| Agent | File | Description |
|-------|------|-------------|
| Code Reviewer | [`code-reviewer.md`](examples/agents/code-reviewer.md) | General code review agent |
| Test Writer | [`test-writer.md`](examples/agents/test-writer.md) | Automated test generation |

---

## Skills (15+ Workflow Skills)

**Location:** [`examples/skills/`](examples/skills/)

### Core Workflow Skills

| Skill | File | Description |
|-------|------|-------------|
| API Design Patterns | [`api-design-patterns.md`](examples/skills/api-design-patterns.md) | REST API design best practices, versioning, error handling |
| API Documentation | [`api-documentation/SKILL.md`](examples/skills/api-documentation/SKILL.md) | Automated API documentation generation |
| Caching Expert | [`caching-expert.md`](examples/skills/caching-expert.md) | Caching strategies (Static, Object, HTTP, CDN) |
| CI Best Practices | [`ci-best-practices.md`](examples/skills/ci-best-practices.md) | CI/CD pipeline configuration and optimization |
| Code Review Workflow | [`code-review-workflow.md`](examples/skills/code-review-workflow.md) | Structured code review process |
| Database Design Patterns | [`database-design-patterns.md`](examples/skills/database-design-patterns.md) | Schema design, normalization, indexing strategies |
| Refactoring Strategy | [`refactoring-strategy.md`](examples/skills/refactoring-strategy.md) | Code refactoring techniques and patterns |
| Release Management | [`release-management.md`](examples/skills/release-management.md) | Release and deployment workflows |
| TDD Workflow | [`tdd-workflow.md`](examples/skills/tdd-workflow.md) | Test-driven development workflow |

### Advanced Testing Skills

| Skill | File | Description |
|-------|------|-------------|
| Advanced E2E Testing | [`advanced-e2e-testing.md`](examples/skills/advanced-e2e-testing.md) | Complex E2E scenarios, auth mocking, parallel execution |
| BDD Framework Examples | [`bdd-framework-examples.md`](examples/skills/bdd-framework-examples.md) | Cucumber, Behave, SpecFlow implementations |
| Contract Testing | [`contract-testing.md`](examples/skills/contract-testing.md) | Pact, consumer-driven contract testing |
| Mutation Testing | [`mutation-testing.md`](examples/skills/mutation-testing.md) | Stryker, PITest, Mutmut mutation testing |
| Testing Standards | [`testing-standards/SKILL.md`](examples/skills/testing-standards/SKILL.md) | Testing standards and guidelines |
| Visual Regression Testing | [`visual-regression-testing.md`](examples/skills/visual-regression-testing.md) | Percy, Chromatic, BackstopJS visual testing |

---

## Commands (5 Slash Commands)

**Location:** [`examples/commands/`](examples/commands/)

Slash commands for common development workflows.

| Command | File | Usage | Description |
|---------|------|-------|-------------|
| Document | [`document.md`](examples/commands/document.md) | `/document` | Generate comprehensive documentation |
| Refactor | [`refactor.md`](examples/commands/refactor.md) | `/refactor` | Code refactoring workflow |
| Review | [`review.md`](examples/commands/review.md) | `/review` | Code review with suggestions |
| Scaffold | [`scaffold.md`](examples/commands/scaffold.md) | `/scaffold` | Project scaffolding |
| Test Generate | [`test-generate.md`](examples/commands/test-generate.md) | `/test-generate` | Generate tests for code |

---

## Hooks (4 Automation Hooks)

**Location:** [`examples/hooks/`](examples/hooks/)

Event-driven automation triggers.

| Hook | File | Trigger | Description |
|------|------|---------|-------------|
| Build Validation | [`build-validation.md`](examples/hooks/build-validation.md) | Pre-execution | Validate build before code changes |
| Code Quality Gate | [`code-quality-gate.md`](examples/hooks/code-quality-gate.md) | Pre-commit | Enforce code quality standards |
| Security Scan | [`security-scan.md`](examples/hooks/security-scan.md) | Pre-push | Security vulnerability scanning |
| Lint on Save | [`lint-on-save.json`](examples/hooks/lint-on-save.json) | On save | Auto-linting on file save |

---

## Plugins (6 Complete Packages)

**Location:** [`examples/plugins/`](examples/plugins/)

Complete feature packages combining multiple tools and configurations.

| Plugin | File | Description |
|--------|------|-------------|
| CI/CD Automation | [`cicd-automation-plugin.md`](examples/plugins/cicd-automation-plugin.md) | Complete CI/CD pipeline automation suite |
| Cloud Native | [`cloud-native-plugin.md`](examples/plugins/cloud-native-plugin.md) | Cloud-native development with containers and k8s |
| Code Quality Suite | [`code-quality-suite-plugin.md`](examples/plugins/code-quality-suite-plugin.md) | Comprehensive code quality enforcement |
| Modern Web Stack | [`modern-web-stack-plugin.md`](examples/plugins/modern-web-stack-plugin.md) | Full-stack web development toolkit |
| Python Data Stack | [`python-data-stack-plugin.md`](examples/plugins/python-data-stack-plugin.md) | Python data science and ML toolkit |
| Security Hardening | [`security-hardening-plugin.md`](examples/plugins/security-hardening-plugin.md) | Security best practices and hardening |

---

## Additional Sub-Agents (17 Technology Specialists)

**Location:** [`examples/sub-agents/`](examples/sub-agents/)

Extended collection of technology-specific expert agents.

| Agent | File | Specialization |
|-------|------|----------------|
| Android Expert | [`android-expert.md`](examples/sub-agents/android-expert.md) | Mobile Android development |
| Angular Expert | [`angular-expert.md`](examples/sub-agents/angular-expert.md) | Angular framework |
| AWS Architect | [`aws-architect-expert.md`](examples/sub-agents/aws-architect-expert.md) | AWS cloud architecture |
| Azure Architect | [`azure-architect-expert.md`](examples/sub-agents/azure-architect-expert.md) | Azure cloud architecture |
| Game Design Expert | [`game-design-expert.md`](examples/sub-agents/game-design-expert.md) | Game development and design |
| GCP Architect | [`gcp-architect-expert.md`](examples/sub-agents/gcp-architect-expert.md) | Google Cloud Platform |
| Go Expert | [`go-expert.md`](examples/sub-agents/go-expert.md) | Go programming |
| Hugging Face Expert | [`huggingface-expert.md`](examples/sub-agents/huggingface-expert.md) | Hugging Face ML models |
| IoT/Embedded Expert | [`iot-embedded-expert.md`](examples/sub-agents/iot-embedded-expert.md) | IoT and embedded systems |
| Laravel Expert | [`laravel-expert.md`](examples/sub-agents/laravel-expert.md) | Laravel PHP framework |
| PHP Expert | [`php-expert.md`](examples/sub-agents/php-expert.md) | PHP programming |
| QA Testing Expert | [`qa-testing-expert.md`](examples/sub-agents/qa-testing-expert.md) | Quality assurance |
| Redis Expert | [`redis-expert.md`](examples/sub-agents/redis-expert.md) | Redis and caching |
| Ruby on Rails Expert | [`ruby-rails-expert.md`](examples/sub-agents/ruby-rails-expert.md) | Ruby on Rails |
| Rust Expert | [`rust-expert.md`](examples/sub-agents/rust-expert.md) | Rust programming |
| Vue/Nuxt Expert | [`vue-nuxt-expert.md`](examples/sub-agents/vue-nuxt-expert.md) | Vue.js/Nuxt framework |
| WordPress Expert | [`wordpress-expert.md`](examples/sub-agents/wordpress-expert.md) | WordPress development |

---

## Integration Examples

**Location:** [`examples/integrations/`](examples/integrations/)

Complete architecture blueprints for real-world applications.

| Integration | File | Description |
|-------------|------|-------------|
| E-Commerce Platform | [`ecommerce-platform.md`](examples/integrations/ecommerce-platform.md) | Complete e-commerce architecture with product catalog, cart, checkout, payments |
| SaaS Application | [`saas-application.md`](examples/integrations/saas-application.md) | Multi-tenant SaaS architecture with auth, billing, analytics |

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

**Location:** [`scripts/`](scripts/)

| Script | File | Description |
|--------|------|-------------|
| Install All | [`install-all.sh`](scripts/install-all.sh) | Main installation script for all components |
| Setup API Key | [`setup-api-key.sh`](scripts/setup-api-key.sh) | API key configuration helper |
| Test Setup | [`test-setup.sh`](scripts/test-setup.sh) | Verify installation success |

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

## MCP Server Example Agents

**Location:** [`mcp-servers/example-agents/`](mcp-servers/example-agents/)

Pre-configured agent examples that demonstrate MCP server usage.

| Agent | File | Description |
|-------|------|-------------|
| Security Reviewer | [`security-reviewer.json`](mcp-servers/example-agents/security-reviewer.json) | Security scanning with MCP tools |
| Test Quality Enforcer | [`test-quality-enforcer.json`](mcp-servers/example-agents/test-quality-enforcer.json) | Test coverage enforcement |
| Design System Guardian | [`design-system-guardian.json`](mcp-servers/example-agents/design-system-guardian.json) | Design system compliance |
| Performance Optimizer | [`performance-optimizer.json`](mcp-servers/example-agents/performance-optimizer.json) | Performance analysis |
| API Specialist | [`api-specialist.json`](mcp-servers/example-agents/api-specialist.json) | API testing and validation |

---

## MCP Concept Documentation

Additional MCP server concepts and documentation (not yet implemented as servers).

| Concept | Location | Description |
|---------|----------|-------------|
| CI/CD Pipeline | [`mcp-servers/ci-cd-pipeline/`](mcp-servers/ci-cd-pipeline/) | Pipeline generation and optimization concepts |
| CICD Pipeline (Expanded) | [`mcp-servers/cicd-pipeline/`](mcp-servers/cicd-pipeline/) | Detailed pipeline examples |
| Dependency Management | [`mcp-servers/dependency-management/`](mcp-servers/dependency-management/) | Dependency analysis concepts |
| N8n Automation | [`mcp-servers/n8n-automation/`](mcp-servers/n8n-automation/) | N8n workflow integration |

---

## MCP Configuration Examples

**Location:** [`examples/mcp/`](examples/mcp/)

| Config | File | Description |
|--------|------|-------------|
| GitHub Config | [`github-config.json`](examples/mcp/github-config.json) | GitHub MCP integration configuration |

---

## Root Documentation Files

| File | Description |
|------|-------------|
| [`README.md`](README.md) | Main repository overview and navigation |
| [`QUICKSTART.md`](QUICKSTART.md) | 5-minute quick start guide |
| [`CLAUDE.md`](CLAUDE.md) | Project-specific Claude Code instructions |
| [`CHANGELOG.md`](CHANGELOG.md) | Version history and updates |
| [`LICENSE`](LICENSE) | MIT license |
| [`TODO.md`](TODO.md) | Project roadmap and tasks |

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
./scripts/test-setup.sh

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
- Mutation testing support
- Contract testing with Pact
- Visual regression testing

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

1. Place examples in appropriate `examples/` subdirectory
2. Add template version to `templates/` if creating new pattern
3. Update this TOOLS-INDEX.md with new entries
4. Update relevant README.md files
5. Include installation instructions
6. Test installation process

---

*Last updated: January 2026*
*Total documented components: 100+*
