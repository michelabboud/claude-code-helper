#!/bin/bash
# Setup claude-api user for API usage
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: MIT - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (sudo ./setup-api-user.sh)"
    exit 1
fi

API_KEY="$1"

if [ -z "$API_KEY" ]; then
    echo "Usage: sudo ./setup-api-user.sh <api-key>"
    echo "Example: sudo ./setup-api-user.sh sk-ant-your-key-here"
    exit 1
fi

echo "========================================="
echo "Setting up claude-api user"
echo "========================================="
echo ""

# Get the bundle directory
BUNDLE_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"

# Switch to claude-api user context
sudo -u claude-api bash << EOF
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

# Add API key to .bashrc
echo "" >> ~/.bashrc
echo "# Anthropic API Configuration" >> ~/.bashrc
echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> ~/.bashrc

# Create API key helper
cat > ~/.claude/anthropic_key_helper.sh << 'SCRIPT'
#!/bin/bash
echo \${ANTHROPIC_API_KEY}
SCRIPT
chmod +x ~/.claude/anthropic_key_helper.sh

echo "✓ claude-api user configured"
EOF

echo ""
echo "========================================="
echo "✅ API User Setup Complete"
echo "========================================="
echo ""
echo "API user configured with:"
echo "  • Claude Code CLI"
echo "  • Full configuration bundle"
echo "  • API key authentication"
echo ""
echo "To use:"
echo "  su - claude-api"
echo "  claude"
echo ""
echo "Verify with:"
echo "  /status"
echo "  Should show: Authentication: API usage billing"
echo ""
