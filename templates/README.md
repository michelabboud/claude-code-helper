# Claude Code Templates

Starter templates for creating your own Claude Code tools. Copy these templates and customize them for your needs.

## Available Templates

### 1. [Agent Template](./agent/)

Create custom agents that specialize in specific domains or tasks.

**File:** `agent-template.md`

```markdown
---
name: agent-name
description: Agent purpose
tools: Read, Write
model: sonnet
---

# Agent Instructions

Your agent content here.
```

**Usage:**
```bash
cp templates/agent/agent-template.md ~/.claude/agents/my-agent.md
# Edit and customize
```

---

### 2. [Skill Template](./skill/)

Build reusable skills that teach Claude new workflows and capabilities.

**File:** `SKILL.md`

```markdown
---
name: your-skill-name
description: Clear description with trigger words
---

# Skill Instructions

Your skill content here.
```

**Usage:**
```bash
mkdir -p ~/.claude/skills/my-skill
cp templates/skill/SKILL.md ~/.claude/skills/my-skill/
# Edit and customize
```

---

### 3. [Command Template](./command/)

Design slash commands for quick access to common operations.

**File:** `command-template.md`

```markdown
---
description: Command description
allowed-tools: Read, Write
---

# Command Instructions

Your command content here.
```

**Usage:**
```bash
cp templates/command/command-template.md ~/.claude/commands/my-command.md
# Edit and customize
```

---

## Quick Start

```bash
# 1. Choose a template type
ls templates/

# 2. Copy to your Claude directory
cp templates/agent/agent-template.md ~/.claude/agents/my-custom-agent.md

# 3. Edit and customize
nano ~/.claude/agents/my-custom-agent.md

# 4. Restart Claude Code
claude
```

---

## Template Customization Tips

### For Agents
- Use clear, specific descriptions that explain when the agent should be invoked
- List only the tools your agent actually needs
- Choose the right model: `sonnet` for most tasks, `opus` for complex reasoning

### For Skills
- Include trigger words in the description that users naturally say
- Keep instructions focused and actionable
- Consider adding examples of expected inputs/outputs

### For Commands
- Use descriptive command names that are easy to remember
- Limit allowed-tools to what's necessary for security
- Include clear documentation in the instructions

---

## Learn More

- [Complete Guide](../guides/complete-guide/) - Understand all tool types
- [Examples](../examples/) - See working implementations
- [Sub-Agents Guide](../guides/subagents-guide/) - Advanced agent patterns

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
