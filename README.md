# Claude Code Configuration Bundle

This bundle contains all the best scripts and configurations we created for optimizing your Claude Code experience.

claude-config-bundle/
├── 📘 README.md              # Complete documentation
├── ⚡ QUICKSTART.md           # 5-minute setup guide
│
├── global-config/
│   ├── settings.json         # Main Claude Code settings
│   └── CLAUDE.md            # Global instructions
│
├── statuslines/
│   ├── model-display.sh     # Simple status indicator
│   └── detailed-status.sh   # With git branch info
│
├── commands/
│   ├── plan.md             # /plan workflow command
│   └── observability.sh    # /observability toggle
│
├── skills/
│   └── auto-plan/
│       └── SKILL.md        # Auto model-switching intelligence
│
├── agents/
│   ├── planner.json        # Dedicated planning agent
│   └── implementer.json    # Dedicated coding agent
│
├── scripts/
│   ├── install-all.sh      # One-command installation
│   ├── setup-api-key.sh    # API key configuration
│   └── test-setup.sh       # Verify installation
│
└── wsl-setup/
    ├── create-users.sh     # Create claude-api & claude-pro users
    ├── setup-api-user.sh   # Configure API user
    └── setup-pro-user.sh   # Configure subscription user

## 📦 What's Included

- **Global Configuration**: settings.json and CLAUDE.md
- **Status Lines**: Model display scripts for terminal
- **Custom Commands**: /plan and other workflow commands
- **Skills**: Auto-planning intelligence
- **Agents**: Specialized planner and implementer agents
- **Scripts**: Setup and utility scripts
- **WSL Multi-User**: Setup for API vs Subscription separation

## 🚀 Quick Start

### Option 1: Full Installation (Recommended)
```bash
cd claude-config-bundle
chmod +x scripts/install-all.sh
./scripts/install-all.sh
```

### Option 2: Manual Installation
Choose what you want to install:

```bash
# Install global config
cp global-config/settings.json ~/.claude/
cp global-config/CLAUDE.md ~/.claude/

# Install status lines
mkdir -p ~/.claude/statuslines
cp statuslines/* ~/.claude/statuslines/
chmod +x ~/.claude/statuslines/*.sh

# Install commands
mkdir -p ~/.claude/commands
cp commands/* ~/.claude/commands/
chmod +x ~/.claude/commands/*.sh

# Install skills
mkdir -p ~/.claude/skills
cp -r skills/* ~/.claude/skills/

# Install agents
mkdir -p ~/.claude/agents
cp agents/* ~/.claude/agents/
```

## 📋 Components Overview

### Global Configuration
- `settings.json` - Main Claude Code settings with status line
- `CLAUDE.md` - Global instructions for model transparency

### Status Lines
- `model-display.sh` - Simple colored model indicator
- `detailed-status.sh` - Model + auth type + git branch

### Commands
- `plan.md` - Planning workflow command
- `observability.sh` - Toggle model transparency

### Skills
- `auto-plan/SKILL.md` - Automatic model switching intelligence

### Agents
- `planner.json` - Dedicated planning agent (opusplan)
- `implementer.json` - Dedicated implementation agent (sonnet)

### Scripts
- `install-all.sh` - One-command installation
- `setup-api-key.sh` - API key configuration helper
- `test-setup.sh` - Verify installation

### WSL Multi-User Setup
- `create-users.sh` - Create claude-api and claude-pro users
- `setup-api-user.sh` - Configure API user
- `setup-pro-user.sh` - Configure subscription user

## 🔧 Configuration

### Environment Variables

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
# API Configuration (only if using API)
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Model preferences (optional)
export ANTHROPIC_MODEL="sonnet"
export ANTHROPIC_DEFAULT_OPUS_MODEL="claude-opus-4-5-20251101"
export ANTHROPIC_DEFAULT_SONNET_MODEL="claude-sonnet-4-5-20250929"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-haiku-4-5-20251001"

# Disable telemetry (optional)
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=true
```

### Multi-User WSL Setup

If you want separate users for API vs Subscription:

```bash
cd wsl-setup
sudo ./create-users.sh
./setup-api-user.sh "sk-ant-your-api-key"
./setup-pro-user.sh
```

Then switch between users:
```bash
su - claude-api   # Use API
su - claude-pro   # Use subscription
```

## 📊 Features

### ✅ Model Transparency
- Status line shows current model at bottom of terminal
- Every response prefixed with [model-name]
- Color-coded indicators (🟡 Opus, 🔵 Sonnet, 🟢 Haiku)

### ✅ Automatic Planning
- Claude detects when planning is needed
- Automatically switches to opusplan
- Switches back to sonnet for implementation

### ✅ Custom Workflows
- `/plan` command for structured planning
- Agents for specialized tasks
- Observable model switching

### ✅ Multi-User Support
- Separate WSL users for API vs Subscription
- Easy cost comparison
- No accidental auth mixing

## 🧪 Testing

After installation, test your setup:

```bash
# Test basic installation
claude --version

# Test status line (should see model indicator at bottom)
claude
/status

# Test model transparency (should see [sonnet] prefix)
> Hello Claude

# Test planning (should auto-switch to opusplan)
> How should we design a REST API?

# Test custom command
/plan "Build an authentication system"
```

## 💡 Usage Examples

### Example 1: Automatic Planning
```bash
claude

> Design a microservices architecture for e-commerce

# Claude automatically:
# 1. Detects this is a planning task
# 2. Switches to opusplan: [opusplan] I'll create a comprehensive plan...
# 3. After planning, suggests: "Ready to implement? Switching to sonnet."
```

### Example 2: Custom Plan Command
```bash
claude

/plan Create a CI/CD pipeline

# Starts with structured planning workflow
# Uses opusplan automatically
```

### Example 3: Multi-User Cost Comparison
```bash
# Use API for one week
su - claude-api
claude
# ... do your work ...

# Check API costs in console.anthropic.com

# Use subscription for comparison
su - claude-pro
claude
# ... do your work ...

# Compare which is more cost-effective
```

## 🔍 Troubleshooting

### Status line not showing
```bash
# Check settings
cat ~/.claude/settings.json

# Verify script is executable
ls -la ~/.claude/statuslines/
chmod +x ~/.claude/statuslines/*.sh
```

### Model not switching automatically
```bash
# Check if CLAUDE.md exists
cat ~/.claude/CLAUDE.md

# Check if skill is installed
ls ~/.claude/skills/auto-plan/
```

### API key not working
```bash
# Check if it's set
echo $ANTHROPIC_API_KEY

# Check Claude Code status
claude
/status
# Should show "Authentication: API usage billing"
```

## 📚 Resources

- [Claude Code Documentation](https://code.claude.com/docs)
- [Anthropic API Console](https://console.anthropic.com/)
- [Claude Pricing](https://www.anthropic.com/pricing)

## 🤝 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify all scripts are executable (`chmod +x`)
3. Ensure Claude Code is up to date (`claude update`)
4. Check logs with `claude doctor`

## 📝 Notes

- Always test in a non-production environment first
- Back up existing configurations before installing
- API keys are sensitive - never commit them to git
- Status line scripts require bash (default in most systems)

## 🎯 Next Steps

After installation:
1. Configure your API key (if using API)
2. Test the setup with sample queries
3. Customize CLAUDE.md for your workflow
4. Create project-specific `.claude/CLAUDE.md` files
5. Explore creating custom commands for your needs

Enjoy your optimized Claude Code experience! 🚀
