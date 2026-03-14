# Claude Code Building Blocks

**A practical guide to understanding Skills, Agents, Hooks, MCP Servers, Plugins, and how they all fit together.**

---

## Table of Contents

- [The Big Picture](#the-big-picture)
- [1. Skills](#1-skills)
- [2. Agents (Subagents)](#2-agents-subagents)
- [3. Hooks](#3-hooks)
- [4. MCP Servers](#4-mcp-servers)
- [5. Plugins](#5-plugins)
- [How They Work Together](#how-they-work-together)
- [Decision Guide](#decision-guide)
- [Real-World Examples](#real-world-examples)

---

## The Big Picture

Claude Code has five extension points. Each solves a different problem:

```
+------------------------------------------------------------------+
|                        Claude Code Session                        |
|                                                                   |
|  YOU ──> /testing tdd ──> [Skill]                                |
|            "instructions loaded into Claude's context"            |
|                                                                   |
|  CLAUDE ──> @redis-expert ──> [Agent/Subagent]                   |
|              "autonomous specialist spawned as child process"     |
|                                                                   |
|  EVENT ──> PreToolUse ──> [Hook]                                 |
|             "script runs automatically, can block or augment"     |
|                                                                   |
|  CLAUDE ──> lint_file() ──> [MCP Server]                         |
|              "local process provides callable tools"              |
|                                                                   |
|  INSTALL ──> claude plugin add ──> [Plugin]                      |
|               "package bundles agents + skills + hooks + more"    |
+------------------------------------------------------------------+
```

| Building Block | What It Is | Analogy |
|---------------|------------|---------|
| **Skill** | Instructions Claude follows | A recipe |
| **Agent** | An autonomous specialist | A hired expert |
| **Hook** | An automated rule enforcer | A security guard |
| **MCP Server** | A tool provider | A power tool |
| **Plugin** | A bundled package | A toolbox |

---

## 1. Skills

### What they are

A skill is a **set of instructions** that Claude loads into its own context and follows. It's a recipe — Claude reads it and does what it says.

Skills don't create a new process or a separate conversation. Claude itself executes the instructions in your current session.

### Where they live

```
~/.claude/skills/              # Global skills
.claude/skills/                # Project-level skills
```

### File formats

**Directory-based** (for skills with subcommands or supporting files):
```
skills/testing/
  SKILL.md                     # Main skill file
```

**Flat file** (for simpler reference skills):
```
skills/refactoring-strategy.md
```

### Anatomy of a skill

```yaml
---
skill_name: testing
description: Comprehensive testing skill with TDD, E2E, BDD, and more
argument-hint: '[target] [type] | tdd | e2e | bdd'
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
agent: qa-testing-expert
version: 2.0.0
---

# Testing Skill

When the user invokes `/testing`, follow these steps:

## Default Mode: `/testing [target] [type]`
Generate tests using the AAA pattern...

## Subcommand: `/testing tdd`
Guide the user through Red-Green-Refactor...
```

### Key properties

| Property | Purpose |
|----------|---------|
| `skill_name` | How users invoke it (`/testing`) |
| `description` | Helps Claude decide when to suggest it |
| `argument-hint` | Shows available arguments in the menu |
| `allowed-tools` | Which tools the skill can use |
| `agent` | Which agent should execute this skill |
| `context: fork` | Run in a forked context (isolation) |

### How to invoke

```
/testing                     # Default mode
/testing tdd                 # Subcommand
/testing src/utils.ts unit   # With arguments
```

### When to use skills

- You want to define a **repeatable workflow** (TDD, code review, deployment)
- You want Claude to follow **specific steps** in a particular order
- You want a **quick reference** Claude can consult (design patterns, best practices)
- You want **subcommands** for different modes of the same concept

### When NOT to use skills

- You need **autonomous work** in a separate context -> use an Agent
- You need to **block or validate** actions automatically -> use a Hook
- You need a **new callable function** -> use an MCP Server

---

## 2. Agents (Subagents)

### What they are

An agent is an **autonomous specialist** that Claude spawns as a separate child process (subagent). It gets its own context, its own tools, and works independently. When it's done, it returns a result to the parent.

Every agent defined in `~/.claude/agents/` runs as a subagent. The terms "agent" and "subagent" are used interchangeably — "agent" is the definition file, "subagent" is the running instance.

### Where they live

```
~/.claude/agents/              # Global agents
.claude/agents/                # Project-level agents
```

### File formats

**Markdown agents** (most common):
```yaml
---
name: redis-expert
description: Redis specialist for caching, data structures, and pub/sub
model: sonnet
tools: Read, Write, Edit, Bash, Grep, Glob
background: true
memory: project
isolation: worktree
---

You are a Redis expert. You help with caching strategies,
data structure selection, pub/sub patterns...
```

**JSON agents** (for MCP-integrated agents):
```json
{
  "name": "api-reviewer",
  "description": "Reviews APIs using MCP tools",
  "model": "sonnet",
  "tools": ["Read", "Grep", "mcp__api-specialist__validate_api_response"],
  "instructions": "You review API endpoints..."
}
```

### Key properties

| Property | Purpose |
|----------|---------|
| `name` | Identifier (used with `@name`) |
| `description` | Helps Claude decide when to dispatch this agent |
| `model` | Which Claude model to use (`opus`, `sonnet`, `haiku`) |
| `tools` | Which tools the agent can access |
| `background` | Run as a background task (default: `false`) |
| `memory` | Memory scope: `user`, `project`, or `local` |
| `isolation` | `worktree` for a separate git worktree |

### How agents get dispatched

1. **User request**: `@redis-expert help me optimize caching`
2. **Claude's judgment**: Claude decides a specialist is needed and uses the Agent tool
3. **Triggers**: Keyword, file pattern, or event triggers auto-dispatch agents
4. **Skill delegation**: A skill's `agent:` field routes to an agent

### Subagent hierarchy

Subagents can spawn their own subagents. This enables multi-agent workflows:

```
Main Claude Session
  └── project-manager agent
       ├── security-expert agent
       ├── qa-testing-expert agent
       └── performance-optimizer agent
```

### Agent Teams (v2.1.32, research preview)

With `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, team members can **communicate** with each other via `SendMessage`, not just return results to their parent.

### When to use agents

- You need **autonomous, specialized work** (code review, security audit, database design)
- The task benefits from a **separate context** (doesn't clutter your main conversation)
- You want to run multiple specialists **in parallel**
- The work should happen in **isolation** (worktree) to avoid conflicts

### When NOT to use agents

- You just need Claude to follow steps -> use a Skill
- You need to enforce rules automatically -> use a Hook
- You need a callable function -> use an MCP Server

---

## 3. Hooks

### What they are

Hooks are **automated scripts that run when specific events happen** in Claude Code. They don't assist you — they **enforce rules**, **validate actions**, or **augment context** silently in the background.

Think of them as event listeners. When Claude is about to write a file, a hook can inspect it and block it if it violates a rule.

### Where they live

```
~/.claude/hooks/               # Global hooks
.claude/hooks/                 # Project-level hooks
settings.json                  # Inline hook configuration
```

Hooks can also be defined inline in agent/skill frontmatter:
```yaml
---
name: my-skill
hooks:
  PreToolUse: |
    # Inline hook logic
---
```

### Event types

| Event | When it fires | Common use |
|-------|--------------|------------|
| `PreToolUse` | Before any tool runs | Block dangerous commands, validate inputs |
| `PostToolUse` | After a tool completes | React to output, log results |
| `Stop` | When Claude finishes responding | Final validation, notifications |
| `SubagentStop` | When a subagent finishes | Aggregate results |
| `ConfigChange` | When config files change | Security auditing |
| `TeammateIdle` | When a team member has no work | Task assignment |
| `TaskCompleted` | When a task finishes | Progress tracking |

### Hook configuration

Hooks are defined in `settings.json` or standalone JSON files:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "bash ~/.claude/hooks/check-dangerous.sh",
        "timeout": 10000
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "command": "node ~/.claude/hooks/validate-output.js"
      }
    ]
  }
}
```

### Hook responses

A hook script receives context via stdin (JSON) and can return:

```json
// Block the action
{"decision": "block", "reason": "rm -rf is not allowed"}

// Allow it
{"decision": "allow"}

// Allow but add context for Claude
{"additionalContext": "Warning: this file is in production"}
```

### How hooks execute

```
You: "Delete the temp files"
  └── Claude prepares: Bash("rm -rf /tmp/app-*")
       └── PreToolUse hook fires
            └── check-dangerous.sh inspects the command
                 ├── Returns "allow" → command runs
                 └── Returns "block" → command is stopped, Claude sees the reason
```

### When to use hooks

- You need to **block dangerous operations** (rm -rf, force push, drop table)
- You want to **validate code** before it's written (lint, security scan)
- You need **automatic logging** or notifications
- You want to **inject context** before tool execution
- You need **enterprise security** controls (audit trails, policy enforcement)

### When NOT to use hooks

- You need a specialist to do work -> use an Agent
- You need Claude to follow a process -> use a Skill
- You need a new callable function -> use an MCP Server

---

## 4. MCP Servers

### What they are

An MCP server is a **local process that provides tools** Claude can call. It runs on your machine and communicates via the Model Context Protocol. From Claude's perspective, MCP tools work exactly like built-in tools (Read, Write, Bash, etc.).

### Where they live

```
~/.claude/mcp-servers/         # Installed server binaries
```

Configured via:
```bash
claude mcp add <name> node ~/.claude/mcp-servers/<name>/build/index.js
```

### How they work

```
Claude Code
  ├── Built-in tools
  │   ├── Read, Write, Edit
  │   ├── Bash, Grep, Glob
  │   └── Agent, Task, etc.
  │
  └── MCP tools (from MCP servers)
      ├── code-review-mcp
      │   ├── lint_file()
      │   ├── security_scan()
      │   └── analyze_complexity()
      ├── rag-mcp
      │   ├── index_codebase()
      │   ├── semantic_search()
      │   └── find_similar_code()
      └── testing-mcp
          ├── run_tests()
          └── get_coverage()
```

### Anatomy of an MCP server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({ name: "my-server", version: "1.0.0" });

// Register a tool
server.tool(
  "lint_file",
  { file_path: z.string() },
  async ({ file_path }) => {
    const results = await runLinter(file_path);
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  }
);

// Start listening
server.connect(new StdioServerTransport());
```

### MCP servers vs APIs

Both provide callable functions, but they're fundamentally different:

| | MCP Server | API |
|---|-----------|-----|
| **Runs where** | Your machine (local) | Remote server |
| **Who calls it** | Claude Code (via MCP protocol) | Any code (via HTTP) |
| **Protocol** | MCP (stdin/stdout or SSE) | HTTP / REST / GraphQL |
| **Auth** | None needed (local) | API keys, OAuth |
| **Latency** | Fast (local process) | Network-dependent |

An MCP server can **wrap** an external API to give Claude access to it:

```
Claude  -->  MCP tool call  -->  MCP Server  -->  HTTP  -->  External API
                                             <--  response  <--
```

### When to use MCP servers

- You want to give Claude a **new callable function** (lint, test, search, analyze)
- You need **structured input/output** (not just bash commands)
- You want to **wrap an external API** for Claude to use
- You need **complex processing** that doesn't fit in a bash one-liner

### When NOT to use MCP servers

- You just need Claude to follow a process -> use a Skill
- You need an autonomous specialist -> use an Agent
- You need to block/validate actions -> use a Hook

---

## 5. Plugins

### What they are

A plugin is a **distribution package** that bundles multiple building blocks into one installable unit. It's not a new concept — it's a **container** for agents, skills, hooks, commands, and settings.

### Where they live

```
Installed via: claude plugin add <github-repo-or-path>
```

### Anatomy of a plugin

```
my-plugin/
├── plugin.json              # Manifest (required)
├── agents/
│   ├── reviewer.md          # Agent definitions
│   └── fixer.md
├── skills/
│   └── review/SKILL.md      # Skill definitions
├── hooks/
│   └── pre-commit-lint.js   # Hook scripts
├── commands/
│   └── deploy.md            # Slash commands
└── settings.json            # Default configuration (v2.1.49)
```

### The manifest (`plugin.json`)

```json
{
  "name": "code-quality-suite",
  "version": "1.0.0",
  "description": "Comprehensive code quality tools",
  "components": {
    "agents": ["agents/reviewer.md", "agents/fixer.md"],
    "skills": ["skills/review/"],
    "hooks": ["hooks/pre-commit-lint.js"]
  }
}
```

### Plugins vs individual components

Without a plugin, you install components one by one:
```bash
cp agents/reviewer.md ~/.claude/agents/
cp agents/fixer.md ~/.claude/agents/
cp -r skills/review ~/.claude/skills/
cp hooks/pre-commit-lint.js ~/.claude/hooks/
# ... configure hooks in settings.json
```

With a plugin, one command:
```bash
claude plugin add github.com/user/code-quality-suite
```

### When to use plugins

- You want to **distribute** a set of related tools as one package
- You want **easy installation** for users (`claude plugin add`)
- You have components that **work together** and should be installed together
- You want to provide **default settings** out of the box

---

## How They Work Together

Here's a real-world flow showing all five building blocks working together:

```
Developer: "Review this PR and fix any issues"

1. [SKILL] /code-review triggers the review workflow
   └── Skill says: "Use the code-reviewer agent with these steps"

2. [AGENT] code-reviewer spawns as a subagent
   └── Agent reads files, analyzes code, identifies issues

3. [MCP SERVER] Agent calls lint_file() and security_scan()
   └── MCP server runs linters, returns structured results

4. [AGENT] Agent proposes fixes and writes code
   └── Before writing...

5. [HOOK] PreToolUse hook fires on the Write tool
   └── Hook validates the output against project rules
   └── Returns "allow" with additionalContext about style guidelines

6. [AGENT] Agent writes the fixed code

All of this was installed via one [PLUGIN]:
   claude plugin add github.com/team/code-quality-suite
```

### Interaction diagram

```
                    +-----------+
                    |  PLUGIN   |  Bundles & distributes
                    +-----+-----+
                          |
          +---------------+---------------+
          |               |               |
    +-----+-----+  +-----+-----+  +------+----+
    |   AGENT   |  |   SKILL   |  |   HOOK    |
    | specialist|  | workflow  |  | guardrail |
    +-----+-----+  +-----------+  +-----------+
          |
          | calls tools
          v
    +-----+-----+
    | MCP SERVER|
    | tool      |
    | provider  |
    +-----------+
```

---

## Decision Guide

### "I want to..."

| Goal | Use | Why |
|------|-----|-----|
| Give Claude new callable functions | **MCP Server** | Only way to add tools |
| Define a repeatable workflow | **Skill** | Instructions Claude follows step by step |
| Add an autonomous specialist | **Agent** | Works independently in separate context |
| Block dangerous operations | **Hook** | Automatic, silent enforcement |
| Validate code before it's written | **Hook** | PreToolUse event + validation script |
| Run multiple specialists in parallel | **Agents** | Each runs as independent subagent |
| Guide Claude through TDD | **Skill** | `/testing tdd` loads the recipe |
| Lint code on every file write | **Hook + MCP Server** | Hook triggers on Write, calls MCP lint tool |
| Ship a complete toolset | **Plugin** | Bundles everything into one install |
| Wrap an external API for Claude | **MCP Server** | Bridge between Claude and HTTP APIs |

### Complexity ladder

Start simple, add complexity only when needed:

```
Level 1: Skill          "Follow these instructions"
Level 2: Agent          "Here's a specialist to handle it"
Level 3: MCP Server     "Here's a new tool to call"
Level 4: Hook           "Here's an automatic guardrail"
Level 5: Plugin         "Here's everything bundled together"
```

### Quick comparison

| | Skill | Agent | Hook | MCP Server | Plugin |
|---|-------|-------|------|-----------|--------|
| **What** | Instructions | Specialist | Guardrail | Tool provider | Package |
| **Runs as** | In your context | Separate process | Shell script | Background process | N/A (container) |
| **Triggered by** | User (`/name`) | User/Claude/trigger | Events (auto) | Tool calls | Install-time |
| **Can write code** | Yes (via Claude) | Yes (independently) | No (blocks/allows) | No (returns data) | N/A |
| **Separate context** | No | Yes | No | N/A | N/A |
| **User visible** | Yes | Yes (result) | Usually not | Indirectly | Indirectly |
| **File location** | `~/.claude/skills/` | `~/.claude/agents/` | `~/.claude/hooks/` | `~/.claude/mcp-servers/` | `plugin.json` |
| **File format** | Markdown | Markdown/JSON | JSON + scripts | TypeScript/Python | JSON manifest |

---

## Real-World Examples

### Example 1: TDD Workflow

**Skill only** — simplest approach:
```
/testing tdd
```
Claude reads the skill and walks you through Red-Green-Refactor.

### Example 2: Automated Code Review

**Agent + MCP Server**:
- `code-reviewer` agent reads your code and identifies issues
- Agent calls `lint_file()` and `security_scan()` from the code-review MCP server
- Agent returns a structured review

### Example 3: Pre-Commit Safety

**Hook**:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "command": "bash check-no-secrets.sh"
    }]
  }
}
```
Every Bash command is checked for accidental secret exposure. No user action needed.

### Example 4: Full Quality Pipeline

**Plugin** containing everything:
```
code-quality-plugin/
├── plugin.json
├── agents/code-reviewer.md        # Does the review
├── skills/review/SKILL.md         # Defines the workflow
├── hooks/pre-commit-lint.js       # Blocks bad commits
└── (uses code-review-mcp server)  # Provides lint/scan tools
```

Install with one command:
```bash
claude plugin add github.com/team/code-quality-plugin
```

---

## Further Reading

- [Agents README](../agents/README.md) — Full agent catalog
- [Skills README](../skills/README.md) — All 14 skills
- [MCP Servers README](../mcp-servers/README.md) — 10 servers, 68+ tools
- [Agent Triggers](../docs/reference/agent-triggers-schema.md) — Automatic agent dispatch
- [Hello Protocol](../docs/reference/hello-protocol.md) — Universal tool handshake
- [Complete Guide](./complete-guide/00-ZERO-TO-HERO-GUIDE.md) — Zero-to-hero learning path

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**AI Assistance**: Created with the help of Claude Code (Anthropic)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
