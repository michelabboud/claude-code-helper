---
skill_name: Model Mode
description: 'Switch between model modes or check current mode. Use /model-mode status to see current setting, /model-mode opus-only to always use Opus, /model-mode default for auto-switching.'
argument-hint: '[status|default|opus-only|sonnet-only|haiku-only|custom] | hello | hello ID'
user-invocable: true
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Model Mode

Switch the `MODEL_MODE` setting in `~/.claude/CLAUDE.md` without manual file editing.

## Usage

```
/model-mode status          → Show current MODEL_MODE and custom model settings
/model-mode default         → Auto-switch: opus for planning, sonnet for coding, haiku for quick
/model-mode opus-only       → Always use Claude Opus 4.6 (MAX plan — best quality everywhere)
/model-mode sonnet-only     → Always use Claude Sonnet 4.6 (fast + capable)
/model-mode haiku-only      → Always use Claude Haiku (fastest, cheapest)
/model-mode custom          → Use PLAN_MODEL / CODE_MODEL / QUICK_MODEL from CLAUDE.md
```

## Available Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `default` | Auto-switches between opus/sonnet/haiku by task type | Most users |
| `opus-only` | Always uses Claude Opus 4.6 | MAX plan users wanting max quality |
| `sonnet-only` | Always uses Claude Sonnet 4.6 | Pro plan users, speed + capability |
| `haiku-only` | Always uses Claude Haiku | Fastest responses, lowest cost |
| `custom` | Uses PLAN_MODEL / CODE_MODEL / QUICK_MODEL settings | Fine-grained control |

## Custom Mode Settings

When `MODEL_MODE: custom`, these additional settings in `~/.claude/CLAUDE.md` control which model is used per task category:

```
PLAN_MODEL: opus      # Used for planning/architecture tasks
CODE_MODEL: sonnet    # Used for implementation/coding tasks
QUICK_MODEL: haiku    # Used for simple/quick tasks
```

## Instructions

When invoked, perform the following based on `$ARGUMENTS`:

### `status` or no argument
Read `~/.claude/CLAUDE.md` and report:
- Current `MODEL_MODE` value
- If `custom`, also show `PLAN_MODEL`, `CODE_MODEL`, `QUICK_MODEL` values
- Example output:
  ```
  Current model mode: default
  Auto-switching enabled: opus for planning, sonnet for coding, haiku for quick tasks.
  ```

### `default`, `opus-only`, `sonnet-only`, `haiku-only`, `custom`
1. Read `~/.claude/CLAUDE.md`
2. Find the line that starts with `MODEL_MODE:`
3. Replace it with `MODEL_MODE: <new-value>`
4. Write the file back
5. Confirm: "Model mode updated to `<new-value>`. Changes take effect in the next session."

### Invalid argument
If argument is not one of the above values, show usage help and list valid options.

### `hello`
Respond with:
> 👋 Hello! I'm **Model Mode** v1.0.0. Switch MODEL_MODE in ~/.claude/CLAUDE.md without manual file editing. Use `/model-mode hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: Model Mode v1.0.0
- **Description**: Switch between model modes or check current mode. Use /model-mode status to see current setting, /model-mode opus-only to always use Opus, /model-mode default for auto-switching.
- **How to invoke**: `/model-mode [mode]`
- **Available arguments**: `[status|default|opus-only|sonnet-only|haiku-only|custom] | hello | hello ID`
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

## Notes

- Changes take effect at session start (CLAUDE.md is read fresh each session)
- If you have hot-reload active (`ConfigChange` hook), changes may apply immediately
- `custom` mode requires manually editing `PLAN_MODEL`, `CODE_MODEL`, `QUICK_MODEL` in `~/.claude/CLAUDE.md`
- This skill modifies `~/.claude/CLAUDE.md` — confirm with the user before writing if they seem uncertain

## Changelog

### 1.0.0 (2026-02-20)
- Initial release
- Supports status, default, opus-only, sonnet-only, haiku-only, custom modes

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
