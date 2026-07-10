---
plugin_name: Code Quality Suite Plugin
description: Complete code quality and testing toolkit
priority: P1
version: 1.0.1
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Code Quality Suite Plugin

Comprehensive quality assurance with testing, refactoring, and code analysis.

## Components

- QA/Testing Expert Agent (`agents/domain-experts/qa-testing-expert.md`)
- Code Reviewer Agent (`agents/code-reviewer.md`)
- Testing Skill (`skills/testing/`)
- Refactoring Strategy Skill (`skills/refactoring-strategy/`)
- Code Quality Gate Hook (`hooks/code-quality-gate.md`)

## Installation

```bash
# Install the skills
cp -r skills/testing ~/.claude/skills/
cp -r skills/refactoring-strategy ~/.claude/skills/

# Install the agents
cp agents/domain-experts/qa-testing-expert.md ~/.claude/agents/
cp agents/code-reviewer.md ~/.claude/agents/

# Install the hook
cp hooks/code-quality-gate.md ~/.claude/hooks/
```

## Features

- ✅ Test strategy design and generation (unit, integration, E2E, TDD, BDD, contract, mutation, visual regression)
- ✅ Code quality gates
- ✅ Refactoring strategy guidance
- ✅ Code review automation

## Usage

```bash
# Design or generate tests (supports tdd, e2e, bdd, contract, mutation, visual subcommands)
/testing tdd src/services/user.ts

# Get a refactoring strategy
/refactoring-strategy extract-method calculateTotal

# Review code quality
Ask: "Review the code quality of my recent changes"
```

## Changelog

### 1.0.1 (2026-07-10)
- Removed fictional "Code Review Workflow" and "TDD Workflow" skills and the nonexistent `/test-generate` and `/refactor` slash-commands; reconciled Components and install steps to the real components (no `commands/` directory exists in this repo)

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
