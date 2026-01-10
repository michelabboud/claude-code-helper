#!/bin/bash

# Multi-Agent MCP System - Installation Script
# Installs all three MCP servers

set -e  # Exit on error

echo "🚀 Installing Multi-Agent MCP System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION is too old${NC}"
    echo "Please upgrade to Node.js 18+ (recommended: 20 or 22)"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Function to install and build a server
install_server() {
    local server_name=$1
    local server_dir=$2
    
    echo "📦 Installing ${server_name}..."
    
    if [ ! -d "$server_dir" ]; then
        echo -e "${RED}❌ Directory $server_dir not found${NC}"
        return 1
    fi
    
    cd "$server_dir"
    
    # Install dependencies
    echo "  └─ Installing dependencies..."
    if npm install --silent; then
        echo -e "     ${GREEN}✓ Dependencies installed${NC}"
    else
        echo -e "     ${RED}✗ Failed to install dependencies${NC}"
        cd ..
        return 1
    fi
    
    # Build
    echo "  └─ Building..."
    if npm run build --silent; then
        echo -e "     ${GREEN}✓ Build successful${NC}"
    else
        echo -e "     ${RED}✗ Build failed${NC}"
        cd ..
        return 1
    fi
    
    # Verify build
    if [ -f "build/index.js" ]; then
        echo -e "  └─ ${GREEN}✓ ${server_name} ready!${NC}"
    else
        echo -e "  └─ ${RED}✗ Build output not found${NC}"
        cd ..
        return 1
    fi
    
    cd ..
    echo ""
}

# Install each server
install_server "Code Review MCP" "code-review-mcp"
install_server "Testing MCP" "testing-mcp"
install_server "Design System MCP" "design-system-mcp"

# Get absolute paths
echo "📍 Installation paths:"
CODE_REVIEW_PATH="$(cd code-review-mcp && pwd)/build/index.js"
TESTING_PATH="$(cd testing-mcp && pwd)/build/index.js"
DESIGN_SYSTEM_PATH="$(cd design-system-mcp && pwd)/build/index.js"

echo "  • Code Review MCP:  $CODE_REVIEW_PATH"
echo "  • Testing MCP:      $TESTING_PATH"
echo "  • Design System MCP: $DESIGN_SYSTEM_PATH"
echo ""

# Generate configuration
echo "⚙️  Configuration for Claude Desktop:"
echo ""
cat << EOF
{
  "mcpServers": {
    "code-review": {
      "command": "node",
      "args": ["$CODE_REVIEW_PATH"]
    },
    "testing": {
      "command": "node",
      "args": ["$TESTING_PATH"]
    },
    "design-system": {
      "command": "node",
      "args": ["$DESIGN_SYSTEM_PATH"]
    }
  }
}
EOF
echo ""

# Save configuration to file
CONFIG_FILE="claude_desktop_config.json"
cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "code-review": {
      "command": "node",
      "args": ["$CODE_REVIEW_PATH"]
    },
    "testing": {
      "command": "node",
      "args": ["$TESTING_PATH"]
    },
    "design-system": {
      "command": "node",
      "args": ["$DESIGN_SYSTEM_PATH"]
    }
  }
}
EOF

echo -e "${GREEN}✓ Configuration saved to $CONFIG_FILE${NC}"
echo ""

# Instructions
echo "📝 Next steps:"
echo ""
echo "1. Copy the configuration to Claude Desktop:"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    echo "   macOS:"
    echo "   cp $CONFIG_FILE \"$CONFIG_PATH\""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
    echo "   Linux:"
    echo "   cp $CONFIG_FILE \"$CONFIG_PATH\""
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    CONFIG_PATH="%APPDATA%\\Claude\\claude_desktop_config.json"
    echo "   Windows:"
    echo "   copy $CONFIG_FILE \"$CONFIG_PATH\""
fi
echo ""
echo "2. Restart Claude Desktop"
echo ""
echo "3. Test it! Ask Claude:"
echo "   \"What MCP tools do you have available?\""
echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo "📚 Documentation:"
echo "  • QUICKGUIDE.md - Get started quickly"
echo "  • README.md - Feature overview"
echo "  • INSTALL.md - Detailed installation"
echo "  • ARCHITECTURE.md - Technical details"
echo ""
