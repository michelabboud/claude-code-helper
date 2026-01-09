# Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Extract the Bundle
```bash
unzip claude-config-bundle.zip
cd claude-config-bundle
```

### Step 2: Choose Your Installation

#### Option A: Full Auto-Install (Recommended)
```bash
chmod +x scripts/install-all.sh
./scripts/install-all.sh
```

#### Option B: Just Test What You Have
```bash
chmod +x scripts/test-setup.sh
./scripts/test-setup.sh
```

### Step 3: Configure Authentication

#### If Using API:
```bash
chmod +x scripts/setup-api-key.sh
./scripts/setup-api-key.sh sk-ant-your-key-here
```

#### If Using Subscription:
```bash
# Just make sure ANTHROPIC_API_KEY is NOT set
unset ANTHROPIC_API_KEY
claude  # Browser will open for authentication
```

### Step 4: Test It!
```bash
claude

# You should see:
# - Status line at bottom: 🔵 SONNET [SUB]
# - Model prefix in responses: [sonnet] Hello! ...

# Try these commands:
/status
/plan "Create a REST API"
/observability status
```

## ✨ Key Features

### Model Transparency
Every response shows which model is being used:
```
[sonnet] I'm implementing the function...
[opusplan] Let me create a comprehensive plan...
```

### Automatic Planning
Just ask planning questions naturally:
```
> How should we design a caching system?

[opusplan] I'll switch to planning mode...
[Creates plan]
Planning complete. Switching to Sonnet for implementation.
[sonnet] Now implementing...
```

### Status Line
Always see current model at terminal bottom:
```
🔵 SONNET [API] | main
```

### Custom Commands
- `/plan` - Structured planning workflow
- `/observability` - Toggle transparency
- Check all with `/help`

## 🎯 Common Tasks

### Switch Between Models
```bash
/model opus      # Use Opus
/model sonnet    # Use Sonnet  
/model haiku     # Use Haiku
/model opusplan  # Planning mode
```

### Check Current Model
```bash
/status
```

### Planning Workflow
```bash
/plan "Build an authentication system"
# Automatically uses opusplan, then switches to sonnet
```

### Toggle Observability
```bash
/observability on     # Enable model prefixes
/observability off    # Disable
/observability status # Check current state
```

## 🐛 Troubleshooting

### Status line not showing?
```bash
# Check if script exists and is executable
ls -la ~/.claude/statuslines/model-display.sh
chmod +x ~/.claude/statuslines/*.sh

# Restart Claude Code
```

### Model not switching automatically?
```bash
# Check if CLAUDE.md and skill exist
cat ~/.claude/CLAUDE.md
ls ~/.claude/skills/auto-plan/SKILL.md
```

### API key not working?
```bash
# Check if it's set
echo $ANTHROPIC_API_KEY

# Check Claude status
claude
/status
# Should show: "Authentication: API usage billing"
```

## 📖 More Help

- Full documentation: See `README.md`
- Test your setup: Run `./scripts/test-setup.sh`
- WSL multi-user: See `wsl-setup/` directory

## 💬 Support

If something doesn't work:
1. Run the test script: `./scripts/test-setup.sh`
2. Check Claude Code version: `claude --version`
3. Update Claude Code: `claude update`
4. Check logs: `claude doctor`

Enjoy! 🎉
