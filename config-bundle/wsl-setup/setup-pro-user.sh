#!/bin/bash
# Setup claude-pro user for subscription usage
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: MIT - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (sudo ./setup-pro-user.sh)"
    exit 1
fi

echo "========================================="
echo "Setting up claude-pro user"
echo "========================================="
echo ""

# Get the bundle directory
BUNDLE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

# Switch to claude-pro user context
sudo -u claude-pro bash << EOF
set -e

echo "Installing Node.js and Claude Code..."
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"

# Install Node.js
nvm install --lts
nvm use --lts

# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Create configuration directories
mkdir -p ~/.claude/statuslines
mkdir -p ~/.claude/commands
mkdir -p ~/.claude/skills
mkdir -p ~/.claude/agents

# Copy configuration files
cp "$BUNDLE_DIR/global-config/settings.json" ~/.claude/
cp "$BUNDLE_DIR/global-config/CLAUDE.md" ~/.claude/
cp "$BUNDLE_DIR/statuslines"/* ~/.claude/statuslines/
cp "$BUNDLE_DIR/commands"/* ~/.claude/commands/
cp -r "$BUNDLE_DIR/skills"/* ~/.claude/skills/
cp "$BUNDLE_DIR/agents"/* ~/.claude/agents/

# Make scripts executable
chmod +x ~/.claude/statuslines/*.sh
chmod +x ~/.claude/commands/*.sh

# DO NOT add API key to .bashrc for subscription user
# Leave it unset so Claude Code uses subscription auth

echo "✓ claude-pro user configured"
EOF

echo ""
echo "========================================="
echo "✅ Pro User Setup Complete"
echo "========================================="
echo ""
echo "Subscription user configured with:"
echo "  • Claude Code CLI"
echo "  • Full configuration bundle"
echo "  • NO API key (will use subscription)"
echo ""
echo "To use:"
echo "  su - claude-pro"
echo "  claude"
echo ""
echo "First time login:"
echo "  You'll be prompted to choose authentication method"
echo "  Select: 1. Claude account with subscription"
echo "  Your browser will open for authentication"
echo ""
echo "Verify with:"
echo "  /status"
echo "  Should show: Authentication: Pro subscription"
echo ""
