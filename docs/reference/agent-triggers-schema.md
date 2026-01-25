# Agent Triggers Schema Reference

This document defines the schema for agent triggers and visual indicators introduced in the Agent Triggers Feature (v1.0).

## Overview

Agents can now include `triggers` and `visual` sections in their YAML frontmatter to enable:
- **Deterministic triggering** based on keywords, file patterns, and events
- **Visual indicators** showing which agent is active

## Frontmatter Schema

### Complete Example

```yaml
---
name: api-expert
description: REST API specialist for design and documentation
tools: Read, Write, Edit, Bash, Grep, Glob, WebSearch
model: sonnet

# Visual Indicators
visual:
  emoji: "🔌"
  color: "#4CAF50"
  label: "API Expert"
  spinner: "Designing API..."

# Triggers
triggers:
  keywords:
    - "REST API"
    - "endpoint"
    - pattern: "(design|create).*api"
      case_insensitive: true

  files:
    - pattern: "src/api/**/*.ts"
      on: [edit, write]

  priority: 10
  tags: [backend, api, rest]
---
```

## Visual Section

Controls how the agent appears in the UI when active.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emoji` | string | No | Single emoji displayed in status line (e.g., "🔌") |
| `color` | string | No | Hex color code for UI elements (e.g., "#4CAF50") |
| `label` | string | No | Human-readable name shown in UI (e.g., "API Expert") |
| `spinner` | string | No | Text shown while agent is working (e.g., "Designing API...") |

### Visual Examples

```yaml
# Minimal
visual:
  emoji: "🔌"

# Full
visual:
  emoji: "🔌"
  color: "#4CAF50"
  label: "API Expert"
  spinner: "Designing API..."
```

### Environment Variables

When an agent is active, these environment variables are set:

| Variable | Value | Example |
|----------|-------|---------|
| `CLAUDE_ACTIVE_AGENT` | Agent name | `api-expert` |
| `CLAUDE_ACTIVE_AGENT_EMOJI` | Agent emoji | `🔌` |
| `CLAUDE_ACTIVE_AGENT_LABEL` | Agent label | `API Expert` |

Status line scripts can use these to display the active agent.

## Triggers Section

Defines conditions under which the agent should be automatically invoked.

### Keywords

Match patterns in the user's prompt.

```yaml
triggers:
  keywords:
    # Simple string match (case-insensitive by default)
    - "REST API"
    - "endpoint"
    - "swagger"

    # Regex pattern
    - pattern: "(design|create|build).*api"
      case_insensitive: true

    # Exact match (case-sensitive)
    - pattern: "OpenAPI"
      case_insensitive: false
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| (string) | string | - | Simple keyword to match |
| `pattern` | string | Yes* | Regex pattern to match |
| `case_insensitive` | boolean | No | Whether match is case-insensitive (default: true) |

*Required when using object format

### Files

Trigger when specific files are accessed.

```yaml
triggers:
  files:
    # Match any TypeScript file in src/api/
    - pattern: "src/api/**/*.ts"
      on: [edit, write]

    # Match route files
    - pattern: "**/routes/**/*.{ts,js}"
      on: [edit]

    # Match OpenAPI spec files
    - pattern: "openapi.{yaml,yml,json}"
      on: [read, edit, write]
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pattern` | string | Yes | Glob pattern for file matching |
| `on` | array | Yes | Events that trigger: `read`, `edit`, `write` |

### Priority

When multiple agents match, priority determines which is selected.

```yaml
triggers:
  priority: 10  # Higher = preferred
```

| Value | Meaning |
|-------|---------|
| 1-5 | Low priority (fallback agents) |
| 6-10 | Normal priority (default) |
| 11-15 | High priority (specialized experts) |
| 16-20 | Critical priority (always prefer) |

Default priority is 5 if not specified.

### Tags

Categorize agents for filtering and organization.

```yaml
triggers:
  tags: [backend, api, rest, web-services]
```

Common tags:
- **Domain**: `frontend`, `backend`, `fullstack`, `mobile`, `devops`
- **Language**: `javascript`, `typescript`, `python`, `go`, `rust`
- **Framework**: `react`, `vue`, `angular`, `express`, `django`
- **Specialty**: `api`, `database`, `security`, `testing`, `performance`

## Complete Schema (TypeScript)

```typescript
interface AgentFrontmatter {
  // Required fields
  name: string;
  description: string;
  tools: string;  // Comma-separated list
  model: 'opus' | 'sonnet' | 'haiku';

  // Visual indicators (optional)
  visual?: {
    emoji?: string;
    color?: string;
    label?: string;
    spinner?: string;
  };

  // Triggers (optional)
  triggers?: {
    keywords?: (string | KeywordPattern)[];
    files?: FilePattern[];
    priority?: number;
    tags?: string[];
  };
}

interface KeywordPattern {
  pattern: string;
  case_insensitive?: boolean;
}

interface FilePattern {
  pattern: string;
  on: ('read' | 'edit' | 'write')[];
}
```

## Trigger Matching Algorithm

1. **Collect candidates**: Find all agents with matching triggers
2. **Apply priority**: Sort by priority (highest first)
3. **Break ties**: Use specificity (more specific patterns win)
4. **Select winner**: First agent after sorting

### Specificity Rules

| Pattern Type | Specificity Score |
|--------------|-------------------|
| Exact keyword match | 10 |
| Regex with anchors (^...$) | 8 |
| Regex without anchors | 5 |
| File pattern with extension | 7 |
| File pattern with ** | 3 |

## Examples by Agent Category

### Backend Agent

```yaml
visual:
  emoji: "⚙️"
  color: "#3498db"
  label: "Backend Expert"
  spinner: "Building backend..."

triggers:
  keywords:
    - "backend"
    - "server"
    - "middleware"
    - pattern: "(express|fastify|koa|nest).*"
  files:
    - pattern: "src/server/**"
      on: [edit, write]
    - pattern: "src/middleware/**"
      on: [edit, write]
  priority: 8
  tags: [backend, nodejs, api]
```

### Frontend Agent

```yaml
visual:
  emoji: "🎨"
  color: "#e74c3c"
  label: "Frontend Expert"
  spinner: "Crafting UI..."

triggers:
  keywords:
    - "frontend"
    - "component"
    - "UI"
    - "UX"
    - pattern: "(react|vue|angular|svelte).*"
  files:
    - pattern: "src/components/**"
      on: [edit, write]
    - pattern: "**/*.{jsx,tsx,vue,svelte}"
      on: [edit, write]
  priority: 8
  tags: [frontend, ui, components]
```

### Security Agent

```yaml
visual:
  emoji: "🔒"
  color: "#9b59b6"
  label: "Security Expert"
  spinner: "Scanning for vulnerabilities..."

triggers:
  keywords:
    - "security"
    - "vulnerability"
    - "CVE"
    - "OWASP"
    - "penetration"
    - pattern: "(auth|authentication|authorization).*"
  files:
    - pattern: "**/auth/**"
      on: [edit, write]
    - pattern: "**/security/**"
      on: [edit, write]
  priority: 15  # High priority for security
  tags: [security, audit, compliance]
```

### Database Agent

```yaml
visual:
  emoji: "🗄️"
  color: "#27ae60"
  label: "Database Expert"
  spinner: "Optimizing queries..."

triggers:
  keywords:
    - "database"
    - "SQL"
    - "query"
    - "migration"
    - "schema"
    - pattern: "(postgres|mysql|mongodb|redis).*"
  files:
    - pattern: "**/migrations/**"
      on: [edit, write]
    - pattern: "**/models/**"
      on: [edit, write]
    - pattern: "**/*.sql"
      on: [read, edit, write]
  priority: 10
  tags: [database, sql, orm]
```

## Status Line Integration

Use the `agent-display.sh` status line script to show active agents:

```bash
# ~/.claude/settings.json
{
  "statusLine": "~/.claude/statuslines/agent-display.sh"
}
```

Output example:
```
🔵 SONNET [API] | 🔌 api-expert | 🌿 main
```

## Debugging Triggers

To test trigger matching:

```bash
# List all agents with triggers
grep -l "triggers:" ~/.claude/agents/*.md

# Show trigger keywords for an agent
grep -A 20 "keywords:" ~/.claude/agents/api-expert.md

# Test file pattern matching
# (future: /triggers command)
```

## Migration Guide

### Updating Existing Agents

1. Add `visual` section for UI indicators
2. Add `triggers` section with relevant keywords
3. Set appropriate priority
4. Add tags for categorization

### Before

```yaml
---
name: api-expert
description: REST API specialist...
tools: Read, Write, Edit, Bash
model: sonnet
---
```

### After

```yaml
---
name: api-expert
description: REST API specialist...
tools: Read, Write, Edit, Bash
model: sonnet

visual:
  emoji: "🔌"
  label: "API Expert"

triggers:
  keywords:
    - "REST API"
    - "endpoint"
  priority: 10
  tags: [backend, api]
---
```

---

## Related Documentation

- [Agent Triggers Feature Proposal](../plans/agent-triggers-feature-proposal.md)
- [Agents README](../../agents/README.md)
- [Status Lines Guide](../../config-bundle/statuslines/README.md)

---

**Credits:**
- Author: Michel Abboud (https://github.com/michelabboud)
- AI Assistance: Created with Claude Code (Anthropic)
- License: Apache-2.0
