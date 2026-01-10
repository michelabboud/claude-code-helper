# Sub-Agent Examples

Autonomous specialist agents that Claude spawns for domain-specific development tasks.

## What Are Sub-Agents?

Sub-agents are specialized assistants that Claude Code spawns to handle specific domains. They have focused expertise and work autonomously on delegated tasks.

**Key characteristics:**
- Markdown files with YAML frontmatter
- Domain-specific knowledge and workflows
- Use built-in tools (Read, Write, Edit, Bash, etc.)
- No external dependencies required
- Can be triggered automatically or explicitly

## Available Sub-Agents

### Frontend Development

| Agent | Description |
|-------|-------------|
| **react-nextjs-expert** | React 18+, Next.js 14+, App Router, RSC |
| **vue-nuxt-expert** | Vue 3, Nuxt 3, Composition API |
| **css-tailwind-expert** | CSS, Tailwind, responsive design |

### Backend Development

| Agent | Description |
|-------|-------------|
| **nodejs-typescript-backend-expert** | Node.js, Express, NestJS, TypeScript |
| **python-backend-expert** | Python, FastAPI, Django, Flask |
| **api-expert** | REST API design and implementation |
| **database-expert** | SQL, PostgreSQL, MySQL, migrations |

### Mobile Development

| Agent | Description |
|-------|-------------|
| **android-dev** | Kotlin, Jetpack Compose, Android SDK |
| **ios-development-expert** | Swift, SwiftUI, iOS SDK |

### DevOps & Infrastructure

| Agent | Description |
|-------|-------------|
| **devops-infrastructure-expert** | Docker, Kubernetes, CI/CD |
| **security-expert** | Security auditing, vulnerability fixes |
| **performance-optimizer** | Performance tuning, profiling |
| **observability-expert** | Logging, monitoring, tracing |

### Data & AI

| Agent | Description |
|-------|-------------|
| **ml-ai-expert** | Machine learning, model training |
| **data-engineering-expert** | Data pipelines, ETL, warehousing |

### Other

| Agent | Description |
|-------|-------------|
| **git-expert** | Git workflows, merge conflicts |
| **documentation-expert** | Technical writing, API docs |
| **qa-testing-expert** | Testing strategies, automation |

## Installation

### Install All Sub-Agents

```bash
mkdir -p ~/.claude/agents
cp *.md ~/.claude/agents/
```

### Install Specific Agents

```bash
# Just the ones you need
cp database-expert.md ~/.claude/agents/
cp api-expert.md ~/.claude/agents/
cp react-nextjs-expert.md ~/.claude/agents/
```

### Install by Domain

```bash
# Frontend stack
cp react-nextjs-expert.md css-tailwind-expert.md ~/.claude/agents/

# Backend stack
cp nodejs-typescript-backend-expert.md database-expert.md api-expert.md ~/.claude/agents/

# DevOps stack
cp devops-infrastructure-expert.md security-expert.md ~/.claude/agents/
```

## Usage

### Automatic Activation

Claude detects context and spawns appropriate agents:

```bash
> Design a database schema for a blog

# Claude spawns database-expert
# [database-expert] I'll design an optimized schema...
```

### Explicit Invocation

```bash
> Use the security-expert to review this code for vulnerabilities

# Claude spawns security-expert
# [security-expert] I'll perform a security audit...
```

### Multi-Agent Coordination

```bash
> Build a REST API with authentication

# Claude orchestrates multiple agents:
# 1. api-expert designs endpoints
# 2. database-expert creates schema
# 3. security-expert reviews auth implementation
```

## Sub-Agent Structure

```markdown
---
name: agent-name
description: When to trigger this agent (used for matching)
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Agent Title

[agent-name] Brief description of expertise.

## Expertise Areas
- Area 1
- Area 2

## Workflows
How the agent approaches tasks...

## Best Practices
Domain-specific best practices...
```

### Frontmatter Fields

| Field | Description | Required |
|-------|-------------|----------|
| `name` | Unique identifier | Yes |
| `description` | Trigger conditions (detailed = better matching) | Yes |
| `tools` | Available tools | Yes |
| `model` | `sonnet` or `opus` | Yes |

### Description Best Practices

The `description` field determines when the agent activates. Be specific:

```yaml
# Good - detailed, includes examples
description: Database specialist for SQL, PostgreSQL, MySQL, SQLite,
  migrations, queries, optimization, schema design. Use for: database
  design, writing queries, migrations, performance tuning, indexing.
  Examples: "design database schema", "optimize this query"

# Less effective - too vague
description: Helps with databases
```

## Customization

### Modify Existing Agent

```bash
# Copy and customize
cp database-expert.md ~/.claude/agents/my-database-expert.md

# Edit to add company-specific patterns
```

### Create New Agent

```markdown
---
name: my-custom-expert
description: Specialist in [domain]. Use for: [use cases].
  Examples: "[example queries]"
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# My Custom Expert

[my-custom-expert] Expert in [domain] with deep knowledge of [specifics].

## Expertise
- Expertise 1
- Expertise 2

## Approach
1. Step 1
2. Step 2

## Best Practices
- Practice 1
- Practice 2
```

## Model Selection

### Use `sonnet` (default) for:
- Most development tasks
- Code generation
- Standard implementations
- Fast responses

### Use `opus` for:
- Complex architectural decisions
- Nuanced problem-solving
- Multi-step reasoning
- Critical security reviews

## Best Practices

### Agent Design
1. **Single focus** - One domain per agent
2. **Detailed description** - Include trigger examples
3. **Clear workflows** - Document approach
4. **Appropriate tools** - Only include needed tools

### Usage
1. **Let Claude choose** - Automatic activation works well
2. **Explicit when needed** - Specify agent for edge cases
3. **Trust delegation** - Let agents work autonomously
4. **Review results** - Verify agent output

## Troubleshooting

### Agent Not Triggering

1. Check description matches your query
2. Add more trigger examples to description
3. Use explicit invocation: "Use the X agent..."

### Wrong Agent Activated

1. Make descriptions more distinct
2. Be more specific in your request
3. Explicitly name the agent you want

### Agent Missing Tools

Add needed tools to frontmatter:
```yaml
tools: Read, Write, Edit, Bash, Grep, Glob, WebFetch
```

## Related Resources

- [MCP Agents](../mcp-agents/) - Tool-based agents
- [Additional Sub-Agents](../../sub-agents/) - P3 agents
- [Sub-Agents Guide](../../../guides/subagents-guide/) - Deep dive
- [Agents README](../README.md) - Agent types overview

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: MIT - Free to use for personal and commercial projects.

---

**Version**: 1.0.0
