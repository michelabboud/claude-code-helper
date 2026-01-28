# Release v1.8.0 - Claude Code CLI v2.1.21 Compatibility Update

**Documentation and compatibility update for Claude Code CLI v2.1.21**

This release updates the repository to align with the latest Claude Code CLI features and deprecations from v2.1.10 through v2.1.21.

---

## Breaking Changes Addressed

### npm Installation Deprecated (v2.1.15)

The npm installation method (`npm install -g @anthropic-ai/claude-code`) is now deprecated but **still works**. It displays a deprecation warning directing users to the official installer.

**Updated files:**
- `README.md` - Added recommended installer, noted npm as deprecated alternative
- `config-bundle/wsl-setup/setup-pro-user.sh` - Updated to use official installer
- `config-bundle/wsl-setup/setup-api-user.sh` - Updated to use official installer
- `config-bundle/scripts/install-all.sh` - Updated error message with both options
- `config-bundle/FILE-TREE.md` - Updated dependencies section

**Recommended installation:**
```bash
# Recommended method
curl -fsSL https://claude.ai/install.sh | sh

# Alternative (deprecated, shows warning)
npm install -g @anthropic-ai/claude-code
```

### Argument Syntax Change (v2.1.19)

Indexed argument syntax changed from `$ARGUMENTS.0` to `$ARGUMENTS[0]` (bracket syntax).

**Impact on this repository:** None - no files used the old syntax.

**New shorthand available:** `$0`, `$1`, etc. for accessing individual arguments in custom commands.

---

## New Features Documented

### v2.1.21
- **VSCode Python Environment Activation** - `claudeCode.usePythonEnvironment` setting
- **Full-width number input** - Japanese IME support

### v2.1.20
- **PR Review Status Indicator** - Shows in prompt footer
- **Task Deletion** - Tasks can be deleted via TaskUpdate
- **Permission Rules Update** - `Bash(*)` accepted as equivalent to `Bash`
- **Config Backups** - Timestamped and rotated (keeps 5 recent)
- **Background Agent Permissions** - Prompt before launching

### v2.1.19
- **Bracket Argument Syntax** - `$ARGUMENTS[0]` instead of `$ARGUMENTS.0`
- **Argument Shorthand** - `$0`, `$1`, etc.
- **Task System Toggle** - `CLAUDE_CODE_ENABLE_TASKS=false`

### v2.1.16
- **Task Management System** - Dependency tracking with `blockedBy`
- **VSCode Plugin Management** - Native plugin support
- **Remote Session Browsing** - OAuth users can browse/resume sessions

### v2.1.15
- **npm Installation Deprecated** - Use official installer

### v2.1.14
- **Bash History Autocomplete** - `!` mode with Tab completion
- **Plugin Commit Pinning** - Pin to specific git SHAs

---

## Files Changed

### Updated
| File | Change |
|------|--------|
| `README.md` | Updated 2 npm install references to official installer |
| `CLAUDE.md` | Added features from v2.1.10-v2.1.21, updated header to v2.1.21 |
| `config-bundle/wsl-setup/setup-pro-user.sh` | Updated npm install to curl installer |
| `config-bundle/wsl-setup/setup-api-user.sh` | Updated npm install to curl installer |
| `config-bundle/scripts/install-all.sh` | Updated error message with new install method |
| `config-bundle/FILE-TREE.md` | Updated dependencies section |

### Added
| File | Description |
|------|-------------|
| `docs/releases/RELEASE-v1.8.0.md` | This release notes file |

---

## Compatibility Matrix

| Claude Code CLI | Repository Version | Status |
|-----------------|-------------------|--------|
| v2.1.21 | v1.8.0 | Fully compatible |
| v2.1.15-v2.1.20 | v1.8.0 | Compatible |
| v2.1.9-v2.1.14 | v1.7.0 | Compatible |
| < v2.1.9 | v1.7.0 | May have missing features |

---

## Migration Guide

### For Users on npm Installation

If you installed Claude Code via npm, migrate to the official installer:

```bash
# 1. Uninstall npm version
npm uninstall -g @anthropic-ai/claude-code

# 2. Install via official method
curl -fsSL https://claude.ai/install.sh | sh

# 3. Verify
claude --version
```

### For Custom Commands Using Arguments

If you have custom commands using `$ARGUMENTS.0` syntax:

```bash
# Old syntax (deprecated)
echo "First arg: $ARGUMENTS.0"

# New syntax
echo "First arg: $ARGUMENTS[0]"

# Or use shorthand
echo "First arg: $0"
```

---

## What's NOT Changed

The following remain fully compatible:

- All 47 agents in `agents/` directory
- All 16 skills in `skills/` directory
- All 6 commands in `commands/` directory
- All hooks in `hooks/` directory
- All 10 MCP servers in `mcp-servers/` directory
- All plugins in `plugins/` directory

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
| v1.8.0 | 2026-01-28 | **CLI v2.1.21 compatibility update** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude Opus 4.5 (Anthropic)
**License:** Apache-2.0

---

**"Staying current with Claude Code CLI updates"**
