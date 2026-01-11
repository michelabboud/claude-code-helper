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

### 2. [Sub-Agents Guide](./subagents-guide/)
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

### 3. [Advanced Patterns](./advanced-patterns/)
**Production-ready patterns for robust, reliable agentic systems**

**Contents:**
- `agent-loop-prevention.md` - **Comprehensive guide to preventing "Ralph Wiggum loops"** (2,245 lines, 56KB)
  - Zero-to-hero progression with Playwright examples (Beginner → Expert)
  - Real-life scenarios with 3rd party tools (APIs, databases, S3, scraping, CI/CD)
  - Circuit breaker patterns, progress tracking, timeouts
  - Complete production-ready Playwright test agent
- `multi-agent-orchestration.md` - Advanced multi-agent coordination strategies
- `testing-strategy.md` - Comprehensive testing approaches for different project types

**Best for:**
- Building production systems
- Preventing infinite loops and unproductive cycles
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

### Choose Sub-Agents Guide if you want to:
- Build specialized agents
- Implement multi-agent workflows
- See production-ready examples
- Learn coordination patterns

### Choose Advanced Patterns if you want to:
- Prevent agent infinite loops (Ralph Wiggum loops)
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
2. Review [Tools Comparison](./complete-guide/01-TOOLS-COMPARISON.md)
3. Keep [Quick Reference](./complete-guide/02-QUICK-REFERENCE.md) handy

### Week 3-4: Advanced Features
4. Study [Sub-Agents Overview](./subagents-guide/README.md)
5. Try [Integration Example](./subagents-guide/INTEGRATION-EXAMPLE.md)
6. Explore [Agent Examples](./subagents-guide/examples/)

### Week 5+: Mastery
7. **Master [Agent Loop Prevention](./advanced-patterns/agent-loop-prevention.md)** - Essential for production
8. Learn [Coordination Patterns](./subagents-guide/patterns/)
9. Study [Multi-Agent Orchestration](./advanced-patterns/multi-agent-orchestration.md)
10. Build custom agents for your workflow
11. Create multi-agent orchestration systems

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

- [Examples Directory](../examples/) - Ready-to-use examples for all tools
- [Templates Directory](../templates/) - Starter templates
- [MCP Servers](../mcp-servers/) - 5 specialized MCP servers
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
