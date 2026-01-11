# Claude Code Helper - Complete Toolkit

**Your comprehensive resource for mastering Claude Code with guides, examples, MCP servers, and production-ready configurations.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Latest-purple.svg)](https://code.claude.com)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📖 Quick Reference

### Documentation Hub

| Document | Purpose | Use When |
|----------|---------|----------|
| **[📋 TOOLS-INDEX.md](TOOLS-INDEX.md)** | Complete catalog of all components | Exploring available tools |
| **[⚡ TOOLS-CHEATSHEET.md](TOOLS-CHEATSHEET.md)** | Quick reference for 131 tools/agents/skills | Need instant lookup |
| **[🏗️ ECOSYSTEM-DIAGRAM.md](ECOSYSTEM-DIAGRAM.md)** | Visual architecture & workflow diagrams | Understanding how it all works |
| **[🧪 TESTING-GUIDE.md](TESTING-GUIDE.md)** | Validation with 136 test cases | Testing your installation |
| **[🤖 test-automation/](test-automation/)** | Automated testing framework | Running automated tests |
| **[📊 INSTALLATION-STATISTICS.md](INSTALLATION-STATISTICS.md)** | Impact analysis & metrics | Understanding resource usage |

### What's Available

- **48 Agents** (14 MCP agents + 34 sub-agents)
- **60 MCP Tools** across 9 servers (30 production + 30 experimental)
- **16 Skills** (workflow and testing patterns)
- **7 Commands** (development workflow automation)
- **Comprehensive guides, templates, and integration examples**

---

## 🎯 What's Inside

This repository contains everything you need to become productive with Claude Code:

| Component | Description | Best For |
|-----------|-------------|----------|
| **[Guides](#-guides)** | Complete learning paths from zero to hero | Learning & Reference |
| **[MCP Servers](#-mcp-servers)** | 9 specialized servers for code quality & automation | Automation & CI/CD |
| **[Examples](#-examples)** | Ready-to-use examples for all tool types | Quick Start & Templates |
| **[Templates](#-templates)** | Starter templates for creating your own | Building Custom Tools |
| **[Config Bundle](#-config-bundle)** | Production-ready global configuration | Setup & Optimization |

---

## 🚀 Quick Start

### For Complete Beginners
```bash
# 1. Read the zero-to-hero guide
cat guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md

# 2. Install the config bundle
cd config-bundle
./scripts/install-all.sh

# 3. Start using Claude Code
claude
```

### For Intermediate Users
```bash
# 1. Explore examples
cd examples && ls -la

# 2. Install sub-agents
cd ../guides/subagents-guide
./install-all-agents.sh

# 3. Set up MCP servers
cd ../../mcp-servers
./install-all.sh
# Add with CLI (commands provided by script)
# Or configure Claude Desktop (see QUICKGUIDE.md)
```

### For Advanced Users
```bash
# Build custom agents, integrate MCP, create workflows
# See: guides/subagents-guide/patterns/
```

---

## 📚 Guides

**[📖 Navigate to Guides →](./guides/)**

Comprehensive documentation to master Claude Code at every level.

### [Complete Guide](./guides/complete-guide/)
Zero to hero learning path covering all Claude Code features.

**Includes:**
- **Zero-to-Hero Guide** - Structured learning from basics to mastery
- **Tools Comparison** - Skills vs Agents vs Commands vs Hooks vs MCP
- **Quick Reference** - Cheat sheet for common operations
- **Best Practices** - Industry patterns and conventions
- **Troubleshooting** - Common issues and solutions

**Start here if:** You're new to Claude Code or want comprehensive documentation.

---

### [Sub-Agents Guide](./guides/subagents-guide/)
Advanced guide with production-ready agent examples and orchestration patterns.

**Includes:**
- **6+ Agent Examples** - Android, Database, API, Styling, Git, Performance
- **12+ Patterns** - Orchestration, parallel execution, sequential workflows
- **Real-World Example** - Complete authentication system implementation
- **Custom Agents** - Gradle expert, WSL helper, Tailwind builder

**Start here if:** You want to build specialized agents and multi-agent workflows.

---

## 🌐 MCP Servers

**[🔌 Navigate to MCP Servers →](./mcp-servers/)**

Nine specialized Model Context Protocol servers for automated code quality, testing, and DevOps workflows.

### Production Servers (5)

| Server | Tools | Purpose |
|--------|-------|---------|
| **API Specialist** | 8 tools | API testing, validation, security, docs |
| **Code Review** | 4 tools | Linting, security scanning, complexity |
| **Design System** | 5 tools | Token validation, component checks, a11y |
| **Testing** | 4 tools | Test execution, coverage, quality analysis |
| **UI/UX Review** | 9 tools | Design review, accessibility, wireframes |

**Total: 30 production tools**

### Experimental Servers (4) 🧪

| Server | Purpose |
|--------|---------|
| **CI/CD Pipeline** | Pipeline generation, optimization, troubleshooting |
| **Database Operations** | Migrations, queries, schema management |
| **Dependency Management** | Security scanning, updates, license compliance |
| **n8n Automation** | Workflow automation and integration |

**Total: 52+ tools across all servers**

### Quick Install

**Option 1: Claude Code CLI (Recommended - 2 minutes)**
```bash
cd mcp-servers
./install-all.sh

# Add servers with CLI (commands provided by install script)
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"

# Verify
claude mcp list
```

**Option 2: Claude Desktop (5 minutes)**
```bash
cd mcp-servers
./install-all.sh

# Configure Claude Desktop
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
# Linux: ~/.config/Claude/claude_desktop_config.json
# (Paths provided by install script)
```

### Use Cases
- **Automated Code Review**: Lint, security scan, complexity check
- **API Development**: Test endpoints, validate specs, generate docs
- **Design Systems**: Validate tokens, check components, audit accessibility
- **Testing**: Run tests, check coverage, analyze quality
- **UI/UX**: Review designs, check WCAG compliance, generate wireframes

**Learn more:** [MCP Servers Documentation](./mcp-servers/README.md)

---

## 💡 Examples

**[📝 Navigate to Examples →](./examples/)**

Ready-to-use examples for all Claude Code tool types. Copy, customize, and deploy!

### What's Included

#### [Agents](./examples/agents/) 🤖
- **MCP Agents** (12 configs) - Use MCP servers for specialized tasks (8 production + 4 experimental)
- **Sub-Agents** (32+ agents) - Autonomous domain experts

#### [Skills](./examples/skills/) ✨
- **Workflows:** Code review, refactoring, TDD, release management, CI best practices
- **Testing Suite:** Visual regression, contract testing, mutation testing, BDD, advanced E2E
- **Architecture:** API design, database design, caching patterns

#### [Commands](./examples/commands/) ⚡
- Slash commands for quick operations
- `/plan`, `/review`, `/test`, `/docs`

#### [Hooks](./examples/hooks/) 🎣
- Event-driven automation
- PreToolUse, PostToolUse, SessionStart, SessionEnd

#### [Plugins](./examples/plugins/) 🔌
- Complete packages combining multiple tools
- Full-stack dev, testing, documentation workflows

#### [MCP Configs](./examples/mcp/) 🌐
- MCP server configuration examples
- GitHub, database, API integration

### Installation
```bash
# Browse examples
cd examples && ls -la

# Install specific category
cp agents/subagents/database-expert.md ~/.claude/agents/

# Install everything
cd ../guides/subagents-guide
./install-all-agents.sh
```

**Learn more:** [Examples Documentation](./examples/README.md)

---

## 📐 Templates

**[🎨 Navigate to Templates →](./templates/)**

Starter templates for creating your own tools.

### Available Templates
- **Agent Template** - Create custom agents
- **Skill Template** - Build reusable skills
- **Command Template** - Design slash commands

### Usage
```bash
# Copy template
cp templates/agent/template.md ~/.claude/agents/my-agent.md

# Customize
nano ~/.claude/agents/my-agent.md

# Use
claude
```

---

## ⚙️ Config Bundle

**[🔧 Navigate to Config Bundle →](./config-bundle/)**

Production-ready global configuration for Claude Code with status lines, commands, skills, and multi-user support.

### What's Included
- **Global Config** - settings.json + CLAUDE.md
- **Status Lines** - Model display in terminal
- **Commands** - /plan, /observability
- **Skills** - Auto-planning intelligence
- **Agents** - Planner + Implementer
- **Scripts** - Installation & setup utilities
- **WSL Setup** - Multi-user configuration

### Features
✅ Model transparency (status line + prefixes)
✅ Automatic planning mode switching
✅ Custom workflow commands
✅ Multi-user WSL support (API vs Subscription)

### Quick Install
```bash
cd config-bundle
./scripts/install-all.sh

# Restart Claude Code
claude
```

**Learn more:** [Config Bundle Documentation](./config-bundle/README.md)

---

## 📖 Documentation Structure

```
claude-code-helper/
│
├── TOOLS-INDEX.md             # 📋 Master catalog of all tools
│
├── guides/                    # Learning resources
│   ├── complete-guide/        # Zero to hero path
│   ├── subagents-guide/       # Advanced agents guide
│   └── advanced-patterns/     # Advanced usage patterns
│
├── mcp-servers/               # 5 MCP servers (30 tools)
│   ├── api-specialist-mcp/
│   ├── code-review-mcp/
│   ├── design-system-mcp/
│   ├── testing-mcp/
│   └── uiux-review-mcp/
│
├── examples/                  # Ready-to-use examples
│   ├── agents/               # MCP + Sub-agents
│   ├── skills/               # Reusable workflows
│   ├── commands/             # Slash commands
│   ├── hooks/                # Event automation
│   ├── plugins/              # Complete packages
│   ├── mcp/                  # MCP configs
│   ├── integrations/         # Integration examples
│   └── sub-agents/           # Sub-agent examples
│
├── templates/                 # Starter templates
│   ├── agent/
│   ├── skill/
│   └── command/
│
├── config-bundle/             # Production config
│   ├── global-config/
│   ├── statuslines/
│   ├── commands/
│   ├── skills/
│   ├── agents/
│   ├── scripts/
│   └── wsl-setup/
│
├── agents/                    # Your custom agents
├── commands/                  # Your custom commands
├── skills/                    # Your custom skills
├── statuslines/               # Your status line scripts
├── scripts/                   # Utility scripts
├── global-config/             # Your global config
└── wsl-setup/                 # WSL configuration
```

---

## 🎓 Learning Paths

### Path 1: Complete Beginner (Week 1-2)
1. Read [Zero to Hero Guide](./guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md)
2. Review [Tools Comparison](./guides/complete-guide/01-TOOLS-COMPARISON.md)
3. Install [Config Bundle](./config-bundle/)
4. Try [Basic Examples](./examples/)

### Path 2: Intermediate Developer (Week 3-4)
5. Study [Sub-Agents Guide](./guides/subagents-guide/README.md)
6. Install [Sub-Agents](./guides/subagents-guide/install-all-agents.sh)
7. Try [Integration Example](./guides/subagents-guide/INTEGRATION-EXAMPLE.md)
8. Experiment with [Agent Examples](./examples/agents/)

### Path 3: Advanced User (Week 5+)
9. Set up [MCP Servers](./mcp-servers/)
10. Learn [Coordination Patterns](./guides/subagents-guide/patterns/)
11. Build custom agents using [Templates](./templates/)
12. Create multi-agent orchestration workflows
13. Develop custom MCP servers

---

## 📖 Related Learning Resources

### AI and Claude Code: A Comprehensive Guide for DevOps Engineers
**Repository**: [michelabboud/ai-and-claude-code-intro](https://github.com/michelabboud/ai-and-claude-code-intro)
**Author**: Michel Abboud (with assistance of Claude AI)
**License**: CC BY-NC 4.0

A comprehensive 10-chapter guide covering AI fundamentals through advanced Claude Code usage. This guide provides the theoretical foundation that complements the practical examples in this repository.

**What's Covered**:
- **Part 1: Foundations** - AI history, LLM mechanics, prompt engineering (CRAFT framework)
- **Part 2: AI Ecosystem** - Model providers, Claude capabilities, token economics
- **Part 3: Claude Code Mastery** - Installation, configuration, agent workflows
- **Part 4: Advanced Topics** - MCP architecture, real-world DevOps applications

**Perfect For**:
- Understanding the *why* behind Claude Code features
- Learning AI/LLM fundamentals before diving into tools
- Structured learning path from beginner to expert
- Theoretical foundation for DevOps engineers

**Recommended Learning Path**:
```
1. 📚 Read the Guide    → AI and Claude Code Intro (Theory)
2. 🛠️ Practice Here     → claude-code-helper (Hands-On)
3. 🚀 Build Projects    → Apply to Real-World Scenarios
```

**How They Complement Each Other**:
- **AI & Claude Code Guide** teaches *what* Claude Code is and *how* it works
- **Claude Code Helper** provides *production-ready examples* and *professional configurations*

---

## 💻 Installation

### Prerequisites
```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### Quick Install Everything
```bash
# Clone repository
git clone https://github.com/yourusername/claude-code-helper.git
cd claude-code-helper

# Install config bundle
cd config-bundle && ./scripts/install-all.sh && cd ..

# Install sub-agents
cd guides/subagents-guide && ./install-all-agents.sh && cd ../..

# Install MCP servers (builds all servers)
cd mcp-servers && ./install-all.sh

# Add MCP servers with CLI (recommended)
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"

cd ..

# Verify MCP servers
claude mcp list

# Start using
claude
```

### Selective Installation
```bash
# Just the guides (no installation needed)
cd guides && cat complete-guide/README.md

# Just the examples
cp examples/agents/subagents/*.md ~/.claude/agents/

# Just the MCP servers
cd mcp-servers && ./install-all.sh
# Then add with CLI: claude mcp add <name> -- node "$(pwd)/<server>/build/index.js"
# Or configure Claude Desktop (see mcp-servers/QUICKGUIDE.md)

# Just the config bundle
cd config-bundle && ./scripts/install-all.sh
```

---

## 🎯 Common Use Cases

### Use Case 1: API Development
**Tools:** API Specialist MCP + API Expert Sub-Agent + Testing MCP
```bash
# 1. Install MCP servers
cd mcp-servers && ./install-all.sh

# 2. Install API expert agent
cp examples/agents/subagents/api-expert.md ~/.claude/agents/

# 3. Use in project
claude
> Build a REST API for user management
> Test the API endpoints with security validation
```

---

### Use Case 2: Android Development
**Tools:** Android Dev Sub-Agent + Performance MCP + Testing MCP
```bash
# 1. Install agents
cp examples/agents/subagents/android-dev.md ~/.claude/agents/

# 2. Use for development
claude
> Build a Material 3 login screen with Jetpack Compose
```

---

### Use Case 3: Full-Stack Code Review
**Tools:** All MCP Servers + Review Agents
```bash
# 1. Install everything
cd mcp-servers && ./install-all.sh
cp examples/agents/mcp-agents/*.json ~/.claude/agents/

# 2. Run comprehensive review
claude
> Review this pull request for security, testing, and design compliance
```

---

## 🔧 Configuration

### Global Configuration
```bash
# Location: ~/.claude/
settings.json       # Main settings
CLAUDE.md          # Global instructions
```

### Project Configuration
```bash
# Location: ./.claude/ (project root)
CLAUDE.md          # Project-specific instructions
config.json        # Project settings
```

### Environment Variables
```bash
# Add to ~/.zshrc or ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-your-key"
export ANTHROPIC_MODEL="sonnet"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
```

---

## 📊 Features Overview

### ✅ Complete Learning Resources
- Zero-to-hero guides
- Tool comparisons
- Best practices
- Troubleshooting guides

### ✅ Production-Ready Tools
- 5 MCP servers (30 tools)
- 26+ agent examples (all major tech stacks)
- 13+ skills (workflows, testing, architecture)
- Commands, hooks, complete plugins

### ✅ Automation & Quality
- Automated code review
- Comprehensive testing (visual, contract, mutation, BDD, E2E)
- API testing & validation
- Design system compliance
- Test coverage enforcement

### ✅ Multi-Agent Workflows
- Orchestration patterns
- Parallel execution
- Sequential pipelines
- Error handling strategies

### ✅ Development Experience
- Status line indicators
- Model transparency
- Custom commands
- Auto-planning mode

---

## 🐛 Troubleshooting

### Common Issues

**Claude Code not found**
```bash
npm install -g @anthropic-ai/claude-code
claude --version
```

**Status line not showing**
```bash
chmod +x ~/.claude/statuslines/*.sh
# Restart Claude
```

**MCP servers not loading**
```bash
# Check config
cat ~/.config/Claude/claude_desktop_config.json
# Verify server paths are correct
```

**Agents not triggering**
```bash
# Verify installation
ls ~/.claude/agents/
# Check agent description is clear
```

**More help:** See [Troubleshooting Guide](./guides/complete-guide/04-TROUBLESHOOTING.md)

---

## 🤝 Contributing

Contributions are welcome! Whether you have:
- New agent examples
- Improved documentation
- Bug fixes
- Feature requests

Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes
4. Submit a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📝 License

**MIT License** - Free for personal and commercial use

See the [LICENSE](./LICENSE) file for complete details.

---

## 👤 Credits & Transparency

**Author:** [Michel Abboud](https://github.com/michelabboud)
**GitHub:** https://github.com/michelabboud
**AI Assistance:** This project was created with the help of Claude Code (Anthropic)

### About This Project

This project represents a collaboration between human expertise and AI capabilities. All design decisions, architecture, content curation, and implementation direction were made by the human author (Michel Abboud), with AI (Claude Code) assisting in:
- Documentation generation
- Code implementation
- Best practices guidance
- Pattern suggestions

### Why Transparency Matters

I believe in being open about AI assistance in software development. This project demonstrates how humans and AI can work together effectively, with the human maintaining creative control and decision-making authority while leveraging AI capabilities to accelerate development.

### Free to Use

This is open source software under the MIT License. You are free to:
- ✅ Use for personal projects
- ✅ Use for commercial projects
- ✅ Modify and adapt the code
- ✅ Distribute and sell
- ✅ Use in proprietary software

No attribution is legally required, but it is appreciated!

---

## 🔗 Resources

### Repository Documentation
- [TOOLS-INDEX.md](TOOLS-INDEX.md) - Complete catalog of all tools and components
- [CHANGELOG.md](CHANGELOG.md) - Version history and release notes
- [TODO.md](TODO.md) - Repository roadmap (79/79 items complete)
- [COMPLETION-SUMMARY.md](COMPLETION-SUMMARY.md) - 100% completion milestone

### Official Documentation
- [Claude Code Docs](https://code.claude.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [MCP Protocol](https://modelcontextprotocol.io)

### Community
- [Claude AI Reddit](https://reddit.com/r/ClaudeAI)
- [Anthropic Discord](https://discord.gg/anthropic)
- [Skills Repository](https://github.com/anthropics/skills)

### Additional Tools
- [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)
- [Awesome Claude Code](https://github.com/awesome-claude-code)

---

## 🙏 Acknowledgments

- Anthropic team for Claude Code
- MCP community for protocol development
- Contributors and community members
- Open source examples and patterns

---

## 📞 Support

Need help?
1. Check [Guides](./guides/) for learning resources
2. Review [Examples](./examples/) for working code
3. Read [Troubleshooting](./guides/complete-guide/04-TROUBLESHOOTING.md)
4. Ask in [Community Forums](https://reddit.com/r/ClaudeAI)
5. Open an [Issue](https://github.com/yourusername/claude-code-helper/issues)

---

## 🎉 Get Started Now!

```bash
# Choose your path:

# 🌱 Beginner: Learn the basics
cd guides/complete-guide && cat 00-ZERO-TO-HERO-GUIDE.md

# 🚀 Intermediate: Install and explore
cd config-bundle && ./scripts/install-all.sh

# ⚡ Advanced: Build custom workflows
cd guides/subagents-guide && cat patterns/coordination-patterns.md
```

---

**Happy Coding with Claude!** 🤖✨

*Last Updated: January 2026*
*Version: 2.0.0*
*Repository: claude-code-helper*
