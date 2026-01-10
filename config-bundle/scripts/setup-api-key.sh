#!/bin/bash
# API Key Setup Helper

set -e

echo "========================================="
echo "Claude API Key Configuration"
echo "========================================="
echo ""

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG=~/.zshrc
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG=~/.bashrc
    SHELL_NAME="bash"
else
    echo "⚠️  Unknown shell. Please add API key manually."
    exit 1
fi

echo "Detected shell: $SHELL_NAME"
echo "Config file: $SHELL_CONFIG"
echo ""

# Get API key
if [ -z "$1" ]; then
    echo "Enter your Anthropic API key:"
    echo "(Get one from: https://console.anthropic.com/)"
    read -s API_KEY
    echo ""
else
    API_KEY="$1"
fi

# Validate API key format
if [[ ! "$API_KEY" =~ ^sk-ant- ]]; then
    echo "❌ Invalid API key format. Should start with 'sk-ant-'"
    exit 1
fi

# Check if already exists
if grep -q "ANTHROPIC_API_KEY" "$SHELL_CONFIG"; then
    echo "⚠️  ANTHROPIC_API_KEY already exists in $SHELL_CONFIG"
    echo "Do you want to replace it? (y/n)"
    read -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
    # Remove old line
    sed -i.bak '/export ANTHROPIC_API_KEY/d' "$SHELL_CONFIG"
fi

# Add API key
echo "" >> "$SHELL_CONFIG"
echo "# Anthropic API Key (added by setup script)" >> "$SHELL_CONFIG"
echo "export ANTHROPIC_API_KEY=\"$API_KEY\"" >> "$SHELL_CONFIG"

echo "✅ API key added to $SHELL_CONFIG"
echo ""

# Create API key helper
mkdir -p ~/.claude
cat > ~/.claude/anthropic_key_helper.sh << 'EOF'
#!/bin/bash
echo ${ANTHROPIC_API_KEY}
EOF
chmod +x ~/.claude/anthropic_key_helper.sh

echo "✅ API key helper created"
echo ""

# Configure Claude Code
if command -v claude &> /dev/null; then
    claude config set --global apiKeyHelper ~/.claude/anthropic_key_helper.sh 2>/dev/null || true
    echo "✅ Claude Code configured to use API key helper"
    echo ""
fi

# Source the config
source "$SHELL_CONFIG"

echo "========================================="
echo "✅ API Key Setup Complete!"
echo "========================================="
echo ""
echo "The API key has been added to: $SHELL_CONFIG"
echo ""
echo "To activate in current terminal:"
echo "  source $SHELL_CONFIG"
echo ""
echo "To test:"
echo "  claude"
echo "  /status"
echo ""
echo "Should show: Authentication: API usage billing"
echo ""
echo "⚠️  Security reminder:"
echo "  • Never commit API keys to git"
echo "  • Add .env* to .gitignore"
echo "  • Set file permissions: chmod 600 $SHELL_CONFIG"
echo ""
