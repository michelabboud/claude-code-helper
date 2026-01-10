# Claude Code Quick Reference

## Installation
```bash
# Install Claude Code
curl -fsSL https://cli.claude.ai/install.sh | sh

# Start Claude Code
claude

# Login
/login
```

## Basic Commands
```bash
/help           # Show available commands
/clear          # Start new conversation
/compact        # Condense context
/stats          # View usage
/resume <name>  # Resume session
/rename         # Name current session
```

## File Structure

```
project/
├── CLAUDE.md              # Project memory
├── .claude/
│   ├── settings.json      # Project settings
│   ├── commands/          # Slash commands
│   ├── agents/            # Sub-agents
│   └── skills/            # Project skills
├── .mcp.json             # MCP servers
└── ~/.claude/
    ├── skills/            # User skills
    └── commands/          # User commands
```

## Creating a Skill
```yaml
---
name: my-skill
description: Clear description with trigger words
---

# Instructions here
```

## Creating a Sub-agent
```yaml
---
name: my-agent
description: Agent purpose
tools: Read, Write
model: sonnet
---

# Agent instructions
```

## Adding MCP Server
```bash
claude mcp add-json server-name '{
  "command": "npx",
  "args": ["-y", "package-name"],
  "env": {"KEY": "value"}
}'
```

## Creating Hooks
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{"type": "command", "command": "npm run lint"}]
      }
    ]
  }
}
```

## Decision Tree

Need expertise across platforms? → **Skill**
Need parallel execution? → **Sub-agent**
Need external API? → **MCP**
Need shortcut? → **Slash Command**
Need automation? → **Hook**
Need to bundle? → **Plugin**
Need production agent? → **Agent SDK**
