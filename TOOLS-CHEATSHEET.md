# Tools Cheatsheet

**Quick reference for all claude-code-helper tools**

Version: v2.7.0
Last Updated: 2026-02-21
Total: 68 MCP tools • 52 agents • 22 skills • 7 commands

---

## 📚 Table of Contents

1. [MCP Tools (60)](#mcp-tools)
   - [API Specialist MCP (8)](#1-api-specialist-mcp-8-tools)
   - [Code Review MCP (4)](#2-code-review-mcp-4-tools)
   - [Design System MCP (5)](#3-design-system-mcp-5-tools)
   - [Testing MCP (4)](#4-testing-mcp-4-tools)
   - [UI/UX Review MCP (9)](#5-uiux-review-mcp-9-tools)
   - [CI/CD Pipeline MCP (8)](#6-cicd-pipeline-mcp-8-tools)
   - [Database Operations MCP (8)](#7-database-operations-mcp-8-tools)
   - [Dependency Management MCP (8)](#8-dependency-management-mcp-8-tools)
   - [n8n Automation MCP (6)](#9-n8n-automation-mcp-6-tools)
   - [RAG MCP (8)](#10-rag-mcp-8-tools)
2. [Agents (52)](#agents)
3. [Skills (22)](#skills)
4. [Commands (7)](#commands)
5. [Quick Start Examples](#quick-start-examples)

---

## MCP Tools

### 1. API Specialist MCP (8 tools)

#### `validate_openapi`
**Purpose:** Validate OpenAPI/Swagger specifications
**Usage:** Check API spec compliance, version validation, schema errors
**Example:** "Validate this OpenAPI spec: [paste spec]"

#### `test_endpoint`
**Purpose:** Test HTTP endpoints
**Usage:** GET/POST/PUT/DELETE requests, response time, status codes
**Example:** "Test GET https://api.example.com/users"

#### `check_api_security`
**Purpose:** Security audit for API endpoints
**Usage:** HTTP/HTTPS check, auth headers, injection risks
**Example:** "Check security for POST /api/login"

#### `analyze_api_structure`
**Purpose:** Analyze REST API design
**Usage:** Verb usage, naming conventions, RESTful compliance
**Example:** "Analyze: GET /createUser, POST /getUser"

#### `load_test`
**Purpose:** Performance load testing
**Usage:** Concurrent requests, response times, success rates
**Example:** "Load test with 50 concurrent requests: [URL]"

#### `generate_api_docs`
**Purpose:** Auto-generate API documentation
**Usage:** Markdown/HTML docs from endpoints
**Example:** "Generate docs for: GET /users, POST /users"

#### `suggest_improvements`
**Purpose:** API design recommendations
**Usage:** Best practices, optimizations, alternatives
**Example:** "Review this API design: [endpoints]"

#### `validate_api_response`
**Purpose:** Validate response against schema
**Usage:** Type checking, field validation, schema compliance
**Example:** "Validate response: { id: 1, name: 'John' }"

---

### 2. Code Review MCP (4 tools)

#### `lint_file`
**Purpose:** Run linting on code files
**Usage:** ESLint, syntax errors, style violations
**Example:** "Lint /path/to/file.js"

#### `security_scan`
**Purpose:** Security vulnerability scanning
**Usage:** Hardcoded secrets, SQL injection, XSS
**Example:** "Scan for security issues in app.js"

#### `analyze_complexity`
**Purpose:** Calculate cyclomatic complexity
**Usage:** Identify complex functions, refactoring targets
**Example:** "Check complexity in /src/utils.js"

#### `find_duplicates`
**Purpose:** Detect code duplication
**Usage:** Find repeated code blocks, suggest DRY improvements
**Example:** "Find duplicates in /src directory"

---

### 3. Design System MCP (5 tools)

#### `validate_tokens`
**Purpose:** Validate design token consistency
**Usage:** Check naming, values, format compliance
**Example:** "Validate: { colors: { primary: '#007bff' } }"

#### `check_component`
**Purpose:** Check component design system compliance
**Usage:** Validate props, tokens usage, variants
**Example:** "Check: <Button color='#fff' size='large'>"

#### `validate_color_palette`
**Purpose:** Check color accessibility (WCAG)
**Usage:** Contrast ratios, AA/AAA compliance
**Example:** "Check contrast: #fff on #ccc"

#### `analyze_spacing`
**Purpose:** Analyze spacing consistency
**Usage:** Validate spacing scale, find off-scale values
**Example:** "Check spacing: padding: 13px, margin: 15px"

#### `generate_report`
**Purpose:** Generate design system compliance report
**Usage:** Summary of all design checks
**Example:** "Generate design system report"

---

### 4. Testing MCP (4 tools)

#### `run_tests`
**Purpose:** Execute test suites
**Usage:** Jest, Mocha, Vitest test execution
**Example:** "Run tests in /tests directory"

#### `get_coverage`
**Purpose:** Generate code coverage reports
**Usage:** Line/branch coverage, threshold checks
**Example:** "Get coverage for src/app.js (min 80%)"

#### `analyze_test_quality`
**Purpose:** Evaluate test quality metrics
**Usage:** Assertion counts, mock usage, descriptions
**Example:** "Analyze test quality in test.spec.js"

#### `generate_test_report`
**Purpose:** Create comprehensive test reports
**Usage:** HTML/JSON reports with all metrics
**Example:** "Generate test report for last run"

---

### 5. UI/UX Review MCP (9 tools)

#### `analyze_design`
**Purpose:** Comprehensive design analysis
**Usage:** Visual hierarchy, layout, color, typography
**Example:** "Analyze design: [screenshot or URL]"

#### `check_accessibility`
**Purpose:** WCAG accessibility audit
**Usage:** Alt text, contrast, ARIA labels, keyboard nav
**Example:** "Check accessibility: [HTML snippet]"

#### `review_typography`
**Purpose:** Typography scale and hierarchy review
**Usage:** Font sizes, line heights, readability
**Example:** "Review: h1 { font-size: 18px }"

#### `validate_spacing`
**Purpose:** UI spacing consistency check
**Usage:** Padding, margins, grid alignment
**Example:** "Validate spacing in: [CSS]"

#### `check_color_scheme`
**Purpose:** Color palette analysis
**Usage:** Harmony, contrast, accessibility, branding
**Example:** "Check colors: primary=#007bff, text=#333"

#### `suggest_improvements`
**Purpose:** UX improvement recommendations
**Usage:** Prioritized design suggestions
**Example:** "Suggest improvements for: [design]"

#### `generate_wireframe`
**Purpose:** Generate HTML wireframes
**Usage:** Responsive, accessible mockups
**Example:** "Create login page wireframe"

#### `compare_designs`
**Purpose:** Compare design alternatives
**Usage:** A/B comparison, pros/cons analysis
**Example:** "Compare: Design A vs Design B"

#### `check_usability`
**Purpose:** Nielsen's heuristics evaluation
**Usage:** 10 usability heuristics assessment
**Example:** "Check usability: [navigation HTML]"

---

### 6. CI/CD Pipeline MCP (8 tools) 🧪

#### `generate_workflow`
**Purpose:** Generate CI/CD workflow files
**Usage:** GitHub Actions, GitLab CI, CircleCI
**Example:** "Create GitHub Actions for Node.js app"

#### `optimize_pipeline`
**Purpose:** Optimize pipeline performance
**Usage:** Caching, parallelization, dependency optimization
**Example:** "Optimize this workflow: [YAML]"

#### `validate_config`
**Purpose:** Validate CI/CD configuration
**Usage:** Syntax check, best practices validation
**Example:** "Validate .github/workflows/ci.yml"

#### `suggest_improvements`
**Purpose:** CI/CD best practice recommendations
**Usage:** Security, speed, reliability improvements
**Example:** "Review pipeline: [config]"

#### `analyze_build_time`
**Purpose:** Analyze pipeline execution times
**Usage:** Identify bottlenecks, optimization targets
**Example:** "Analyze build times: [workflow history]"

#### `generate_matrix`
**Purpose:** Generate test matrix strategies
**Usage:** Multi-version, multi-platform testing
**Example:** "Create matrix for Node 18, 20, 22"

#### `setup_secrets`
**Purpose:** Guide secret management setup
**Usage:** Environment variables, secure storage
**Example:** "Setup secrets for AWS deployment"

#### `create_deployment`
**Purpose:** Generate deployment configurations
**Usage:** Staging, production, rollback strategies
**Example:** "Create deployment to Vercel"

---

### 7. Database Operations MCP (8 tools) 🧪

#### `generate_migration`
**Purpose:** Create database migrations
**Usage:** Schema changes, up/down migrations
**Example:** "Create migration: add users table"

#### `analyze_query`
**Purpose:** SQL query performance analysis
**Usage:** Explain plans, optimization suggestions
**Example:** "Analyze: SELECT * FROM users WHERE..."

#### `suggest_indexes`
**Purpose:** Index recommendations
**Usage:** Performance optimization, query patterns
**Example:** "Suggest indexes for users table"

#### `validate_schema`
**Purpose:** Database schema validation
**Usage:** Normalization, relationships, constraints
**Example:** "Validate schema: [DDL]"

#### `generate_orm_models`
**Purpose:** Generate ORM model definitions
**Usage:** Sequelize, Prisma, TypeORM models
**Example:** "Generate Prisma model for users"

#### `optimize_schema`
**Purpose:** Schema optimization recommendations
**Usage:** Denormalization, partitioning, archival
**Example:** "Optimize schema for high-traffic tables"

#### `create_backup_strategy`
**Purpose:** Backup strategy planning
**Usage:** Schedules, retention, disaster recovery
**Example:** "Design backup strategy for PostgreSQL"

#### `analyze_growth`
**Purpose:** Database growth projection
**Usage:** Capacity planning, scaling decisions
**Example:** "Analyze growth for 1M users"

---

### 8. Dependency Management MCP (8 tools) 🧪

#### `scan_vulnerabilities`
**Purpose:** CVE and security scanning
**Usage:** npm audit, vulnerable packages
**Example:** "Scan package.json for vulnerabilities"

#### `suggest_updates`
**Purpose:** Dependency update recommendations
**Usage:** Major/minor/patch updates, breaking changes
**Example:** "Check for updates: package.json"

#### `analyze_licenses`
**Purpose:** License compliance checking
**Usage:** Identify license conflicts, compliance risks
**Example:** "Check licenses in dependencies"

#### `find_alternatives`
**Purpose:** Suggest alternative packages
**Usage:** Lighter, more secure, better maintained alternatives
**Example:** "Find alternative for moment.js"

#### `check_deprecations`
**Purpose:** Identify deprecated dependencies
**Usage:** EOL packages, maintenance status
**Example:** "Check for deprecated packages"

#### `analyze_bundle_size`
**Purpose:** Bundle size impact analysis
**Usage:** Identify heavy dependencies, tree-shaking
**Example:** "Analyze bundle impact of lodash"

#### `generate_upgrade_plan`
**Purpose:** Create dependency upgrade strategy
**Usage:** Prioritize updates, risk assessment
**Example:** "Plan upgrade from React 17 to 18"

#### `audit_security`
**Purpose:** Comprehensive security audit
**Usage:** Known CVEs, supply chain risks
**Example:** "Full security audit: package-lock.json"

---

### 9. n8n Automation MCP (6 tools) 🧪

#### `generate_workflow`
**Purpose:** Create n8n workflows
**Usage:** Automation templates, integrations
**Example:** "Create workflow: webhook → Slack"

#### `validate_workflow`
**Purpose:** Validate n8n workflow JSON
**Usage:** Syntax, connections, node configuration
**Example:** "Validate workflow: [JSON]"

#### `suggest_optimizations`
**Purpose:** Workflow optimization recommendations
**Usage:** Performance, error handling, best practices
**Example:** "Optimize this workflow: [JSON]"

#### `create_integration`
**Purpose:** Generate integration nodes
**Usage:** API connectors, authentication setup
**Example:** "Create Airtable integration"

#### `debug_workflow`
**Purpose:** Troubleshoot workflow issues
**Usage:** Execution analysis, error identification
**Example:** "Debug failed workflow: [logs]"

#### `generate_documentation`
**Purpose:** Document n8n workflows
**Usage:** Markdown docs, usage instructions
**Example:** "Document this workflow: [name]"

---

### 10. RAG MCP (8 tools)

#### `index_codebase`
**Purpose:** Index entire codebase for semantic search
**Usage:** Recursive file processing, vector embeddings, collection management
**Example:** "Index /path/to/project for semantic search"

#### `index_file`
**Purpose:** Index a single file
**Usage:** Add individual files to a vector collection
**Example:** "Index src/auth.ts into the codebase collection"

#### `semantic_search`
**Purpose:** Natural language code search
**Usage:** Search indexed code with plain English queries
**Example:** "Search for how authentication works"

#### `find_similar_code`
**Purpose:** Find similar code snippets
**Usage:** Vector similarity matching against indexed codebase
**Example:** "Find code similar to this login function"

#### `get_relevant_context`
**Purpose:** Get task-relevant code context
**Usage:** Retrieve code context within a token budget for a task
**Example:** "Get context for implementing user logout"

#### `list_collections`
**Purpose:** List all vector collections
**Usage:** See all indexed codebases
**Example:** "Show all RAG collections"

#### `get_collection_stats`
**Purpose:** Collection statistics
**Usage:** Chunk counts, document counts
**Example:** "Stats for the codebase collection"

#### `delete_collection`
**Purpose:** Delete a vector collection
**Usage:** Remove indexed data
**Example:** "Delete the old-project collection"

---

## Agents

### MCP Agents (14 configs)

#### Production Agents (8)

| Agent | Purpose | MCP Server | Use Case |
|-------|---------|------------|----------|
| `security-reviewer` | Security scanning | code-review | "Scan for vulnerabilities" |
| `test-quality-enforcer` | Test validation | testing | "Review test coverage" |
| `api-specialist` | API testing | api-specialist | "Test API endpoints" |
| `design-system-guardian` | Design compliance | design-system | "Check component tokens" |
| `performance-optimizer` | Performance analysis | code-review, testing | "Optimize slow functions" |
| `full-stack-reviewer` | Comprehensive review | All servers | "Full code review" |
| `uiux-reviewer` | UX analysis | uiux-review | "Review user flow" |
| `uiux-design-critic` | Design critique | uiux-review | "Critique landing page" |

#### Experimental Agents (4)

| Agent | Purpose | MCP Server | Use Case |
|-------|---------|------------|----------|
| `cicd-engineer` | CI/CD pipelines | cicd-pipeline | "Generate GitHub Actions" |
| `database-engineer` | Database operations | database-operations | "Create migration" |
| `dependency-manager` | Security & updates | dependency-management | "Scan vulnerabilities" |
| `automation-architect` | n8n workflows | n8n-automation | "Design automation" |

#### Planning & Implementation (2)

| Agent | Purpose | Tools | Use Case |
|-------|---------|-------|----------|
| `planner` | Feature planning | All tools | "Plan authentication system" |
| `implementer` | Code implementation | All tools | "Implement planned feature" |

---

### Sub-Agents (34 configs)

#### Frontend Specialists

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `angular-expert` | Angular | Components, RxJS, TypeScript |
| `react-nextjs-expert` | React/Next.js | SSR, routing, hooks |
| `react-native-mobile` | React Native | Mobile apps, native modules |
| `react-typescript-expert` | React/TS | Type-safe components |
| `react-vite-expert` | React/Vite | Fast builds, HMR |
| `svelte-expert` | Svelte | Reactive UI, SvelteKit |
| `tailwind-expert` | Tailwind CSS | Utility-first styling |
| `vue3-expert` | Vue 3 | Composition API, Pinia |

#### Backend Specialists

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `django-expert` | Django | MVT, ORM, REST framework |
| `dotnet-expert` | .NET | C#, ASP.NET, Entity Framework |
| `go-backend-expert` | Go | Gin, gRPC, concurrency |
| `java-spring-expert` | Java/Spring | Boot, JPA, microservices |
| `nestjs-expert` | NestJS | DI, TypeScript, microservices |
| `nodejs-typescript-backend-expert` | Node/TS | Express, fastify, TypeScript |
| `php-expert` | PHP | Laravel, Symfony, modern PHP |
| `python-backend-expert` | Python | FastAPI, async, type hints |
| `rails-expert` | Ruby on Rails | ActiveRecord, conventions |
| `rust-backend-expert` | Rust | Actix, async, performance |

#### Mobile Specialists

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `android-dev` | Android | Kotlin, Jetpack Compose |
| `flutter-expert` | Flutter | Dart, cross-platform UI |
| `ios-dev` | iOS | Swift, SwiftUI, UIKit |

#### Full-Stack Specialists

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `cloudflare-pages` | Cloudflare | Pages, Workers, KV |
| `mean-stack-expert` | MEAN | MongoDB, Express, Angular, Node |
| `mern-stack-expert` | MERN | MongoDB, Express, React, Node |
| `t3-stack-expert` | T3 | Next.js, tRPC, Prisma, Tailwind |

#### DevOps & Infrastructure

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `aws-architect` | AWS | Lambda, S3, CloudFormation |
| `azure-devops-expert` | Azure | DevOps, Pipelines, ARM |
| `docker-kubernetes-expert` | Containers | Docker, K8s, Helm |
| `terraform-expert` | Terraform | IaC, modules, providers |

#### Data & AI

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `data-scientist` | Data Science | Pandas, NumPy, visualization |
| `machine-learning-expert` | ML | Scikit-learn, PyTorch, TF |

#### Testing

| Agent | Technology | Expertise |
|-------|-----------|-----------|
| `qa-automation-expert` | Testing | Selenium, Cypress, Playwright |

---

## Skills

### Code Quality (4)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `code-review-workflow` | Systematic code review | "Review this function" |
| `refactoring-strategy` | Safe refactoring | "Refactor this code" |
| `tdd-workflow` | Test-driven development | "Guide me through TDD" |
| `testing-standards` | Testing best practices | "Review test standards" |

### API Development (2)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `api-design-patterns` | REST/GraphQL design | "Design API for blog" |
| `api-documentation` | API docs generation | "Document these endpoints" |

### Testing Specializations (6)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `advanced-e2e-testing` | E2E test strategies | "Design E2E suite" |
| `bdd-framework-examples` | BDD/Gherkin | "Write BDD scenarios" |
| `contract-testing` | API contract tests | "Implement contract tests" |
| `mutation-testing` | Mutation testing | "Explain mutation testing" |
| `visual-regression-testing` | Visual diffs | "Setup visual regression" |

### Infrastructure (4)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `caching-expert` | Caching strategies | "Design cache strategy" |
| `ci-best-practices` | CI/CD optimization | "Review CI pipeline" |
| `database-design-patterns` | Schema design | "Design user schema" |
| `release-management` | Release planning | "Plan v2.0 release" |

### RAG / Search (1)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `rag` | RAG MCP interface | `/rag index`, `/rag search`, `/rag config redis` |

### Tooling (3)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `greeting` | Health survey of all tools | `/greeting` or `/greeting ID` |
| `update-check` | Check for updates | `/update-check` |
| `model-mode` | Switch model mode | `/model-mode opus-only` |

### Project Management (1)

| Skill | Purpose | Usage |
|-------|---------|-------|
| `pm-dashboard` | Project health dashboard | `/pm-dashboard update` |

---

## Commands

### Development Workflow

| Command | Purpose | Example Usage |
|---------|---------|---------------|
| `/plan` | Feature planning with Opus | `/plan User authentication system` |
| `/review` | Code review | `/review [paste code]` |
| `/test-generate` | Generate test suite | `/test-generate [function]` |
| `/scaffold` | Project scaffolding | `/scaffold React component library` |
| `/document` | Generate documentation | `/document [code]` |
| `/refactor` | Interactive refactoring | `/refactor [code]` |

### Observability

| Command | Purpose | Example Usage |
|---------|---------|---------------|
| `/observability` | Toggle model transparency | `/observability status` |

---

## Quick Start Examples

### 🚀 Common Workflows

#### Security Audit
```
@security-reviewer scan this codebase for vulnerabilities
- Uses: code-review MCP (security_scan)
- Output: CVE findings, severity ratings, fixes
```

#### API Testing
```
@api-specialist test POST https://api.example.com/users
- Uses: api-specialist MCP (test_endpoint, check_api_security)
- Output: Response time, status, security analysis
```

#### Test Quality Check
```
@test-quality-enforcer review test coverage for src/
- Uses: testing MCP (run_tests, get_coverage, analyze_test_quality)
- Output: Coverage %, quality metrics, recommendations
```

#### Design System Validation
```
@design-system-guardian check component compliance
- Uses: design-system MCP (validate_tokens, check_component)
- Output: Violations, token suggestions, fixes
```

#### Full Stack Review
```
@full-stack-reviewer comprehensive review of feature/login
- Uses: All MCP servers
- Output: Security, tests, design, performance analysis
```

---

### 🎯 Tool Combinations

#### API Development Pipeline
```
1. @api-specialist test endpoints
2. @security-reviewer scan for vulnerabilities
3. /document generate API docs
4. @test-quality-enforcer verify tests
```

#### Feature Development
```
1. /plan feature with requirements
2. @implementer build feature
3. /review code quality
4. /test-generate create test suite
5. @security-reviewer final scan
```

#### Database Migration
```
1. @database-engineer generate migration
2. @database-engineer analyze performance
3. /review migration code
4. @test-quality-enforcer verify tests
```

---

### 💡 Pro Tips

**Agent Invocation:**
```bash
# Direct mention
@agent-name [task description]

# Via command
/plan [feature description]  # Uses planner agent

# Multiple agents
@planner design feature
@implementer build it
@security-reviewer scan it
```

**Tool Discovery:**
```bash
# Ask Claude
"What MCP tools do you have?"
"Show me API testing tools"
"List security scanning capabilities"
```

**Skill Usage:**
```bash
# Explicit invocation
"Use the tdd-workflow skill to guide me"

# Implicit (Claude auto-selects)
"Help me refactor this code"  # May use refactoring-strategy skill
```

**Hot Reload:**
```bash
# Skills auto-reload (v2.1.3+)
# Edit ~/.claude/skills/my-skill/SKILL.md
# No restart needed - changes apply immediately
```

---

## 📊 Quick Stats

| Category | Count | Status |
|----------|-------|--------|
| **MCP Tools** | 68 | 38 production + 30 experimental |
| **Agents** | 52 | 14 MCP + 38 domain experts |
| **Skills** | 22 | All production-ready |
| **Commands** | 7 | All production-ready |
| **Total Components** | 149 | Ready to use |

**Resource Impact:**
- **Disk:** 759 MB (MCP servers + agents + skills)
- **RAM:** 655 MB (all MCP servers running)
- **Startup:** 10-14 sec (cold), 3-4 sec (hot)
- **Cost:** $0 to install, pay-per-use for API

---

## 🔗 Related Documentation

- **Installation:** [INSTALLATION.md](docs/reference/INSTALLATION.md)
- **Testing Guide:** [TESTING-GUIDE.md](TESTING-GUIDE.md)
- **Statistics:** [INSTALLATION-STATISTICS.md](docs/reports/INSTALLATION-STATISTICS.md)
- **Main README:** [README.md](README.md)
- **MCP Servers:** [mcp-servers/README.md](mcp-servers/README.md)

---

**Version:** claude-code-helper v2.7.0
**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude Opus 4.6
**License:** Apache-2.0
**Last Updated:** 2026-02-21
