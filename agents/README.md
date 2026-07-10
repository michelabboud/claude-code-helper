# Agent Examples

This directory contains two types of agent examples: **MCP Agents** and **Sub-Agents**.

## 🤖 Understanding the Difference

### MCP Agents (`mcp-agents/`)
**Configuration-based agents that use MCP (Model Context Protocol) servers**

- **Format**: JSON configuration files
- **Purpose**: Configure Claude to use specific MCP tools
- **Use Case**: Specialized tasks using external tool servers
- **Requires**: MCP servers to be installed and running
- **Examples**: API testing, security scanning, design validation

**Structure:**
```json
{
  "name": "agent-name",
  "instructions": "Expert in X. Use MCP tools for Y",
  "mcp_servers": ["server-name"]
}
```

**How they work:**
1. MCP server provides specialized tools
2. Agent knows how to use those tools
3. Agent orchestrates tool usage for specific workflows

---

### Sub-Agents (`subagents/`)
**Autonomous specialist agents for development tasks**

- **Format**: Markdown files with frontmatter
- **Purpose**: Specialized development expertise
- **Use Case**: Domain-specific development tasks
- **Requires**: Only Claude Code (no external servers)
- **Examples**: Android dev, database work, API design, styling

**Structure:**
```markdown
---
name: agent-name
description: When to trigger this agent
tools: Read, Write, Edit, Bash
model: sonnet
---

# Agent Title
[agent-name] Expert in specific domain...
```

**How they work:**
1. Claude spawns sub-agent for specific task
2. Sub-agent has specialized knowledge and workflows
3. Sub-agent uses built-in tools to complete task
4. Results return to main Claude session

---

## 📂 Directory Structure

```
agents/
├── README.md (this file)
│
├── mcp-agents/                    # MCP-based agents
│   ├── api-specialist.json        # API testing & validation
│   ├── security-reviewer.json     # Security auditing
│   ├── test-quality-enforcer.json # Test coverage
│   ├── design-system-guardian.json # Design compliance
│   ├── full-stack-reviewer.json   # Complete code review
│   ├── performance-optimizer.json  # Performance analysis
│   ├── uiux-reviewer.json         # UI/UX review
│   ├── uiux-design-critic.json    # Design critique
│   └── README.md                  # MCP agents details
│
└── subagents/                     # Sub-agents (autonomous)
    ├── android-dev.md             # Android development
    ├── database-expert.md         # Database operations
    ├── api-expert.md              # REST API development
    ├── css-tailwind-expert.md     # Styling specialist
    ├── git-expert.md              # Version control
    ├── performance-optimizer.md   # Performance tuning
    └── README.md                  # Sub-agents details
```

---

## 🎯 When to Use Each Type

### Use MCP Agents When:
- You need external tool integration (API testing, security scanning)
- You want automated quality checks
- You need access to specialized services
- You're building CI/CD pipelines
- You want consistent, tool-based validation

**Example Workflows:**
- API testing with security validation
- Automated code review with multiple tools
- Design system compliance checking
- Performance benchmarking

---

### Use Sub-Agents When:
- You need specialized development expertise
- You want autonomous problem-solving
- You're building features or fixing bugs
- You need domain-specific knowledge
- You want code generation and refactoring

**Example Workflows:**
- Android app development
- Database schema design
- API endpoint implementation
- Responsive design with Tailwind
- Git conflict resolution

---

## 🚀 Installation

### Installing MCP Agents

**Prerequisites:**
1. Install MCP servers first (see [../mcp-servers/](../mcp-servers/))
2. Configure MCP servers in Claude Desktop/Code config

**Installation:**
```bash
# Copy MCP agent configs
cp mcp-agents/*.json ~/.claude/agents/

# Verify MCP servers are running
claude
/tools
# Should see MCP tools listed
```

---

### Installing Sub-Agents

**No prerequisites needed!** Sub-agents work out of the box.

**Option 1: Install All**
```bash
cp subagents/*.md ~/.claude/agents/
```

**Option 2: Install Specific Agents**
```bash
# Just database and API experts
cp subagents/database-expert.md ~/.claude/agents/
cp subagents/api-expert.md ~/.claude/agents/
```

**Option 3: Use Installation Script**
```bash
# From subagents guide
cd ../../guides/subagents-guide/
./install-all-agents.sh
```

---

## 💡 Usage Examples

### Using MCP Agents

```bash
claude

# Explicit invocation
> Use the api-specialist agent to test our REST API

# Claude spawns api-specialist which uses MCP tools:
# - validate_openapi
# - test_endpoint
# - check_api_security
# - suggest_improvements
```

### Using Sub-Agents

```bash
claude

# Automatic invocation (based on context)
> Build an Android login screen with Material 3

# Claude automatically spawns android-dev agent
# [android-dev] I'll create a Material 3 login screen...

# Explicit invocation
> Use the database-expert to optimize this query

# [database-expert] Analyzing query performance...
```

### Combining Both Types

```bash
# Main Claude orchestrates both types
> Build and test a new API endpoint

# Workflow:
# 1. api-expert sub-agent builds the endpoint
# 2. test-quality-enforcer sub-agent writes tests
# 3. api-specialist MCP agent validates with tools
# 4. security-reviewer MCP agent runs security scan
```

---

## 🔧 Customization

### Customizing MCP Agents

Edit JSON configuration:
```json
{
  "name": "my-custom-agent",
  "instructions": "Customize behavior here...",
  "mcp_servers": ["api-specialist", "testing"],
  "model": "sonnet"
}
```

### Customizing Sub-Agents

Edit Markdown content:
```markdown
---
name: my-android-dev
description: Android expert for my company's architecture
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# My Company Android Expert

[my-android-dev] Specialized in:
- Our custom architecture (MVVM + Clean)
- Our UI component library
- Company-specific patterns
...
```

### New Agent Frontmatter Features (v1.0.60+)

Since Claude Code v1.0.60, agents support additional frontmatter fields:

```markdown
---
name: secure-developer
description: Security-focused development agent
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
permissionMode: default
disallowedTools: WebFetch, WebSearch
hooks:
  PreToolUse: |
    if [[ "$TOOL_NAME" == "Write" ]]; then
      # Minimal example - for production use a proper scanner (gitleaks, trufflehog)
      grep -qE "api[_-]?key|password|secret|token" "$FILE_PATH" 2>/dev/null && exit 1
    fi
  PostToolUse: |
    echo "Tool completed: $TOOL_NAME"
---
```

| Field | Version | Description |
|-------|---------|-------------|
| `model` | v1.0.64 | Specify which model the agent should use (e.g., `sonnet`, `opus`, `haiku`) |
| `permissionMode` | v2.0.43 | Permission mode for the agent (`default`, etc.) |
| `disallowedTools` | v2.0.30 | Tools the agent cannot use |
| `hooks` | v2.1.0 | Inline PreToolUse, PostToolUse, and Stop hooks scoped to the agent |

### Invoking Agents

```bash
# @-mention syntax (v1.0.62+)
> @my-android-dev Build a login screen

# Automatic detection based on description
> Build an Android login screen with Material 3

# Explicit invocation
> Use the my-android-dev agent to build a login screen

# Disable specific agents via settings
# In settings.json: "disallowedTools": ["Task(AgentName)"]
```

---

## 📚 Learn More

### MCP Agents
- [MCP Servers Documentation](../mcp-servers/README.md)
- [MCP Agents README](./mcp-integrated/README.md)
- [MCP Protocol Docs](https://modelcontextprotocol.io)

### Sub-Agents
- [Sub-Agents Guide](../guides/subagents-guide/README.md)
- [Sub-Agents README](../guides/subagents-guide/README.md)
- [Coordination Patterns](../guides/subagents-guide/patterns/)

### Both
- [Complete Guide](../guides/complete-guide/README.md)
- [Tools Comparison](../guides/complete-guide/01-TOOLS-COMPARISON.md)

---

## 🎓 Best Practices

### For MCP Agents:
1. **One Focus**: Each agent should use 1-2 MCP servers max
2. **Clear Instructions**: Specify exactly how to use MCP tools
3. **Error Handling**: Handle tool failures gracefully
4. **Tool Discovery**: Let agents explore available tools

### For Sub-Agents:
1. **Domain Expertise**: Make each agent deeply specialized
2. **Clear Triggers**: Define when agent should activate
3. **Tool Selection**: Only include tools agent needs
4. **Model Choice**: Use Sonnet unless Opus reasoning needed

### For Both:
1. **Naming**: Use descriptive, unique names
2. **Documentation**: Include usage examples
3. **Testing**: Test before deployment
4. **Versioning**: Track changes to agent configs

---

## 🤝 Contributing

Have agent examples to share?
1. Test thoroughly with real workflows
2. Document when to use vs alternatives
3. Include example usage
4. Submit to community repositories

---

**Build Specialized Agents!** 🤖✨

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the Apache-2.0 License. Free to use for personal and commercial projects.
