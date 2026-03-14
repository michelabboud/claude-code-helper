# Claude Code Tools: Comprehensive Comparison Guide

## Quick Reference Table

| Tool | Activation | Scope | Context | Primary Use Case | Location |
|------|-----------|-------|---------|-----------------|----------|
| **Skills** | Auto-invoked by Claude | Claude.ai, Claude Code, API | Loads on-demand, minimal | Portable expertise that applies across multiple contexts | `.claude/skills/` or `~/.claude/skills/` |
| **Sub-agents** | Delegated by main agent | Claude Code only | Isolated context window | Parallel execution & context isolation | `.claude/agents/` or `~/.claude/agents/` |
| **MCP** | Tool calls | All Claude products | Shared with main agent | Connecting to external systems & data sources | `.mcp.json` or `~/.mcp.json` |
| **Slash Commands** | User types `/command` | Claude Code only | Main agent context | Repeatable workflows & shortcuts | `.claude/commands/` or `~/.claude/commands/` |
| **Hooks** | Lifecycle events | Claude Code only | N/A - runs scripts | Automatic enforcement & quality gates | `.claude/settings.json` (hooks section) |
| **Plugins** | Via `/plugin` command | Claude Code only | Varies by component | Bundled distribution of multiple components | `.claude-plugin/plugin.json` |
| **Agent SDK** | Programmatic API | Custom applications | Programmatic control | Building deployable autonomous agents | TypeScript/Python code |
| **CLAUDE.md** | Always loaded | Claude Code, Agent SDK | Global context | Project memory & persistent instructions | `CLAUDE.md` or `.claude/CLAUDE.md` |

---

## Detailed Tool Descriptions

### 1. Skills 🧠

**What it is:** Portable, reusable capabilities that Claude discovers and loads dynamically based on task relevance.

**Key Characteristics:**
- **Progressive Disclosure**: Claude only sees what it needs, when it needs it
- **Auto-invoked**: Claude automatically loads skills when description matches the conversation context
- **Can include executable code**: Not just documentation - can run Python scripts locally
- **Works everywhere**: Claude.ai, Claude Code, and API

**When to use:**
- Teaching expertise that multiple agents should share (e.g., "security review procedures")
- Providing documentation for libraries/frameworks
- Implementing automated context provision
- Creating "always-on" capabilities that apply without manual invocation

**Structure:**
```
my-skill/
├── SKILL.md          # Main documentation (required)
├── script.py         # Executable code (optional)
└── examples.txt      # Usage examples (optional)
```

**Example Use Cases:**
- PDF extraction and analysis
- Competitive analysis framework
- Technical writing standards
- Data analysis methods with pandas
- Company-specific coding standards

**Best Practices:**
- Keep descriptions clear and focused (name and description appear in every interaction)
- One skill should do one thing well
- Can be shared across teams via Skills marketplace
- Only install skills from trusted sources (they can execute code!)

---

### 2. Sub-agents 🤖

**What it is:** Specialized Claude instances with their own system prompts, tool permissions, and isolated context windows that the main agent can delegate to.

**Key Characteristics:**
- **Context isolation**: Each sub-agent has its own context window
- **Parallel execution**: Multiple sub-agents can work simultaneously
- **Purpose-built**: Designed for specific workflows with curated tool access
- **Claude Code only**: Not available in Claude.ai or raw API
- **Cannot spawn other sub-agents**: Prevents infinite nesting

**When to use:**
- Preventing context pollution in the main thread
- Heavy computational or research work
- Tasks requiring different tool permissions (e.g., read-only code review)
- Parallel operations (research OAuth while continuing to code)
- Specialized deep dives that need isolation

**Structure:**
```markdown
---
name: code-reviewer
description: Reviews code for quality and security
tools: Read, Grep, Glob  # No Write/Edit for safety
model: sonnet
permissionMode: default
skills: security-best-practices
---

You are a code reviewer specializing in security and best practices.
When invoked:
1. Read the specified files
2. Check for common vulnerabilities
3. Verify code quality standards
4. Return findings to main agent
```

**Built-in Sub-agents:**
- **Plan**: Used in plan mode for research and codebase exploration
- **Explore**: Fast, read-only agent for searching and analyzing codebases

**Example Use Cases:**
- Code reviewer with restricted permissions (no Write access)
- Data scientist for SQL/BigQuery analysis
- Security auditor
- Documentation writer
- Test generator

**Best Practices:**
- Keep sub-agent prompts concise and maintainable (100-500 lines)
- Sub-agents can access Skills - combine them for powerful results
- Use Claude-generated sub-agents as starting point, then iterate
- Each sub-agent counts toward your usage limits

---

### 3. MCP (Model Context Protocol) 🔌

**What it is:** Universal connection layer that standardizes how Claude connects to external tools and data sources.

**Key Characteristics:**
- **Standardized integrations**: Handles authentication and API calls automatically
- **Universal adapter**: Like USB-C for AI applications
- **Growing ecosystem**: Hundreds of community-built servers
- **Works everywhere**: Claude.ai, Claude Code, and API
- **Shared context**: MCP tools share the main agent's context

**When to use:**
- Connecting to databases (PostgreSQL, MongoDB)
- Integrating with APIs (GitHub, Google Drive, Slack, Asana)
- Accessing third-party services
- Custom tool integrations for your organization
- When you need Claude to interact with systems it can't natively access

**Configuration:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-token"
      }
    }
  }
}
```

**Popular MCP Servers:**
- **Filesystem**: Read/write local files
- **GitHub**: Repository operations, issues, PRs
- **Google Drive**: Search and fetch documents
- **Slack**: Search messages, send messages
- **Supabase**: Database operations
- **Playwright**: Browser automation
- **Context7**: Live documentation access
- **Zen**: High-tech utility belt (model debate, security audits)

**Best Practices:**
- Sub-agents can access MCP tools (inherit all by default)
- Configure per-project for different environments (dev vs prod databases)
- Review MCP server code before installation
- MCP tools appear as native commands to Claude

---

### 4. Slash Commands ⚡

**What it is:** User-initiated shortcuts that trigger predefined workflows or prompts.

**Key Characteristics:**
- **User-triggered**: You type `/command` to invoke them
- **Saved prompts**: Essentially reusable prompt templates
- **Project or global scope**: Can be specific to one project or available everywhere
- **Great UX**: Terminal autocomplete support
- **Can orchestrate**: Can invoke sub-agents or specific skills

**When to use:**
- Frequently-used workflows you want to start quickly
- Ensuring consistency in repetitive tasks
- Structured workflows that need specific steps
- As shortcuts to avoid typing the same thing repeatedly

**Structure:**
```markdown
---
description: Refactor code for better readability
allowed-tools: Read, Write, Edit
model: claude-sonnet-4-5-20250929
---

Refactor the selected code to improve:
- Readability and maintainability
- Remove code duplication
- Improve naming conventions
- Add helpful comments
```

**File Naming:**
- Filename becomes the command name
- `refactor.md` → `/refactor`
- In plugins: namespaced as `/plugin-name:command`

**Example Use Cases:**
- `/today` - Load daily task list
- `/refactor` - Code refactoring workflow
- `/security-scan` - Run vulnerability analysis
- `/create-skill` - Start skill creation workflow
- `/pr-review` - Automated PR review process

**Hybrid Pattern:**
- Slash command invokes sub-agent for planning
- Main Claude handles execution with full tool access
- Best of both worlds: structured workflow + full capabilities

---

### 5. Hooks 🪝

**What it is:** Event handlers that run bash scripts automatically at key points in Claude's workflow lifecycle.

**Key Characteristics:**
- **Event-driven**: Triggered by specific lifecycle events
- **Runs scripts**: Executes bash commands before/after events
- **Automatic enforcement**: No manual invocation needed
- **Quality gates**: Perfect for linting, testing, validation

**Available Hook Types:**
- **PreToolUse**: Before Claude uses a tool
- **PostToolUse**: After Claude uses a tool
- **Stop**: When Claude finishes responding
- **UserPromptSubmit**: When user submits a prompt (before processing)
- **SessionStart**: When a new session begins

**When to use:**
- Automatically enforce coding standards (linting)
- Run tests after code changes
- Quality checks before committing
- Calculate dates for task management
- Play notification sounds when Claude finishes
- Remind model about skills

**Configuration:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix $FILE"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay ~/notification.mp3"
          }
        ]
      }
    ]
  }
}
```

**Example Use Cases:**
- Auto-format code after every edit
- Run security scans on file changes
- Update date calculations at session start
- Play sounds when tasks complete
- Validate file changes meet standards
- Run "Do more" prompt automatically (continuous operation)

**Best Practices:**
- Start with simple hooks, add complexity as needed
- Test hooks thoroughly before deploying to team
- Use PreToolUse hooks to prevent issues
- Use PostToolUse hooks to fix issues after they occur

---

### 6. Plugins 📦

**What it is:** Bundled packages that combine slash commands, sub-agents, skills, hooks, and MCP servers into a single distributable unit.

**Key Characteristics:**
- **All-in-one**: Bundles multiple components together
- **Easy distribution**: Install with single `/plugin` command
- **Namespaced**: Prevents conflicts between plugins
- **Versioned**: Proper version management
- **Marketplace support**: Curated collections for discovery

**When to use:**
- Sharing complete workflows across team/community
- Packaging related functionality together
- Team standardization and consistency
- Distributing opinionated setups
- When you have 3+ related components to share

**Structure:**
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json      # Required manifest
├── commands/            # Slash commands (optional)
│   └── custom.md
├── agents/             # Sub-agents (optional)
│   └── specialist.md
├── skills/            # Skills (optional)
│   └── my-skill/
│       └── SKILL.md
├── hooks/            # Hooks (optional)
│   └── hooks.json
├── .mcp.json        # MCP servers (optional)
└── README.md        # Documentation
```

**Installation:**
```bash
# From marketplace
/plugin install anthropics/skills-toolkit

# From GitHub
/plugin install github:username/plugin-name

# Local development
claude-code --plugin-dir ./my-plugin
```

**Official Plugins:**
- **skills-toolkit**: Tools for creating skills
- **pr-reviews**: Comprehensive PR review agents
- **security-guidance**: Security monitoring with hooks
- **agent-sdk-dev**: Development toolkit for Agent SDK
- **frontend-design**: High-quality UI design skill

**Best Practices:**
- Start with standalone config in `.claude/`, convert to plugin when ready to share
- Include comprehensive README
- Version your plugins properly
- Review plugin code before installation (can execute code!)

---

### 7. Agent SDK 🏗️

**What it is:** Framework for building deployable, autonomous agents with full decision loops programmatically.

**Key Characteristics:**
- **Production-ready**: Built-in error handling, session management
- **Programmatic control**: TypeScript/Python API
- **Full agentic loop**: Perception → reasoning → action → evaluation
- **All Claude Code features**: Sub-agents, skills, hooks, MCP, slash commands
- **Hosted separately**: For autonomous agents, not interactive sessions

**When to use:**
- Building deployed agents that run independently
- Creating specialized agents for specific business processes
- Long-running autonomous tasks
- Production applications requiring reliability
- When you need programmatic control over agent behavior

**Architecture Components:**
1. **Perception**: Gathering information via tools and MCP
2. **Code Generation**: Creating executable solutions
3. **Evaluation**: Rules-based feedback, visual feedback, heuristics
4. **Context Management**: Automatic compaction and management
5. **Sub-agents**: Parallelization and context isolation

**Example Use Cases:**
- Email agent that processes incoming messages
- Legal assistant reviewing contracts
- Finance advisor analyzing reports
- Customer support agent resolving issues
- Automated code review systems
- Continuous deployment agents

**Key Methods:**
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

// Basic query
for await (const message of query({
  prompt: "Analyze this codebase",
  options: {
    maxTurns: 5,
    settingSources: ['project'],
    plugins: [{ type: 'local', path: './my-plugin' }]
  }
})) {
  if (message.type === 'assistant') {
    console.log(message.content);
  }
}
```

**Best Practices:**
- Start with Claude Code, migrate to SDK for deployment
- Implement comprehensive evaluation feedback
- Use sub-agents for context management
- Set up proper session management
- Monitor costs and usage

---

### 8. CLAUDE.md 📝

**What it is:** Project or user-level memory files that provide persistent context across sessions.

**Key Characteristics:**
- **Always loaded**: Automatically included in every session
- **Project or user scope**: Can be per-project or global
- **Persistent instructions**: Maintains context across conversations
- **Simple text file**: Just markdown, no special format required

**When to use:**
- Defining project-specific guidelines
- Documenting architecture decisions
- Setting up persistent preferences
- Providing codebase context
- Establishing coding standards

**Locations:**
- **Project**: `CLAUDE.md` or `.claude/CLAUDE.md`
- **User**: `~/.claude/CLAUDE.md`
- **Must enable**: Set `settingSources: ['project']` in SDK

**Example Content:**
```markdown
# Project: Workout Tracker App

## Tech Stack
- React Native with Expo
- Dexie.js for local database
- TypeScript

## Coding Standards
- Use functional components with hooks
- Follow ESLint configuration
- Write tests for business logic
- Use Tailwind for styling

## Architecture
- Feature-based folder structure
- Shared components in /components
- Database operations in /db
```

**Best Practices:**
- Keep it concise and relevant
- Update as project evolves
- Include file structure overview
- Document unusual patterns or decisions
- Specify preferred libraries and patterns

---

## Decision Framework: Which Tool Should I Use?

### Use **Skills** when:
- ✅ Multiple agents/conversations need the same expertise
- ✅ You want automatic, context-driven behavior
- ✅ Knowledge should work across Claude.ai, Claude Code, and API
- ✅ You need portable, reusable capabilities
- ❌ NOT for: Single-use workflows or project-specific instructions

### Use **Sub-agents** when:
- ✅ You need parallel execution
- ✅ Context isolation is important (prevent pollution)
- ✅ Different tool permissions required (read-only review)
- ✅ Specialized deep dives needed
- ❌ NOT for: Shared expertise (use Skills instead)

### Use **MCP** when:
- ✅ Connecting to external systems/APIs
- ✅ Accessing databases
- ✅ Integrating third-party services
- ✅ Custom tool integrations needed
- ❌ NOT for: Task orchestration (use sub-agents)

### Use **Slash Commands** when:
- ✅ You have frequently-used workflows
- ✅ You want quick shortcuts
- ✅ Starting structured processes
- ✅ Need terminal autocomplete
- ❌ NOT for: Automatic behaviors (use Skills/Hooks)

### Use **Hooks** when:
- ✅ Automatically enforcing standards
- ✅ Quality gates needed
- ✅ Running checks after specific events
- ✅ Automating repetitive tasks
- ❌ NOT for: User-initiated workflows (use Commands)

### Use **Plugins** when:
- ✅ Bundling 3+ related components
- ✅ Sharing across teams/community
- ✅ Team standardization needed
- ✅ Distribution is important
- ❌ NOT for: Personal/project configs (use `.claude/` directly)

### Use **Agent SDK** when:
- ✅ Building deployed autonomous agents
- ✅ Need programmatic control
- ✅ Production reliability required
- ✅ Long-running independent tasks
- ❌ NOT for: Interactive terminal usage (use Claude Code)

### Use **CLAUDE.md** when:
- ✅ Project-wide context needed
- ✅ Persistent instructions required
- ✅ Documenting architecture
- ✅ Setting project standards
- ❌ NOT for: Complex workflows (use Skills/Commands)

---

## How They Work Together

### Example: Comprehensive Development Workflow

```
1. CLAUDE.md provides project context
   ↓
2. User types /feature-dev (Slash Command)
   ↓
3. Command invokes planning sub-agent
   ↓
4. Planning sub-agent uses:
   - MCP to search GitHub for similar features
   - Skills for architecture patterns
   ↓
5. Main agent executes plan
   ↓
6. PostToolUse Hook runs linter after code changes
   ↓
7. User types /review (Slash Command)
   ↓
8. Code-review sub-agent (read-only) checks code
   ↓
9. Security-guidance Skill provides security recommendations
   ↓
10. Stop Hook plays notification sound
```

### Real-World Scenario: Building a Feature

**Phase 1: Research**
- Main agent delegates to **Explore sub-agent** (parallel)
- Sub-agent uses **MCP** (GitHub) to find similar implementations
- **Skill** (competitive-analysis) provides framework
- **CLAUDE.md** keeps project context available

**Phase 2: Implementation**
- Main agent writes code
- **Skills** (coding-standards) guide implementation
- **PostToolUse Hook** runs linter after each file edit
- **MCP** (Supabase) for database operations

**Phase 3: Review**
- **Slash command** `/review` triggers workflow
- **Code-review sub-agent** (read-only tools) checks quality
- **Security-guidance Skill** provides recommendations
- **PreToolUse Hook** prevents commits without tests

**Phase 4: Distribution**
- Package everything as **Plugin** for team
- Share via marketplace
- Team installs with `/plugin install`

---

## Migration Paths

### From Simple to Complex

**Level 1: Getting Started**
- Start with `CLAUDE.md` for project context
- Use built-in sub-agents (Plan, Explore)
- Try a few MCP servers (GitHub, filesystem)

**Level 2: Adding Structure**
- Create custom slash commands for repetitive workflows
- Add simple hooks for linting/formatting
- Install useful plugins from marketplace

**Level 3: Custom Workflows**
- Build custom sub-agents for specialized tasks
- Create custom skills for shared expertise
- Combine commands + sub-agents + skills

**Level 4: Team Distribution**
- Package as plugin for team use
- Set up team marketplace
- Standardize workflows across organization

**Level 5: Production Deployment**
- Migrate to Agent SDK for autonomous agents
- Implement comprehensive evaluation
- Deploy as standalone service

---

## Common Patterns

### Pattern 1: Command → Sub-agent → Skill
```
/security-audit (command)
  → invokes security-auditor (sub-agent)
    → uses security-patterns (skill)
      → leverages secaudit (MCP tool)
```

### Pattern 2: Parallel Research
```
Main agent receives complex task
  → spawns 3 Explore sub-agents (parallel)
    → each uses different MCP (GitHub, Docs, Stack Overflow)
  → agents return findings
    → main agent synthesizes
```

### Pattern 3: Quality Pipeline
```
Write code
  → PostToolUse Hook (linter)
    → if pass: continue
    → if fail: auto-fix
  → Stop Hook (run tests)
    → notify results
```

### Pattern 4: Expert Team
```
Main agent (orchestrator)
  → Kevin (architect sub-agent) + design-patterns skill
  → Dave (test-writer sub-agent) + testing skill
  → Stuart (reviewer sub-agent) + secaudit MCP
    → all coordinated through slash commands
```

---

## Troubleshooting

### "Claude isn't using my skill"
- Check skill description is clear and specific
- Skills are auto-invoked based on relevance
- Try being more explicit: "use the X skill to..."
- Verify skill is in correct directory

### "Sub-agent isn't showing up"
- Check file is in `.claude/agents/` or `~/.claude/agents/`
- Verify frontmatter is valid YAML
- Try `/agents` command to see available agents
- Restart Claude Code session

### "Hook isn't triggering"
- Verify hooks configuration in settings.json
- Check matcher regex is correct
- Test bash command independently first
- Look for errors in Claude Code output

### "MCP tool not available"
- Check .mcp.json is valid JSON
- Verify MCP server package is installed
- Check environment variables are set
- Restart Claude Code session

### "Plugin install fails"
- Verify plugin structure has .claude-plugin/plugin.json
- Check plugin path is correct
- Try using absolute path
- Look for manifest validation errors

---

## Resources

### Official Documentation
- [Claude Code Docs](https://code.claude.com/docs)
- [Agent SDK Reference](https://docs.claude.com/en/docs/agent-sdk/overview)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Skills Documentation](https://claude.com/blog/skills-explained)

### Community Resources
- [Awesome Claude Code Plugins](https://github.com/ccplugins/awesome-claude-code-plugins)
- [Claude Code GitHub](https://github.com/anthropics/claude-code)
- [Skills Marketplace](https://github.com/anthropics/skills)

### Example Plugins
- [Skills Toolkit](https://github.com/anthropics/claude-code/tree/main/plugins/skills-toolkit)
- [PR Reviews](https://github.com/anthropics/claude-code/tree/main/plugins/pr-reviews)
- [Security Guidance](https://github.com/anthropics/claude-code/tree/main/plugins/security-guidance)

---

## Quick Reference Cheat Sheet

| I want to... | Use... |
|-------------|--------|
| Share expertise across agents | **Skill** |
| Run tasks in parallel | **Sub-agent** |
| Connect to external API | **MCP** |
| Create a shortcut | **Slash Command** |
| Auto-run checks | **Hook** |
| Bundle everything | **Plugin** |
| Build autonomous agent | **Agent SDK** |
| Add project context | **CLAUDE.md** |

---

## Final Thoughts

The Claude Code ecosystem is designed for progressive complexity:
- Start simple with CLAUDE.md and built-in features
- Add commands and skills as you find patterns
- Build sub-agents for specialized work
- Package as plugins to share
- Scale to Agent SDK for production

Each tool has a specific purpose, and they're most powerful when combined thoughtfully. Don't try to use everything at once - start with what solves your immediate need, then expand as you discover more use cases.

The key insight: **These aren't competing approaches—they're complementary tools for different needs.**

---

*Last updated: January 2026*
*Based on Claude Code 2.0 and Agent SDK documentation*
