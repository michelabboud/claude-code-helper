---
plugin_name: CI/CD Automation Plugin
description: Complete CI/CD pipeline setup and management
priority: P1
version: 1.0.1
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# CI/CD Automation Plugin

Comprehensive CI/CD solution with pipeline generation, optimization, and management.

## Components

- **DevOps Infrastructure Expert Agent** — `agents/domain-experts/devops-infrastructure-expert.md`
- **CI/CD Engineer Agent** (MCP-integrated) — `agents/mcp-integrated/cicd-engineer.json`
- **CI/CD Pipeline MCP Server** — `mcp-servers/cicd-pipeline`
- **CI Best Practices Skill** — `skills/ci-best-practices`
- **Release Management Skill** — `skills/release-management`
- **Build Validation Hook** — `hooks/build-validation.md`

## Installation

```bash
# Agents
cp agents/domain-experts/devops-infrastructure-expert.md ~/.claude/agents/
cp agents/mcp-integrated/cicd-engineer.json ~/.claude/agents/

# Skills
cp -r skills/ci-best-practices ~/.claude/skills/
cp -r skills/release-management ~/.claude/skills/

# Hook
cp hooks/build-validation.md ~/.claude/hooks/

# MCP server (build required)
cd mcp-servers/cicd-pipeline && npm install && npm run build
```

## Features

- ✅ Multi-platform pipeline generation
- ✅ Automated testing integration
- ✅ Deployment automation
- ✅ Release management
- ✅ Pipeline optimization

## Usage

```bash
# Generate a CI/CD pipeline (via CI/CD Engineer agent + cicd-pipeline MCP tools)
Ask: "Generate a GitHub Actions pipeline with tests and deploy for this project"

# Optimize an existing pipeline
Ask: "Optimize my GitHub Actions workflow"

# CI pipeline design, caching, and quality gates
/ci-best-practices

# Release planning: semantic versioning, deployment strategy, rollback
/release-management
```

## Changelog

### 1.0.1 (2026-07-10)
- Removed fictional `/generate-pipeline` and `/release` slash-commands (no `commands/` directory exists in this repo) — replaced with `Ask:` prompts and real skill invocations (`/ci-best-practices`, `/release-management`)
- Reconciled Components to real, verified files only: dropped QA/Testing Expert Agent (off-topic here), added CI/CD Engineer Agent and CI Best Practices Skill
- Added install paths (`cp` / `cp -r`) for every bundled component

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
