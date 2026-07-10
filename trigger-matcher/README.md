# Claude Trigger Matcher

**A comprehensive TypeScript library for deterministic agent triggering in Claude Code.**

[![npm version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![tests](https://img.shields.io/badge/tests-200%20passing-brightgreen.svg)](#testing)
[![license](https://img.shields.io/badge/license-Apache--2.0-green.svg)](../LICENSE)

---

## Overview

The Claude Trigger Matcher library provides a complete system for triggering Claude Code agents based on deterministic rules rather than relying solely on Claude's judgment. This enables automated workflows, enforced policies, and predictable agent activation.

### Key Features

| Feature | Description |
|---------|-------------|
| **Keyword Triggers** | Match patterns in user prompts |
| **File Pattern Triggers** | Activate agents based on file operations (read/edit/write) |
| **Event Triggers** | React to tool usage and lifecycle events |
| **Global Configuration** | Centralized trigger rules with conflict resolution |
| **Agent Chains** | Sequential or parallel execution of multiple agents |
| **MCP Integration** | Connect triggers to MCP tool invocations with before/after hooks |

### Test Coverage

**200 tests passing** across all modules:
- File/keyword matching (28 tests)
- Event system (43 tests)
- Event dispatching (18 tests)
- Configuration loading (39 tests)
- Chain execution (45 tests)
- MCP integration (33 tests)

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Configuration](#configuration)
- [Examples](#examples)
- [Hook Integration](#hook-integration)
- [Architecture](#architecture)

---

## Installation

```bash
# From the claude-code-helper repository
cd trigger-matcher

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

### Requirements

- Node.js >= 18.0.0
- TypeScript >= 5.0.0

### Dependencies

- `minimatch` - Glob pattern matching
- `yaml` - YAML parsing
- `gray-matter` - Frontmatter parsing

---

## Quick Start

### 1. Basic File Matching

```typescript
import { TriggerMatcher } from 'claude-trigger-matcher';

const matcher = new TriggerMatcher();
await matcher.loadAgents();

// Match file operations against agent triggers
const matches = matcher.matchFile('src/api/users.ts', 'edit');
if (matches.length > 0) {
  console.log(`Best agent: ${matches[0].agent.name}`);
  console.log(`Priority: ${matches[0].priority}`);
}
```

### 2. Keyword Matching

```typescript
// Match prompts against keyword triggers
const promptMatches = matcher.matchPrompt('Create a REST API endpoint');
// Returns agents with keyword triggers matching "REST API" or "endpoint"
```

### 3. Event Dispatching

```typescript
import { EventDispatcher } from 'claude-trigger-matcher';

const dispatcher = new EventDispatcher();
await dispatcher.loadAgents();

// Dispatch a PreToolUse event
const matches = dispatcher.dispatch({
  eventType: 'PreToolUse',
  tool: 'Edit',
  file: 'src/api/routes.ts'
});
```

### 4. Chain Execution

```typescript
import { ChainExecutor } from 'claude-trigger-matcher';

const executor = new ChainExecutor();
executor.loadChains(config.chains);
executor.setInvoker(async (agent, prompt) => {
  return await invokeAgent(agent, prompt);
});

const result = await executor.executeByName('full-review-pipeline', {
  userPrompt: 'Review my code',
  files: ['src/api/users.ts']
});

console.log(result.output);
```

### 5. MCP Integration

```typescript
import { MCPTriggerExecutor } from 'claude-trigger-matcher';

const mcpExecutor = new MCPTriggerExecutor();
mcpExecutor.loadTriggers(config.mcp_triggers);
mcpExecutor.setMCPInvoker(mcpClient.invoke);

const result = await mcpExecutor.executeByName('design-validator', {
  server: 'design-system-mcp',
  tool: 'validate_tokens',
  params: {},
  files: ['src/components/Button.tsx']
});
```

---

## Core Concepts

### Trigger Types

| Type | Description | Example |
|------|-------------|---------|
| **Keyword** | Match patterns in prompts | "Create API" → api-expert |
| **File** | Match glob patterns on file ops | `src/api/**/*.ts` → api-expert |
| **Event** | React to tool/lifecycle events | PreCommit → security-expert |
| **MCP** | Trigger MCP tools with hooks | Component edit → validate_tokens |
| **Chain** | Execute multiple agents | Full review pipeline |

### Priority System

When multiple agents match, selection is based on:

1. **Priority** (0-20, higher = preferred)
2. **Confidence** (pattern specificity)
3. **Match type** (keyword > file > event)

**Recommended ranges:**
- 15-20: Critical (security, compliance)
- 12-14: Specialized experts
- 10-11: General purpose
- 8-9: Fallback/catch-all

### Execution Modes

| Mode | Description |
|------|-------------|
| **Sequential** | Agents execute one after another, outputs passed forward |
| **Parallel** | Agents execute concurrently, results collected |

---

## API Reference

### TriggerMatcher

Main class for matching files and prompts against agent triggers.

```typescript
import { TriggerMatcher } from 'claude-trigger-matcher';

const matcher = new TriggerMatcher();

// Load agents
await matcher.loadAgents();                          // Standard locations
await matcher.loadFromDirectories(['./agents']);     // Specific directories
matcher.addAgentFile('./my-agent.md');               // Single file

// Match operations
matcher.matchFile(path, event, options?);            // File matches
matcher.matchPrompt(prompt, options?);               // Keyword matches
matcher.match(path, event, prompt, options?);        // Combined
matcher.getBestFileMatch(path, event);               // Single best
matcher.hasFileTriggers(path, event);                // Check existence

// Utilities
matcher.getAgentEnvironment(agent);                  // Status line env vars
matcher.getStats();                                  // Index statistics
matcher.getFilePatterns();                           // All file patterns
matcher.getKeywords();                               // All keywords
```

### EventDispatcher

Dispatches events and matches against agent event triggers.

```typescript
import { EventDispatcher, EventBus } from 'claude-trigger-matcher';

const dispatcher = new EventDispatcher();
await dispatcher.loadAgents();

// Dispatch events
dispatcher.dispatch({ eventType: 'PreToolUse', tool: 'Edit', file: 'test.ts' });

// Use EventBus for subscriptions
const bus = new EventBus();
bus.on('PreToolUse', (event) => console.log('Tool:', event.tool));
bus.once('SessionStart', (event) => console.log('Session started'));

// Emit through dispatcher
dispatcher.emit(bus, 'PreToolUse', eventContext);
```

**Event Types:**
- `PreToolUse`, `PostToolUse` - Tool execution events
- `PreCommit`, `PostCommit` - Git commit events
- `SessionStart`, `SessionEnd` - Session lifecycle
- `Error` - Error events
- `AgentStart`, `AgentEnd` - Agent execution events

### ConfigLoader

Loads and merges trigger configurations from multiple sources.

```typescript
import { ConfigLoader } from 'claude-trigger-matcher';

const loader = new ConfigLoader();

// Load configuration
const config = await loader.loadConfigFile('~/.claude/triggers.json');
const merged = await loader.loadAllConfigs();

// Access configuration
merged.triggers      // All triggers
merged.chains        // All chains
merged.mcp_triggers  // All MCP triggers
merged.sources       // Loaded sources

// Conflict detection
const conflicts = loader.detectConflicts(merged.triggers);
const resolved = loader.resolveConflicts(conflicts);
```

### ChainExecutor

Executes chains of agents in sequential or parallel mode.

```typescript
import { ChainExecutor } from 'claude-trigger-matcher';

const executor = new ChainExecutor();
executor.loadChains(chains);
executor.setInvoker(agentInvoker);
executor.setDefaultOptions({ stepTimeout: 60000 });

// Execute chains
await executor.executeByName(name, context, options?);
await executor.execute(chain, context, options?);
await executor.executeMatching(context, options?);
await executor.executeMatchingParallel(context, options?);

// Query
executor.getChains();
executor.getChain(name);
executor.findMatching(context);
executor.getStats();
```

**Chain Execution Context:**
```typescript
interface ChainExecutionContext {
  userPrompt?: string;       // Original prompt
  files?: string[];          // Files involved
  event?: string;            // Triggering event
  previousOutputs?: string[];// Previous step outputs
  variables?: Record<string, unknown>;
}
```

**Condition Helpers:**
```typescript
hasFile('**/*.ts')           // Glob pattern match
hasFileWith('/api/')         // Substring match
previousContains('error')    // Check previous output
lastOutput()                 // Get last output
hasFiles()                   // Has any files
hasVar('name')               // Check variable
getVar('name')               // Get variable value
```

### MCPTriggerExecutor

Executes MCP triggers with before/after hook support.

```typescript
import { MCPTriggerExecutor } from 'claude-trigger-matcher';

const executor = new MCPTriggerExecutor();
executor.loadTriggers(triggers);
executor.loadHooks(hooks);
executor.setMCPInvoker(mcpInvoker);
executor.setAgentInvoker(agentInvoker);

// Execute triggers
await executor.executeByName(name, context, options?);
await executor.execute(trigger, context, options?);
await executor.executeMatching(context, options?);
await executor.executeMatchingParallel(context, options?);

// Hooks
executor.addBeforeHook(hook);
executor.addAfterHook(hook);
executor.getBeforeHooks();
executor.getAfterHooks();

// Query
executor.getTriggers();
executor.getTrigger(name);
executor.findMatching(context);
executor.getStats();
```

**MCP Execution Context:**
```typescript
interface MCPExecutionContext {
  server: string;                    // MCP server name
  tool: string;                      // MCP tool name
  params: Record<string, unknown>;   // Tool parameters
  files?: string[];                  // Files involved
  userPrompt?: string;               // User prompt
  event?: string;                    // Triggering event
  variables?: Record<string, unknown>;
}
```

**Variable Substitution:**
```typescript
${server}           // MCP server name
${tool}             // MCP tool name
${file}             // First file
${files}            // Comma-separated files
${user_prompt}      // User prompt
${previous_output}  // Previous output
${mcp_output}       // MCP tool output (after hooks)
${event}            // Triggering event
```

---

## Configuration

### Agent Frontmatter

Add triggers to agent markdown files:

```yaml
---
name: api-expert
description: REST API specialist
model: sonnet
tools: [Read, Write, Edit, Bash, Grep, Glob]
triggers:
  keywords:
    - "REST API"
    - "endpoint"
    - pattern: "design.*api"
      case_insensitive: true
  files:
    - pattern: "src/api/**/*.ts"
      on: [edit, write]
    - pattern: "**/routes/**"
      on: [edit]
  events:
    - type: PreToolUse
      tool: Edit
      condition: "file.path.includes('/api/')"
  priority: 12
  tags: [backend, api]
visual:
  emoji: "🌐"
  color: "#4CAF50"
  label: "API Expert"
  spinner: "Designing APIs..."
---
```

### Global Configuration

Create `~/.claude/triggers.json` or `.claude/triggers.json`:

```json
{
  "$schema": "./triggers.schema.json",
  "version": "1.0",
  "triggers": [
    {
      "name": "security-on-commit",
      "description": "Security review before commits",
      "match": {
        "events": ["PreCommit"]
      },
      "action": {
        "type": "spawn_agent",
        "agent": "security-expert",
        "prompt": "Review staged changes for vulnerabilities",
        "blocking": true
      },
      "priority": 15
    }
  ],
  "chains": [
    {
      "name": "full-review-pipeline",
      "trigger": { "keywords": ["full review", "/review-all"] },
      "agents": [
        { "agent": "security-expert", "prompt": "Security audit" },
        { "agent": "api-expert", "prompt": "API review", "condition": "hasFile('**/api/**')" },
        { "agent": "qa-testing-expert", "prompt": "Test coverage" }
      ],
      "execution": "sequential",
      "output": "consolidated_report"
    }
  ],
  "mcp_triggers": [
    {
      "name": "design-validator",
      "match": {
        "files": ["src/components/**/*.tsx"],
        "events": ["PostToolUse:Write"]
      },
      "action": {
        "type": "mcp_tool",
        "server": "design-system-mcp",
        "tool": "validate_tokens",
        "params": { "file": "${file}" }
      },
      "hooks": [
        {
          "timing": "before",
          "blocking": true,
          "agent": "css-tailwind-expert",
          "prompt": "Pre-check ${file}"
        },
        {
          "timing": "after",
          "agent": "documentation-expert",
          "prompt": "Summarize: ${mcp_output}"
        }
      ]
    }
  ]
}
```

### Configuration Precedence

Configurations merge in order (later overrides earlier):
1. Agent frontmatter triggers
2. Global config (`~/.claude/triggers.json`)
3. Project config (`.claude/triggers.json`)

---

## Examples

### Example 1: Security Gate on Commits

```json
{
  "triggers": [{
    "name": "security-gate",
    "match": { "events": ["PreCommit"] },
    "action": {
      "type": "spawn_agent",
      "agent": "security-expert",
      "prompt": "Scan for: secrets, SQL injection, XSS, command injection",
      "blocking": true
    },
    "priority": 20
  }]
}
```

### Example 2: Auto-Test After Edits

```json
{
  "triggers": [{
    "name": "auto-test",
    "match": {
      "files": ["src/**/*.ts", "!**/*.test.ts"],
      "events": ["PostToolUse:Write", "PostToolUse:Edit"]
    },
    "action": {
      "type": "spawn_agent",
      "agent": "qa-testing-expert",
      "prompt": "Run tests for ${files}",
      "run_in_background": true
    }
  }]
}
```

### Example 3: PR Review Pipeline

```typescript
const executor = new ChainExecutor();
executor.loadChains([{
  name: 'pr-review',
  trigger: { keywords: ['/review-pr'] },
  agents: [
    { agent: 'security-expert', prompt: 'Security audit' },
    { agent: 'api-expert', prompt: 'API review', condition: "hasFile('**/api/**')" },
    { agent: 'qa-testing-expert', prompt: 'Test coverage' },
    { agent: 'documentation-expert', prompt: 'Doc updates?' }
  ],
  execution: 'sequential',
  output: 'consolidated_report'
}]);

const result = await executor.executeByName('pr-review', {
  userPrompt: '/review-pr',
  files: ['src/api/users.ts']
});
```

### Example 4: MCP with Hooks

```json
{
  "mcp_triggers": [{
    "name": "security-scan",
    "match": { "files": ["src/auth/**/*.ts"] },
    "action": {
      "type": "mcp_tool",
      "server": "code-review-mcp",
      "tool": "security_scan",
      "params": { "file": "${file}", "level": "thorough" }
    },
    "hooks": [
      {
        "timing": "before",
        "blocking": true,
        "agent": "security-expert",
        "prompt": "Verify ${file} is safe to scan"
      },
      {
        "timing": "after",
        "agent": "documentation-expert",
        "prompt": "Summarize scan: ${mcp_output}"
      }
    ]
  }]
}
```

---

## Hook Integration

The library provides hook scripts for Claude Code:

### File Trigger Hook

```bash
# Copy to hooks directory
cp hooks/file-trigger-hook.json ~/.claude/hooks/
cp hooks/file-trigger-matcher.js ~/.claude/hooks/
chmod +x ~/.claude/hooks/file-trigger-matcher.js
```

Triggers on `Read`, `Edit`, `Write` operations.

### Event Trigger Hook

```bash
cp hooks/event-trigger-hook.json ~/.claude/hooks/
cp hooks/event-dispatcher.js ~/.claude/hooks/
chmod +x ~/.claude/hooks/event-dispatcher.js
```

Triggers on `PreToolUse`, `PostToolUse` events.

### MCP Trigger Hook

```bash
cp hooks/mcp-trigger-hook.json ~/.claude/hooks/
cp hooks/mcp-trigger-dispatcher.js ~/.claude/hooks/
chmod +x ~/.claude/hooks/mcp-trigger-dispatcher.js
```

Triggers on MCP tool invocations with before/after hooks.

---

## Architecture

```
trigger-matcher/
├── src/
│   ├── types.ts          # Type definitions (380+ lines)
│   ├── parser.ts         # Agent file parsing
│   ├── matcher.ts        # TriggerMatcher class
│   ├── events.ts         # EventBus, condition evaluation
│   ├── dispatcher.ts     # EventDispatcher class
│   ├── config.ts         # ConfigLoader class
│   ├── chain.ts          # ChainExecutor class (569 lines)
│   ├── mcp.ts            # MCPTriggerExecutor class (590 lines)
│   └── index.ts          # Public exports
├── build/                # Compiled JavaScript
├── hooks/                # Claude Code hook scripts
│   ├── file-trigger-hook.json
│   ├── file-trigger-matcher.js
│   ├── event-trigger-hook.json
│   ├── event-dispatcher.js
│   ├── mcp-trigger-hook.json
│   └── mcp-trigger-dispatcher.js
├── package.json
├── tsconfig.json
└── README.md
```

### Module Dependencies

```
index.ts (exports all)
├── types.ts
├── parser.ts → types.ts
├── matcher.ts → parser.ts, types.ts
├── events.ts → types.ts
├── dispatcher.ts → events.ts, matcher.ts, types.ts
├── config.ts → types.ts, parser.ts
├── chain.ts → types.ts
└── mcp.ts → types.ts
```

---

## Testing

```bash
# Run all 200 tests
npm test

# With verbose output
npm test -- --reporter spec

# Run specific module tests
npm test -- build/matcher.test.js
npm test -- build/chain.test.js
npm test -- build/mcp.test.js
```

---

## Performance

- **Index Build**: O(n) for n agents
- **Keyword Lookup**: O(1) via Map
- **Glob Matching**: O(n) for n patterns
- **Chain Execution**: Sequential O(s), Parallel O(1)
- **Test Suite**: ~400ms for 200 tests

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 50+ agents, 16+ skills, 10 MCP servers, and comprehensive guides.
