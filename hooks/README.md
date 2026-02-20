# Claude Code Hook Examples

Event-driven automation that triggers based on Claude Code events like tool usage, session lifecycle, and more.

## What Are Hooks?

Hooks are automation scripts that execute in response to specific events in Claude Code. They enable validation, enforcement, and automation without manual intervention.

**Key characteristics:**
- Event-driven execution
- Can block or allow operations
- 10-minute timeout (extended from 60 seconds)
- Can be standalone files or inline in frontmatter

## Available Hooks

| Hook | Event | Description |
|------|-------|-------------|
| **security-scan** | PreToolUse | Scan for secrets and vulnerabilities before code changes |
| **code-quality-gate** | PostToolUse | Enforce quality standards after changes |
| **build-validation** | PostToolUse | Validate builds after code modifications |

## Hook Events

| Event | When It Fires | Common Uses |
|-------|---------------|-------------|
| `PreToolUse` | Before any tool executes | Validation, blocking, input modification |
| `PostToolUse` | After tool completes | Verification, cleanup |
| `Stop` | When the main agent stops | Final checks, reporting |
| `SubagentStop` | When a subagent completes | Subagent result handling |
| `SubagentStart` | When a subagent starts | Subagent monitoring |
| `SessionStart` | When session begins | Setup, initialization |
| `SessionEnd` | When session ends | Cleanup, reporting |
| `UserPromptSubmit` | When user submits a prompt | Input validation, context injection |
| `PreCompact` | Before conversation compaction | State preservation |
| `Notification` | On system notifications | Alerting, logging |
| `Setup` | On `--init`/`--maintenance` flags | Repository setup, maintenance |
| `PermissionRequest` | When tool permission is requested | Auto-approve/deny logic |

### Hook Capabilities

- **PreToolUse** hooks can return `additionalContext` to inject context into tool execution (v2.1.9+)
- **PreToolUse** hooks can return `updatedInput` to modify tool inputs (v2.0.10+)
- **PostToolUse** hooks receive tool output for verification and can perform cleanup
- **SubagentStart** hooks receive `agent_id` for tracking subagent lifecycle
- **SubagentStop** hooks receive `agent_id` and `agent_transcript_path` for result handling
- **UserPromptSubmit** hooks can return `additionalContext` (v1.0.59+)
- **PreCompact** hooks run before conversation compaction to preserve state or inject summaries
- **Notification** hooks fire on system notifications and support matcher values for filtering
- **PermissionRequest** hooks can process 'always allow' suggestions and apply permission updates (v2.0.54+)
- **Stop** hooks support prompt-based evaluation with optional `model` parameter (v2.0.30+)
- Hooks support `once: true` to run only once per session — set in settings.json hook config (v2.1.0+):
  ```json
  { "matcher": "Write", "command": "echo setup", "once": true }
  ```
- Hooks have a **10-minute timeout** (configurable per command) (v2.1.3+)

## Installation

### Option 1: Settings.json (Recommended)

Add hooks to your `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "~/.claude/hooks/security-scan.sh"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "~/.claude/hooks/code-quality-gate.sh"
      }
    ]
  }
}
```

### Option 2: Inline Frontmatter

Define hooks directly in skills/commands/agents:

```yaml
---
name: secure-deployment
hooks:
  PreToolUse: |
    if [[ "$TOOL_NAME" == "Write" ]]; then
      # Check for secrets
      if grep -rE "api[_-]?key|password" "$FILE_PATH" 2>/dev/null; then
        echo "Security scan failed: Potential secret"
        exit 1
      fi
    fi
---
```

### Option 3: Hook Files

Place hook scripts in `~/.claude/hooks/`:

```bash
mkdir -p ~/.claude/hooks
cp security-scan.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/security-scan.sh
```

## Hook Reference

### security-scan

**Event**: `PreToolUse`

**Purpose**: Prevent secrets and vulnerabilities from entering code.

**Scans for**:
- API keys and tokens
- Passwords and credentials
- Private keys
- SQL injection patterns
- XSS vulnerabilities

**Behavior**:
- Blocks Write/Edit if issues found
- Provides remediation suggestions
- Can be configured with allowlists

**Configuration**:
```json
{
  "enabled": true,
  "severity_threshold": "medium",
  "block_on": ["critical", "high"],
  "whitelist": ["test/**", "*.example.*"]
}
```

---

### code-quality-gate

**Event**: `PostToolUse`

**Purpose**: Enforce code quality standards after changes.

**Checks**:
- Linting (ESLint, Prettier)
- Type checking (TypeScript)
- Test coverage thresholds
- Complexity metrics

**Behavior**:
- Warns on quality issues
- Can block commits
- Reports metrics

---

### build-validation

**Event**: `PostToolUse`

**Purpose**: Validate builds after code modifications.

**Checks**:
- Build succeeds
- Tests pass
- No new warnings

**Behavior**:
- Runs build after code changes
- Reports failures
- Suggests fixes

## Creating Custom Hooks

### Shell Script Hook

```bash
#!/bin/bash
# ~/.claude/hooks/my-hook.sh

# Available environment variables:
# $TOOL_NAME - The tool being used (Write, Edit, Bash, etc.)
# $FILE_PATH - Path to file being modified (for Write/Edit)
# $CONTENT   - Content being written (for Write)

# Example: Block changes to production config
if [[ "$FILE_PATH" == *"production"* ]]; then
  echo "Cannot modify production files directly"
  exit 1
fi

# Exit 0 to allow, non-zero to block
exit 0
```

### Inline Hook

```yaml
---
name: my-skill
hooks:
  PreToolUse: |
    # Inline bash script
    echo "Tool: $TOOL_NAME"
    echo "File: $FILE_PATH"
  PostToolUse: |
    # Run after tool completes
    echo "Tool completed successfully"
---
```

### Hook with Matcher

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "security-scan.sh"
      },
      {
        "matcher": "Bash",
        "command": "command-validator.sh"
      }
    ]
  }
}
```

## Hook Patterns

### Validation Pattern

```bash
#!/bin/bash
# Validate before allowing operation

if ! validate_something; then
  echo "Validation failed: reason"
  exit 1
fi

exit 0
```

### Notification Pattern

```bash
#!/bin/bash
# Notify but don't block

notify_team "Code change: $FILE_PATH"

# Always allow
exit 0
```

### Transformation Pattern

```bash
#!/bin/bash
# Transform content before writing

# Read content, transform, output
transformed=$(transform_content "$CONTENT")
echo "$transformed"

exit 0
```

### Logging Pattern

```bash
#!/bin/bash
# Log all operations

echo "$(date): $TOOL_NAME on $FILE_PATH" >> ~/.claude/hooks/audit.log

exit 0
```

## Best Practices

### Do
- Keep hooks fast (< 1 second for most)
- Use specific matchers to limit scope
- Provide clear error messages
- Log for debugging
- Handle edge cases gracefully

### Don't
- Block everything (too restrictive)
- Run slow operations on every tool use
- Modify files unexpectedly
- Swallow errors silently
- Forget to make scripts executable

## Troubleshooting

### Hook Not Running

1. Check file is executable: `chmod +x hook.sh`
2. Verify path in settings.json
3. Check matcher pattern matches tool name
4. Look for syntax errors in script

### Hook Blocking Everything

1. Check exit codes (0 = allow, non-zero = block)
2. Verify matcher is specific enough
3. Test script manually

### Hook Too Slow

1. Add timeout to external commands
2. Cache results when possible
3. Use matcher to limit invocations
4. Move heavy checks to PostToolUse

## Environment Variables

| Variable | Description | Available In |
|----------|-------------|--------------|
| `TOOL_NAME` | Name of the tool | All tool hooks |
| `FILE_PATH` | File being modified | Write, Edit |
| `CONTENT` | Content being written | Write |
| `OLD_CONTENT` | Original content | Edit |
| `NEW_CONTENT` | New content | Edit |
| `CLAUDE_PROJECT_DIR` | Project directory path | All hooks (v1.0.58+) |
| `hook_event_name` | Name of the hook event | All hooks (v1.0.41+) |
| `tool_use_id` | Tool use ID | PreToolUse, PostToolUse (v2.0.43+) |

## Related Resources

- [Complete Guide](../guides/complete-guide/) - Full Claude Code guide
- [Settings Reference](../config-bundle/) - Configuration options
- [Security Best Practices](../guides/complete-guide/) - Security patterns

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: MIT - Free to use for personal and commercial projects.

---

**Version**: 2.0.0 (updated for Claude Code CLI v2.1.22)
