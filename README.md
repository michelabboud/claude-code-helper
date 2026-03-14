# Claude Code Helper - Complete Toolkit

**Your comprehensive resource for mastering Claude Code with guides, examples, MCP servers, and production-ready configurations.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Claude Code](https://img.shields.io/badge/Claude_Code-Latest-purple.svg)](https://code.claude.com)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## 📖 Quick Reference

### Documentation Hub

| Document | Purpose | Use When |
|----------|---------|----------|
| **[📋 TOOLS-INDEX.md](TOOLS-INDEX.md)** | Complete catalog of all components | Exploring available tools |
| **[⚡ TOOLS-CHEATSHEET.md](TOOLS-CHEATSHEET.md)** | Quick reference for 122 tools/agents/skills | Need instant lookup |
| **[🏗️ ECOSYSTEM-DIAGRAM.md](docs/reference/ECOSYSTEM-DIAGRAM.md)** | Visual architecture & workflow diagrams | Understanding how it all works |
| **[🧪 TESTING-GUIDE.md](TESTING-GUIDE.md)** | Validation with 136 test cases | Testing your installation |
| **[🤖 test-automation/](test-automation/)** | Automated testing framework | Running automated tests |
| **[📊 INSTALLATION-STATISTICS.md](docs/reports/INSTALLATION-STATISTICS.md)** | Impact analysis & metrics | Understanding resource usage |
| **[🔄 agent-loop-prevention.md](guides/advanced-patterns/agent-loop-prevention.md)** | Prevent infinite agent loops | Production agent development |
| **[🎯 solving-ai-coding-problems.md](guides/advanced-patterns/solving-ai-coding-problems.md)** | Solutions to top 11 developer complaints | Fixing AI hallucinations, costs, quality |

### What's Available

- **52 Agents** (12 MCP agents + 40 domain experts)
- **68 MCP Tools** across 10 servers (38 production + 30 experimental)
- **13 Skills** (workflows, testing, scaffolding, documentation, RAG, update-check, refresh, model-mode, greeting, and more)
- **Comprehensive guides, templates, and integration examples**

---

## 🎯 What's Inside

This repository contains everything you need to become productive with Claude Code:

| Component | Description | Best For |
|-----------|-------------|----------|
| **[Agents](#-agents)** | 52 agents (domain experts + MCP-integrated) | Specialized AI assistance |
| **[Skills](#-skills)** | 13 reusable workflow skills | Workflows, patterns & actions |
| **[Guides](#-guides)** | Complete learning paths from zero to hero | Learning & Reference |
| **[MCP Servers](#-mcp-servers)** | 10 specialized servers for code quality & automation | Automation & CI/CD |
| **[Templates](#-templates)** | Starter templates for creating your own | Building Custom Tools |
| **[Config Bundle](#-config-bundle)** | Production-ready global configuration | Setup & Optimization |
| **[Dashboard](#-dashboard)** | Multi-repo monitoring with log viewer | Project monitoring |

---

## 🚀 Quick Start

### For Complete Beginners
```bash
# 1. Read the zero-to-hero guide
cat guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md

# 2. Install everything (agents, hooks, triggers, skills)
cd config-bundle/scripts && ./install-all.sh

# 3. Start using Claude Code
claude
```

The install script installs:
- 52 agents (domain experts + MCP-integrated)
- 6 hook configurations (file, event, MCP triggers)
- Triggers configuration (triggers.json + schema)
- Skills and status lines

### Keeping Updated

```bash
# Check what's outdated
/update-check

# Update all outdated components
/update-check update

# Update a specific component
/update-check update redis-expert

# Refresh agent knowledge from official docs
/refresh status
/refresh redis-expert
```

### For Intermediate Users
```bash
# 1. Explore agents at root level
ls agents/domain-experts/
ls agents/mcp-integrated/

# 2. Install agents and skills
cp agents/domain-experts/*.md ~/.claude/agents/
cp -r skills/* ~/.claude/skills/

# 3. Set up MCP servers
cd mcp-servers && ./install-all.sh
# Add with CLI (commands provided by script)
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

### [Advanced Patterns](./guides/advanced-patterns/)
Production patterns for robust, reliable agentic systems.

**Includes:**
- **[Agent Loop Prevention](./guides/advanced-patterns/agent-loop-prevention.md)** - Comprehensive guide to preventing "Ralph Wiggum loops" (2,245 lines)
  - Zero-to-hero progression with Playwright examples
  - Real-life scenarios with 3rd party tools (APIs, databases, S3, scraping, CI/CD)
  - Circuit breaker patterns and progress tracking
  - Complete production-ready test agent
- **[Solving AI Coding Problems](./guides/advanced-patterns/solving-ai-coding-problems.md)** - Solutions to top 11 developer complaints (2,386 lines)
  - Research-backed solutions from 2025-2026 studies
  - RAG system implementation to eliminate hallucinations
  - Smart routing for 80% cost reduction
  - Quality gates and verification systems
  - Memory management and context persistence
- **[Multi-Agent Orchestration](./guides/advanced-patterns/multi-agent-orchestration.md)** - Coordinating multiple agents
- **[Testing Strategy](./guides/advanced-patterns/testing-strategy.md)** - Comprehensive testing approaches

**Start here if:** You're building production systems and need to prevent infinite loops, eliminate hallucinations, optimize costs, handle failures gracefully, and ensure reliability.

---

## 🌐 MCP Servers

**[🔌 Navigate to MCP Servers →](./mcp-servers/)**

Ten specialized Model Context Protocol servers for automated code quality, testing, DevOps workflows, and AI-enhanced development.

### Production Servers (6)

| Server | Tools | Purpose |
|--------|-------|---------|
| **RAG** ⭐ | 8 tools | Semantic codebase search, context retrieval, eliminate hallucinations |
| **API Specialist** | 8 tools | API testing, validation, security, docs |
| **Code Review** | 4 tools | Linting, security scanning, complexity |
| **Design System** | 5 tools | Token validation, component checks, a11y |
| **Testing** | 4 tools | Test execution, coverage, quality analysis |
| **UI/UX Review** | 9 tools | Design review, accessibility, wireframes |

**Total: 38 production tools**

### Experimental Servers (4) 🧪

| Server | Purpose |
|--------|---------|
| **CI/CD Pipeline** | Pipeline generation, optimization, troubleshooting |
| **Database Operations** | Migrations, queries, schema management |
| **Dependency Management** | Security scanning, updates, license compliance |
| **n8n Automation** | Workflow automation and integration |

**Total: 68+ tools across all servers**

### Quick Install

```bash
cd mcp-servers
./install-all.sh

# Servers are built and copied to ~/.claude/mcp-servers/
# Add to Claude Code CLI (commands provided by install script):
claude mcp add rag -- node "$HOME/.claude/mcp-servers/rag-mcp/build/index.js"
claude mcp add api-specialist -- node "$HOME/.claude/mcp-servers/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$HOME/.claude/mcp-servers/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$HOME/.claude/mcp-servers/design-system-mcp/build/index.js"
claude mcp add testing -- node "$HOME/.claude/mcp-servers/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$HOME/.claude/mcp-servers/uiux-review-mcp/build/index.js"

# Verify
claude mcp list
```

> After `install-all.sh`, servers live in `~/.claude/mcp-servers/` — you can safely delete the repo clone.

### Use Cases
- **RAG-Enhanced Coding**: Eliminate hallucinations, ground code in reality, semantic search
- **Automated Code Review**: Lint, security scan, complexity check
- **API Development**: Test endpoints, validate specs, generate docs
- **Design Systems**: Validate tokens, check components, audit accessibility
- **Testing**: Run tests, check coverage, analyze quality
- **UI/UX**: Review designs, check WCAG compliance, generate wireframes

**Learn more:** [MCP Servers Documentation](./mcp-servers/README.md)

---

## 🤖 Agents

**[📁 Navigate to Agents →](./agents/)**

46 production-ready agents for specialized AI assistance.

### Domain Experts (34 agents)
Specialized agents for every major technology stack:
- **Frontend:** React, Next.js, Vue, Nuxt, Angular, CSS/Tailwind
- **Backend:** Node.js, Python, Go, Rust, PHP, Laravel, Ruby/Rails
- **Mobile:** Android, iOS, React Native
- **Cloud:** AWS, Azure, GCP architects
- **DevOps:** Git, CI/CD, Docker, Kubernetes
- **Data:** Database, ML/AI, Data Engineering
- **Quality:** QA/Testing, Security, Performance

### MCP-Integrated (12 agents)
JSON agents that leverage MCP server tools:
- API Specialist, Code Reviewer, Design System Guardian
- UI/UX Reviewer, Test Quality Enforcer, Security Reviewer
- Database Engineer, CI/CD Engineer, and more

**Note:** All 52 agents include a semantic `color` field in their frontmatter for visual identification in Claude Code (e.g., `color: blue`, `color: purple`). This allows the UI to display agents with distinct color coding when browsing or selecting them.

### Installation
```bash
# Install all domain experts
cp agents/domain-experts/*.md ~/.claude/agents/

# Install MCP-integrated agents
cp agents/mcp-integrated/*.json ~/.claude/agents/
```

---

## ✨ Skills

**[📁 Navigate to Skills →](./skills/)**

13 reusable skills for development workflows, testing, and project scaffolding.

### Available Skills
- **Testing:** `/testing` — unified skill with subcommands: tdd, e2e, bdd, contract, mutation, visual
- **Workflows:** Refactoring strategy, release management, CI best practices
- **Development:** Project scaffolding, API design patterns, database design patterns
- **Documentation:** `/documentation` — code docs, JSDoc/TSDoc, README, API docs (OpenAPI 3.0)
- **Project Management:** `@project-manager` agent (includes dashboard output)
- **Tooling:** `/update-check`, `/model-mode`, `/greeting` (health report across all installed tools)
- **Knowledge:** `/refresh` — auto-update agent knowledge from reference URLs
- **RAG:** `/rag` — Setup wizard (`/rag init`), index codebases, semantic search, configure backends (ChromaDB/Redis/Qdrant), persistent storage, two-layer auto-discovery via CLAUDE.md. See [RAG MCP Guide](./guides/RAG-MCP-GUIDE.md)

### Installation
```bash
cp -r skills/* ~/.claude/skills/
```

---

## 🎣 Hooks & Plugins

**[📁 Hooks →](./hooks/)** | **[📁 Plugins →](./plugins/)** | **[📁 Integrations →](./integrations/)**

### Hooks (8 files)
Event-driven automation for PreToolUse, PostToolUse, SessionStart, SessionEnd.

### Plugins (7 files)
Complete packages combining multiple tools for full-stack dev, testing, documentation.

### Integrations (3 files)
Real-world integration examples for e-commerce, SaaS applications.

### Installation
```bash
cp hooks/* ~/.claude/hooks/
cp plugins/* ~/.claude/plugins/
```

---

## 🔌 Trigger Matcher Library

**[📁 Navigate to Trigger Matcher →](./trigger-matcher/)**

A comprehensive TypeScript library for **deterministic agent triggering** in Claude Code.

### Key Features

| Feature | Description |
|---------|-------------|
| **Keyword Triggers** | Match patterns in user prompts |
| **File Pattern Triggers** | Activate agents based on file operations |
| **Event Triggers** | React to tool usage and lifecycle events |
| **Global Configuration** | Centralized trigger rules with conflict resolution |
| **Agent Chains** | Sequential or parallel execution of multiple agents |
| **MCP Integration** | Connect triggers to MCP tool invocations with hooks |

### Why Use Triggers?

| Before (Non-Deterministic) | After (Deterministic) |
|----------------------------|----------------------|
| Claude decides when to spawn agents | Rules define exactly when agents activate |
| Same prompt may or may not trigger | Consistent, predictable triggering |
| No automation possible | Auto-trigger on file changes, commits, etc. |
| Hope the right agent is selected | Guarantee specific agents for specific tasks |

### Quick Example

```yaml
# In agent frontmatter (api-expert.md)
triggers:
  keywords: ["REST API", "endpoint"]
  files:
    - pattern: "src/api/**/*.ts"
      on: [edit, write]
  events:
    - type: PreCommit
      condition: "files.some(f => f.includes('/api/'))"
  priority: 12
```

### Test Coverage

**200 tests passing** across 6 modules covering file matching, events, configuration, chains, and MCP integration.

### Installation

```bash
cd trigger-matcher
npm install && npm run build
npm test  # Verify 200 tests pass
```

**Learn more:** [Trigger Matcher Documentation](./trigger-matcher/README.md)

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

## 📊 Dashboard

**Professional multi-repo monitoring dashboard for Claude Code projects.**

```bash
cd dashboard && npm install && npm run dev
# Opens at http://localhost:3200
```

**Features:**
- **Multi-project overview** - Auto-discovers all Claude Code projects with health scores
- **PM Health view** - 16 expert scores, radar chart, priority matrix, tasks, risks, tech debt, sparklines
- **Sparkline trend charts** - Per-score mini trend lines showing score movement over time
- **Score delta badges** - Visual indicators (▲/▼) showing score changes since last update
- **Expert detail panels** - Expandable per-expert breakdown with findings and recommendations
- **Trend History tab** - Full historical score timeline across all experts
- **Activity Logs** - Real-time debug log viewer with level filtering (DEBUG/INFO/WARN/ERROR), search, auto-refresh
- **Session Browser** - View session transcripts, subagent activity, tool calls in human-readable format
- **Dark/light theme** - Professional design with keyboard shortcuts (T, 1-4, R)

The dashboard reads from `~/.claude/` (global logs, debug output, session transcripts) and `.claude/` (per-project PM data). No data is written — it's purely a monitoring tool.

---

## 📖 Documentation Structure

```
claude-code-helper/
│
├── README.md                  # Main entry point
├── QUICKSTART.md             # Quick setup guide
├── CLAUDE.md                 # AI instructions
├── CHANGELOG.md              # Version history
├── TOOLS-INDEX.md            # Complete catalog of all tools
│
├── agents/                   # PRIMARY: Agent distribution
│   ├── domain-experts/       # 34 specialized .md agents
│   ├── mcp-integrated/       # 12 .json agents using MCP tools
│   └── README.md
│
├── skills/                   # PRIMARY: Skills distribution
│   └── [13 skill files/dirs]
│
├── hooks/                    # PRIMARY: Hooks distribution
│   └── [5 hook files]
│
├── plugins/                  # PRIMARY: Plugins distribution
│   └── [7 plugin files]
│
├── integrations/             # PRIMARY: Integration examples
│   └── [3 integration files]
│
├── docs/                     # Documentation (organized)
│   ├── releases/             # Release notes (v1.3.0 - v1.7.0)
│   ├── reference/            # ECOSYSTEM-DIAGRAM, INSTALLATION, etc.
│   ├── reports/              # AUDIT-REPORT, statistics
│   └── mcp-configs/          # Third-party MCP server configs
│
├── mcp-servers/              # MCP server implementations
│   └── [10 TypeScript servers]
│
├── guides/                   # Learning documentation
│   ├── complete-guide/       # Zero-to-hero learning path
│   ├── subagents-guide/      # Advanced agent patterns
│   └── advanced-patterns/    # Production patterns
│
├── dashboard/                # Multi-repo monitoring dashboard
├── config-bundle/            # Production-ready global config
└── templates/                # Starter templates
```

---

## 🎓 Learning Paths

### Path 1: Complete Beginner (Week 1-2)
1. Read [Zero to Hero Guide](./guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md)
2. Review [Tools Comparison](./guides/complete-guide/01-TOOLS-COMPARISON.md)
3. Install [Config Bundle](./config-bundle/)
4. Copy agents from [agents/](./agents/) to `~/.claude/agents/`

### Path 2: Intermediate Developer (Week 3-4)
5. Study [Sub-Agents Guide](./guides/subagents-guide/README.md)
6. Explore [Domain Expert Agents](./agents/domain-experts/)
7. Try [Integration Example](./guides/subagents-guide/INTEGRATION-EXAMPLE.md)
8. Install [Skills](./skills/)

### Path 3: Advanced User (Week 5+)
9. Set up [MCP Servers](./mcp-servers/)
10. Learn [Coordination Patterns](./guides/subagents-guide/patterns/)
11. **Master [Agent Loop Prevention](./guides/advanced-patterns/agent-loop-prevention.md)** - Essential for production
12. **Study [Solving AI Coding Problems](./guides/advanced-patterns/solving-ai-coding-problems.md)** - Real-world solutions
13. Build custom agents using [Templates](./templates/)
14. Create multi-agent orchestration workflows
15. Implement RAG systems and quality gates
16. Develop custom MCP servers

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
# Install Claude Code CLI (recommended method)
curl -fsSL https://claude.ai/install.sh | sh

# Alternative: npm (deprecated, shows warning)
npm install -g @anthropic-ai/claude-code

# See: https://docs.anthropic.com/en/docs/claude-code/getting-started

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

# Install agents (from root-level agents/)
cp agents/domain-experts/*.md ~/.claude/agents/
cp agents/mcp-integrated/*.json ~/.claude/agents/

# Install skills
cp -r skills/* ~/.claude/skills/

# Install MCP servers (builds and copies to ~/.claude/mcp-servers/)
cd mcp-servers && ./install-all.sh

# Add MCP servers with CLI (paths printed by install script)
claude mcp add api-specialist -- node "$HOME/.claude/mcp-servers/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$HOME/.claude/mcp-servers/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$HOME/.claude/mcp-servers/design-system-mcp/build/index.js"
claude mcp add testing -- node "$HOME/.claude/mcp-servers/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$HOME/.claude/mcp-servers/uiux-review-mcp/build/index.js"

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

# Just the agents
cp agents/domain-experts/*.md ~/.claude/agents/

# Just the MCP servers
cd mcp-servers && ./install-all.sh
# Then add with CLI: claude mcp add <name> -- node "$(pwd)/<server>/build/index.js"

# Just the config bundle
cd config-bundle && ./scripts/install-all.sh
```

---

## 🎯 Common Use Cases

### Use Case 1: API Development
**Tools:** API Specialist MCP + API Expert Agent + Testing MCP
```bash
# 1. Install MCP servers
cd mcp-servers && ./install-all.sh

# 2. Install API expert agent
cp agents/domain-experts/api-expert.md ~/.claude/agents/

# 3. Use in project
claude
> Build a REST API for user management
> Test the API endpoints with security validation
```

---

### Use Case 2: Android Development
**Tools:** Android Dev Agent + Performance MCP + Testing MCP
```bash
# 1. Install agents
cp agents/domain-experts/android-expert.md ~/.claude/agents/

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
cp agents/mcp-integrated/*.json ~/.claude/agents/

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
- 13 skills (workflows, testing, architecture)
- Commands, hooks, complete plugins

### ✅ Automation & Quality
- Automated code review
- Comprehensive testing (`/testing` with tdd, e2e, bdd, contract, mutation, visual)
- API testing & validation
- Design system compliance
- Test coverage enforcement

### ✅ Multi-Agent Workflows
- Orchestration patterns
- Parallel execution
- Sequential pipelines
- Error handling strategies
- **Loop prevention** (Ralph Wiggum loops)
- Circuit breaker patterns
- Progress tracking & timeouts

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
# Recommended installation method
curl -fsSL https://claude.ai/install.sh | sh

# Or via npm (deprecated but still works)
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
- [docs/TODO.md](docs/TODO.md) - Repository roadmap (79/79 items complete)
- [docs/reports/](docs/reports/) - Audit reports, completion summary, statistics

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
2. Browse [Agents](./agents/) and [Skills](./skills/) for working code
3. Read [Troubleshooting](./guides/complete-guide/04-TROUBLESHOOTING.md)
4. Ask in [Community Forums](https://reddit.com/r/ClaudeAI)
5. Open an [Issue](https://github.com/yourusername/claude-code-helper/issues)

---

## 🎉 Get Started Now!

```bash
# Choose your path:

# 🌱 Beginner: Learn the basics
cat guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md

# 🚀 Intermediate: Install agents and explore
cp agents/domain-experts/*.md ~/.claude/agents/
cd config-bundle && ./scripts/install-all.sh

# ⚡ Advanced: Build custom workflows
cat guides/subagents-guide/patterns/coordination-patterns.md
```

---

**Happy Coding with Claude!** 🤖✨

*Last Updated: January 2026*
*Version: 2.0.0*
*Repository: claude-code-helper*
