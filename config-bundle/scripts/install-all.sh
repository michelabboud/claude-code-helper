#!/bin/bash
# Complete installation script for Claude Code configuration bundle
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: MIT - Free to use for personal and commercial projects
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
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

echo "Installing from: $SCRIPT_DIR"
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
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Install global configuration
echo "Installing global configuration..."
cp "$SCRIPT_DIR/global-config/settings.json" ~/.claude/
cp "$SCRIPT_DIR/global-config/CLAUDE.md" ~/.claude/
echo -e "${GREEN}✓ Global configuration installed${NC}"
echo ""

# Install status lines
echo "Installing status lines..."
cp "$SCRIPT_DIR/statuslines"/*.sh ~/.claude/statuslines/
chmod +x ~/.claude/statuslines/*.sh
echo -e "${GREEN}✓ Status lines installed${NC}"
echo ""

# Install commands
echo "Installing custom commands..."
cp "$SCRIPT_DIR/commands"/* ~/.claude/commands/
chmod +x ~/.claude/commands/*.sh 2>/dev/null || true
echo -e "${GREEN}✓ Commands installed${NC}"
echo ""

# Install skills
echo "Installing skills..."
cp -r "$SCRIPT_DIR/skills"/* ~/.claude/skills/
echo -e "${GREEN}✓ Skills installed${NC}"
echo ""

# Install agents
echo "Installing agents..."
cp "$SCRIPT_DIR/agents"/* ~/.claude/agents/
echo -e "${GREEN}✓ Agents installed${NC}"
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
echo "  • Custom commands (/plan, /observability)"
echo "  • Auto-planning skill"
echo "  • Planner and implementer agents"
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
    echo "Install it with: npm install -g @anthropic-ai/claude-code"
    echo ""
fi

echo "Enjoy your optimized Claude Code experience! 🚀"
