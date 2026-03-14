# Release v2.0.0 - Agent Triggers System - Deterministic Agent Routing

**Comprehensive trigger system for deterministic agent invocation based on keywords, file patterns, events, and MCP tool usage. Enables automated workflows, agent chains, and event-driven automation.**

---

## What's New

### Trigger Matcher Library (`trigger-matcher/`)

A complete TypeScript library (2,500+ lines) with 188 passing tests, organized into 6 core modules:

| Module | Purpose |
|--------|---------|
| `parser.ts` | Agent file parser for Markdown (YAML frontmatter) and JSON formats |
| `matcher.ts` | Keyword and file pattern matching with glob support |
| `events.ts` | Event bus, condition evaluation, and event trigger matching |
| `dispatcher.ts` | Event dispatcher with agent index building |
| `config.ts` | Global configuration loader with conflict detection/resolution |
| `chain.ts` | Agent chain executor with sequential/parallel modes |
| `mcp.ts` | MCP trigger executor with before/after hooks |

### Trigger Types

- **Keyword Triggers** - Pattern matching in user prompts (string or regex)
- **File Pattern Triggers** - Glob patterns with `on: [read, edit, write]` event filtering
- **Event Triggers** - React to PreToolUse, PostToolUse, PreCommit, PostCommit, SessionStart, SessionEnd, Error, AgentStart, AgentEnd
- **Agent Chains** - Sequential or parallel multi-agent workflows with conditions
- **MCP Integration** - Before/after hooks for MCP tool execution

Additional capabilities: priority-based selection, confidence scoring, safe condition evaluation (blocks dangerous patterns), and variable substitution (`${file}`, `${files}`, `${user_prompt}`, `${previous_output}`, `${mcp_output}`).

### All 45 Agents Updated

Every agent received new frontmatter fields:

- `visual.emoji` - Agent-specific emoji for status line
- `visual.color` - Hex color for UI theming
- `visual.label` - Human-readable display name
- `visual.spinner` - Text shown while agent is working
- `triggers.keywords` - Keyword/regex patterns for prompt matching
- `triggers.files` - Glob patterns with event filtering
- `triggers.priority` - 8-15 (higher = preferred when multiple match)
- `triggers.tags` - Categorization tags

### Hook Files

Six new hook files for different trigger types:

**File Pattern Hooks:**
- `hooks/file-trigger-hook.json` - PreToolUse configuration for file operations
- `hooks/file-trigger-matcher.js` - Standalone matcher script

**Event Hooks:**
- `hooks/event-trigger-hook.json` - PreToolUse/PostToolUse event configuration
- `hooks/event-dispatcher.js` - Event dispatcher script

**MCP Hooks:**
- `hooks/mcp-trigger-hook.json` - MCP tool execution hooks
- `hooks/mcp-trigger-dispatcher.js` - MCP dispatcher script

### Global Configuration

**`config-bundle/triggers.json`** provides:
- 5 global triggers (security-on-commit, api-file-guard, test-after-edit, database-migrations, docker-devops)
- 2 agent chains (full-review-pipeline, pre-release-check)
- 4 MCP triggers (design-token-validator, api-spec-validator, security-scan-with-hooks, test-coverage-check)

**`config-bundle/triggers.schema.json`** - JSON Schema for IDE validation covering GlobalTrigger, TriggerMatch, TriggerAction, AgentChain, ChainStep, MCPTrigger, and MCPHook definitions.

### Testing

188 tests across 6 modules:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `matcher.test.ts` | 28 | Parser, matcher, file patterns |
| `events.test.ts` | 25 | Event bus, conditions, matching |
| `dispatcher.test.ts` | 18 | Event dispatch, agent index |
| `config.test.ts` | 39 | Loading, merging, conflicts |
| `chain.test.ts` | 45 | Execution modes, conditions, variables |
| `mcp.test.ts` | 33 | MCP matching, hooks, execution |

---

## Impact

**Before Agent Triggers:**
- Agents only triggered via Claude's judgment through Task tool
- No deterministic routing based on context
- Manual agent selection required
- No event-driven automation

**After Agent Triggers:**
- Deterministic agent invocation based on keywords, files, events
- Automatic agent selection based on file patterns
- Event-driven workflows (security scan on commit, tests after edit)
- Multi-agent chains for complex workflows
- MCP tool hooks for validation and enrichment
- Priority-based conflict resolution
- Visual status indicators

---

## Files Changed

### Added (20+ files)
| File | Description |
|------|-------------|
| `trigger-matcher/src/*.ts` | 6 core modules (~2,500 lines) |
| `trigger-matcher/src/*.test.ts` | 6 test files (~1,500 lines) |
| `trigger-matcher/package.json` | Library package config |
| `trigger-matcher/tsconfig.json` | TypeScript configuration |
| `trigger-matcher/README.md` | API reference (700+ lines) |
| `hooks/file-trigger-hook.json` | File pattern hook config |
| `hooks/file-trigger-matcher.js` | File pattern matcher script |
| `hooks/event-trigger-hook.json` | Event hook config |
| `hooks/event-dispatcher.js` | Event dispatcher script |
| `hooks/mcp-trigger-hook.json` | MCP hook config |
| `hooks/mcp-trigger-dispatcher.js` | MCP dispatcher script |
| `config-bundle/triggers.json` | Global trigger configuration |
| `config-bundle/triggers.schema.json` | JSON Schema for validation |
| `config-bundle/statuslines/agent-display.sh` | Status line script |
| `docs/reference/agent-triggers-schema.md` | Schema documentation |

### Modified (45+ files)
| File | Change |
|------|--------|
| All 33 `agents/domain-experts/*.md` | Added trigger and visual fields |
| All 12 `agents/mcp-integrated/*.json` | Added trigger and visual fields |
| `README.md` | Added Trigger Matcher Library section |

**Total: ~4,000+ lines of new code and documentation**

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v1.3.0 | 2026-01-10 | Complete MCP ecosystem |
| v1.3.1 | 2026-01-11 | Documentation suite |
| v1.3.2 | 2026-01-11 | Test automation |
| v1.4.0 | 2026-01-11 | MCP configuration modernization |
| v1.5.0 | 2026-01-11 | Agent loop prevention |
| v1.6.0 | 2026-01-11 | Solving AI coding problems |
| v1.7.0 | 2026-01-11 | RAG MCP Server |
| v1.8.0 | 2026-01-30 | CLI v2.1.22 compatibility update |
| v1.9.0 | 2026-02-20 | CLI v2.1.47 compatibility update |
| v1.10.1 | 2026-01-16 | Repository reorganization & v2.1.9 support |
| v2.0.0 | 2026-01-25 | **Agent Triggers System** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"From manual agent selection to deterministic, event-driven automation"**
