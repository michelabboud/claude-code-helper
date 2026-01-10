---
hook_name: [Hook Name]
event: [PreToolUse|PostToolUse|Stop|SubagentStop|SessionStart|SessionEnd|UserPromptSubmit|PreCompact|Notification]
description: [Brief description of what this hook does]
priority: [P0|P1|P2|P3]
---

# [Hook Name]

[Detailed description of the hook's purpose and when it triggers]

## Trigger Event

`[EventName]` - [Description of when this event occurs]

### Available Events

- **PreToolUse** - Before a tool is executed
- **PostToolUse** - After a tool completes execution
- **Stop** - When the session is stopped
- **SubagentStop** - When a subagent completes
- **SessionStart** - At the beginning of a new session
- **SessionEnd** - When the session ends
- **UserPromptSubmit** - When the user submits a prompt
- **PreCompact** - Before conversation compaction
- **Notification** - On system notifications

## Hook Timeout

Hooks have a **10-minute timeout** (extended from 60 seconds in earlier versions), allowing sufficient time for comprehensive validation and processing.

## Hook Implementation

### Bash Script Example

```bash
#!/bin/bash

# [Description of what this script does]

# Get context information
# Available variables: $FILE, $TOOL_NAME, $TOOL_ARGS, etc.

echo "Running [hook name]..."

# Your validation/processing logic here
# Example: Run linter
npm run lint $FILE
if [ $? -ne 0 ]; then
  echo "❌ Linting failed"
  exit 1
fi

echo "✅ [Hook name] passed"
exit 0
```

### Prompt-Based Hook Example

```
You are running a [event name] hook.

Context:
- File modified: [context details]
- Tool used: [tool name]

Please:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Report any issues found.
```

## Deployment Options

### Option 1: Global Hook File
Place in `~/.claude/hooks/[hook-name].md`

```bash
mkdir -p ~/.claude/hooks
cp [hook-name].md ~/.claude/hooks/
```

### Option 2: Project Hook
Place in `.claude/hooks/[hook-name].md` within your project

```bash
mkdir -p .claude/hooks
cp [hook-name].md .claude/hooks/
```

### Option 3: Frontmatter Hook (Inline)
Define directly in command or skill frontmatter:

```yaml
---
name: my-command
hooks:
  [EventName]: |
    # Hook implementation inline
    echo "Running inline hook..."
    # Your logic here
---
```

## Hook Configuration

### JSON Format (for simple hooks)

```json
{
  "hooks": {
    "[EventName]": [
      {
        "matcher": "[ToolName|Pattern]",
        "hooks": [
          {
            "type": "command",
            "command": "[command to run]"
          }
        ]
      }
    ]
  }
}
```

### Markdown Format (for complex hooks)

Use this template file format with frontmatter and detailed bash or prompt-based implementation.

## Usage Examples

### Example 1: [Use case 1]

```bash
# [Explain the use case]
[example command or prompt]
```

### Example 2: [Use case 2]

```bash
# [Explain the use case]
[example command or prompt]
```

## Testing

Test your hook before deployment:

```bash
# Manually trigger the hook event
# [Provide testing instructions]
```

## Troubleshooting

### Hook Not Triggering

- Verify hook file is in correct location
- Check event name matches exactly
- Review Claude Code logs: `~/.claude/logs/`

### Hook Timing Out

- Reduce validation complexity
- Use async operations where possible
- Consider splitting into multiple hooks

### Hook Failing

- Add debug output: `echo "Debug: $VARIABLE"`
- Check exit codes: non-zero exits block the operation
- Review error messages in console

## Integration with Other Components

- **Agents**: [How this hook works with agents]
- **Skills**: [How this hook works with skills]
- **Commands**: [How this hook works with commands]
- **MCP Servers**: [How this hook integrates with MCP]

## Best Practices

1. **Keep hooks fast** - Long-running hooks delay workflows
2. **Clear error messages** - Help users understand failures
3. **Idempotent operations** - Hooks should be safe to run multiple times
4. **Fail safely** - Don't block on non-critical issues
5. **Log appropriately** - Balance verbosity with useful information

## Related Hooks

- **[Related Hook 1]** - [Brief description]
- **[Related Hook 2]** - [Brief description]

## References

- [Claude Code Hooks Documentation](https://github.com/anthropics/claude-code)
- [Example Hooks](../../examples/hooks/)
- [Hook Development Guide](../../guides/)

---

**Priority**: [P0|P1|P2|P3]
**Status**: [Draft|Testing|Production Ready]
**Maintainer**: [Your Name/Team]

---

**Author**: Michel Abboud (https://github.com/michelabboud)
**AI Assistance**: Created with Claude Code (Anthropic)
**License**: MIT
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
