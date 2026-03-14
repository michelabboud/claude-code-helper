# Claude Code CLI Features v2.1.50 through v2.1.76

**Summary of new Claude Code CLI features not yet covered in the repository's CLAUDE.md (which documents through v2.1.49).**

**Date range:** February-March 2026
**Author:** Michel Abboud | **AI:** Claude | **License:** Apache-2.0

---

## Models & Effort

- **Opus 4.6 defaults to medium effort** for Max/Team plans (v2.1.68)
- **Effort levels simplified** to `low`, `medium`, `high` -- the `max` level has been removed (v2.1.72)
- **`/effort` slash command** for changing effort level during a session (v2.1.76)
- **1M context for Opus 4.6** enabled by default for Max/Team/Enterprise plans (v2.1.75)
- **`modelOverrides` setting** allows specifying custom provider model IDs (v2.1.73)
- **Opus 4 and 4.1 removed** from first-party API (v2.1.68)

---

## Voice Mode

- **Push-to-talk voice input** for hands-free interaction (v2.1.69)
- **20 supported languages** for voice recognition
- **`voice:pushToTalk` keybinding** for customizing the push-to-talk key (v2.1.71)

---

## Remote Control

- **`claude remote-control` subcommand** for controlling Claude Code sessions remotely (v2.1.51)
- **Optional `--name` argument** for naming remote-control sessions (v2.1.69)
- **Expanded availability** to more users (v2.1.58)

---

## Worktree Improvements

- **`isolation: worktree`** in agent definitions for running agents in isolated git worktrees (v2.1.50)
- **`ExitWorktree` tool** for programmatically leaving a worktree context (v2.1.72)
- **`worktree.sparsePaths`** setting for monorepo support -- only checks out specified paths (v2.1.76)
- **`WorktreeCreate` / `WorktreeRemove` hook events** fired when worktrees are created or removed (v2.1.50)
- **`claude agents` CLI command** for listing and managing available agents (v2.1.50)

---

## New Commands & Skills

- **`/loop`** for setting up recurring prompts that execute on a schedule (v2.1.71)
- **`/simplify` and `/batch`** bundled as built-in commands (v2.1.63)
- **`/claude-api` skill** for querying Claude API documentation inline (v2.1.69)
- **`/copy` interactive picker** for selecting and copying content from the conversation (v2.1.59)
- **`/effort`** for changing model effort level mid-session (v2.1.76)
- **`/color`** now available for all users to customize prompt bar color (v2.1.75)
- **`/reload-plugins`** for hot-reloading plugins without restarting (v2.1.69)
- **`/plan` with description argument** for creating named plans inline (v2.1.72)

---

## Hooks

- **HTTP hooks** -- hooks can now POST JSON to a URL instead of running a local script (v2.1.63)
- **`InstructionsLoaded` hook event** fires after all instructions (CLAUDE.md, skills, etc.) are loaded (v2.1.69)
- **`PostCompact` hook** fires after context compaction (v2.1.76)
- **`Elicitation` and `ElicitationResult` hooks** fire when Claude asks clarifying questions and receives answers (v2.1.76)
- **`agent_id` and `agent_type`** fields added to all hook event payloads (v2.1.69)

---

## MCP

- **MCP elicitation support** -- MCP servers can now request additional information from users during tool execution (v2.1.76)
- **`ENABLE_CLAUDEAI_MCP_SERVERS=false`** environment variable to disable claude.ai MCP connectors locally (v2.1.63)
- **`CLAUDE_CODE_DISABLE_1M_CONTEXT`** environment variable to opt out of extended context (v2.1.50)

---

## Auto Memory

- **Automatic context saving** -- Claude now automatically saves important context to auto-memory files as it works (v2.1.59)
- **`/memory` command** for viewing and managing auto-saved memories
- **`autoMemoryDirectory` setting** for customizing where auto-memory files are stored (v2.1.74)
- **Last-modified timestamps** shown on memory files for recency awareness (v2.1.75)

---

## Session Management

- **`-n` / `--name` flag** for setting a display name when starting a session (v2.1.76)
- **`/color` command** for customizing the prompt bar color per session (v2.1.75)
- **Session name on prompt bar** -- named sessions display their name in the prompt bar header (v2.1.75)

---

## Performance & Memory

- **Dozens of memory leak fixes** across v2.1.50 through v2.1.76, addressing long-running session stability
- **BashTool skips login shell by default** for faster command execution (v2.1.51)
- **Tool results >50K persisted to disk** instead of held in memory (v2.1.51)
- **~16MB baseline memory reduction** through internal optimizations (v2.1.69)
- **Native bash command parser** replaces regex-based parsing for correctness and speed (v2.1.72)

---

## Security

- **`statusLine` / `fileSuggestion` trust fix** -- these features now respect trust boundaries correctly (v2.1.51)
- **Managed settings via macOS plist or Windows Registry** for enterprise policy enforcement (v2.1.51)
- **Nested skill discovery from gitignored directories blocked** to prevent untrusted skill injection (v2.1.69)

---

## Enterprise

- **`feedbackSurveyRate` setting** for controlling how often feedback surveys appear (v2.1.76)
- **`pluginTrustMessage`** in managed settings for displaying custom plugin trust policies (v2.1.69)
- **`includeGitInstructions` setting** for controlling whether git-derived instructions are included in context (v2.1.69)
