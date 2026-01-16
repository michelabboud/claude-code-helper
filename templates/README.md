# Claude Code Templates

Professional templates for creating hooks, plugins, agents, skills, commands, and MCP servers for Claude Code.

---

## 📁 Available Templates

### Core Templates

| Template | Location | Purpose | Format |
|----------|----------|---------|--------|
| **Hook Template** | `hook/hook-template.md` | Create custom hooks for Claude Code events | Markdown + Frontmatter |
| **Plugin Template** | `plugin/plugin-template.md` | Build comprehensive plugins with multiple components | Markdown + Frontmatter |
| **Agent Template** | `agent/agent-template.md` | Create specialized AI agents | Markdown + Frontmatter |
| **Skill Template** | `skill/SKILL.md` | Define reusable skills | Markdown + Frontmatter |
| **Command Template** | `command/command-template.md` | Build custom slash commands | Markdown + Frontmatter |

### Coming Soon

- **MCP Server Template** - Develop Model Context Protocol servers

---

## 🎯 Quick Start

### Using a Template

1. **Copy the template**
   ```bash
   cp templates/[type]/[template-name].md my-[name].md
   ```

2. **Edit the frontmatter**
   - Update metadata fields (name, description, priority)
   - Configure component-specific settings

3. **Fill in the content**
   - Replace placeholders in brackets: `[Like This]`
   - Add your implementation details
   - Include examples and usage instructions

4. **Test your component**
   - Follow testing instructions in template
   - Verify functionality before deployment

5. **Deploy**
   - Move to appropriate directory (`~/.claude/hooks/`, etc.)
   - Update configuration files as needed
   - Restart Claude Code if necessary

---

## 📋 Hook Template

### What is a Hook?

Hooks are event-driven scripts or prompts that execute automatically when specific Claude Code events occur (e.g., before tool use, after file edit, on session start).

### Template Location

`templates/hook/hook-template.md`

### Supported Hook Events

- **PreToolUse** - Before a tool executes
- **PostToolUse** - After a tool completes
- **Stop** - When session stops
- **SubagentStop** - When subagent finishes
- **SessionStart** - At session start
- **SessionEnd** - When session ends
- **UserPromptSubmit** - On user prompt
- **PreCompact** - Before conversation compaction
- **Notification** - On system notifications

### Quick Create

```bash
# Copy template
cp templates/hook/hook-template.md ~/.claude/hooks/my-hook.md

# Edit the file
vim ~/.claude/hooks/my-hook.md

# Test by triggering the event
```

---

## 🔌 Plugin Template

### What is a Plugin?

Plugins are comprehensive packages that bundle multiple Claude Code components (agents, skills, commands, MCP servers, hooks) to provide complete functionality for specific domains or workflows.

### Template Location

`templates/plugin/plugin-template.md`

### Plugin Structure

```
my-plugin/
├── README.md          # Plugin docs (use template)
├── config.json        # Plugin configuration
├── agents/            # Agent definitions
├── skills/            # Skill definitions
├── commands/          # Command definitions
├── mcp-servers/       # MCP implementations
├── hooks/             # Hook definitions
└── examples/          # Usage examples
```

### Quick Create

```bash
# Create plugin directory
mkdir -p ~/.claude/plugins/my-plugin
cd ~/.claude/plugins/my-plugin

# Copy template
cp /path/to/templates/plugin/plugin-template.md README.md

# Edit README
vim README.md

# Add components
mkdir -p agents skills commands mcp-servers hooks examples
```

---

## 📝 Template Structure

### Frontmatter

All templates use YAML frontmatter for metadata:

```yaml
---
name: Component Name
description: Brief description
priority: P0|P1|P2|P3
version: 1.0.0
author: Your Name
---
```

**Priority Levels:**
- **P0**: Critical, core functionality
- **P1**: Important, commonly used
- **P2**: Useful, specific use cases
- **P3**: Nice-to-have, experimental

---

## 🎨 Customization Guidelines

### Naming Conventions

**Hooks**: `[action]-[trigger].md`
- Examples: `lint-on-save.md`, `test-before-push.md`

**Plugins**: `[domain]-[purpose]-plugin.md`
- Examples: `web-dev-plugin.md`, `data-science-plugin.md`

**Agents**: `[specialty]-[role].json`
- Examples: `security-reviewer.json`, `api-specialist.json`

### File Organization

**Global Components** (available to all projects):
```
~/.claude/
├── hooks/          # Global hooks
├── agents/         # Global agents
├── skills/         # Global skills
├── commands/       # Global commands
└── plugins/        # Plugin packages
```

**Project Components** (project-specific):
```
project/.claude/
├── hooks/          # Project hooks
├── agents/         # Project agents
├── skills/         # Project skills
└── commands/       # Project commands
```

---

## 🚀 Best Practices

### Hooks

1. **Keep Fast** - Hooks should complete quickly
2. **Clear Errors** - Provide helpful error messages
3. **Idempotent** - Safe to run multiple times
4. **Fail Gracefully** - Don't block on non-critical issues

### Plugins

1. **Modular Design** - Components should work independently
2. **Clear Dependencies** - Document all requirements
3. **Version Control** - Track changes with semantic versioning
4. **Comprehensive Docs** - Include examples and troubleshooting

### General

1. **Test Before Deploy** - Always test in safe environment
2. **Document Changes** - Keep changelog updated
3. **Follow Conventions** - Use standard naming and structure
4. **Share Knowledge** - Contribute back to community

---

## 📚 Resources

### Official Documentation

- [Claude Code Documentation](https://github.com/anthropics/claude-code)
- [MCP Specification](https://modelcontextprotocol.io)
- [Claude API Docs](https://docs.anthropic.com)

### Example Components

- [Example Hooks](../hooks/) - Real-world hook implementations
- [Example Plugins](../plugins/) - Complete plugin examples
- [Example Agents](../agents/) - Agent configurations
- [Example Skills](../skills/) - Skill definitions

### Guides

- [Complete Guide](../guides/complete-guide/) - Comprehensive Claude Code guide
- [Quick Start Guide](../QUICKSTART.md) - Get started in 5 minutes
- [Tools Index](../TOOLS-INDEX.md) - Complete component catalog

---

## 🤝 Contributing

### Adding New Templates

1. Create template in appropriate directory
2. Follow existing template structure
3. Include comprehensive documentation
4. Add usage examples
5. Test with real use cases
6. Submit pull request

### Improving Templates

- Report issues and gaps
- Suggest improvements
- Share use cases
- Contribute examples

---

**Happy building!** 🚀

Create amazing Claude Code components with these professional templates.

---

**Author**: Michel Abboud (https://github.com/michelabboud)
**AI Assistance**: Created with Claude Code (Anthropic)
**License**: MIT
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
