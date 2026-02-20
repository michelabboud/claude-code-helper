# Complete Installation Guide

**claude-code-helper** - Comprehensive setup guide for all components

This guide provides step-by-step instructions for installing and configuring the MCP servers, agents, skills, commands, and all other components of the claude-code-helper toolkit.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Full Installation](#full-installation)
4. [Component-Specific Setup](#component-specific-setup)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

- **Node.js** 18.0.0 or higher (recommended: 20 or 22)
  ```bash
  node --version  # Should be >= 18.0.0
  ```

- **npm** 7+ (or pnpm, yarn)
  ```bash
  npm --version
  ```

- **Git** (for cloning repository)
  ```bash
  git --version
  ```

### Claude Code CLI

Install Claude Code:
```bash
# Recommended (macOS/Linux)
curl -fsSL https://claude.ai/install.sh | sh

# Or see: https://docs.anthropic.com/en/docs/claude-code/getting-started
```

> **Note:** npm installation (`npm install -g @anthropic-ai/claude-code`) is deprecated since v2.1.15. Use the official installer above.

Verify installation:
```bash
claude --version
```

### System Requirements

- **OS**: macOS, Linux, or WSL2 (Windows)
- **RAM**: 2 GB minimum, 4 GB recommended
- **Disk**: 1 GB free space for MCP servers + node_modules

---

## Quick Start

Choose your installation method:

### Option 1: Claude Code CLI (Recommended - 2 minutes)

**Step 1: Clone Repository**

```bash
cd ~/projects  # Or your preferred directory
git clone https://github.com/michelabboud/claude-code-helper.git
cd claude-code-helper
```

**Step 2: Build MCP Servers**

```bash
cd mcp-servers
./install-all.sh
```

This builds all 5 production-ready MCP servers:
- ✅ api-specialist-mcp
- ✅ code-review-mcp
- ✅ design-system-mcp
- ✅ testing-mcp
- ✅ uiux-review-mcp

**Step 3: Add Servers with CLI**

The install script outputs ready-to-run commands. Copy and execute them:

```bash
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"
```

**Step 4: Verify & Test**

```bash
# Verify servers are registered
claude mcp list

# Start Claude Code
claude
```

Then test: **"What MCP tools do you have?"**

✅ You should see 30 tools from the 5 servers!

---

### Option 2: Claude Desktop (5 minutes)

**Step 1: Clone Repository**

```bash
cd ~/projects  # Or your preferred directory
git clone https://github.com/michelabboud/claude-code-helper.git
cd claude-code-helper
```

**Step 2: Build MCP Servers**

```bash
cd mcp-servers
./install-all.sh
```

**Step 3: Configure Claude Desktop**

The install script outputs a configuration. Copy it to your Claude Desktop config:

**macOS:**
```bash
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Linux:**
```bash
nano ~/.config/Claude/claude_desktop_config.json
```

Paste the configuration from install-all.sh output.

**Step 4: Restart & Test**

1. Restart Claude Desktop
2. Open Claude Code: `claude`
3. Test: "What MCP tools do you have?"

✅ You should see 30 tools from the 5 servers!

---

## Full Installation

### 1. Install All MCP Servers (Production + Experimental)

#### Production Servers (Recommended)

Already installed if you followed Quick Start. Otherwise:

```bash
cd mcp-servers

# Install and build production servers
cd api-specialist-mcp && npm install && npm run build && cd ..
cd code-review-mcp && npm install && npm run build && cd ..
cd design-system-mcp && npm install && npm run build && cd ..
cd testing-mcp && npm install && npm run build && cd ..
cd uiux-review-mcp && npm install && npm run build && cd ..
```

#### Experimental Servers (Optional)

```bash
# Install and build experimental servers
cd cicd-pipeline && npm install && npm run build && cd ..
cd database-operations && npm install && npm run build && cd ..
cd dependency-management && npm install && npm run build && cd ..
cd n8n-automation && npm install && npm run build && cd ..
```

### 2. Install Agent Configurations

Copy MCP agent configs to your Claude Code directory:

```bash
# From repository root
cd agents/mcp-agents

# Copy all agent configs (production)
cp security-reviewer.json ~/.claude/agents/
cp test-quality-enforcer.json ~/.claude/agents/
cp design-system-guardian.json ~/.claude/agents/
cp performance-optimizer.json ~/.claude/agents/
cp full-stack-reviewer.json ~/.claude/agents/
cp api-specialist.json ~/.claude/agents/
cp uiux-reviewer.json ~/.claude/agents/
cp uiux-design-critic.json ~/.claude/agents/

# Copy experimental agent configs (optional)
cp cicd-engineer.json ~/.claude/agents/
cp database-engineer.json ~/.claude/agents/
cp dependency-manager.json ~/.claude/agents/
cp automation-architect.json ~/.claude/agents/
```

Or copy the entire directory:

```bash
cp *.json ~/.claude/agents/
```

### 3. Install Configuration Bundle

The config-bundle includes production-ready settings, hooks, and utilities:

```bash
cd config-bundle
./scripts/install-all.sh
```

This installs:
- Global Claude Code settings
- Status line scripts
- Example hooks
- CLAUDE.md project instructions

### 4. Install Example Sub-Agents

```bash
cd guides/subagents-guide
./install-all-agents.sh
```

This installs advanced sub-agent examples for learning orchestration patterns.

---

## Component-Specific Setup

### MCP Server Configuration

#### Method 1: Claude Code CLI (Recommended)

The modern, streamlined way to configure MCP servers:

```bash
# Navigate to mcp-servers directory
cd /path/to/claude-code-helper/mcp-servers

# Add each server with a single command
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"

# Verify servers are registered
claude mcp list
```

**Benefits:**
- ✅ Single command per server (no JSON editing)
- ✅ Automatic path resolution with `$(pwd)`
- ✅ Configuration stored in `~/.claude.json` (managed automatically)
- ✅ Instant verification with `claude mcp list`

#### Method 2: Claude Desktop (Manual Configuration)

Edit your Claude Desktop config file and add MCP servers:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "api-specialist": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/api-specialist-mcp/build/index.js"]
    },
    "code-review": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/code-review-mcp/build/index.js"]
    },
    "design-system": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/design-system-mcp/build/index.js"]
    },
    "testing": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/testing-mcp/build/index.js"]
    },
    "uiux-review": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/uiux-review-mcp/build/index.js"]
    }
  }
}
```

**Important:** Replace `/absolute/path/to/` with your actual path (from `pwd` output).

**Note:** After editing, restart Claude Desktop for changes to take effect.

#### Project-Specific MCP Servers

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "project-tools": {
      "command": "node",
      "args": ["./tools/custom-mcp-server.js"]
    }
  }
}
```

### Agent Configuration

Agents are automatically discovered from:
- `~/.claude/agents/` (global)
- `./.claude/agents/` (project-specific)

No additional configuration needed after copying files.

### Skills & Commands

Install examples:

```bash
# Skills
cp -r skills/* ~/.claude/skills/

# Commands
cp -r commands/* ~/.claude/commands/
```

Skills and commands hot-reload automatically in Claude Code v2.1.3+.

---

## Verification

### Verify MCP Server Builds

```bash
cd mcp-servers

# Check all build artifacts exist
for dir in */; do
  if [ -f "${dir}build/index.js" ]; then
    echo "✓ $(basename $dir) - BUILT"
  else
    echo "✗ $(basename $dir) - NOT BUILT"
  fi
done
```

Expected output: All servers showing "✓ BUILT"

### Verify Claude Code Setup

```bash
# Verify MCP servers (if using CLI method)
claude mcp list
# Should show all 5 servers: api-specialist, code-review, design-system, testing, uiux-review

# Check agent files
ls ~/.claude/agents/*.json | wc -l
# Should show 12 (8 production + 4 experimental)

# Check settings
cat ~/.claude/settings.json
# Should exist and contain valid JSON
```

### Test MCP Servers

In Claude Code:

```bash
claude
```

Then ask:
```
What MCP tools do you have available?
```

You should see tools from your installed servers.

### Test Agents

In Claude Code, invoke an agent:

```bash
claude --agent security-reviewer
```

Or from within Claude:
```
Use the security-reviewer agent to scan my code.
```

---

## Troubleshooting

### MCP Servers Not Loading

**Issue:** Claude doesn't see MCP tools

**Solutions:**

1. **Check build artifacts exist:**
   ```bash
   ls mcp-servers/*/build/index.js
   ```
   If missing, rebuild:
   ```bash
   cd mcp-servers/[server-name]
   npm run build
   ```

2. **Verify configuration paths are absolute:**
   ```bash
   pwd  # From mcp-servers directory
   # Use this full path in claude_desktop_config.json
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Must be >= 18.0.0
   ```

4. **Restart Claude Desktop completely**
   - Quit Claude Desktop (not just close window)
   - Reopen and wait 10 seconds for servers to initialize

5. **Check for errors:**
   ```bash
   # Test server standalone
   cd mcp-servers/code-review-mcp
   node build/index.js
   # Should start without errors (Ctrl+C to stop)
   ```

### Agents Not Triggering

**Issue:** Agent configs not recognized

**Solutions:**

1. **Verify file location:**
   ```bash
   ls ~/.claude/agents/
   # Should show your .json files
   ```

2. **Check JSON syntax:**
   ```bash
   cat ~/.claude/agents/security-reviewer.json | python -m json.tool
   # Should output formatted JSON without errors
   ```

3. **Agent name mismatch:**
   Ensure `"name"` field in JSON matches filename (without .json)

### Permission Errors

**Issue:** Scripts fail with "Permission denied"

**Solution:**

```bash
# Make scripts executable
chmod +x mcp-servers/install-all.sh
chmod +x config-bundle/scripts/*.sh
chmod +x guides/subagents-guide/install-all-agents.sh
chmod +x ~/.claude/statuslines/*.sh
```

### Build Failures

**Issue:** TypeScript compilation errors

**Solutions:**

1. **Clear node_modules and rebuild:**
   ```bash
   cd mcp-servers/[server-name]
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Check Node.js/npm versions:**
   ```bash
   node --version  # >= 18.0.0
   npm --version   # >= 7.0.0
   ```

3. **Specific error in dependency-management:**
   Already fixed in repository. Pull latest:
   ```bash
   git pull origin main
   ```

### Status Line Not Showing

**Issue:** Status line doesn't appear in Claude Code

**Solution:**

```bash
# Make status line scripts executable
chmod +x ~/.claude/statuslines/*.sh

# Restart Claude Code
exit  # From Claude Code session
claude  # Start new session
```

---

## Next Steps

### Learning Resources

1. **Start with Complete Guide:**
   ```bash
   cat guides/complete-guide/00-ZERO-TO-HERO-GUIDE.md
   ```

2. **Explore Agents and Skills:**
   ```bash
   ls agents/
   ls skills/
   ```

3. **Study Sub-Agent Patterns:**
   ```bash
   cat guides/subagents-guide/README.md
   ```

### Try the Agents

**Test Security Scanning:**
```bash
claude --agent security-reviewer
# Ask: "Scan my project for security vulnerabilities"
```

**Test Code Quality:**
```bash
claude --agent test-quality-enforcer
# Ask: "Check my test coverage and quality"
```

**Test API Design:**
```bash
claude --agent api-specialist
# Ask: "Review my API endpoints for best practices"
```

### Customize

1. **Create your own agent:**
   ```bash
   cp agents/mcp-integrated/security-reviewer.json ~/.claude/agents/my-agent.json
   nano ~/.claude/agents/my-agent.json
   # Edit name, description, instructions
   ```

2. **Add project-specific MCP server:**
   ```bash
   # In your project root
   mkdir -p tools
   # Create custom MCP server in tools/
   # Add to .mcp.json
   ```

3. **Customize status line:**
   ```bash
   nano ~/.claude/statuslines/custom-status.sh
   chmod +x ~/.claude/statuslines/custom-status.sh
   # Configure in ~/.claude/settings.json
   ```

---

## Architecture Overview

```
claude-code-helper/
├── mcp-servers/           # 9 MCP servers (all built)
│   ├── Production (5):
│   │   ├── api-specialist-mcp/    ✅ 8 tools
│   │   ├── code-review-mcp/       ✅ 4 tools
│   │   ├── design-system-mcp/     ✅ 5 tools
│   │   ├── testing-mcp/           ✅ 4 tools
│   │   └── uiux-review-mcp/       ✅ 9 tools
│   └── Experimental (4):
│       ├── cicd-pipeline/         🧪 8 tools
│       ├── database-operations/   🧪 8 tools
│       ├── dependency-management/ 🧪 8 tools
│       └── n8n-automation/        🧪 6 tools
│
├── agents/               # 46 production-ready agents
│   ├── domain-experts/   # 34 specialized agents
│   └── mcp-integrated/   # 12 MCP-enabled agents
│
├── skills/               # 16 workflow skills
├── commands/             # 6 slash commands
├── hooks/                # Event automation
├── plugins/              # Complete plugin packages
│
├── config-bundle/        # Production config
├── guides/               # Learning resources
└── templates/            # Starter templates
```

---

## Summary

### What You Installed

✅ **9 MCP Servers** (30+ tools) - All built and ready
✅ **12 Agent Configurations** - Production + experimental
✅ **Configuration Bundle** - Settings, hooks, utilities
✅ **Example Sub-Agents** - Advanced patterns
✅ **Documentation** - Complete guides

### File Locations

- **MCP Servers:** `~/projects/claude-code-helper/mcp-servers/*/build/index.js`
- **Agents:** `~/.claude/agents/*.json`
- **Settings:** `~/.claude/settings.json`
- **Status Lines:** `~/.claude/statuslines/*.sh`
- **Skills:** `~/.claude/skills/*/`
- **Commands:** `~/.claude/commands/*/`

### Configuration Files

- **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
- **Claude Desktop:** `~/.config/Claude/claude_desktop_config.json` (Linux)
- **Project MCP:** `./.mcp.json` (project root)

---

## Getting Help

### Documentation

- **Main README:** [README.md](../../README.md)
- **Quick Start:** [QUICKSTART.md](../../QUICKSTART.md)
- **MCP Servers:** [mcp-servers/README.md](../../mcp-servers/README.md)
- **Agents:** [agents/README.md](../../agents/README.md)
- **Sub-Agents:** [guides/subagents-guide/README.md](../../guides/subagents-guide/README.md)

### Support

- **Issues:** [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **Claude Code Help:** `/help` command in Claude Code
- **Documentation:** [claude.ai/code](https://claude.ai/code)

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with Claude Code (Anthropic)
**License:** Apache-2.0

**Version:** 1.5.0
**Last Updated:** 2026-02-20

---

🎉 **Installation Complete! Start building with Claude Code!**
