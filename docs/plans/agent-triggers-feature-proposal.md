# Feature Proposal: Agent Triggers and Hooks System

## Metadata
- **Created**: 2025-01-25
- **Status**: draft
- **Author**: claude-code-helper maintainers
- **Affects**: agents/, skills/, mcp-servers/

## Executive Summary

Currently, agents in this repository are only triggered when Claude's parent agent decides to spawn them via the Task tool. This proposal adds **declarative triggers and hooks** that give users deterministic control over when agents activate.

## Problem Statement

### Current Behavior
1. User writes a prompt
2. Claude interprets the prompt and decides whether to spawn an agent
3. Agent selection is based on Claude's judgment (non-deterministic)

### Limitations
| Issue | Impact |
|-------|--------|
| **Inconsistent triggering** | Same prompt may or may not spawn an agent |
| **No automation** | Can't auto-trigger agents on file changes, git events, etc. |
| **No composition** | Can't chain agents together declaratively |
| **No enforcement** | Can't require certain agents for specific workflows |
| **User must hope** | No guarantee the right agent gets selected |

## Proposed Solution

Add a **triggers** system to agent definitions that supports:

1. **Keyword triggers** - Match on prompt content
2. **File pattern triggers** - Match on files being edited/read
3. **Event triggers** - Match on tool usage or lifecycle events
4. **MCP triggers** - Match on MCP tool invocations
5. **Chained triggers** - One agent can trigger another

## Specification

### 1. Agent Frontmatter Extension

```yaml
---
name: api-expert
description: REST API specialist
model: sonnet
triggers:
  # Keyword-based (match in user prompt)
  keywords:
    - "REST API"
    - "endpoint"
    - "swagger"
    - "openapi"
    - pattern: "design.*api"  # regex support
      case_insensitive: true

  # File pattern-based
  files:
    - pattern: "src/api/**/*.ts"
      on: [edit, read, write]
    - pattern: "**/routes/**"
      on: [edit]
    - pattern: "openapi.yaml"
      on: [edit, read]

  # Event-based
  events:
    - type: PreToolUse
      tool: Edit
      condition: "file.path.includes('/api/')"
    - type: PostToolUse
      tool: Bash
      condition: "command.includes('curl')"

  # MCP tool triggers
  mcp:
    - server: api-specialist-mcp
      tools: ["validate_openapi", "test_endpoint"]
      on: before  # or "after"

  # Priority when multiple agents match
  priority: 10  # higher = preferred

# Optional: conditions that must ALL be true
conditions:
  - file_exists: "package.json"
  - context_contains: "express|fastify|koa"
---
```

### 2. Skill Frontmatter Extension

```yaml
---
name: api-review
description: Review API endpoints
agent: api-expert  # existing field
triggers:
  keywords:
    - "review api"
    - "check endpoints"
  events:
    - type: PreCommit
      files: "src/api/**"
---
```

### 3. Global Triggers Configuration

New file: `~/.claude/triggers.json` or `.claude/triggers.json`

```json
{
  "version": "1.0",
  "triggers": [
    {
      "name": "api-files-guard",
      "description": "Always involve api-expert for API files",
      "match": {
        "files": ["src/api/**", "**/routes/**"],
        "events": ["Edit", "Write"]
      },
      "action": {
        "type": "spawn_agent",
        "agent": "api-expert",
        "prompt_prefix": "Review this change for API best practices: "
      }
    },
    {
      "name": "security-on-commit",
      "description": "Security review before commits",
      "match": {
        "events": ["PreCommit"]
      },
      "action": {
        "type": "spawn_agent",
        "agent": "security-expert",
        "prompt": "Review staged changes for security vulnerabilities",
        "blocking": true
      }
    },
    {
      "name": "test-after-edit",
      "description": "Run tests after editing source files",
      "match": {
        "files": ["src/**/*.ts", "!src/**/*.test.ts"],
        "events": ["PostToolUse:Write", "PostToolUse:Edit"]
      },
      "action": {
        "type": "spawn_agent",
        "agent": "qa-testing-expert",
        "prompt": "Run relevant tests for the modified files",
        "run_in_background": true
      }
    }
  ],

  "chains": [
    {
      "name": "full-review-pipeline",
      "description": "Complete code review workflow",
      "trigger": {
        "keywords": ["full review", "complete review"]
      },
      "agents": [
        { "agent": "security-expert", "prompt": "Security audit" },
        { "agent": "performance-optimizer", "prompt": "Performance review" },
        { "agent": "api-expert", "prompt": "API best practices", "condition": "has_api_files" },
        { "agent": "qa-testing-expert", "prompt": "Test coverage analysis" }
      ],
      "execution": "sequential"  # or "parallel"
    }
  ]
}
```

### 4. MCP Integration Triggers

```json
{
  "mcp_triggers": [
    {
      "name": "design-system-validator",
      "description": "Auto-validate design tokens on component changes",
      "match": {
        "files": ["src/components/**/*.tsx"],
        "events": ["PostToolUse:Write"]
      },
      "action": {
        "type": "mcp_tool",
        "server": "design-system-mcp",
        "tool": "validate_tokens",
        "params": {
          "file": "${modified_file}"
        }
      }
    }
  ]
}
```

## Implementation Plan

### Phase 1: Keyword Triggers (Foundation)
- [ ] Extend agent frontmatter parser to recognize `triggers` field
- [ ] Implement keyword matching in prompt routing
- [ ] Add priority-based agent selection when multiple match
- [ ] Update agent loader to index triggers

**Files to modify:**
- Agent frontmatter schema
- Agent loading/parsing logic
- Documentation

### Phase 2: File Pattern Triggers
- [ ] Implement glob pattern matching for file triggers
- [ ] Hook into Read/Edit/Write tool events
- [ ] Cache file patterns for performance
- [ ] Add `on` event filtering (read, edit, write)

### Phase 3: Event Triggers
- [ ] Define event types (PreToolUse, PostToolUse, PreCommit, etc.)
- [ ] Implement event bus/dispatcher
- [ ] Add condition evaluation (simple expression parser)
- [ ] Connect to existing hook system

### Phase 4: Global Configuration
- [ ] Create `triggers.json` schema
- [ ] Implement configuration loader
- [ ] Merge global + project + agent triggers
- [ ] Add trigger conflict resolution

### Phase 5: Agent Chains
- [ ] Implement chain definitions
- [ ] Add sequential/parallel execution modes
- [ ] Handle agent output passing between chain steps
- [ ] Add conditional chain steps

### Phase 6: MCP Integration
- [ ] Connect triggers to MCP tool invocations
- [ ] Implement before/after MCP hooks
- [ ] Add MCP response-based triggers

## Examples

### Example 1: API Expert Auto-Trigger

**Agent file:** `agents/domain-experts/api-expert.md`
```yaml
---
name: api-expert
description: REST API design and review specialist
model: sonnet
tools: [Read, Write, Edit, Bash, Grep, Glob, WebSearch]
triggers:
  keywords:
    - "REST API"
    - "endpoint"
    - "api design"
    - pattern: "(create|design|review).*api"
  files:
    - pattern: "src/api/**"
      on: [edit, write]
    - pattern: "**/routes/**"
      on: [edit]
    - pattern: "openapi.{yaml,json}"
      on: [read, edit]
---
```

**User prompt:** "I need to add a new endpoint for user preferences"

**Result:** `api-expert` is automatically triggered because:
- Keyword match: "endpoint"
- No ambiguity, deterministic selection

### Example 2: Security Gate on Commits

**Global config:** `~/.claude/triggers.json`
```json
{
  "triggers": [
    {
      "name": "security-gate",
      "match": { "events": ["PreCommit"] },
      "action": {
        "type": "spawn_agent",
        "agent": "security-expert",
        "prompt": "Scan staged changes for: hardcoded secrets, SQL injection, XSS, command injection. Block commit if critical issues found.",
        "blocking": true
      }
    }
  ]
}
```

**Result:** Every commit is reviewed by security-expert before proceeding.

### Example 3: Test-Driven Workflow

```json
{
  "triggers": [
    {
      "name": "auto-test",
      "match": {
        "files": ["src/**/*.ts", "!**/*.test.ts", "!**/*.spec.ts"],
        "events": ["PostToolUse:Write", "PostToolUse:Edit"]
      },
      "action": {
        "type": "spawn_agent",
        "agent": "qa-testing-expert",
        "prompt": "Run tests related to ${modified_file}. If tests fail, suggest fixes.",
        "run_in_background": true
      }
    }
  ]
}
```

### Example 4: Full Review Pipeline

```json
{
  "chains": [
    {
      "name": "pr-review-pipeline",
      "trigger": { "keywords": ["/review-pr", "full pr review"] },
      "agents": [
        {
          "agent": "security-expert",
          "prompt": "Security review of all changes"
        },
        {
          "agent": "api-expert",
          "prompt": "API best practices review",
          "condition": "files.some(f => f.includes('/api/'))"
        },
        {
          "agent": "qa-testing-expert",
          "prompt": "Test coverage analysis"
        },
        {
          "agent": "Documentation Expert",
          "prompt": "Check if documentation needs updates"
        }
      ],
      "execution": "sequential",
      "output": "consolidated_report"
    }
  ]
}
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Deterministic** | Users know exactly when agents will activate |
| **Automated** | Workflows run without manual invocation |
| **Composable** | Chain agents for complex workflows |
| **Enforceable** | Require agents for specific file types or events |
| **Customizable** | Users define their own trigger rules |
| **Backward Compatible** | Existing agents work unchanged (triggers optional) |

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Over-triggering agents | Add cooldown/debounce options |
| Performance impact | Cache trigger patterns, lazy evaluation |
| Conflicting triggers | Priority system + conflict warnings |
| Complex configuration | Provide templates, validation, good defaults |
| Trigger loops | Detect cycles, max depth limit |

## Open Questions

1. **Should triggers be opt-in or opt-out?**
   - Proposal: Opt-in (agents without triggers behave as today)

2. **How to handle trigger conflicts?**
   - Proposal: Priority field + user confirmation for ties

3. **Should chained agents share context?**
   - Proposal: Yes, via `${previous_output}` variable

4. **How to debug triggers?**
   - Proposal: Add `/triggers` command to list active triggers and test matching

## Success Criteria

- [ ] Users can define keyword triggers in agent frontmatter
- [ ] File pattern triggers work for Edit/Write/Read tools
- [ ] Event triggers integrate with existing hook system
- [ ] Agent chains execute correctly (sequential + parallel)
- [ ] Global and project triggers merge correctly
- [ ] Documentation covers all trigger types with examples
- [ ] No performance regression in agent loading

## Related Work

- Existing hook system (`~/.claude/hooks/`)
- Skill `agent` field (specifies execution agent)
- MCP server tool definitions
- Built-in agent routing in Claude Code

## Next Steps

1. Review and approve this proposal
2. Create implementation job in JOBS.md
3. Start with Phase 1 (keyword triggers)
4. Iterate based on user feedback

---

## Appendix: Full Schema

```typescript
interface AgentTriggers {
  keywords?: (string | KeywordPattern)[];
  files?: FilePattern[];
  events?: EventTrigger[];
  mcp?: MCPTrigger[];
  priority?: number;
}

interface KeywordPattern {
  pattern: string;  // regex
  case_insensitive?: boolean;
}

interface FilePattern {
  pattern: string;  // glob
  on: ('read' | 'edit' | 'write')[];
}

interface EventTrigger {
  type: 'PreToolUse' | 'PostToolUse' | 'PreCommit' | 'PostCommit' | 'SessionStart';
  tool?: string;
  condition?: string;  // JS expression
}

interface MCPTrigger {
  server: string;
  tools: string[];
  on: 'before' | 'after';
}

interface GlobalTrigger {
  name: string;
  description?: string;
  match: {
    keywords?: string[];
    files?: string[];
    events?: string[];
  };
  action: TriggerAction;
}

interface TriggerAction {
  type: 'spawn_agent' | 'mcp_tool' | 'shell_command';
  agent?: string;
  prompt?: string;
  prompt_prefix?: string;
  blocking?: boolean;
  run_in_background?: boolean;
  server?: string;
  tool?: string;
  params?: Record<string, string>;
}

interface AgentChain {
  name: string;
  description?: string;
  trigger: { keywords: string[] };
  agents: ChainStep[];
  execution: 'sequential' | 'parallel';
  output?: 'consolidated_report' | 'last_only';
}

interface ChainStep {
  agent: string;
  prompt: string;
  condition?: string;
}
```
