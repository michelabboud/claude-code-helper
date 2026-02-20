# Release v1.9.0 - Claude Code CLI v2.1.47 Compatibility Update

**Documentation and compatibility update for Claude Code CLI v2.1.47**

This release updates the repository to align with Claude Code CLI features from v2.1.23 through v2.1.47 (January 29 - February 18, 2026).

---

## Breaking Changes Addressed

### Permission Behavior Change (v2.1.27)

Permissions now respect content-level `ask` over tool-level `allow`. Previously `allow: ["Bash"], ask: ["Bash(rm *)"]` allowed all bash commands, but will now prompt for permission on `rm`.

**Impact on this repository:** Users with custom permission configs should review their settings.

### Sandbox Security Fix (v2.1.34)

Fixed a bug where commands excluded from sandboxing (via `sandbox.excludedCommands` or `dangerouslyDisableSandbox`) could bypass the Bash ask permission rule when `autoAllowBashIfSandboxed` was enabled.

### Config Backup Location Change (v2.1.47)

Config backup files moved from home directory root to `~/.claude/backups/` to reduce clutter.

### Background Agent Cancellation Change (v2.1.47)

`ctrl+f` now kills all background agents instead of double-pressing ESC. Background agents now continue running when you press ESC to cancel the main thread.

---

## Major New Features

### Claude Opus 4.6 (v2.1.32)
Claude Opus 4.6 is now available as a model option.

### Claude Sonnet 4.6 (v2.1.45)
Claude Sonnet 4.6 is now available as a model option.

### Fast Mode for Opus 4.6 (v2.1.36)
Fast mode (same model, faster output) is now available for Opus 4.6.

### Agent Teams - Research Preview (v2.1.32)
Multi-agent collaboration feature. Token-intensive, requires setting `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- `TeammateIdle` and `TaskCompleted` hook events (v2.1.33)
- `Task(agent_type)` syntax to restrict sub-agent spawning (v2.1.33)
- `memory` frontmatter field with `user`, `project`, or `local` scope (v2.1.33)

### Automatic Memory (v2.1.32)
Claude now automatically records and recalls memories as it works, building persistent context over time.

### PDF Page Ranges (v2.1.30)
- `pages` parameter for the Read tool (e.g., `pages: "1-5"`)
- Large PDFs (>10 pages) return lightweight reference when `@` mentioned

### PR-Linked Sessions (v2.1.27)
- `--from-pr` flag to resume sessions linked to a specific GitHub PR number or URL
- Sessions auto-link to PRs when created via `gh pr create`

### CLI Auth Subcommands (v2.1.41)
New `claude auth login`, `claude auth status`, and `claude auth logout` CLI subcommands.

### Windows ARM64 Support (v2.1.41)
Native binary support for Windows ARM64 (win32-arm64).

---

## New Features Documented

### v2.1.47
- **Stop hook `last_assistant_message`** - Access final assistant response in Stop/SubagentStop hooks
- **`chat:newline` keybinding** - Configurable multi-line input
- **`added_dirs` in statusline** - Exposed in workspace JSON section
- **`/rename` updates terminal tab title** by default
- **Resume picker** - Initial count increased from 10 to 50
- **Teammate navigation simplified** - Shift+Down only (with wrapping)

### v2.1.45
- **Claude Sonnet 4.6** - New model option
- **`spinnerTipsOverride` setting** - Custom tips array, optional `excludeDefault: true`
- **Plugins from `--add-dir`** - `enabledPlugins` and `extraKnownMarketplaces` loaded
- **SDK rate limit types** - `SDKRateLimitInfo` and `SDKRateLimitEvent`

### v2.1.41-v2.1.42
- **CLI auth subcommands** - `claude auth login/status/logout`
- **Windows ARM64** - Native binary support
- **`/rename` auto-generates** session name from conversation context
- **AWS auth 3-minute timeout** - Prevents indefinite hanging

### v2.1.38-v2.1.39
- **Heredoc security** - Improved delimiter parsing to prevent command smuggling
- **Sandbox hardening** - Blocked writes to `.claude/skills` in sandbox mode
- **Terminal rendering performance** improvements

### v2.1.36-v2.1.37
- **Fast mode for Opus 4.6**

### v2.1.33-v2.1.34
- **Agent Teams hooks** - `TeammateIdle`, `TaskCompleted` events
- **Agent memory** - `memory` frontmatter with scoping
- **Sub-agent restriction** - `Task(agent_type)` syntax in agent tools
- **Plugin name in skill descriptions** - Better discoverability

### v2.1.32
- **Claude Opus 4.6** - New model
- **Agent Teams** - Research preview multi-agent collaboration
- **Automatic memory** - Claude records and recalls memories
- **Summarize from here** - Partial conversation summarization
- **Skills from `--add-dir`** - Auto-loaded from additional directories
- **Skill budget scaling** - 2% of context window

### v2.1.30-v2.1.31
- **PDF page ranges** - `pages` parameter in Read tool
- **MCP OAuth credentials** - `--client-id` and `--client-secret` with `claude mcp add`
- **`/debug` command** - Session troubleshooting
- **Read-only git flags** - `--topo-order`, `--cherry-pick`, `--format`, `--raw`
- **Task tool metrics** - Token count, tool uses, duration in results
- **Reduced motion mode** - Accessibility setting

### v2.1.27-v2.1.29
- **`--from-pr` flag** - PR-linked sessions
- **VSCode Chrome integration**
- **Permission behavior change** - Content-level `ask` overrides tool-level `allow`
- **Merged PR indicator** - Purple status in prompt footer

### v2.1.23-v2.1.25
- **Customizable spinner verbs** - `spinnerVerbs` setting
- **Improved terminal rendering** - Optimized screen data layout
- **Bash timeout display** - Shows timeout duration alongside elapsed time

---

## VSCode Improvements (v2.1.27-v2.1.47)

- Claude in Chrome integration (v2.1.27)
- Remote sessions for OAuth users (v2.1.33)
- Git branch and message count in session picker (v2.1.33)
- Multiline input in "Other" dialogs with Shift+Enter (v2.1.30)
- Plan preview auto-updates and commenting controls (v2.1.47)
- Permission destination choice persists across sessions (v2.1.45)
- Spinner when loading past conversations (v2.1.32)

---

## Major Bug Fixes

### v2.1.47 (50+ fixes)
- FileWriteTool preserves intentional trailing blank lines
- Windows terminal rendering (`\r\n` line counting, bold/colored text)
- Edit tool no longer corrupts Unicode curly quotes
- Plan mode no longer lost after context compaction
- Bash permission classifier no longer hallucinating incorrect permissions
- Background agent results return final answer instead of raw transcript
- Custom session titles via `/rename` preserved after resume
- Parallel file write/edit errors no longer abort sibling operations
- CJK wide characters no longer misalign TUI layout
- Agent progress indicator no longer shows inflated tool use count
- Hooks (PreToolUse, PostToolUse) fixed on Windows

### v2.1.30-v2.1.31
- Phantom "(no content)" text blocks eliminated (token waste fix)
- 68% memory reduction for `--resume` operations
- PDF too large errors no longer lock up sessions
- Prompt cache invalidation fixed for tool description changes

### v2.1.23-v2.1.29
- mTLS and proxy connectivity fixes for corporate environments
- Per-user temp directory isolation
- Race condition fix for prompt caching 400 errors
- Tab completion updating input field

---

## Repository Tools Updated

### Hook System (hooks/)
- Added `TeammateIdle` and `TaskCompleted` hook events for agent teams
- Added `last_assistant_message` field to Stop/SubagentStop hook inputs

### Agent System (agents/)
- Documented `memory` frontmatter field with `user`, `project`, `local` scope
- Documented `Task(agent_type)` restriction syntax for agent tools

### Skill System (skills/)
- Skills from `--add-dir` directories now auto-loaded (v2.1.32)
- Skill character budget scales with context window (v2.1.32)

---

## Files Changed

### Updated
| File | Change |
|------|--------|
| `CLAUDE.md` | Updated features section from v2.1.22 to v2.1.47, fixed release range |
| `docs/reference/CLAUDE-CODE-V2-UPDATES.md` | Updated from v2.1.9 to v2.1.47 coverage |
| `docs/reference/INSTALLATION.md` | Fixed installer URL, added npm deprecation note |

### Added
| File | Description |
|------|-------------|
| `docs/releases/RELEASE-v1.9.0.md` | This release notes file |

---

## Compatibility Matrix

| Claude Code CLI | Repository Version | Status |
|-----------------|-------------------|--------|
| v2.1.47 | v1.9.0 | Fully compatible |
| v2.1.23-v2.1.46 | v1.9.0 | Compatible |
| v2.1.22 | v1.8.0 | Compatible |
| v2.1.15-v2.1.21 | v1.8.0 | Compatible |
| v2.1.9-v2.1.14 | v1.7.0 | Compatible |
| < v2.1.9 | v1.7.0 | May have missing features |

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
| v1.9.0 | 2026-02-20 | **CLI v2.1.47 compatibility update** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude Opus 4.6 (Anthropic)
**License:** Apache-2.0

---

**"Staying current with Claude Code CLI updates"**
