# Sub-Agents Quick Reference

Lightning-fast reference for Claude Code sub-agents. Bookmark this!

## 🎯 Quick Agent Selection

```
Testing?          → test-writer
Database?         → database-expert
API/REST?         → api-expert
Styling?          → css-tailwind-expert
Git issues?       → git-expert
Performance?      → performance-optimizer
Android?          → android-dev
WSL problems?     → wsl-helper
Design system?    → tailwind-system-builder
```

## 💬 Usage Patterns

```bash
# Automatic (Claude decides)
> Write tests for authentication

# Explicit agent
> Use the database-expert to optimize this query

# With context
> Ask the api-expert to create user endpoints following our conventions
```

## 🔧 Agent Locations

```bash
# User-level agents (all projects)
~/.claude/agents/

# Project-level agents (current project only)
./.claude/agents/

# List installed agents
ls ~/.claude/agents/

# Edit agent
nano ~/.claude/agents/database-expert.md
```

## 📋 Agent Template

```markdown
---
name: agent-name
description: Use for [when]. Examples: "do X", "fix Y"
tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet  # or opus
---

# Agent Title

[agent-name] Brief description.

## Expertise
- What
- This
- Does

## Workflow
1. Step one
2. Step two

## Examples
Show concrete examples

Prefix: [agent-name]
```

## 🎨 Common Agent Combinations

### Full-Stack Feature
```
1. planner (architecture)
2. api-expert (backend)
3. implementer (frontend)
4. database-expert (schema)
5. test-writer (tests)
6. docs-writer (docs)
```

### Bug Fix Pipeline
```
1. Explore (find related code)
2. code-reviewer (identify issues)
3. implementer (fix)
4. test-writer (regression tests)
5. git-expert (commit strategy)
```

### Performance Optimization
```
1. performance-optimizer (analyze)
2. database-expert (query optimization)
3. implementer (code changes)
4. test-writer (benchmarks)
```

## ⚡ Coordination Patterns

### Parallel Execution
```javascript
// Launch multiple agents at once
Task("Research best practices", { agent: "researcher" })
Task("Analyze codebase", { agent: "Explore" })
Task("Design architecture", { agent: "planner" })
// All run simultaneously
```

### Sequential Pipeline
```javascript
// One after another
const tests = await Task("Write tests", { agent: "test-writer" });
const review = await Task("Review code", { agent: "code-reviewer" });
const docs = await Task("Document", { agent: "docs-writer" });
```

### Conditional Routing
```javascript
if (taskInvolves('database')) {
  agent = 'database-expert';
} else if (taskInvolves('api')) {
  agent = 'api-expert';
}
```

## 🛠️ Tool Permissions

```
Read-only agents:    Read, Grep, Glob
Code reviewers:      Read, Grep, Glob
Researchers:         Read, Grep, WebSearch, WebFetch
Code writers:        Read, Write, Edit, Bash, Grep, Glob
Full access:         All tools
```

## 📊 Model Selection

```
Simple tasks:          sonnet
Complex architecture:  opus
Research:             opus + WebSearch
Code implementation:   sonnet
Code review:          sonnet
Performance analysis:  opus
```

## 🚨 Common Issues

### Agent not triggering?
```markdown
# Fix description
description: "Database expert for SQL, migrations, schema"
# Add examples
Examples: "optimize query", "create migration"
```

### Agent conflicts?
```bash
# Make descriptions more specific
# Remove overlapping responsibilities
# Use explicit agent invocation
```

### Context issues?
```bash
# Share context via files
echo '{"context": "..."}' > .claude/shared-context.json

# Read in agent
const context = read('.claude/shared-context.json')
```

## 📦 Installation

### Single Agent
```bash
cp agent-file.md ~/.claude/agents/
claude  # restart
```

### All Agents
```bash
./install-all-agents.sh
```

### Verify Installation
```bash
ls ~/.claude/agents/
claude
/agents  # list agents in Claude
```

## 🔍 Debugging

### Check Agent Files
```bash
# List agents
ls -la ~/.claude/agents/

# Check agent syntax
cat ~/.claude/agents/agent-name.md | head -20

# Verify name matches file
grep "^name:" ~/.claude/agents/*.md
```

### Test Agent
```bash
claude
> Use the [agent-name] to [specific task]
```

## 💡 Pro Tips

1. **Start Small**: Install 3-4 agents
2. **Be Specific**: Clear agent descriptions
3. **Use Prefixes**: Agent responses show [agent-name]
4. **Share Context**: Use context files for complex workflows
5. **Monitor Usage**: Track which agents help most
6. **Iterate**: Refine based on actual use

## 🎓 Advanced Patterns

### Error Handling
```javascript
try {
  await Task(task, { agent: 'primary-agent' });
} catch {
  await Task(task, { agent: 'fallback-agent' });
}
```

### Context Building
```javascript
const discovery = await Task("Analyze", { agent: "Explore" });
const plan = await Task(`Plan using: ${discovery}`, { agent: "planner" });
const code = await Task(`Implement: ${plan}`, { agent: "implementer" });
```

### Validation
```javascript
const result = await Task(task);
if (!validate(result)) {
  await Task(`Fix issues: ${errors}`, { agent: 'same-agent' });
}
```

## 📚 Resources

- Full Guide: `README.md`
- Examples: `/examples/`
- Patterns: `/patterns/coordination-patterns.md`
- Custom: `/custom/michel-custom-agents.md`
- Docs: https://code.claude.com/docs/sub-agents

## ⌨️ Keyboard Shortcuts

```bash
# In Claude Code
/agents          # List agents
/model opus      # Switch model
/status          # Show status
Ctrl+C           # Cancel
```

---

**Keep this guide handy!** Bookmark it or print it out. 🔖
