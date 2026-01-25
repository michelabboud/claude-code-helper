#!/bin/bash
# Install Claude Code Trigger Matcher and All Hooks
#
# This script installs:
# - Trigger matcher library (built)
# - File pattern trigger hooks
# - Event trigger hooks
# - MCP trigger hooks
# - Triggers configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLAUDE_DIR="${HOME}/.claude"
HOOKS_DIR="${CLAUDE_DIR}/hooks"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Claude Code Trigger Matcher Installer"
echo "========================================="
echo ""

# Create directories
mkdir -p "${HOOKS_DIR}"

# Build the library
echo -e "${BLUE}🔨 Building trigger-matcher library...${NC}"
cd "${SCRIPT_DIR}"
npm install
npm run build
echo -e "${GREEN}✓ Library built${NC}"
echo ""

# Copy all hook files
echo -e "${BLUE}📋 Installing hook files...${NC}"

# File trigger hooks
if [ -f "${REPO_ROOT}/hooks/file-trigger-hook.json" ]; then
    cp "${REPO_ROOT}/hooks/file-trigger-hook.json" "${HOOKS_DIR}/"
    echo "  ✓ file-trigger-hook.json"
fi
if [ -f "${REPO_ROOT}/hooks/file-trigger-matcher.js" ]; then
    cp "${REPO_ROOT}/hooks/file-trigger-matcher.js" "${HOOKS_DIR}/"
    chmod +x "${HOOKS_DIR}/file-trigger-matcher.js"
    echo "  ✓ file-trigger-matcher.js"
fi

# Event trigger hooks
if [ -f "${REPO_ROOT}/hooks/event-trigger-hook.json" ]; then
    cp "${REPO_ROOT}/hooks/event-trigger-hook.json" "${HOOKS_DIR}/"
    echo "  ✓ event-trigger-hook.json"
fi
if [ -f "${REPO_ROOT}/hooks/event-dispatcher.js" ]; then
    cp "${REPO_ROOT}/hooks/event-dispatcher.js" "${HOOKS_DIR}/"
    chmod +x "${HOOKS_DIR}/event-dispatcher.js"
    echo "  ✓ event-dispatcher.js"
fi

# MCP trigger hooks
if [ -f "${REPO_ROOT}/hooks/mcp-trigger-hook.json" ]; then
    cp "${REPO_ROOT}/hooks/mcp-trigger-hook.json" "${HOOKS_DIR}/"
    echo "  ✓ mcp-trigger-hook.json"
fi
if [ -f "${REPO_ROOT}/hooks/mcp-trigger-dispatcher.js" ]; then
    cp "${REPO_ROOT}/hooks/mcp-trigger-dispatcher.js" "${HOOKS_DIR}/"
    chmod +x "${HOOKS_DIR}/mcp-trigger-dispatcher.js"
    echo "  ✓ mcp-trigger-dispatcher.js"
fi

# Copy other hook documentation
cp "${REPO_ROOT}/hooks"/*.md "${HOOKS_DIR}/" 2>/dev/null || true

echo -e "${GREEN}✓ Hook files installed${NC}"
echo ""

# Install hook dependencies
echo -e "${BLUE}📦 Installing hook dependencies...${NC}"
cd "${HOOKS_DIR}"
if [ ! -f "package.json" ]; then
    npm init -y > /dev/null 2>&1
fi
npm install minimatch --save > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Install triggers configuration
echo -e "${BLUE}📋 Installing triggers configuration...${NC}"
if [ -f "${REPO_ROOT}/config-bundle/triggers.json" ]; then
    cp "${REPO_ROOT}/config-bundle/triggers.json" "${CLAUDE_DIR}/"
    echo "  ✓ triggers.json"
fi
if [ -f "${REPO_ROOT}/config-bundle/triggers.schema.json" ]; then
    cp "${REPO_ROOT}/config-bundle/triggers.schema.json" "${CLAUDE_DIR}/"
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
echo "Installed files:"
echo ""
echo "Hooks (${HOOKS_DIR}):"
ls "${HOOKS_DIR}"/*.json 2>/dev/null | xargs -n1 basename | sed 's/^/  • /'
echo ""
echo "Triggers config (~/.claude/):"
echo "  • triggers.json"
echo "  • triggers.schema.json"
echo ""
echo -e "${YELLOW}Note:${NC} The trigger system requires Claude Code hooks to be enabled."
echo "Hooks are configured in ~/.claude/settings.json"
echo ""
echo "For documentation, see: trigger-matcher/README.md"
