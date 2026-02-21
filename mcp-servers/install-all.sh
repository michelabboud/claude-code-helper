#!/bin/bash
# Multi-Agent MCP System - Installation Script
# Installs all three MCP servers
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: Apache-2.0 - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

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

# Install root dependencies first (needed for workspaces and shared packages)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
if [ -f "$REPO_ROOT/package.json" ]; then
    echo "📦 Installing root dependencies..."
    cd "$REPO_ROOT"
    if npm install --silent 2>/dev/null; then
        echo -e "   ${GREEN}✓ Root dependencies installed${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Root dependency install had warnings (continuing anyway)${NC}"
    fi
    cd "$SCRIPT_DIR"
    echo ""
fi

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
install_server "RAG MCP" "rag-mcp"
install_server "API Specialist MCP" "api-specialist-mcp"
install_server "Code Review MCP" "code-review-mcp"
install_server "Design System MCP" "design-system-mcp"
install_server "Testing MCP" "testing-mcp"
install_server "UI/UX Review MCP" "uiux-review-mcp"
install_server "Project Oversight MCP" "project-oversight-mcp"

# Get absolute paths
echo "📍 Installation paths:"
RAG_PATH="$(cd rag-mcp && pwd)/build/index.js"
API_SPECIALIST_PATH="$(cd api-specialist-mcp && pwd)/build/index.js"
CODE_REVIEW_PATH="$(cd code-review-mcp && pwd)/build/index.js"
DESIGN_SYSTEM_PATH="$(cd design-system-mcp && pwd)/build/index.js"
TESTING_PATH="$(cd testing-mcp && pwd)/build/index.js"
UIUX_REVIEW_PATH="$(cd uiux-review-mcp && pwd)/build/index.js"
OVERSIGHT_PATH="$(cd project-oversight-mcp && pwd)/build/index.js"

echo "  • RAG MCP:            $RAG_PATH"
echo "  • API Specialist MCP: $API_SPECIALIST_PATH"
echo "  • Code Review MCP:    $CODE_REVIEW_PATH"
echo "  • Design System MCP:  $DESIGN_SYSTEM_PATH"
echo "  • Testing MCP:        $TESTING_PATH"
echo "  • UI/UX Review MCP:   $UIUX_REVIEW_PATH"
echo "  • Project Oversight MCP: $OVERSIGHT_PATH"
echo ""

# Generate configuration
echo "⚙️  Configuration for Claude Desktop:"
echo ""
cat << EOF
{
  "mcpServers": {
    "rag": {
      "command": "node",
      "args": ["$RAG_PATH"]
    },
    "api-specialist": {
      "command": "node",
      "args": ["$API_SPECIALIST_PATH"]
    },
    "code-review": {
      "command": "node",
      "args": ["$CODE_REVIEW_PATH"]
    },
    "design-system": {
      "command": "node",
      "args": ["$DESIGN_SYSTEM_PATH"]
    },
    "testing": {
      "command": "node",
      "args": ["$TESTING_PATH"]
    },
    "uiux-review": {
      "command": "node",
      "args": ["$UIUX_REVIEW_PATH"]
    },
    "project-oversight": {
      "command": "node",
      "args": ["$OVERSIGHT_PATH"]
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
    "rag": {
      "command": "node",
      "args": ["$RAG_PATH"]
    },
    "api-specialist": {
      "command": "node",
      "args": ["$API_SPECIALIST_PATH"]
    },
    "code-review": {
      "command": "node",
      "args": ["$CODE_REVIEW_PATH"]
    },
    "design-system": {
      "command": "node",
      "args": ["$DESIGN_SYSTEM_PATH"]
    },
    "testing": {
      "command": "node",
      "args": ["$TESTING_PATH"]
    },
    "uiux-review": {
      "command": "node",
      "args": ["$UIUX_REVIEW_PATH"]
    },
    "project-oversight": {
      "command": "node",
      "args": ["$OVERSIGHT_PATH"]
    }
  }
}
EOF

echo -e "${GREEN}✓ Configuration saved to $CONFIG_FILE${NC}"
echo ""

# Instructions
echo "📝 Next steps:"
echo ""
echo "=== Option 1: Claude Code CLI (Recommended) ==="
echo ""
echo "Run these commands to add MCP servers:"
echo ""
echo "  claude mcp add rag -- node \"$RAG_PATH\""
echo "  claude mcp add api-specialist -- node \"$API_SPECIALIST_PATH\""
echo "  claude mcp add code-review -- node \"$CODE_REVIEW_PATH\""
echo "  claude mcp add design-system -- node \"$DESIGN_SYSTEM_PATH\""
echo "  claude mcp add testing -- node \"$TESTING_PATH\""
echo "  claude mcp add uiux-review -- node \"$UIUX_REVIEW_PATH\""
echo "  claude mcp add project-oversight -- node \"$OVERSIGHT_PATH\""
echo ""
echo "Then verify with:"
echo "  claude mcp list"
echo ""
echo "=== Option 2: Claude Desktop ==="
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
# Write installation manifest (v2: per-component registration)
SCRIPT_DIR_MCP="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT_MCP="$( cd "$SCRIPT_DIR_MCP/.." && pwd )"
if [ -f "$REPO_ROOT_MCP/scripts/manifest-helper.sh" ]; then
    export REPO_ROOT="$REPO_ROOT_MCP"
    source "$REPO_ROOT_MCP/scripts/manifest-helper.sh"

    echo "📝 Registering MCP servers in manifest..."
    for dir in */build/index.js; do
        server=$(echo "$dir" | sed 's|/build/index.js||')
        [ "$server" = "mcp-shared" ] && continue
        if [ -f "${server}/package.json" ]; then
            ver=$(extract_json_version "$(pwd)/${server}/package.json")
            register_component "mcp-servers/${server}" "$ver" ""
            echo "  ✓ ${server} (v${ver})"
        fi
    done

    # Also keep legacy manifest data for backward compatibility
    SERVERS_LIST=$(ls -d */build/index.js 2>/dev/null | sed 's|/build/index.js||' | paste -sd ',' - | sed 's/,/", "/g')
    update_manifest "mcp-servers" "{\"servers\": [\"${SERVERS_LIST}\"]}"
fi

echo "📚 Documentation:"
echo "  • QUICKGUIDE.md - Get started quickly"
echo "  • README.md - Feature overview"
echo "  • INSTALL.md - Detailed installation"
echo "  • ARCHITECTURE.md - Technical details"
echo ""
