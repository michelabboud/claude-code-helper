# Claude Code Plugins

Complete packages that bundle multiple Claude Code components (skills, agents, commands, hooks) into cohesive workflows.

## What Are Plugins?

Plugins are curated bundles that combine related Claude Code components to provide comprehensive solutions for specific use cases. Instead of installing individual pieces, plugins give you an integrated experience.

**A plugin typically includes:**
- Skills (knowledge and patterns)
- Agents (specialized assistants)
- Commands (quick actions)
- Hooks (automation)

## Available Plugins

| Plugin | Description | Components |
|--------|-------------|------------|
| **code-quality-suite** | Complete QA and testing toolkit | Agent, Skills, Hook |
| **modern-web-stack** | Modern web development tools | Agents, Skills, Commands |
| **security-hardening** | Security-focused development | Agent, Skills, Hooks |
| **cicd-automation** | CI/CD pipeline automation | Skills, Commands, Hooks |
| **cloud-native** | Cloud infrastructure patterns | Agents, Skills |
| **python-data-stack** | Python data science toolkit | Agent, Skills |

## Installation

### Install a Plugin

Plugins are documentation/reference bundles. To use them:

1. **Read the plugin** to understand what components it bundles
2. **Install the referenced components** from their respective directories

```bash
# Example: Installing code-quality-suite plugin components

# 1. Install the referenced skills
cp -r ../skills/testing ~/.claude/skills/
cp -r ../skills/refactoring-strategy ~/.claude/skills/

# 2. Install the referenced agent
cp ../agents/subagents/qa-testing-expert.md ~/.claude/agents/

# 3. Install the referenced hooks
cp ../hooks/code-quality-gate.md ~/.claude/hooks/

# 4. Install related commands
cp ../commands/test-generate.md ~/.claude/commands/
cp ../commands/refactor.md ~/.claude/commands/
```

### Quick Reference

Each plugin file lists its components. Use the plugin as a guide for what to install.

## Plugin Reference

### code-quality-suite

**Purpose**: Complete code quality and testing toolkit

**Components**:
- QA/Testing Expert Agent
- Refactoring Strategy Skill
- Testing Skill (`/testing` with tdd, e2e, bdd, contract, mutation, visual subcommands)
- Code Quality Gate Hook

**Use Cases**:
- Test-driven development
- Code review automation
- Refactoring with safety
- Quality gates in CI

**Example Usage**:
```bash
# Generate tests
/test-generate src/services/user.ts

# Refactor safely
/refactor extract-method calculateTotal

# Review code
Ask: "Review the code quality of my changes"
```

---

### modern-web-stack

**Purpose**: Modern web development with React, Next.js, and TypeScript

**Components**:
- React/Next.js Expert Agent
- CSS/Tailwind Expert Agent
- API Design Patterns Skill
- Database Design Patterns Skill

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
- Security Expert Agent
- Security Scan Hook (PreToolUse)
- Secure coding skills

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
- CI Best Practices Skill
- Release Management Skill
- Build Validation Hook

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
- DevOps/Infrastructure Expert Agent
- AWS/Azure/GCP Architect Agents
- Cloud deployment skills

**Use Cases**:
- Cloud architecture
- Kubernetes deployment
- Infrastructure as code
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

**Purpose**: Python data science and ML toolkit

**Components**:
- ML/AI Expert Agent
- Data Engineering Expert Agent
- Python best practices skills

**Use Cases**:
- Data analysis
- Machine learning
- Data pipelines
- Model development

**Example Usage**:
```bash
# Data analysis
Ask: "Analyze this dataset and create visualizations"

# ML model
Ask: "Train a classification model on this data"
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
- [Skills Examples](../skills/) - Skills and commands
- [Hooks Examples](../hooks/) - Individual hooks

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: MIT - Free to use for personal and commercial projects.

---

**Version**: 1.0.0
