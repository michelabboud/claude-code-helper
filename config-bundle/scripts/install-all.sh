#!/bin/bash
# Complete installation script for Claude Code configuration bundle
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: Apache-2.0 - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit on error

echo "========================================="
echo "Claude Code Configuration Bundle Installer"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory (config-bundle/scripts) and repo root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CONFIG_BUNDLE_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"
REPO_ROOT="$( cd "$CONFIG_BUNDLE_DIR/.." && pwd )"

echo "Installing from: $REPO_ROOT"
echo ""

# Backup existing configuration
if [ -d ~/.claude ]; then
    echo -e "${YELLOW}⚠️  Backing up existing configuration...${NC}"
    BACKUP_DIR=~/.claude.backup.$(date +%Y%m%d_%H%M%S)
    cp -r ~/.claude "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR${NC}"
    echo ""
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p ~/.claude/statuslines
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/skills
mkdir -p ~/.claude/agents
mkdir -p ~/.claude/hooks
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Install global configuration
echo "Installing global configuration..."
cp "$CONFIG_BUNDLE_DIR/global-config/settings.json" ~/.claude/
cp "$CONFIG_BUNDLE_DIR/global-config/CLAUDE.md" ~/.claude/
echo -e "${GREEN}✓ Global configuration installed${NC}"
echo ""

# Install status lines
echo "Installing status lines..."
cp "$CONFIG_BUNDLE_DIR/statuslines"/*.sh ~/.claude/statuslines/
chmod +x ~/.claude/statuslines/*.sh
echo -e "${GREEN}✓ Status lines installed${NC}"
echo ""

# Install commands
echo "Installing custom commands..."
if [ -d "$CONFIG_BUNDLE_DIR/commands" ] && [ "$(ls -A "$CONFIG_BUNDLE_DIR/commands" 2>/dev/null)" ]; then
    cp "$CONFIG_BUNDLE_DIR/commands"/* ~/.claude/commands/
    chmod +x ~/.claude/commands/*.sh 2>/dev/null || true
fi
# Also install from root commands directory
if [ -d "$REPO_ROOT/commands" ] && [ "$(ls -A "$REPO_ROOT/commands" 2>/dev/null)" ]; then
    cp "$REPO_ROOT/commands"/* ~/.claude/commands/ 2>/dev/null || true
    chmod +x ~/.claude/commands/*.sh 2>/dev/null || true
fi
echo -e "${GREEN}✓ Commands installed${NC}"
echo ""

# Install skills
echo "Installing skills..."
if [ -d "$CONFIG_BUNDLE_DIR/skills" ]; then
    cp -r "$CONFIG_BUNDLE_DIR/skills"/* ~/.claude/skills/ 2>/dev/null || true
fi
# Also install from root skills directory
if [ -d "$REPO_ROOT/skills" ]; then
    cp -r "$REPO_ROOT/skills"/* ~/.claude/skills/ 2>/dev/null || true
fi
echo -e "${GREEN}✓ Skills installed${NC}"
echo ""

# Install agents (config-bundle agents + domain experts + MCP integrated)
echo "Installing agents..."
# Config bundle agents (planner, implementer)
if [ -d "$CONFIG_BUNDLE_DIR/agents" ] && [ "$(ls -A "$CONFIG_BUNDLE_DIR/agents" 2>/dev/null)" ]; then
    cp "$CONFIG_BUNDLE_DIR/agents"/* ~/.claude/agents/ 2>/dev/null || true
fi
# Domain expert agents (33 agents)
if [ -d "$REPO_ROOT/agents/domain-experts" ]; then
    cp "$REPO_ROOT/agents/domain-experts"/*.md ~/.claude/agents/ 2>/dev/null || true
fi
# MCP integrated agents (12 agents)
if [ -d "$REPO_ROOT/agents/mcp-integrated" ]; then
    cp "$REPO_ROOT/agents/mcp-integrated"/*.json ~/.claude/agents/ 2>/dev/null || true
fi
echo -e "${GREEN}✓ Agents installed ($(ls ~/.claude/agents | wc -l) files)${NC}"
echo ""

# Install hooks
echo -e "${BLUE}Installing hooks...${NC}"
if [ -d "$REPO_ROOT/hooks" ]; then
    # Copy all hook files
    cp "$REPO_ROOT/hooks"/*.json ~/.claude/hooks/ 2>/dev/null || true
    cp "$REPO_ROOT/hooks"/*.js ~/.claude/hooks/ 2>/dev/null || true
    cp "$REPO_ROOT/hooks"/*.md ~/.claude/hooks/ 2>/dev/null || true
    chmod +x ~/.claude/hooks/*.js 2>/dev/null || true

    # Install minimatch dependency for hook scripts
    echo "  Installing hook dependencies..."
    cd ~/.claude/hooks
    if [ ! -f "package.json" ]; then
        npm init -y > /dev/null 2>&1
    fi
    npm install minimatch --save > /dev/null 2>&1
    cd - > /dev/null
fi
echo -e "${GREEN}✓ Hooks installed ($(ls ~/.claude/hooks/*.json 2>/dev/null | wc -l) hook configs)${NC}"
echo ""

# Install triggers configuration
echo -e "${BLUE}Installing triggers configuration...${NC}"
if [ -f "$CONFIG_BUNDLE_DIR/triggers.json" ]; then
    cp "$CONFIG_BUNDLE_DIR/triggers.json" ~/.claude/
    echo "  ✓ triggers.json"
fi
if [ -f "$CONFIG_BUNDLE_DIR/triggers.schema.json" ]; then
    cp "$CONFIG_BUNDLE_DIR/triggers.schema.json" ~/.claude/
    echo "  ✓ triggers.schema.json"
fi
echo -e "${GREEN}✓ Triggers configuration installed${NC}"
echo ""

# Summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "========================================="
echo ""
echo "Installed components:"
echo "  • Global settings and CLAUDE.md"
echo "  • Status line scripts"
echo "  • Custom commands"
echo "  • Skills"
echo "  • Agents ($(ls ~/.claude/agents 2>/dev/null | wc -l) files)"
echo "  • Hooks ($(ls ~/.claude/hooks/*.json 2>/dev/null | wc -l) configs)"
echo "  • Triggers configuration"
echo ""
echo "Hook files installed:"
ls ~/.claude/hooks/*.json 2>/dev/null | xargs -n1 basename | sed 's/^/  • /'
echo ""
echo "Next steps:"
echo "  1. Configure your API key (if using API):"
echo "     export ANTHROPIC_API_KEY=\"sk-ant-your-key\""
echo ""
echo "  2. Test your setup:"
echo "     claude"
echo "     /status"
echo ""
echo "  3. Try the features:"
echo "     > How should we design a REST API?"
echo "     /plan Create an authentication system"
echo ""
echo "For detailed documentation, see README.md"
echo ""

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo -e "${YELLOW}⚠️  Claude Code not found${NC}"
    echo "Install with: curl -fsSL https://claude.ai/install.sh | sh"
    echo "Or via npm:   npm install -g @anthropic-ai/claude-code (deprecated)"
    echo ""
fi

# Write installation manifest
if [ -f "$REPO_ROOT/scripts/manifest-helper.sh" ]; then
    source "$REPO_ROOT/scripts/manifest-helper.sh"
    AGENT_COUNT=$(ls ~/.claude/agents 2>/dev/null | wc -l | tr -d ' ')
    SKILL_COUNT=$(find ~/.claude/skills -maxdepth 2 -name "SKILL.md" -o -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    HOOK_COUNT=$(ls ~/.claude/hooks/*.json 2>/dev/null | wc -l | tr -d ' ')
    update_manifest "config-bundle" "{\"agents\": ${AGENT_COUNT}, \"skills\": ${SKILL_COUNT}, \"hooks\": ${HOOK_COUNT}}"
fi

echo "Enjoy your optimized Claude Code experience! 🚀"
