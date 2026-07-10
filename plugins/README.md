# Claude Code Plugins

Complete packages that bundle multiple Claude Code components (skills, agents, commands, hooks) into cohesive workflows.

## What Are Plugins?

Plugins are curated bundles that combine related Claude Code components to provide comprehensive solutions for specific use cases. Instead of installing individual pieces, plugins give you an integrated experience.

**A plugin typically bundles some of:**
- Skills (knowledge and patterns)
- Agents (specialized assistants)
- Hooks (automation)
- MCP servers (tools)

> Note: these plugins are **documentation/reference bundles** — curated lists of
> real components to install together. This repository does not ship a
> `commands/` directory, so plugins reference agents, skills, hooks, and MCP
> servers (invoked via `/skill-name` or natural-language `Ask:` prompts), not
> standalone slash-commands.

## Available Plugins

| Plugin | Description | Components |
|--------|-------------|------------|
| **code-quality-suite** | Complete QA and testing toolkit | Agents, Skills, Hook |
| **modern-web-stack** | Modern web development tools | Agents, Skills, Hooks, MCP servers |
| **security-hardening** | Security-focused development | Agents, Hook, MCP server |
| **cicd-automation** | CI/CD pipeline automation | Agents, Skills, Hook, MCP server |
| **cloud-native** | Cloud infrastructure patterns | Agents, Skill, MCP server |
| **python-data-stack** | Python data science toolkit | Agents, Skill, MCP server |

## Installation

### Install a Plugin

Plugins are documentation/reference bundles. To use them:

1. **Read the plugin** to understand what components it bundles
2. **Install the referenced components** from their respective directories

```bash
# Example: Installing code-quality-suite plugin components (run from repo root)

# 1. Install the referenced skills (each is a directory with SKILL.md)
cp -r skills/testing ~/.claude/skills/
cp -r skills/refactoring-strategy ~/.claude/skills/

# 2. Install the referenced agents
cp agents/domain-experts/qa-testing-expert.md ~/.claude/agents/
cp agents/code-reviewer.md ~/.claude/agents/

# 3. Install the referenced hook
cp hooks/code-quality-gate.md ~/.claude/hooks/

# 4. (Optional) build + register the referenced MCP servers
#    cd mcp-servers/code-review-mcp && npm install && npm run build
```

### Quick Reference

Each plugin file lists its components. Use the plugin as a guide for what to install.

## Plugin Reference

### code-quality-suite

**Purpose**: Complete code quality and testing toolkit

**Components**:
- QA/Testing Expert Agent (`agents/domain-experts/qa-testing-expert.md`)
- Code Reviewer Agent (`agents/code-reviewer.md`)
- Testing Skill (`/testing` with tdd, e2e, bdd, contract, mutation, visual subcommands)
- Refactoring Strategy Skill (`/refactoring-strategy`)
- Code Quality Gate Hook (`hooks/code-quality-gate.md`)

**Use Cases**:
- Test-driven development
- Code review automation
- Refactoring with safety
- Quality gates in CI

**Example Usage**:
```bash
# Generate tests (real skill)
/testing src/services/user.ts

# Refactor safely (real skill)
/refactoring-strategy extract-method calculateTotal

# Review code
Ask: "Review the code quality of my changes"
```

---

### modern-web-stack

**Purpose**: Modern web development with React, Next.js, and TypeScript

**Components**:
- React/Next.js Expert Agent (`agents/domain-experts/react-nextjs-expert.md`)
- Node.js/TypeScript Backend Expert Agent (`agents/domain-experts/nodejs-typescript-backend-expert.md`)
- Database Expert Agent (`agents/domain-experts/database-expert.md`)
- Skills: API Design Patterns, Database Design Patterns, Project Scaffolding, Testing, Refactoring Strategy
- Hooks: Security Scan, Code Quality Gate, Build Validation
- MCP servers: Database Operations, CI/CD Pipeline

**Use Cases**:
- Full-stack web development
- React component development
- API design and implementation
- Database schema design

**Example Usage**:
```bash
# Build a component
Ask: "Create a dashboard component with Tailwind"

# Design an API
Ask: "Design a RESTful API for user management"
```

---

### security-hardening

**Purpose**: Security-focused development practices

**Components**:
- Security Expert Agent (`agents/domain-experts/security-expert.md`)
- Security Reviewer Agent (`agents/mcp-integrated/security-reviewer.json`)
- Security Scan Hook — PreToolUse (`hooks/security-scan.md`)
- Code Review MCP Server — security scanning tools (`mcp-servers/code-review-mcp`)

**Use Cases**:
- Secure code development
- Vulnerability prevention
- Security code review
- Secret detection

**Example Usage**:
```bash
# Security review
Ask: "Review this code for security vulnerabilities"

# Automatic scanning (via hook)
# Happens automatically before Write/Edit operations
```

---

### cicd-automation

**Purpose**: CI/CD pipeline automation and best practices

**Components**:
- DevOps Infrastructure Expert Agent (`agents/domain-experts/devops-infrastructure-expert.md`)
- CI/CD Engineer Agent (`agents/mcp-integrated/cicd-engineer.json`)
- CI Best Practices Skill, Release Management Skill
- Build Validation Hook (`hooks/build-validation.md`)
- CI/CD Pipeline MCP Server (`mcp-servers/cicd-pipeline`)

**Use Cases**:
- Pipeline setup
- Release automation
- Build validation
- Deployment workflows

**Example Usage**:
```bash
# Set up CI
Ask: "Create a GitHub Actions workflow for this project"

# Release management
Ask: "Prepare a release with changelog"
```

---

### cloud-native

**Purpose**: Cloud infrastructure and Kubernetes patterns

**Components**:
- AWS / Azure / GCP Architect Expert Agents (`agents/domain-experts/{aws,azure,gcp}-architect-expert.md`)
- DevOps/Infrastructure Expert Agent, Terraform/IaC Expert Agent
- CI Best Practices Skill (`skills/ci-best-practices`)
- CI/CD Pipeline MCP Server (`mcp-servers/cicd-pipeline`)

**Use Cases**:
- Cloud architecture
- Infrastructure as code
- CI/CD for cloud deployments
- Multi-cloud patterns

**Example Usage**:
```bash
# Cloud architecture
Ask: "Design a serverless architecture on AWS"

# Kubernetes
Ask: "Create Kubernetes manifests for this app"
```

---

### python-data-stack

**Purpose**: Python backend and data engineering toolkit

**Components**:
- Python Backend Expert Agent (`agents/domain-experts/python-backend-expert.md`)
- Data Engineering Expert Agent (`agents/domain-experts/data-engineering-expert.md`)
- Database Expert Agent (`agents/domain-experts/database-expert.md`)
- Database Design Patterns Skill (`skills/database-design-patterns`)
- Database Operations MCP Server (`mcp-servers/database-operations`)

**Use Cases**:
- FastAPI / async Python services
- Data pipelines and ETL
- Database schema design and migrations
- Data modeling and quality

**Example Usage**:
```bash
# Build an async API
Ask: "Build a FastAPI service with SQLAlchemy models and Alembic migrations"

# Design a data pipeline
Ask: "Design an ETL pipeline with data-quality validation"
```

## Creating Custom Plugins

### Plugin Structure

```markdown
---
plugin_name: My Plugin Name
description: What this plugin provides
priority: P1
version: 1.0.0
---

# My Plugin Name

Brief description.

## Components

List the bundled components:
- Component 1 (type)
- Component 2 (type)

## Features

- Feature 1
- Feature 2

## Usage

\`\`\`bash
# Example commands
\`\`\`

---

**Status**: Production Ready
```

### Best Practices

1. **Focused purpose** - Each plugin should solve a specific problem domain
2. **Complementary components** - Components should work well together
3. **Clear documentation** - List all components and how to use them
4. **Installation guide** - Provide steps to install all referenced components
5. **Usage examples** - Show real-world usage scenarios

## Plugins vs Individual Components

| Aspect | Plugins | Individual Components |
|--------|---------|----------------------|
| Scope | Bundled solution | Single purpose |
| Installation | Multiple steps | One step |
| Flexibility | Curated set | Mix and match |
| Use case | Complete workflow | Specific need |

## Related Resources

- [Skills Examples](../skills/) - Individual skills
- [Agents Examples](../agents/) - Individual agents
- [Hooks Examples](../hooks/) - Individual hooks
- [MCP Servers](../mcp-servers/) - Tool servers referenced by plugins

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: Apache-2.0 - Free to use for personal and commercial projects.

---

**Version**: 1.0.0
