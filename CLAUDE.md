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
- **58 agent files** committed across `examples/agents/`, `examples/sub-agents/`, and `config-bundle/agents/`
- **33 agents** overlap with Claude Code built-in agents (this is intentional)
- **14 MCP-integrated JSON agents** provide unique functionality through MCP servers
- **All agents are valuable** - duplicates included

## Repository Structure

```
claude-code-helper/
├── guides/                    # Learning documentation
│   ├── complete-guide/        # Zero-to-hero learning path
│   ├── subagents-guide/       # Advanced agent patterns
│   └── advanced-patterns/     # Advanced usage patterns
├── mcp-servers/               # 9 MCP servers (TypeScript/Node.js)
├── examples/                  # Ready-to-use examples
│   ├── agents/               # MCP agents + sub-agents
│   ├── skills/               # Reusable skills
│   ├── commands/             # Slash commands
│   ├── hooks/                # Event automation
│   ├── plugins/              # Complete packages
│   ├── mcp/                  # MCP configurations
│   ├── integrations/         # Integration examples
│   └── sub-agents/           # Sub-agent examples
├── templates/                 # Starter templates
├── config-bundle/            # Production-ready global config
└── scripts/                  # Installation utilities
```

## Key Architectural Patterns

### 1. Dual-Purpose Directories
Many directories (agents/, commands/, skills/, statuslines/) exist in:
- **Root level**: User's personal customizations (not tracked in git)
- **examples/**: Example implementations to copy
- **config-bundle/**: Production-ready bundles
- **templates/**: Blank starter templates

Users copy from examples/config-bundle/templates to their `~/.claude/` directory or root-level working directories.

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
cat guides/README.md                    # Learning resources
cat examples/README.md                  # Examples overview
cat mcp-servers/README.md              # MCP servers docs

# Quick starts
cat QUICKSTART.md                       # Fast setup
cat config-bundle/README.md            # Config bundle guide
```

## File Type Conventions

### Agent Files (.md or .json)
- **Sub-agents**: Markdown files with YAML frontmatter (name, description, tools, model)
- **MCP agents**: JSON files referencing MCP server tools
- Location: `~/.claude/agents/` or `examples/agents/`

### Skill Files (SKILL.md)
- Markdown files in `skills/[skill-name]/SKILL.md` structure
- May include additional resources in same directory
- Location: `~/.claude/skills/` or `examples/skills/`

### Command Files (.md or .sh)
- Markdown for command logic or shell scripts for execution
- Location: `~/.claude/commands/` or `examples/commands/`

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
When updating examples or guides:
- Update corresponding README.md files
- Maintain consistency between examples/ and config-bundle/ versions
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
3. Try basic examples from `examples/`

### For Intermediate Users
1. Install sub-agents: `cd guides/subagents-guide && ./install-all-agents.sh`
2. Explore agent examples in `examples/agents/`
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
1. Place examples in appropriate `examples/` subdirectory
2. Add template version to `templates/` if creating new pattern
3. Update relevant README.md files
4. Include installation instructions
5. Test installation process
6. Add to main README.md if significant addition

## Latest Claude Code Features (v2.1.3+)

### Unified Skills and Commands
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
4. `examples/README.md` - Examples by type
5. `REORGANIZATION-COMPLETE.md` - Recent structure changes

### Most Commonly Used Scripts
- `config-bundle/scripts/install-all.sh` - Install production config
- `mcp-servers/install-all.sh` - Build and configure MCP servers
- `guides/subagents-guide/install-all-agents.sh` - Install example agents
- `config-bundle/scripts/test-setup.sh` - Verify installation

### Entry Points for Different Tasks
- **Learning Claude Code**: `guides/complete-guide/`
- **Setting up production config**: `config-bundle/`
- **Finding example code**: `examples/`
- **Creating custom tools**: `templates/`
- **Installing MCP servers**: `mcp-servers/`
- **Understanding architecture**: `mcp-servers/ARCHITECTURE.md`
