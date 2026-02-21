# Claude Code Skills

Reusable skills that teach Claude specialized knowledge, workflows, and best practices.

## What Are Skills?

Skills are knowledge modules that enhance Claude's capabilities in specific domains. They provide context, patterns, and expertise that Claude applies when relevant. Since Claude Code v2.1.3, skills and commands are **unified** — both use `/name` invocation syntax and support the same frontmatter options.

**Key characteristics:**
- Activated based on context and user requests
- Provide comprehensive knowledge in a domain
- Can include examples, patterns, and best practices
- Hot-reload when saved (no restart needed)
- Invoked via `/name` syntax (e.g., `/refactoring-strategy`, `/testing-standards`)
- Auto-discovered from nested `.claude/skills` directories (v2.1.6+)
- Visible in slash command menu by default (opt-out with `user-invocable: false`)

## Available Skills (22)

| Skill | Description | Category |
|-------|-------------|----------|
| **documentation** | JSDoc/TSDoc, inline comments, README updates | Documentation |
| **api-documentation** | OpenAPI 3.0 and REST documentation standards | Documentation |
| **testing-standards** | Generate comprehensive test suites | Testing |
| **tdd-workflow** | Red-Green-Refactor cycle and TDD patterns | Testing |
| **bdd-framework-examples** | Cucumber, Behave, SpecFlow examples | Testing |
| **contract-testing** | Pact and consumer-driven contracts | Testing |
| **mutation-testing** | Stryker, PITest, Mutmut patterns | Testing |
| **visual-regression-testing** | Percy, Chromatic, BackstopJS | Testing |
| **advanced-e2e-testing** | Complex workflows, auth, mocking | Testing |
| **code-review-workflow** | Comprehensive code review with security/quality analysis | Quality |
| **refactoring-strategy** | Interactive refactoring with safety checks and rollback | Development |
| **project-scaffolding** | Generate project structure and boilerplate code | Development |
| **api-design-patterns** | RESTful API design best practices | Development |
| **database-design-patterns** | Schema design and optimization | Development |
| **ci-best-practices** | CI/CD pipeline patterns | DevOps |
| **release-management** | Release workflows and versioning | DevOps |
| **caching-expert** | Static, Object, HTTP, CDN caching | Performance |
| **pm-dashboard** | Project Manager health dashboard management | Project Management |
| **model-mode** | Switch model mode (default/opus-only/sonnet-only/haiku-only/custom) | Configuration |
| **update-check** | Check for new releases (never auto-updates) | Maintenance |
| **greeting** | Survey all installed tools and generate health report | Tooling |
| **rag** | Index codebases, semantic search, configure backends (ChromaDB/Redis/Qdrant) | RAG / Search |

## Installation

### Install All Skills (Global)

```bash
mkdir -p ~/.claude/skills
cp -r *.md ~/.claude/skills/
cp -r api-documentation ~/.claude/skills/
cp -r testing-standards ~/.claude/skills/
cp -r documentation ~/.claude/skills/
cp -r project-scaffolding ~/.claude/skills/
cp -r pm-dashboard ~/.claude/skills/
cp -r model-mode ~/.claude/skills/
cp -r update-check ~/.claude/skills/
cp -r greeting ~/.claude/skills/
cp -r rag ~/.claude/skills/
```

### Install All Skills (Project-Specific)

```bash
mkdir -p .claude/skills
cp -r /path/to/skills/* .claude/skills/
```

### Install Single Skill

```bash
# Skills with subdirectories (SKILL.md format)
cp -r documentation ~/.claude/skills/

# Standalone skill files
cp tdd-workflow.md ~/.claude/skills/
```

### Quick Install via curl

```bash
mkdir -p ~/.claude/skills

# Install a specific skill
curl -sO ~/.claude/skills/tdd-workflow.md \
  https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/skills/tdd-workflow.md
```

## Skill Formats

### Format 1: Standalone Markdown

Single `.md` file with frontmatter:

```markdown
---
skill_name: My Skill
description: When to activate this skill
category: Development
---

# Skill Content

Knowledge, patterns, examples...
```

**Location**: `~/.claude/skills/my-skill.md`

### Format 2: Directory with SKILL.md

For skills with multiple resources:

```
skill-name/
├── SKILL.md          # Main skill content
├── templates/        # Optional templates
└── examples/         # Optional examples
```

**Location**: `~/.claude/skills/skill-name/SKILL.md`

## Usage

Skills activate automatically based on context:

```bash
# Claude detects testing context
> Help me write tests for this function

# tdd-workflow or testing-standards skill activates
# Claude applies TDD patterns and best practices
```

Or invoke explicitly:

```bash
/refactoring-strategy extract-method src/utils/parser.ts
/testing-standards src/services/user-service unit
/project-scaffolding nextjs-app my-app --typescript --tailwind
/code-review-workflow src/api/auth.ts
/documentation src/utils/helpers.ts
```

## Skill Reference

### Testing Skills

#### tdd-workflow
Red-Green-Refactor cycle, test-first development, TDD best practices.

**Covers**: Red-Green-Refactor cycle, TDD patterns, when to use TDD, common pitfalls, framework-specific examples

#### testing-standards
Generate comprehensive test suites (unit, integration, E2E, API, component).

**Covers**: AAA pattern, test generation, edge case identification, mock generation, multi-framework support (Jest, Vitest, pytest, RSpec, JUnit)

#### bdd-framework-examples
Behavior-Driven Development with Gherkin syntax.

**Covers**: Cucumber (JS/Ruby), Behave (Python), SpecFlow (.NET), feature files, step definitions

#### contract-testing
Consumer-driven contract testing patterns.

**Covers**: Pact framework, provider verification, consumer tests, contract versioning

#### mutation-testing
Measure test quality through mutation analysis.

**Covers**: Stryker (JS/TS), PITest (Java), Mutmut (Python), mutation score interpretation

#### visual-regression-testing
Catch visual bugs with screenshot comparison.

**Covers**: Percy, Chromatic for Storybook, BackstopJS, baseline management

#### advanced-e2e-testing
Complex E2E testing scenarios.

**Covers**: Authentication flows, multi-step workflows, API mocking, flaky test handling

---

### Development Skills

#### refactoring-strategy
Interactive refactoring with safety checks, testing, and rollback support.

**Covers**: Extract/rename/move/inline/simplify/modernize/optimize patterns, 7-step safety workflow, git checkpoints

#### project-scaffolding
Generate project structure and boilerplate for 16+ project types.

**Covers**: React, Next.js, Vue, Express, NestJS, FastAPI, Django, monorepo, auth/database/Docker/CI setup

#### api-design-patterns
RESTful API design best practices.

**Covers**: Resource naming, HTTP methods, status codes, pagination, versioning

#### database-design-patterns
Schema design and optimization.

**Covers**: Normalization, indexing strategies, query optimization, migration patterns

#### code-review-workflow
Comprehensive code review with security, quality, and performance analysis.

**Covers**: Review checklist, security review, performance review, feedback patterns

---

### Documentation Skills

#### documentation
Add comprehensive documentation to code (JSDoc/TSDoc, inline comments, READMEs).

**Covers**: JSDoc/TSDoc, Python docstrings, inline comments, README structure, API docs, language-specific conventions

#### api-documentation
OpenAPI 3.0 and REST documentation standards.

**Covers**: OpenAPI spec format, documentation checklist, response schemas

---

### DevOps Skills

#### ci-best-practices
CI/CD pipeline patterns.

**Covers**: Pipeline structure, caching strategies, parallelization, deployment gates

#### release-management
Release workflows and versioning.

**Covers**: Semantic versioning, changelog generation, release branches, hotfix processes

---

### Performance Skills

#### caching-expert
Comprehensive caching strategies.

**Covers**: Static file caching, object caching (Redis, Memcached), HTTP caching headers, CDN configuration

---

### Project Management Skills

#### pm-dashboard
Manage the Project Manager health dashboard.

**Covers**: 16 expert dimensions, scoring, task tracking, risk management, trend history

---

### Configuration Skills

#### model-mode
Switch the `MODEL_MODE` setting in `~/.claude/CLAUDE.md` without manual file editing.

**Covers**: `default` (auto-switch), `opus-only`, `sonnet-only`, `haiku-only`, `custom` modes; status display; PLAN_MODEL / CODE_MODEL / QUICK_MODEL custom settings

**Usage:**
```bash
/model-mode status        # Show current mode
/model-mode opus-only     # Always use Opus (MAX plan)
/model-mode default       # Restore auto-switching
/model-mode custom        # Use per-task model settings
```

---

### Tooling Skills

#### greeting
Survey all installed MCP servers, agents, and skills — generate a health report.

**Covers**: MCP server hello protocol, agent inventory, skill inventory, online/offline status

**Usage:**
```bash
/greeting          # Quick hello to all servers + list agents & skills
/greeting ID       # Verbose: full profiles from all servers + complete report
```

---

### RAG / Search Skills

#### rag
Unified interface for the RAG MCP server — init, index, search, and configure vector database backends.

**Covers**: First-time setup wizard, codebase indexing, semantic search, similar code search, context retrieval, collection management, backend configuration (ChromaDB/Redis/Qdrant), persistent storage, two-layer CLAUDE.md auto-discovery, multi-repo support

**Usage:**
```bash
/rag                      # Interactive menu (auto-redirects to init on first run)
/rag init                 # Setup wizard: choose backend, install, configure, teach Claude Code
/rag index                # Index current project
/rag search "auth flow"   # Semantic search
/rag config redis         # Switch to Redis backend
/rag collections          # List indexed collections
```

**Guide:** See [RAG MCP Guide](../guides/RAG-MCP-GUIDE.md) for comprehensive documentation.

## Creating Custom Skills

### Basic Template

```markdown
---
skill_name: My Custom Skill
description: Describe when this skill should activate
category: Development
priority: P1
allowed-tools: Read, Write, Edit
---

# My Custom Skill

## Overview
Brief introduction to what this skill teaches.

## Key Concepts
- Concept 1
- Concept 2

## Examples

### Example 1: Basic Usage
\`\`\`typescript
// Code example
\`\`\`

---

**Version**: 1.0.0
```

### Skill Frontmatter Options

| Field | Description | Version |
|-------|-------------|---------|
| `skill_name` | Skill display name | - |
| `description` | When to activate (used for matching) | - |
| `category` | Grouping category | - |
| `priority` | P0-P3 priority level | - |
| `allowed-tools` | Tools the skill can use (supports YAML lists) | v2.1.0 |
| `hooks` | Inline hook definitions (PreToolUse, PostToolUse, Stop) | v2.1.0 |
| `context` | `fork` for isolated execution in a forked sub-agent | v2.1.0 |
| `agent` | Specify agent type for execution | v2.1.0 |
| `model` | Specify model for skill execution | v1.0.57 |
| `user-invocable` | Show in slash command menu (default: true) | v2.1.0 |
| `argument-hint` | Hint text for expected arguments | v1.0.54 |
| `skills` | Auto-load additional skills for subagents | v2.0.43 |

### Advanced Frontmatter Example

```yaml
---
skill_name: Secure Deployment
description: Deploy with security checks
allowed-tools:
  - Read
  - Bash
  - Edit
context: fork
agent: devops-infrastructure-expert
model: sonnet
hooks:
  PreToolUse: |
    if [[ "$TOOL_NAME" == "Bash" ]]; then
      echo "Validating command..."
    fi
---
```

### Argument Syntax (v2.1.19+)

Skills can access arguments passed by the user:

```markdown
---
skill_name: Deploy
description: Deploy to environment
argument-hint: <environment>
allowed-tools: Bash
---

Deploy to the $ARGUMENTS environment.

# Bracket syntax for indexed access
First argument: $ARGUMENTS[0]

# Shorthand syntax (v2.1.19+)
First argument: $0
Second argument: $1
```

### Session ID Access (v2.1.9+)

Skills can access the current session ID using `${CLAUDE_SESSION_ID}` string substitution, enabling session-aware behavior like logging or state tracking.

### Best Practices

1. **Be comprehensive** - Skills should teach, not just list
2. **Include examples** - Real code examples help Claude apply knowledge
3. **Structure well** - Use clear headings and sections
4. **Update regularly** - Keep patterns current
5. **Focus on one domain** - Don't mix unrelated topics

## Related Resources

- [Agents Examples](../agents/) - Specialized agents
- [Hooks Examples](../hooks/) - Event automation
- [Complete Guide](../guides/complete-guide/) - Full Claude Code guide

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: Apache-2.0 - Free to use for personal and commercial projects.

---

**Version**: 3.0.0 (commands merged into skills, updated for Claude Code CLI v2.1.47)
