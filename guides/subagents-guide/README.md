# Advanced Sub-Agents Guide

Complete guide to mastering Claude Code sub-agents with examples, patterns, and custom agents.

## 📚 What's Included

### Part 1: Specific Agent Examples (`/examples`)
Production-ready agents for common development tasks:

| Agent | Purpose | Best For |
|-------|---------|----------|
| **android-dev** | Android development | Kotlin, Jetpack Compose, Room, Hilt |
| **database-expert** | Database operations | SQL, PostgreSQL, migrations, optimization |
| **api-expert** | REST API development | Endpoints, auth, OpenAPI, error handling |
| **css-tailwind-expert** | Styling specialist | Tailwind CSS, responsive design, theming |
| **git-expert** | Version control | Branching, merging, conflict resolution |
| **performance-optimizer** | Performance tuning | Bundle size, caching, memory optimization |

### Part 2: Coordination Patterns (`/patterns`)
Advanced patterns for orchestrating multiple agents:

- **Orchestration**: Coordinating multiple specialists
- **Parallel Execution**: Running agents simultaneously
- **Sequential Workflows**: Step-by-step pipelines
- **Conditional Routing**: Intelligent task delegation
- **Error Handling**: Retry logic and fallbacks
- **Context Management**: Sharing state between agents

### Part 3: Custom Agents (`/custom`)
Agents tailored specifically for your workflow:

- **gradle-expert**: Android Gradle configuration
- **wsl-helper**: WSL development environment
- **tailwind-system-builder**: Design system creation

## 🚀 Quick Start

### Option 1: Install Individual Agents

```bash
# Copy an agent to your Claude config
cp examples/android-dev.md ~/.claude/agents/

# Restart Claude Code
claude
```

### Option 2: Install All Agents

```bash
# Run the installation script
./install-all-agents.sh
```

### Option 3: Cherry-Pick Agents

```bash
# Install only what you need
cp examples/database-expert.md ~/.claude/agents/
cp examples/api-expert.md ~/.claude/agents/
cp custom/gradle-expert.md ~/.claude/agents/
```

## 💡 Usage Examples

### Simple Usage

```bash
claude

> Write tests for the authentication module

# Claude automatically invokes test-writer agent
# [test-writer] Creating comprehensive test suite...
```

### Explicit Agent Invocation

```bash
> Use the database-expert agent to optimize this query
> Ask the performance-optimizer to analyze bundle size
> Have the git-expert help me resolve this conflict
```

### Coordinated Workflows

```bash
> Implement user profile feature

# [feature-coordinator] orchestrates:
# 1. [planner] designs architecture
# 2. [api-expert] creates backend
# 3. [implementer] builds frontend
# 4. [test-writer] writes tests
# 5. [docs-writer] documents feature
```

## 📖 Learning Path

### Beginner
1. Start with `/examples` - install 2-3 agents you'll use most
2. Try explicit invocation: "Use the X agent to..."
3. Understand when each agent is automatically triggered

### Intermediate
4. Read `/patterns/coordination-patterns.md`
5. Create your first coordinator agent
6. Try parallel execution patterns

### Advanced
7. Study custom agents in `/custom`
8. Modify agents for your specific needs
9. Create complex orchestration workflows
10. Build your own agent ecosystem

## 🎯 When to Use Which Agent

### Development Phase

**Planning & Research**
- `planner` - Architecture and design
- `researcher` - Technology evaluation
- `Explore` (built-in) - Codebase analysis

**Implementation**
- `implementer` - General coding
- `android-dev` - Android apps
- `api-expert` - Backend APIs
- `database-expert` - Database work
- `css-tailwind-expert` - Styling

**Quality Assurance**
- `test-writer` - Test suites
- `code-reviewer` - Code review
- `security-auditor` - Security checks
- `performance-optimizer` - Performance

**Documentation & Deployment**
- `docs-writer` - Documentation
- `devops` - Deployment
- `git-expert` - Version control

## 🔧 Customization Guide

### Modify an Existing Agent

```markdown
1. Copy agent to your directory
cp examples/api-expert.md ~/.claude/agents/

2. Edit in your favorite editor
nano ~/.claude/agents/api-expert.md

3. Customize:
   - Add your company's API standards
   - Include your preferred libraries
   - Add custom validation rules

4. Restart Claude Code
```

### Create a New Agent

```markdown
---
name: your-agent-name
description: When to use this agent. Include examples.
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet
---

# Your Agent Title

[your-agent-name] Brief description of expertise.

## Core Responsibilities

1. What this agent does
2. When to use it
3. How it helps

## Workflow

Step-by-step process this agent follows

## Examples

Concrete examples of agent output

Prefix: [your-agent-name]
```

## 🏗️ Building Complex Workflows

### Example: Complete Feature Implementation

```javascript
// Coordinator orchestrates multiple specialists
async function buildFeature(description) {
  // Phase 1: Parallel research
  const [bestPractices, existingCode, architecture] = await Promise.all([
    invoke("researcher", "Research best practices"),
    invoke("Explore", "Find existing patterns"),
    invoke("planner", "Design architecture")
  ]);
  
  // Phase 2: Parallel implementation
  const [backend, frontend, database] = await Promise.all([
    invoke("api-expert", "Build API", { context: architecture }),
    invoke("implementer", "Build UI", { context: architecture }),
    invoke("database-expert", "Schema", { context: architecture })
  ]);
  
  // Phase 3: Sequential quality checks
  const tests = await invoke("test-writer", "Write tests");
  const review = await invoke("code-reviewer", "Review code");
  const docs = await invoke("docs-writer", "Document feature");
  
  return { backend, frontend, database, tests, review, docs };
}
```

## 📊 Agent Performance Tips

### For Faster Results
- Use `model: sonnet` for routine tasks
- Use parallel execution when possible
- Keep agent prompts focused and specific

### For Better Quality
- Use `model: opus` for complex decisions
- Provide clear context to agents
- Use sequential validation pipelines

### For Cost Efficiency
- Start with Sonnet, escalate to Opus only when needed
- Reuse agent results via context files
- Use built-in `Explore` agent for read-only tasks

## 🐛 Troubleshooting

### Agent Not Found
```bash
# Check agents directory
ls ~/.claude/agents/

# Verify agent name matches file
cat ~/.claude/agents/your-agent.md | grep "^name:"

# Restart Claude
claude
```

### Agent Not Triggered
```bash
# Make description more specific
description: "Database expert. Use for SQL queries, migrations, schema design"

# Add explicit examples
Examples: "optimize query", "create migration", "design schema"
```

### Context Issues
```bash
# Reduce agent scope - make it more focused
# Split into multiple specialized agents
# Use context files to share state
```

## 🤝 Contributing

Have a great agent? Share it!

1. Test your agent thoroughly
2. Add clear documentation
3. Include usage examples
4. Submit a pull request or share in community

## 📚 Additional Resources

- [Claude Code Documentation](https://code.claude.com/docs)
- [Sub-Agents Official Guide](https://code.claude.com/docs/sub-agents)
- [MCP Tools](https://modelcontextprotocol.io/)
- [Community Agents](https://github.com/VoltAgent/awesome-claude-code-subagents)

## 🎓 Pro Tips

1. **Start Small**: Install 3-4 agents you'll use daily
2. **Learn Patterns**: Master one coordination pattern at a time
3. **Iterate**: Customize agents based on your actual usage
4. **Share Context**: Use context files for complex workflows
5. **Monitor Performance**: Track which agents save you the most time
6. **Stay Organized**: Keep agents well-documented and maintained

## 📝 License

These agents are provided as educational examples. Customize freely for your needs!

---

**Happy Coding with Sub-Agents!** 🚀

For questions or suggestions, feel free to reach out or open an issue.
