# Claude Code Guides

Comprehensive learning resources for mastering Claude Code from beginner to expert.

## 📚 Available Guides

### 1. [Complete Guide](./complete-guide/)
**Zero to Hero learning path covering all Claude Code features**

**Contents:**
- `00-ZERO-TO-HERO-GUIDE.md` - Complete structured learning path
- `01-TOOLS-COMPARISON.md` - Compare Skills, Agents, Commands, Hooks, MCP
- `02-QUICK-REFERENCE.md` - Quick lookup cheat sheet
- `03-BEST-PRACTICES.md` - Industry patterns and best practices
- `04-TROUBLESHOOTING.md` - Common issues and solutions
- `resources/` - Links, glossary, and additional resources

**Best for:**
- New users learning Claude Code
- Understanding tool differences
- Reference documentation
- Problem-solving

**Start here:** [Complete Guide README](./complete-guide/README.md)

---

### 2. [Building Blocks Guide](./CLAUDE-CODE-BUILDING-BLOCKS.md)
**Understand how Skills, Agents, Hooks, MCP Servers, and Plugins fit together**

Explains the 5 Claude Code extension points with practical examples, comparison tables, and a decision guide for choosing the right tool for any job.

**Covers:**
- Skills vs Agents vs Hooks vs MCP Servers vs Plugins
- When to use each (decision lookup table)
- How they work together (real-world flow)
- File formats, configuration, and anatomy of each
- Complexity ladder from simple to advanced

**Best for:**
- Understanding the Claude Code architecture
- Choosing the right building block for your task
- Seeing how all the pieces connect

**Start here:** [Building Blocks Guide](./CLAUDE-CODE-BUILDING-BLOCKS.md)

---

### 3. [Sub-Agents Guide](./subagents-guide/)
**Advanced guide to Claude Code sub-agents with production-ready examples**

**Contents:**
- `README.md` - Main documentation and overview
- `QUICK-REFERENCE.md` - Lightning-fast cheat sheet
- `INTEGRATION-EXAMPLE.md` - Complete real-world authentication example
- `examples/` - 6+ production-ready agent examples
- `patterns/` - 12+ advanced coordination patterns
- `custom/` - Specialized agents (Gradle, WSL, Tailwind)
- `install-all-agents.sh` - Interactive installation script

**Agent Examples:**
- android-dev - Android/Kotlin development
- database-expert - SQL, PostgreSQL, migrations
- api-expert - REST APIs, authentication
- css-tailwind-expert - Tailwind CSS, responsive design
- git-expert - Version control workflows
- performance-optimizer - Bundle size, caching, memory

**Best for:**
- Building specialized agents
- Multi-agent workflows
- Advanced orchestration patterns
- Real-world agent examples

**Start here:** [Sub-Agents Guide README](./subagents-guide/README.md)

---

### 4. [Advanced Patterns](./advanced-patterns/)
**Production-ready patterns for robust, reliable agentic systems**

**Contents:**
- `agent-loop-prevention.md` - **Comprehensive guide to preventing "Ralph Wiggum loops"** (2,245 lines, 56KB)
  - Zero-to-hero progression with Playwright examples (Beginner → Expert)
  - Real-life scenarios with 3rd party tools (APIs, databases, S3, scraping, CI/CD)
  - Circuit breaker patterns, progress tracking, timeouts
  - Complete production-ready Playwright test agent
- `solving-ai-coding-problems.md` - **Solutions to top 11 developer complaints** (2,386 lines, 60KB)
  - Research-backed solutions from 2025-2026 developer studies
  - RAG system implementation with ChromaDB
  - Smart routing for cost optimization (80% savings)
  - Quality gates, verification agents, context caching
  - Memory management and session persistence
  - Complete agent implementations ready to deploy
- `multi-agent-orchestration.md` - Advanced multi-agent coordination strategies
- `testing-strategy.md` - Comprehensive testing approaches for different project types

**Best for:**
- Building production systems
- Preventing infinite loops and unproductive cycles
- Solving real developer pain points with AI tools
- Eliminating hallucinations with RAG systems
- Optimizing AI costs and performance
- Implementing quality gates and verification
- Managing context and memory across sessions
- Ensuring agent reliability
- Implementing circuit breakers and error recovery
- Working with external tools (Playwright, AWS, PostgreSQL, etc.)

**Start here:** [Agent Loop Prevention Guide](./advanced-patterns/agent-loop-prevention.md) - Essential reading for production development

---

## 🎯 Which Guide Should I Use?

### Choose Complete Guide if you want to:
- Learn Claude Code from scratch
- Understand all available tools
- Get a comprehensive overview
- Find quick references

### Choose Building Blocks Guide if you want to:
- Understand the difference between Skills, Agents, Hooks, MCP Servers, and Plugins
- Know which building block to use for a given task
- See how all the extension points work together

### Choose Sub-Agents Guide if you want to:
- Build specialized agents
- Implement multi-agent workflows
- See production-ready examples
- Learn coordination patterns

### Choose Advanced Patterns if you want to:
- Prevent agent infinite loops (Ralph Wiggum loops)
- Solve real developer complaints about AI coding tools
- Implement RAG systems to eliminate hallucinations
- Optimize AI costs (80% reduction strategies)
- Build quality gates and verification systems
- Manage AI memory and context persistence
- Build production-ready systems
- Implement circuit breakers and error recovery
- Work with external tools (Playwright, AWS, databases)
- Ensure agent reliability and robustness

### Use All Three if you want to:
- Master Claude Code completely
- Build professional workflows
- Create reliable, production-ready systems
- Become a Claude Code expert

---

## 📖 Recommended Learning Path

### Week 1-2: Foundations
1. Read [Complete Guide: Zero to Hero](./complete-guide/00-ZERO-TO-HERO-GUIDE.md)
2. Read [Building Blocks Guide](./CLAUDE-CODE-BUILDING-BLOCKS.md) — understand the 5 extension points
3. Review [Tools Comparison](./complete-guide/01-TOOLS-COMPARISON.md)
4. Keep [Quick Reference](./complete-guide/02-QUICK-REFERENCE.md) handy

### Week 3-4: Advanced Features
5. Study [Sub-Agents Overview](./subagents-guide/README.md)
5. Try [Integration Example](./subagents-guide/INTEGRATION-EXAMPLE.md)
6. Explore [Agent Examples](./subagents-guide/examples/)

### Week 5+: Mastery
7. **Master [Agent Loop Prevention](./advanced-patterns/agent-loop-prevention.md)** - Essential for production
8. **Study [Solving AI Coding Problems](./advanced-patterns/solving-ai-coding-problems.md)** - Real-world solutions
9. Learn [Coordination Patterns](./subagents-guide/patterns/)
10. Study [Multi-Agent Orchestration](./advanced-patterns/multi-agent-orchestration.md)
11. Build custom agents for your workflow
12. Create multi-agent orchestration systems
13. Implement RAG systems and quality gates

---

## 🚀 Quick Start

```bash
# 1. Read the guides
cd guides/
cat complete-guide/README.md
cat subagents-guide/README.md

# 2. Install example agents
cd subagents-guide/
./install-all-agents.sh

# 3. Start using Claude Code
claude
```

---

## 💡 Pro Tips

- **Start Simple**: Master one tool type before moving to the next
- **Practice Daily**: Build real projects, not just examples
- **Combine Tools**: Use Skills + Agents + MCP together
- **Share Knowledge**: Contribute your discoveries back

---

## 📚 Additional Resources

- [Agents Directory](../agents/) - 46 production-ready agents
- [Skills Directory](../skills/) - 14 workflow skills
- [Templates Directory](../templates/) - Starter templates
- [MCP Servers](../mcp-servers/) - 10 specialized MCP servers
- [Config Bundle](../config-bundle/) - Production configuration

---

## 🔗 External Links

- [Official Documentation](https://code.claude.com/docs)
- [Skills Repository](https://github.com/anthropics/skills)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude API Docs](https://docs.anthropic.com)

---

**Happy Learning!** 🚀

For questions or suggestions, check the troubleshooting sections in each guide.

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
