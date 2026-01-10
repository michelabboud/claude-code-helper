# Claude Config Bundle - File Tree

Complete directory structure and file descriptions.

## 📁 Directory Structure

```
claude-config-bundle/
│
├── 📄 README.md                          # Complete documentation with installation guide
├── 📄 QUICKSTART.md                      # 5-minute quick start guide
├── 📄 CONTENTS.txt                       # Complete file listing
│
├── 📁 global-config/                     # Global Claude Code configuration
│   ├── settings.json                     # Main settings (status line, permissions)
│   └── CLAUDE.md                         # Global instructions for model behavior
│
├── 📁 statuslines/                       # Status line scripts for terminal display
│   ├── model-display.sh                  # Simple: "🔵 SONNET [API]"
│   └── detailed-status.sh                # Detailed: "🔵 SONNET [API] | main"
│
├── 📁 commands/                          # Custom slash commands
│   ├── plan.md                           # /plan - Structured planning workflow
│   └── observability.sh                  # /observability - Toggle model transparency
│
├── 📁 skills/                            # Claude Code skills
│   └── auto-plan/
│       └── SKILL.md                      # Automatic intelligent model selection
│
├── 📁 agents/                            # Specialized agents
│   ├── planner.json                      # Planning agent (uses opusplan)
│   └── implementer.json                  # Implementation agent (uses sonnet)
│
├── 📁 scripts/                           # Installation and utility scripts
│   ├── install-all.sh                    # Complete one-command installation
│   ├── setup-api-key.sh                  # API key configuration helper
│   └── test-setup.sh                     # Verify installation and configuration
│
└── 📁 wsl-setup/                         # WSL multi-user setup
    ├── create-users.sh                   # Create claude-api and claude-pro users
    ├── setup-api-user.sh                 # Configure API user with key
    └── setup-pro-user.sh                 # Configure subscription user
```

## 📋 File Details

### Root Files

| File | Purpose |
|------|---------|
| `README.md` | Complete documentation with features, installation, troubleshooting |
| `QUICKSTART.md` | Quick 5-minute setup guide for impatient users |
| `CONTENTS.txt` | Auto-generated complete file listing |

### global-config/

**Installation Location:** `~/.claude/`

| File | Purpose | Description |
|------|---------|-------------|
| `settings.json` | Main configuration | Defines model, maxTokens, status line, permissions |
| `CLAUDE.md` | Global instructions | Rules for model transparency, auto-switching, coding standards |

**Key Features:**
- Status line configuration pointing to `model-display.sh`
- Security permissions (deny .env, .key files)
- Model defaults and token limits

### statuslines/

**Installation Location:** `~/.claude/statuslines/`

| File | Purpose | Output Example |
|------|---------|----------------|
| `model-display.sh` | Simple status indicator | `🔵 SONNET [API]` |
| `detailed-status.sh` | Detailed with git branch | `🔵 SONNET [API] \| main` |

**Features:**
- Color-coded model indicators (🟡 Opus, 🔵 Sonnet, 🟢 Haiku)
- Shows authentication type (API or SUB)
- Git branch integration (detailed version)
- Executable bash scripts

### commands/

**Installation Location:** `~/.claude/commands/`

| File | Type | Usage | Purpose |
|------|------|-------|---------|
| `plan.md` | Markdown | `/plan <task>` | Structured planning workflow with opusplan |
| `observability.sh` | Shell script | `/observability [on\|off\|status]` | Toggle model transparency |

**Usage Examples:**
```bash
/plan Create a REST API
/observability status
/observability on
```

### skills/

**Installation Location:** `~/.claude/skills/`

```
skills/
└── auto-plan/
    └── SKILL.md          # Teaches Claude automatic model selection
```

**What it does:**
- Detects planning vs implementation tasks automatically
- Switches to opusplan for planning questions
- Switches to sonnet for implementation
- Transparent model changes with announcements

**Triggers:**
- Planning: "how should we", "design", "architect", "plan"
- Implementation: "implement", "code", "write", "build"

### agents/

**Installation Location:** `~/.claude/agents/`

| File | Agent | Model | Purpose |
|------|-------|-------|---------|
| `planner.json` | Planner | opusplan | Strategic planning and architecture |
| `implementer.json` | Implementer | sonnet | Code implementation and execution |

**Usage:**
```bash
/agent planner      # Switch to planning agent
/agent implementer  # Switch to implementation agent
```

### scripts/

**Location:** `./scripts/` (run from bundle directory)

| File | Purpose | Usage |
|------|---------|-------|
| `install-all.sh` | Complete installation | `./scripts/install-all.sh` |
| `setup-api-key.sh` | Configure API key | `./scripts/setup-api-key.sh sk-ant-...` |
| `test-setup.sh` | Verify installation | `./scripts/test-setup.sh` |

**Features:**
- **install-all.sh**: Backs up existing config, installs everything, makes scripts executable
- **setup-api-key.sh**: Adds API key to shell config, creates helper script, configures Claude Code
- **test-setup.sh**: Checks all files, permissions, executables, and configuration

### wsl-setup/

**Location:** `./wsl-setup/` (for WSL multi-user setup)

| File | Purpose | Requires Root |
|------|---------|---------------|
| `create-users.sh` | Create claude-api and claude-pro users | Yes (sudo) |
| `setup-api-user.sh` | Configure claude-api with API key | Yes (sudo) |
| `setup-pro-user.sh` | Configure claude-pro for subscription | Yes (sudo) |

**Workflow:**
```bash
# 1. Create users
sudo ./wsl-setup/create-users.sh

# 2. Setup API user
sudo ./wsl-setup/setup-api-user.sh sk-ant-your-key

# 3. Setup subscription user
sudo ./wsl-setup/setup-pro-user.sh

# 4. Switch between users
su - claude-api   # Use API
su - claude-pro   # Use subscription
```

## 🎯 Installation Targets

### Where Files Get Installed

| Source | Destination | Purpose |
|--------|-------------|---------|
| `global-config/settings.json` | `~/.claude/settings.json` | Main settings |
| `global-config/CLAUDE.md` | `~/.claude/CLAUDE.md` | Global instructions |
| `statuslines/*.sh` | `~/.claude/statuslines/` | Status line scripts |
| `commands/*` | `~/.claude/commands/` | Custom commands |
| `skills/*` | `~/.claude/skills/` | Skills |
| `agents/*` | `~/.claude/agents/` | Agents |

### File Permissions

All scripts are made executable during installation:
```bash
chmod +x ~/.claude/statuslines/*.sh
chmod +x ~/.claude/commands/*.sh
```

## 📊 File Sizes

```
Total bundle size: ~22KB (compressed)

Breakdown:
├── Documentation (README, QUICKSTART): ~15KB
├── Configuration files: ~3KB
├── Scripts: ~3KB
└── Other: ~1KB
```

## 🔄 Dependencies

### Required
- **Claude Code CLI**: `npm install -g @anthropic-ai/claude-code`
- **Bash**: For scripts (standard on Linux/macOS/WSL)
- **Node.js**: For Claude Code (v18+ recommended)

### Optional
- **Git**: For git branch display in status line
- **zsh or bash**: For shell configuration

## 🎨 File Formats

| Format | Count | Purpose |
|--------|-------|---------|
| `.md` | 5 | Documentation and commands |
| `.json` | 3 | Configuration and agents |
| `.sh` | 8 | Executable scripts |
| `.txt` | 1 | File listing |

## 🚀 Quick Reference

### Most Important Files

1. **README.md** - Start here
2. **scripts/install-all.sh** - Install everything
3. **global-config/CLAUDE.md** - Defines behavior
4. **statuslines/model-display.sh** - Visual feedback

### Most Useful Commands

After installation:
```bash
/plan           # Start planning workflow
/status         # Check current model
/observability  # Toggle transparency
/agent planner  # Switch to planning agent
```

## 📝 Notes

- All scripts are designed to be idempotent (safe to run multiple times)
- Existing configurations are backed up before installation
- Scripts detect and handle both zsh and bash shells
- Multi-user setup is optional (for cost comparison)
- All configurations can be customized after installation

## 🔗 Related Files

Files that work together:

```
settings.json ──→ model-display.sh
     ↓
CLAUDE.md ──→ auto-plan/SKILL.md
     ↓
planner.json + implementer.json
```

---

**Last Updated:** 2026-01-09
**Bundle Version:** 1.0
**Total Files:** 18
