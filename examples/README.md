# Claude Code Examples

Ready-to-use examples for all Claude Code tool types. Copy, customize, and use in your projects!

## 📁 What's Included

### 1. [Agents](./agents/) 🤖
Pre-configured agent examples for both MCP agents and sub-agents.

**MCP Agents** (`agents/mcp-agents/`):
- `api-specialist.json` - API testing and validation
- `security-reviewer.json` - Security auditing
- `test-quality-enforcer.json` - Test coverage enforcement
- `design-system-guardian.json` - Design system compliance
- `full-stack-reviewer.json` - Complete code review
- `performance-optimizer.json` - Performance analysis
- `uiux-reviewer.json` - UI/UX design review
- `uiux-design-critic.json` - Design critique

**Sub-Agents** (`agents/subagents/`):
- `android-dev.md` - Android development specialist
- `database-expert.md` - Database operations
- `api-expert.md` - REST API development
- `css-tailwind-expert.md` - Styling and Tailwind
- `git-expert.md` - Version control
- `performance-optimizer.md` - Performance tuning

---

### 2. [Skills](./skills/) ✨
Reusable skills that enhance Claude's capabilities.

**What are Skills?**
Skills teach Claude new workflows and specialized knowledge. They're activated based on context and user requests.

**Available Skills:**

**Workflow & Development:**
- Code review workflow
- Refactoring strategy
- API design patterns
- Database design patterns
- TDD workflow
- Release management
- CI best practices
- Caching expert (Static, Object, HTTP, CDN)

**Advanced Testing Suite:**
- Visual regression testing (Percy, Chromatic, BackstopJS)
- Contract testing (Pact, consumer-driven contracts)
- Mutation testing (Stryker, PITest, Mutmut)
- BDD framework examples (Cucumber, Behave, SpecFlow)
- Advanced E2E testing (Complex workflows, auth, mocking)

**Usage:**
```bash
cp skills/visual-regression-testing.md ~/.claude/skills/
```

---

### 3. [Commands](./commands/) ⚡
Custom slash commands for quick workflows.

**What are Commands?**
Slash commands provide quick access to common operations with structured inputs.

**Example commands:**
- `/plan` - Planning workflow
- `/review` - Code review
- `/test` - Run tests
- `/docs` - Generate documentation

**Usage:**
```bash
cp commands/example.md ~/.claude/commands/
# Then use: /example <args>
```

---

### 4. [Hooks](./hooks/) 🎣
Event-driven automation and validation.

**What are Hooks?**
Hooks execute automatically in response to events like tool usage, session start/end, etc.

**Hook Types:**
- PreToolUse - Before tool execution
- PostToolUse - After tool execution
- SessionStart - When session begins
- SessionEnd - When session ends

**Usage:**
```bash
cp hooks/example-hook ~/.claude/hooks/
```

---

### 5. [Plugins](./plugins/) 🔌
Complete packages combining multiple tool types.

**What are Plugins?**
Plugins bundle skills, agents, commands, and hooks into cohesive packages for specific workflows.

**Example plugins:**
- Full-stack development
- Testing automation
- Documentation generation
- Code review workflows

**Usage:**
```bash
cp -r plugins/example-plugin ~/.claude/plugins/
```

---

### 6. [MCP Configs](./mcp/) 🌐
Model Context Protocol server configurations.

**What is MCP?**
MCP servers extend Claude's capabilities with external tools and services.

**Example configurations:**
- GitHub integration
- Database connections
- API testing tools
- File system operations

**Usage:**
```json
// Add to claude_desktop_config.json
{
  "mcpServers": {
    "example": {
      "command": "node",
      "args": ["/path/to/server.js"]
    }
  }
}
```

---

### 7. [Integrations](./integrations/) 🔗
Integration examples showing how to connect Claude Code with external services and tools.

---

### 8. [Sub-Agents](./sub-agents/) 🤖
Additional sub-agent examples demonstrating specialized autonomous agents.

---

## 🚀 Quick Start

### Browse Examples
```bash
# Navigate to examples directory
cd examples/

# List all agent examples
ls agents/mcp-agents/
ls agents/subagents/

# List all other examples
ls skills/ commands/ hooks/ plugins/ mcp/
```

### Install Examples

**Option 1: Install Individual Examples**
```bash
# Copy specific examples
cp agents/subagents/database-expert.md ~/.claude/agents/
cp skills/example-skill ~/.claude/skills/
cp commands/plan.md ~/.claude/commands/
```

**Option 2: Install by Category**
```bash
# Install all sub-agents
cp agents/subagents/* ~/.claude/agents/

# Install all skills
cp -r skills/* ~/.claude/skills/

# Install all commands
cp commands/* ~/.claude/commands/
```

**Option 3: Install Everything**
```bash
# Use installation scripts from guides
cd ../guides/subagents-guide/
./install-all-agents.sh
```

### Customize Examples
1. Copy example to your Claude directory
2. Open in text editor
3. Modify instructions, tools, or configuration
4. Restart Claude Code
5. Test your customizations

---

## 📖 Example Structure

### Agents (JSON Format)
```json
{
  "name": "agent-name",
  "description": "What this agent does",
  "instructions": "Detailed instructions...",
  "tools": ["tool1", "tool2"],
  "model": "sonnet"
}
```

### Agents (Markdown Format)
```markdown
---
name: agent-name
description: When to use this agent
tools: Read, Write, Edit, Bash
model: sonnet
---

# Agent Instructions
...
```

### Skills
```markdown
---
name: skill-name
description: What this skill teaches
---

# Skill Content
...
```

### Commands
```markdown
---
name: command-name
description: What this command does
arguments:
  - name: arg1
    description: First argument
---

# Command Implementation
...
```

---

## 💡 Usage Tips

### For Beginners
1. Start with **Commands** - Easiest to understand
2. Try **Skills** - Add new capabilities
3. Explore **Agents** - Specialized assistants

### For Intermediate Users
4. Combine **Skills + Agents** - Powerful workflows
5. Add **Hooks** - Automation and validation
6. Integrate **MCP** - External tools

### For Advanced Users
7. Build **Plugins** - Complete ecosystems
8. Create **Multi-Agent Workflows** - Orchestration
9. Develop **Custom MCP Servers** - Extend capabilities

---

## 🔍 Finding the Right Example

### By Development Phase

**Planning & Design:**
- Skills: Planning workflows
- Agents: Planner, architect
- Commands: /plan

**Implementation:**
- Agents: android-dev, api-expert, implementer
- Skills: Code generation
- MCP: GitHub, file system

**Testing:**
- Skills: Visual regression, contract testing, mutation testing, BDD, advanced E2E
- Agents: test-quality-enforcer
- MCP: Testing tools
- Hooks: Test validation

**Review & Documentation:**
- Agents: code-reviewer, security-reviewer
- Commands: /review, /docs
- Skills: Documentation patterns

### By Technology

**Frontend:**
- Agents: css-tailwind-expert, uiux-reviewer
- Skills: React patterns, styling
- MCP: Browser automation

**Backend:**
- Agents: api-expert, database-expert
- Skills: API design, authentication
- MCP: Database connections

**DevOps:**
- Agents: Performance-optimizer
- Commands: Deployment workflows
- Hooks: Build validation

---

## 📚 Learn More

- [Complete Guide](../guides/complete-guide/) - Understand all tools
- [Sub-Agents Guide](../guides/subagents-guide/) - Deep dive into agents
- [MCP Servers](../mcp-servers/) - Full MCP system
- [Templates](../templates/) - Create your own

---

## 🤝 Contributing

Have a great example to share?
1. Test it thoroughly
2. Add clear documentation
3. Include usage instructions
4. Share with the community!

---

**Explore, Learn, Build!** 🚀

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
