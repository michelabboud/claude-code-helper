# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is **claude-code-helper** - a comprehensive toolkit and learning resource for mastering Claude Code. It contains guides, examples, MCP servers, configuration bundles, and templates that help users learn and optimize their Claude Code experience.

### Purpose
- Teaching resource for Claude Code features (Skills, Agents, Commands, Hooks, MCP, Plugins)
- Production-ready configurations and tools
- Example implementations for all Claude Code tool types
- MCP servers for code quality automation
- **Distribution source for Claude Code agents** - This repo maintains a comprehensive collection of useful agents that users install to their `~/.claude/agents/` directory

### CRITICAL: Agent Preservation Policy

**NEVER remove agents from this repository**, even if they duplicate Claude Code's built-in agents.

**Why duplicates exist and must be kept:**
1. **This repo is a distribution source** - Users install agents from here to `~/.claude/agents/`
2. **Customization** - Custom agents can have different prompts, tools, or model preferences than built-in equivalents
3. **Backward compatibility** - Existing users depend on these agents being available
4. **Documentation value** - Example agents serve as learning resources and templates
5. **Independence from Claude Code updates** - Built-in agents may change; repo agents remain stable
6. **Offline reference** - Users can study agent patterns without running Claude Code

**Current agent inventory:**
- **47 agent files** in `agents/` directory (34 domain-experts + 13 MCP-integrated)
- **2 agent files** in `config-bundle/agents/` (planner, implementer)
- **33 agents** overlap with Claude Code built-in agents (this is intentional)
- **All agents are valuable** - duplicates included

## Repository Structure

```
claude-code-helper/
├── README.md                  # Main entry point
├── QUICKSTART.md             # Quick setup guide
├── CLAUDE.md                 # AI instructions (this file)
├── CHANGELOG.md              # Version history
├── TOOLS-INDEX.md            # Complete catalog of all tools
│
├── agents/                   # PRIMARY: Agent distribution
│   ├── domain-experts/       # 34 specialized .md agents
│   ├── mcp-integrated/       # 13 .json agents using MCP tools
│   └── README.md
│
├── skills/                   # PRIMARY: Skills distribution
│   └── [16 skill files/dirs]
│
├── commands/                 # PRIMARY: Commands distribution
│   └── [6 command files]
│
├── hooks/                    # PRIMARY: Hooks distribution
│   └── [5 hook files]
│
├── plugins/                  # PRIMARY: Plugins distribution
│   └── [7 plugin files]
│
├── integrations/             # PRIMARY: Integration examples
│   └── [3 integration files]
│
├── docs/                     # Documentation (organized)
│   ├── mcp-configs/          # Third-party MCP server configs
│   ├── releases/             # Release notes (v1.3.0 - v1.7.0)
│   ├── reference/            # Reference docs, guides, tools
│   └── reports/              # Audit reports, statistics
│
├── mcp-servers/              # MCP server implementations
│   └── [10 TypeScript servers]
│
├── guides/                   # Learning documentation
│   ├── complete-guide/       # Zero-to-hero learning path
│   ├── subagents-guide/      # Advanced agent patterns
│   └── advanced-patterns/    # Advanced usage patterns
│
├── config-bundle/            # Production-ready global config
└── templates/                # Starter templates
```

## Key Architectural Patterns

### 1. Primary Distribution Directories
The main distributable content is now at root level:
- **agents/**: All agent files (domain-experts + MCP-integrated)
- **skills/**: All skill files
- **commands/**: All command files
- **hooks/**: All hook files
- **plugins/**: All plugin files
- **integrations/**: Integration examples

Users install from these directories to their `~/.claude/` directory.

### 2. Installation Pattern
Most components use `install-all.sh` scripts that:
- Copy files to `~/.claude/` (global Claude Code config directory)
- Set proper permissions (especially for .sh scripts)
- Provide configuration output for Claude Desktop

Standard installation paths:
- Agents: `~/.claude/agents/`
- Skills: `~/.claude/skills/`
- Commands: `~/.claude/commands/`
- Hooks: `~/.claude/hooks/`
- Status lines: `~/.claude/statuslines/`
- Global config: `~/.claude/settings.json` and `~/.claude/CLAUDE.md`

### 3. MCP Server Architecture
MCP servers are TypeScript/Node.js projects that provide specialized tools:
- Located in `mcp-servers/` directory
- Each has its own package.json and build process
- Must be built with `npm run build` before use
- Output to `build/index.js`
- Configured in Claude Desktop's `claude_desktop_config.json`

Available MCP servers (9 total, 30+ tools):

**Production-Ready Servers** (5 servers with agent configs):
- **api-specialist-mcp** (8 tools): API testing, validation, security, docs
- **code-review-mcp** (4 tools): Linting, security scanning, complexity
- **design-system-mcp** (5 tools): Token validation, component checks, accessibility
- **testing-mcp** (4 tools): Test execution, coverage, quality analysis
- **uiux-review-mcp** (9 tools): Design review, accessibility, wireframes

**Experimental Servers** (4 servers):
- **cicd-pipeline**: CI/CD pipeline automation and workflow management
- **database-operations**: Database migrations, queries, and schema management
- **dependency-management**: Dependency analysis, updates, and vulnerability scanning
- **n8n-automation**: n8n workflow automation and integration

## Common Development Commands

### Testing and Validation
```bash
# Test config-bundle installation
cd config-bundle && ./scripts/test-setup.sh

# Verify MCP server builds
cd mcp-servers/[server-name]
npm run build
npm test

# Install all components
cd config-bundle && ./scripts/install-all.sh
cd mcp-servers && ./install-all.sh
cd guides/subagents-guide && ./install-all-agents.sh
```

### Working with MCP Servers
```bash
# Build individual server
cd mcp-servers/[server-name]
npm install
npm run build

# Build all servers
cd mcp-servers
./install-all.sh

# Test server standalone
cd mcp-servers/[server-name]
node build/index.js
```

### Documentation Navigation
```bash
# Main entry points
cat README.md                           # Repository overview
cat TOOLS-INDEX.md                      # Complete catalog of all tools
cat guides/README.md                    # Learning resources
cat mcp-servers/README.md              # MCP servers docs

# Quick starts
cat QUICKSTART.md                       # Fast setup
cat config-bundle/README.md            # Config bundle guide
```

## File Type Conventions

### Agent Files (.md or .json)
- **Domain experts**: Markdown files with YAML frontmatter in `agents/domain-experts/`
- **MCP agents**: JSON files referencing MCP server tools in `agents/mcp-integrated/`
- Install to: `~/.claude/agents/`

### Skill Files (SKILL.md)
- Markdown files in `skills/[skill-name]/SKILL.md` structure
- May include additional resources in same directory
- Install to: `~/.claude/skills/`

### Command Files (.md or .sh)
- Markdown for command logic or shell scripts for execution
- Located in: `commands/`
- Install to: `~/.claude/commands/`

### Status Line Scripts (.sh)
- Bash scripts that output terminal status line content
- Must be executable (`chmod +x`)
- Location: `~/.claude/statuslines/`

### Hook Scripts
- Event-driven automation scripts
- Location: `~/.claude/hooks/`

## Important File Locations

### Claude Desktop Configuration
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Claude Code Configuration
- Global: `~/.claude/`
- Project: `./.claude/` (in project root)

## Repository-Specific Notes

### Do NOT Commit
- `dup/` directory (already in .gitignore) - contains duplicates for review
- Personal customizations in root-level directories (agents/, commands/, etc.)
- Node modules in MCP servers
- API keys or secrets
- Build artifacts (`mcp-servers/*/build/`)

### Documentation Maintenance
When updating content:
- Update corresponding README.md files
- Maintain consistency between root-level content and config-bundle/ versions
- Keep main README.md navigation structure updated
- Verify all install scripts work after changes

### MCP Server Development
When modifying MCP servers:
- Update package.json version if making breaking changes
- Test with `npm run build && node build/index.js`
- Update server's README.md with new tools
- Update main mcp-servers/README.md with tool counts
- Regenerate configuration in install-all.sh

### Testing Changes
Before committing:
```bash
# Test config-bundle
cd config-bundle && ./scripts/test-setup.sh

# Verify all install scripts work
./scripts/install-all.sh
cd mcp-servers && ./install-all.sh
cd guides/subagents-guide && ./install-all-agents.sh

# Check markdown formatting
# Ensure all READMEs have proper navigation links
```

## User Workflow Patterns

### For Beginners
1. Read `guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md`
2. Install config-bundle: `cd config-bundle && ./scripts/install-all.sh`
3. Copy agents from `agents/` to `~/.claude/agents/`

### For Intermediate Users
1. Explore agents in `agents/domain-experts/` and `agents/mcp-integrated/`
2. Install skills from `skills/`
3. Set up MCP servers: `cd mcp-servers && ./install-all.sh`

### For Advanced Users
1. Study orchestration patterns in `guides/subagents-guide/patterns/`
2. Customize templates from `templates/`
3. Build custom MCP servers (reference existing ones in `mcp-servers/`)

## Common Issues and Solutions

### Status Line Not Showing
```bash
chmod +x ~/.claude/statuslines/*.sh
# Restart Claude Code
```

### MCP Server Not Loading
- Verify build succeeded: check for `build/index.js`
- Check Claude Desktop config has correct absolute paths
- Restart Claude Desktop after config changes
- Check Node.js version >= 18

### Agents Not Triggering
- Verify agent file is in `~/.claude/agents/`
- Check agent description clearly matches use case
- Ensure YAML frontmatter is properly formatted

### Install Script Fails
- Check file permissions: `chmod +x scripts/*.sh`
- Verify `~/.claude/` directory exists: `mkdir -p ~/.claude`
- Check for sufficient disk space

## Special Notes

### WSL Multi-User Setup
The `wsl-setup/` directory contains scripts for running separate API vs Subscription user accounts in WSL:
- `create-users.sh`: Creates claude-api and claude-pro users
- `setup-api-user.sh`: Configures API key user
- `setup-pro-user.sh`: Configures subscription user

### Model Transparency Features
The config-bundle implements model transparency:
- Status line shows current model (🔵 SONNET, 🟣 OPUS, etc.)
- Model prefixes in responses ([sonnet], [opus], etc.)
- `/observability` command to toggle features
- Auto-switching between models for planning vs implementation

### Integration Example
`guides/subagents-guide/INTEGRATION-EXAMPLE.md` shows complete authentication system implementation using multiple coordinated agents - valuable reference for multi-agent workflows.

## Contributing Guidelines

When adding new content:
1. Place agents in `agents/domain-experts/` or `agents/mcp-integrated/`
2. Place skills in `skills/`
3. Place commands in `commands/`
4. Add template version to `templates/` if creating new pattern
5. Update relevant README.md files
6. Include installation instructions
7. Test installation process

## Latest Claude Code Features (v2.1.22)

### Structured Outputs Fix (v2.1.22)
Fixed structured outputs for non-interactive (`-p`) mode.

### VSCode Python Environment Activation (v2.1.21)
Added automatic Python virtual environment activation via `claudeCode.usePythonEnvironment` setting in VSCode.

### Full-Width Number Input Support (v2.1.21)
Added support for full-width (zenkaku) number input from Japanese IME.

### PR Review Status Indicator (v2.1.20)
PR review status indicator now appears in the prompt footer when working on pull requests.

### Task Deletion (v2.1.20)
Tasks can now be deleted via the TaskUpdate tool by setting status to `deleted`.

### Permission Rules Update (v2.1.20)
Permission rules like `Bash(*)` are now accepted as equivalent to `Bash`, providing more flexible permission configuration.

### Config Backups (v2.1.20)
Configuration backups are now timestamped and rotated, keeping the 5 most recent backups.

### Background Agent Permissions (v2.1.20)
Background agents now prompt for tool permissions before launching, improving security and control.

### Argument Syntax Update (v2.1.19)
- **Breaking**: Indexed argument syntax changed from `$ARGUMENTS.0` to `$ARGUMENTS[0]` (bracket syntax)
- **New**: Shorthand `$0`, `$1`, etc. for accessing individual arguments in custom commands
- Environment variable `CLAUDE_CODE_ENABLE_TASKS` - set to `false` to disable new task system

### Task Management System (v2.1.16)
New comprehensive task management system with dependency tracking. Tasks can have `blockedBy` relationships and status progression (`pending` → `in_progress` → `completed`).

### VSCode Plugin Management (v2.1.16)
Native plugin management support in VSCode extension, plus ability for OAuth users to browse/resume remote Claude sessions.

### npm Installation Deprecated (v2.1.15)
npm installation (`npm install -g @anthropic-ai/claude-code`) is deprecated and shows a warning. Recommended: `curl -fsSL https://claude.ai/install.sh | sh` or see https://docs.anthropic.com/en/docs/claude-code/getting-started

### Bash History Autocomplete (v2.1.14)
Added history-based autocomplete in bash mode (`!`) - press Tab to complete from bash history.

### Plugin Commit Pinning (v2.1.14)
Support for pinning plugins to specific git commit SHAs for version control.

### Customizable Keyboard Shortcuts (v2.1.7)
Configure custom keybindings via `~/.claude/keybindings.json`. Run `/keybindings` to get started with customizing your keyboard shortcuts.

### Plans Directory Customization (v2.1.9)
Use the `plansDirectory` setting to customize where plan files are stored, giving you control over project organization.

### Session ID in Skills (v2.1.9)
Skills can now access the current session ID using `${CLAUDE_SESSION_ID}` string substitution, enabling session-aware skill behavior.

### Enhanced PreToolUse Hooks (v2.1.9)
PreToolUse hooks can now return `additionalContext` to inject context into tool execution, providing more control over tool behavior.

### MCP Tool Search Auto Mode (v2.1.7)
MCP tool search is now auto-enabled by default. When MCP tool descriptions exceed 10% of context window, they're automatically deferred and discovered via MCPSearch tool. Configure threshold with `auto:N` syntax where N is context window percentage (0-100).

### Skill Auto-Discovery (v2.1.6)
Skills are automatically discovered from nested `.claude/skills` directories when working with files in subdirectories, improving project organization.

### Enhanced Status Line Fields (v2.1.6)
New context window fields available for status lines:
- `context_window.used_percentage`
- `context_window.remaining_percentage`

### Config Search (v2.1.6)
The `/config` command now has search functionality for filtering settings quickly.

### Stats Date Range Filtering (v2.1.6)
Press `r` in `/stats` to cycle between Last 7 days, Last 30 days, and All time.

### Environment Variables (v2.1.4-2.1.5)
- `CLAUDE_CODE_TMPDIR` - Override temp directory for internal temp files
- `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` - Disable background task functionality

### Unified Skills and Commands (v2.1.3)
Claude Code has merged the conceptual distinction between skills and commands - they now share a simplified mental model with no behavior changes. Both can be invoked with `/name` syntax and both support the same frontmatter options.

### Automatic Skill Hot-Reload
Skills in `~/.claude/skills/` or `.claude/skills/` update instantly without restarting Claude Code. This enables rapid iteration during skill development - just save your changes and they're immediately available.

### Extended Hook Timeout
Tool hooks now have a 10-minute timeout (extended from 60 seconds), allowing for longer-running validation, security scans, and build processes in PreToolUse, PostToolUse, and other hook events.

### Frontmatter Hook Support
Hooks can now be defined directly in agent, skill, and command frontmatter using the `hooks` field. This provides inline event handling without separate hook files:

```yaml
---
name: my-skill
hooks:
  PreToolUse: |
    # Inline hook logic here
---
```

### Forked Sub-Agent Context
Skills can specify `context: fork` in frontmatter to execute in a forked context, providing isolation from the main conversation while maintaining access to necessary tools.

### Agent Field in Skills
Skills can specify which agent type should execute them using the `agent` field in frontmatter, enabling automatic agent selection for specialized tasks.

### Named Session Management
Use `/rename` to name your session and `claude --resume <name>` to resume by name instead of session ID. This makes it easier to manage multiple projects and return to specific work contexts.

### Background Agent Support
Press `Ctrl+B` to background long-running tasks and agents. This unified backgrounding allows you to continue working while previous tasks complete in the background.

### Remote Session Management
For claude.ai subscribers, `/teleport` and `/remote-env` commands enable remote session management, allowing seamless transitions between local and remote development environments.

### LSP Tool Integration
Claude Code now includes Language Server Protocol (LSP) tool integration, providing code intelligence features like go-to-definition, find references, and symbol search directly within Claude's context.

### Release Channel Toggle
Use `/config` to toggle between `stable` or `latest` release channels, giving you control over when you adopt new features versus maintaining stability.

## Quick Reference

### Key Files to Read First
1. `README.md` - Start here for complete overview
2. `QUICKSTART.md` - 5-minute setup guide
3. `guides/README.md` - Learning path navigation
4. `agents/README.md` - Agent catalog
5. `docs/reference/` - Reference documentation

### Most Commonly Used Scripts
- `config-bundle/scripts/install-all.sh` - Install production config
- `mcp-servers/install-all.sh` - Build and configure MCP servers
- `guides/subagents-guide/install-all-agents.sh` - Install example agents
- `config-bundle/scripts/test-setup.sh` - Verify installation

### Entry Points for Different Tasks
- **Learning Claude Code**: `guides/complete-guide/`
- **Installing agents**: `agents/`
- **Installing skills**: `skills/`
- **Installing commands**: `commands/`
- **Setting up production config**: `config-bundle/`
- **Creating custom tools**: `templates/`
- **Installing MCP servers**: `mcp-servers/`
- **Reference documentation**: `docs/reference/`
