# Sub-Agents Advanced Guide - File Structure

```
subagents-advanced-guide/
│
├── README.md                      # Main documentation and overview
├── QUICK-REFERENCE.md             # Lightning-fast cheat sheet
├── INTEGRATION-EXAMPLE.md         # Complete real-world example
├── install-all-agents.sh          # Installation script (executable)
│
├── examples/                      # Production-ready agent examples
│   ├── android-dev.md            # Android development specialist
│   ├── database-expert.md        # Database operations expert
│   ├── api-expert.md             # REST API specialist
│   ├── css-tailwind-expert.md    # CSS/Tailwind specialist
│   ├── git-expert.md             # Git workflow expert
│   └── performance-optimizer.md  # Performance tuning expert
│
├── patterns/                      # Advanced coordination patterns
│   └── coordination-patterns.md  # Orchestration, parallel, sequential patterns
│
└── custom/                        # Custom agents for your workflow
    └── michel-custom-agents.md   # Gradle, WSL, Tailwind system builder
```

## File Descriptions

### Core Documentation

| File | Size | Purpose |
|------|------|---------|
| **README.md** | 8KB | Main guide with installation, usage, and learning path |
| **QUICK-REFERENCE.md** | 5.5KB | Quick lookup for common patterns and commands |
| **INTEGRATION-EXAMPLE.md** | 24KB | Complete authentication system example |
| **install-all-agents.sh** | 6.7KB | Interactive installation script |

### Agent Examples (examples/)

| File | Lines | Expertise |
|------|-------|-----------|
| **android-dev.md** | ~500 | Kotlin, Jetpack Compose, Room, Gradle |
| **database-expert.md** | ~700 | SQL, PostgreSQL, migrations, optimization |
| **api-expert.md** | ~800 | REST APIs, authentication, OpenAPI |
| **css-tailwind-expert.md** | ~600 | Tailwind CSS, responsive design, theming |
| **git-expert.md** | ~600 | Version control, branching, workflows |
| **performance-optimizer.md** | ~700 | Bundle size, caching, memory optimization |

### Advanced Patterns (patterns/)

| File | Lines | Content |
|------|-------|---------|
| **coordination-patterns.md** | ~600 | 12 advanced orchestration patterns |

### Custom Agents (custom/)

| File | Lines | Specialization |
|------|-------|----------------|
| **michel-custom-agents.md** | ~800 | Gradle, WSL, Design systems |

## Total Package Stats

- **Total Files**: 11
- **Total Lines**: ~5,500
- **Total Size**: ~150KB
- **Agent Examples**: 9 complete agents
- **Patterns**: 12 coordination patterns
- **Examples**: 1 complete integration example

## Installation Paths

After installation, agents will be located at:

```
~/.claude/agents/          # User-level (all projects)
./.claude/agents/          # Project-level (current project)
```

## Usage Summary

### Quick Installation
```bash
./install-all-agents.sh
```

### Individual Installation
```bash
cp examples/database-expert.md ~/.claude/agents/
```

### Verify Installation
```bash
ls ~/.claude/agents/
claude  # restart Claude Code
/agents # list agents in Claude
```

## Learning Order

1. Read **README.md** (5 min)
2. Try **QUICK-REFERENCE.md** (2 min)
3. Install 2-3 agents (1 min)
4. Study **INTEGRATION-EXAMPLE.md** (10 min)
5. Read **coordination-patterns.md** (15 min)
6. Customize agents for your workflow (ongoing)

## Key Features

### For Beginners
✓ Clear documentation
✓ Production-ready examples
✓ Interactive installation
✓ Quick reference guide

### For Advanced Users
✓ Coordination patterns
✓ Custom agent examples
✓ Integration examples
✓ Performance tips

### For Your Workflow
✓ Android development
✓ WSL optimization
✓ Tailwind design systems
✓ Full-stack development

## Support

- **Documentation**: All files include comprehensive examples
- **Examples**: Every agent shows real-world usage
- **Patterns**: 12 coordination patterns with code
- **Integration**: Complete auth system example

## Next Steps

1. Install agents: `./install-all-agents.sh`
2. Read docs: `cat README.md`
3. Try agents: `claude`
4. Build something! 🚀
