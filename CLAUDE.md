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
- **50 agent files** in `agents/` directory (37 domain-experts + 13 MCP-integrated)
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
├── skills/                   # PRIMARY: Skills distribution (13 skills)
│   └── [13 skill files/dirs]
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
│   ├── releases/             # Release notes (v1.3.0 - v1.9.0)
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
├── dashboard/                # Multi-repo monitoring dashboard (npm run dev)
├── config-bundle/            # Production-ready global config
└── templates/                # Starter templates
```

## Key Architectural Patterns

### 1. Primary Distribution Directories
The main distributable content is now at root level:
- **agents/**: All agent files (domain-experts + MCP-integrated)
- **skills/**: All skill files (since v2.1.3, commands are unified into skills)
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
# Build and install all servers to ~/.claude/mcp-servers/
cd mcp-servers
./install-all.sh

# Update a single server (builds in repo, copies to ~/.claude/)
./scripts/update-component.sh mcp-servers/[server-name]

# Test server standalone (from installed location)
node ~/.claude/mcp-servers/[server-name]/build/index.js
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
- **`references` field**: All agents should include 2-4 official doc URLs for auto-refresh via `/refresh`
- Install to: `~/.claude/agents/`

### Skill Files (SKILL.md)
- Markdown files in `skills/[skill-name]/SKILL.md` structure
- May include additional resources in same directory
- Install to: `~/.claude/skills/`

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

## Hello Protocol (Universal Handshake)

All tools in this repository implement the **Hello Protocol** — a universal handshake that lets users verify a tool is available and get its full API reference.

| Tool type | Hello | Verbose |
|-----------|-------|---------|
| MCP server | `hello {}` | `hello {"verbose": true}` |
| Skill | `/skill-name hello` | `/skill-name hello ID` |
| Agent | `hello agent-name` | `hello agent-name ID` |

**Full documentation**: [`docs/reference/hello-protocol.md`](docs/reference/hello-protocol.md)

**MANDATORY for new tools**: Every new MCP server, skill, or agent MUST implement the Hello Protocol before being added to this repository. See the documentation for exact code patterns and checklists.

## Contributing Guidelines

When adding new content:
1. Place agents in `agents/domain-experts/` or `agents/mcp-integrated/`
2. Place skills in `skills/` (commands are now unified into skills since v2.1.3)
3. Add template version to `templates/` if creating new pattern
4. **Implement the Hello Protocol** — see `docs/reference/hello-protocol.md` for the required pattern
5. **Add `references` field** to agent frontmatter with 2-4 official doc URLs (enables `/refresh` auto-updates)
6. Update relevant README.md files
7. Include installation instructions
8. Test installation process

## Latest Claude Code Features (v2.1.49)

### Major: Claude Opus 4.6 and Sonnet 4.6 (v2.1.32, v2.1.45)
- **Claude Opus 4.6** is now available (v2.1.32)
- **Claude Sonnet 4.6** is now available (v2.1.45)
- **Fast mode for Opus 4.6** (v2.1.36) - same model, faster output
- **Sonnet 4.5 1M removed from Max plan** in favor of Sonnet 4.6 with 1M context (v2.1.49)

### Git Worktree Isolation (v2.1.49)
- `--worktree` (`-w`) flag to start Claude in an isolated git worktree
- Subagents support `isolation: "worktree"` for working in a temporary git worktree
- Enables safe parallel work without affecting the main working tree

### Background Agent Improvements (v2.1.49)
- Agent definitions support `background: true` to always run as a background task
- Fixed Ctrl+C/ESC being silently ignored when background agents are running

### ConfigChange Hook Event (v2.1.49)
New `ConfigChange` hook event fires when configuration files change during a session. Enables enterprise security auditing and optional blocking of settings changes.

### Plugin Default Settings (v2.1.49)
Plugins can now ship `settings.json` for default configuration, providing sensible defaults out of the box.

### Simple Mode Enhancement (v2.1.49)
Simple mode (`CLAUDE_CODE_SIMPLE`) now includes the file edit tool in addition to the Bash tool.

### SDK Model Capability Discovery (v2.1.49)
SDK model info now includes `supportsEffort`, `supportedEffortLevels`, and `supportsAdaptiveThinking` fields so consumers can discover model capabilities.

### claude.ai MCP Connectors (v2.1.46)
MCP connectors configured in claude.ai can now be used directly in Claude Code.

### Agent Teams (v2.1.32) - Research Preview
Multi-agent collaboration with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Includes `TeammateIdle` and `TaskCompleted` hook events (v2.1.33), `Task(agent_type)` syntax to restrict sub-agent spawning, and `memory` frontmatter field with `user`, `project`, or `local` scope.

### Automatic Memory (v2.1.32)
Claude now automatically records and recalls memories as it works, building context over time.

### Summarize from Here (v2.1.32)
Message selector now includes "Summarize from here" for partial conversation summarization.

### PDF Page Ranges in Read Tool (v2.1.30)
Added `pages` parameter for PDFs (e.g., `pages: "1-5"`). Large PDFs (>10 pages) return a lightweight reference when `@` mentioned.

### PR-Linked Sessions (v2.1.27)
- `--from-pr` flag to resume sessions linked to a specific GitHub PR number or URL
- Sessions auto-link to PRs when created via `gh pr create`

### Permission Behavior Change (v2.1.27)
**Breaking:** Permissions now respect content-level `ask` over tool-level `allow`. Previously `allow: ["Bash"], ask: ["Bash(rm *)"]` allowed all bash commands; now it prompts for `rm`.

### CLI Auth Subcommands (v2.1.41)
New `claude auth login`, `claude auth status`, and `claude auth logout` CLI subcommands.

### Windows ARM64 Support (v2.1.41)
Native binary support for Windows ARM64 (win32-arm64).

### MCP OAuth Client Credentials (v2.1.30)
Pre-configured OAuth client credentials for MCP servers that don't support Dynamic Client Registration. Use `--client-id` and `--client-secret` with `claude mcp add`.

### Debug Command (v2.1.30)
`/debug` command for troubleshooting the current session.

### Customizable Spinner Verbs and Tips (v2.1.23, v2.1.45)
- `spinnerVerbs` setting for custom spinner verbs (v2.1.23)
- `spinnerTipsOverride` setting with custom `tips` array and `excludeDefault: true` option (v2.1.45)

### Enhanced /rename (v2.1.41, v2.1.47)
- Auto-generates session name from conversation context when called without arguments (v2.1.41)
- Updates the terminal tab title by default (v2.1.47)

### New Keybinding Actions (v2.1.47)
- `chat:newline` keybinding action for configurable multi-line input
- `ctrl+f` now kills all background agents (instead of double-pressing ESC)
- `added_dirs` in statusline JSON `workspace` section

### Config Backups Relocated (v2.1.47)
Config backup files moved from home directory root to `~/.claude/backups/`.

### Resume Picker Improvements (v2.1.47)
- Initial session count increased from 10 to 50
- Simplified teammate navigation: Shift+Down only (with wrapping)

### Stop Hook Enhancement (v2.1.47)
`last_assistant_message` field added to Stop and SubagentStop hook inputs for accessing the final assistant response.

### Skills from Additional Directories (v2.1.32)
Skills in `.claude/skills/` within `--add-dir` directories are now loaded automatically. Skill character budget scales with context window (2% of context).

### Plugins from Additional Directories (v2.1.45)
`enabledPlugins` and `extraKnownMarketplaces` can now be read from `--add-dir` directories.

### SDK Rate Limit Info (v2.1.45)
New `SDKRateLimitInfo` and `SDKRateLimitEvent` types for receiving rate limit status updates including utilization, reset times, and overage information.

### Sandbox Security Fix (v2.1.34)
**Security:** Fixed commands excluded from sandboxing bypassing Bash ask permission when `autoAllowBashIfSandboxed` was enabled.

### Heredoc Security Improvement (v2.1.38)
Improved heredoc delimiter parsing to prevent command smuggling. Writes to `.claude/skills` directory blocked in sandbox mode.

### Managed Settings Security (v2.1.49)
**Security:** Fixed `disableAllHooks` setting to respect managed settings hierarchy - non-managed settings can no longer disable managed hooks set by policy.

### VSCode Improvements (v2.1.27-v2.1.47)
- Claude in Chrome integration (v2.1.27)
- Remote sessions for OAuth users (v2.1.33)
- Git branch and message count in session picker, searchable by branch name (v2.1.33)
- Multiline input in "Other" text input (Shift+Enter) (v2.1.30)
- Plan preview auto-updates, commenting only when ready, stays open on reject (v2.1.47)
- Permission destination choice persists across sessions (v2.1.45)

### Performance Improvements (v2.1.42-v2.1.49)
- Deferred Zod schema construction for faster startup (v2.1.42)
- Improved prompt cache hit rates by moving date out of system prompt (v2.1.42)
- Deferred SessionStart hook execution (~500ms startup reduction) (v2.1.47)
- Released API stream buffers, agent context, and skill state after use (v2.1.47)
- Eliminated O(n²) message accumulation in progress updates (v2.1.47)
- Pre-warmed `@` file mention index with session-based caching (v2.1.47)
- Skipped unnecessary API calls in non-interactive mode (`-p`) (v2.1.49)
- Cached MCP auth failures to avoid repeated connection attempts (v2.1.49)
- Batched MCP tool token counting into single API call (v2.1.49)
- Fixed unbounded WASM memory growth by periodically resetting tree-sitter parser (v2.1.49)

### Major Bug Fix Highlights (v2.1.23-v2.1.49)
- Fixed file-not-found errors now suggest corrected paths (v2.1.49)
- Fixed unbounded Yoga WASM linear memory growth in long sessions (v2.1.49)
- Fixed FileWriteTool stripping intentional trailing blank lines (v2.1.47)
- Fixed Windows terminal rendering (`\r\n` issues) (v2.1.47)
- Fixed Edit tool corrupting Unicode curly quotes (v2.1.47)
- Fixed plan mode lost after context compaction (v2.1.47)
- Fixed bash permission classifier hallucinating incorrect permissions (v2.1.47)
- Fixed orphaned Claude Code processes after terminal disconnect on macOS (v2.1.46)
- Fixed PDF too large errors locking up sessions (v2.1.31)
- Fixed phantom "(no content)" text blocks wasting tokens (v2.1.30)
- 68% memory reduction for `--resume` (v2.1.30)
- Improved memory usage for long-running sessions (v2.1.47)

### Structured Outputs Fix (v2.1.22)
Fixed structured outputs for non-interactive (`-p`) mode.

### VSCode Python Environment Activation (v2.1.21)
Added automatic Python virtual environment activation via `claudeCode.usePythonEnvironment` setting in VSCode.

### Full-Width Input Support (v2.1.21, v2.1.31)
Full-width (zenkaku) number input (v2.1.21) and space input (v2.1.31) from Japanese IME.

### PR Review Status Indicator (v2.1.20)
PR review status indicator now appears in the prompt footer when working on pull requests.

### Task Deletion (v2.1.20)
Tasks can now be deleted via the TaskUpdate tool by setting status to `deleted`.

### Permission Rules Update (v2.1.20)
Permission rules like `Bash(*)` are now accepted as equivalent to `Bash`, providing more flexible permission configuration.

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
- **Setting up production config**: `config-bundle/`
- **Creating custom tools**: `templates/`
- **Installing MCP servers**: `mcp-servers/`
- **Reference documentation**: `docs/reference/`
