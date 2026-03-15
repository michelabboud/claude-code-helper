#!/bin/bash
# Multi-Agent MCP System - Installation Script
# Builds MCP servers in the repo, then installs them for stable paths.
# Default: ~/.claude/mcp-servers/  |  Optional: shared CLI-neutral folder
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
BLUE='\033[0;34m'
BOLD='\033[1m'
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

# ─────────────────────────────────────────────────────────────────────────────
# Ask user where to install MCP servers
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
DEFAULT_DIR="$HOME/.claude/mcp-servers"
SUGGESTED_SHARED="$HOME/.claude-code-helper-mcps"

# Allow override via env var (for CI / non-interactive use)
if [ -n "$MCP_INSTALL_DIR" ]; then
    echo -e "Using MCP_INSTALL_DIR from environment: ${BOLD}$MCP_INSTALL_DIR${NC}"
    SHARED_INSTALL=false
    # If it's not under ~/.claude, treat as shared
    case "$MCP_INSTALL_DIR" in
        "$HOME/.claude/"*) SHARED_INSTALL=false ;;
        *) SHARED_INSTALL=true ;;
    esac
else
    # Detect other CLI tools
    HAS_GEMINI=false
    HAS_CODEX=false
    command -v gemini &> /dev/null && HAS_GEMINI=true
    command -v codex &> /dev/null && HAS_CODEX=true

    if [ "$HAS_GEMINI" = "true" ] || [ "$HAS_CODEX" = "true" ]; then
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BOLD}MCP servers can be shared across multiple AI coding CLIs.${NC}"
        echo ""
        echo "Detected CLIs:"
        echo -e "  ${GREEN}✓${NC} Claude Code"
        [ "$HAS_GEMINI" = "true" ] && echo -e "  ${GREEN}✓${NC} Gemini CLI"
        [ "$HAS_CODEX" = "true" ] && echo -e "  ${GREEN}✓${NC} Codex CLI"
        echo ""
        echo "Options:"
        echo -e "  ${BOLD}1)${NC} Install to ${BOLD}~/.claude/mcp-servers/${NC} (Claude Code only — default)"
        echo -e "  ${BOLD}2)${NC} Install to ${BOLD}~/.claude-code-helper-mcps/${NC} (shared across all CLIs)"
        echo -e "  ${BOLD}3)${NC} Custom path (you choose)"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        read -p "Choose [1/2/3] (default: 1): " MCP_CHOICE
        MCP_CHOICE="${MCP_CHOICE:-1}"

        case "$MCP_CHOICE" in
            2)
                MCP_INSTALL_DIR="$SUGGESTED_SHARED"
                SHARED_INSTALL=true
                ;;
            3)
                read -p "Enter install path (e.g. ~/.my-mcps): " CUSTOM_PATH
                # Expand ~ to $HOME
                CUSTOM_PATH="${CUSTOM_PATH/#\~/$HOME}"
                if [ -z "$CUSTOM_PATH" ]; then
                    echo "No path entered, using default."
                    MCP_INSTALL_DIR="$DEFAULT_DIR"
                    SHARED_INSTALL=false
                else
                    MCP_INSTALL_DIR="$CUSTOM_PATH"
                    SHARED_INSTALL=true
                fi
                ;;
            *)
                MCP_INSTALL_DIR="$DEFAULT_DIR"
                SHARED_INSTALL=false
                ;;
        esac
    else
        # No other CLIs detected — use default
        MCP_INSTALL_DIR="$DEFAULT_DIR"
        SHARED_INSTALL=false
    fi
fi

echo ""
echo -e "📂 MCP servers will be installed to: ${BOLD}$MCP_INSTALL_DIR${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Build servers
# ─────────────────────────────────────────────────────────────────────────────

# Install root dependencies first (needed for workspaces and shared packages)
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

# Function to install and build a server (in the repo workspace)
install_server() {
    local server_name=$1
    local server_dir=$2

    echo "📦 Building ${server_name}..."

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
        echo -e "  └─ ${GREEN}✓ ${server_name} built!${NC}"
    else
        echo -e "  └─ ${RED}✗ Build output not found${NC}"
        cd ..
        return 1
    fi

    cd ..
    echo ""
}

# Derive clean MCP name from directory name (strip -mcp suffix)
derive_mcp_name() {
    echo "$1" | sed 's/-mcp$//'
}

# Function to copy a built server to the install directory
# This creates a standalone installation with its own node_modules.
install_to_dest() {
    local server_dir=$1
    local dest="$MCP_INSTALL_DIR/$server_dir"

    echo "  └─ Installing to $dest ..."

    # Create destination
    mkdir -p "$dest"

    # Copy build output and package.json
    cp -r "$server_dir/build" "$dest/"
    cp "$server_dir/package.json" "$dest/"

    # Copy mcp-shared as a local package alongside the server
    if [ -d "mcp-shared/build" ]; then
        mkdir -p "$dest/mcp-shared"
        cp -r "mcp-shared/build" "$dest/mcp-shared/"
        cp "mcp-shared/package.json" "$dest/mcp-shared/"

        # Strip scripts/devDeps from mcp-shared (already built; prevents tsc not found errors)
        node -e "
const fs = require('fs');
const p = '${dest}/mcp-shared/package.json';
const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
delete pkg.scripts;
delete pkg.devDependencies;
fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
"
    fi

    # Rewrite package.json: mcp-shared → local path, strip devDependencies
    node -e "
const fs = require('fs');
const path = '${dest}/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));

// Point mcp-shared to the local copy
if (pkg.dependencies && pkg.dependencies['mcp-shared']) {
    pkg.dependencies['mcp-shared'] = 'file:./mcp-shared';
}

// Remove devDependencies (not needed at runtime)
delete pkg.devDependencies;

// Remove workspace-only scripts
delete pkg.scripts;

fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"

    # Run standalone npm install (production only)
    cd "$dest"
    if npm install --production --silent 2>/dev/null; then
        echo -e "     ${GREEN}✓ Dependencies installed at $dest${NC}"
    else
        # Retry without --silent to see errors
        echo -e "     ${YELLOW}⚠️  Retrying npm install...${NC}"
        npm install --production 2>&1 || true
    fi
    cd "$SCRIPT_DIR"
}

# Build each server in the repo workspace
install_server "RAG MCP" "rag-mcp"
install_server "API Specialist MCP" "api-specialist-mcp"
install_server "Code Review MCP" "code-review-mcp"
install_server "Design System MCP" "design-system-mcp"
install_server "Testing MCP" "testing-mcp"
install_server "UI/UX Review MCP" "uiux-review-mcp"
install_server "Project Oversight MCP" "project-oversight-mcp"

# Build mcp-shared (needed for install_to_dest)
if [ -d "mcp-shared" ] && [ ! -d "mcp-shared/build" ]; then
    echo "📦 Building mcp-shared..."
    cd mcp-shared && npm run build --silent && cd ..
fi

# ─────────────────────────────────────────────────────────────────────────────
# Copy servers to install directory
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "📂 Copying MCP servers to $MCP_INSTALL_DIR ..."
echo ""

# List of server directories (same order as build)
SERVERS=(
    "rag-mcp"
    "api-specialist-mcp"
    "code-review-mcp"
    "design-system-mcp"
    "testing-mcp"
    "uiux-review-mcp"
    "project-oversight-mcp"
)

for server_dir in "${SERVERS[@]}"; do
    if [ -f "$server_dir/build/index.js" ]; then
        install_to_dest "$server_dir"
    fi
done

# Also install experimental servers if they were built
for dir in */build/index.js; do
    server=$(echo "$dir" | sed 's|/build/index.js||')
    [ "$server" = "mcp-shared" ] && continue
    # Skip servers already installed above
    already_installed=false
    for s in "${SERVERS[@]}"; do
        if [ "$server" = "$s" ]; then
            already_installed=true
            break
        fi
    done
    if [ "$already_installed" = "false" ]; then
        install_to_dest "$server"
    fi
done

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Register MCP servers with detected CLI tools
# ─────────────────────────────────────────────────────────────────────────────
register_with_cli() {
    local cli_name=$1

    echo "🔗 Registering MCP servers with ${cli_name}..."

    for server_entry in "$MCP_INSTALL_DIR"/*/build/index.js; do
        dir_name=$(basename "$(dirname "$(dirname "$server_entry")")")
        [ "$dir_name" = "mcp-shared" ] && continue
        mcp_name=$(derive_mcp_name "$dir_name")

        case "$cli_name" in
            "Claude Code")
                claude mcp remove -s user "$mcp_name" 2>/dev/null || true
                if claude mcp add -s user "$mcp_name" -- node "$server_entry" 2>/dev/null; then
                    echo -e "  ${GREEN}✓ $mcp_name${NC}"
                else
                    echo -e "  ${RED}✗ $mcp_name${NC}"
                fi
                ;;
            "Gemini CLI")
                gemini mcp remove "$mcp_name" 2>/dev/null || true
                if gemini mcp add "$mcp_name" node -- "$server_entry" 2>/dev/null; then
                    echo -e "  ${GREEN}✓ $mcp_name${NC}"
                else
                    # Fallback: write directly to settings.json
                    node -e "
const fs = require('fs'), p = require('path');
const sf = p.join(process.env.HOME, '.gemini/settings.json');
try {
    const s = JSON.parse(fs.readFileSync(sf, 'utf8'));
    s.mcpServers = s.mcpServers || {};
    s.mcpServers['${mcp_name}'] = { command: 'node', args: ['${server_entry}'] };
    fs.writeFileSync(sf, JSON.stringify(s, null, 2));
    process.stdout.write('  \x1b[32m✓ ${mcp_name}\x1b[0m (settings.json)\n');
} catch(e) { process.stdout.write('  \x1b[31m✗ ${mcp_name}\x1b[0m\n'); }
" 2>/dev/null
                fi
                ;;
            "Codex CLI")
                codex mcp remove "$mcp_name" 2>/dev/null || true
                if codex mcp add "$mcp_name" -- node "$server_entry" 2>/dev/null; then
                    echo -e "  ${GREEN}✓ $mcp_name${NC}"
                else
                    echo -e "  ${RED}✗ $mcp_name${NC}"
                fi
                ;;
        esac
    done
    echo ""
}

CLI_REGISTERED=false

# Always register with Claude Code if available
if command -v claude &> /dev/null; then
    CLI_REGISTERED=true
    register_with_cli "Claude Code"
fi

# Register with other CLIs only if user chose a shared location
if [ "$SHARED_INSTALL" = "true" ]; then
    if command -v gemini &> /dev/null; then
        CLI_REGISTERED=true
        register_with_cli "Gemini CLI"
    fi
    if command -v codex &> /dev/null; then
        CLI_REGISTERED=true
        register_with_cli "Codex CLI"
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary and configuration output
# ─────────────────────────────────────────────────────────────────────────────
echo "📍 Installation paths (stable — safe to delete repo clone):"
for server_entry in "$MCP_INSTALL_DIR"/*/build/index.js; do
    dir_name=$(basename "$(dirname "$(dirname "$server_entry")")")
    [ "$dir_name" = "mcp-shared" ] && continue
    mcp_name=$(derive_mcp_name "$dir_name")
    echo "  • $mcp_name → $server_entry"
done
echo ""

# Generate Claude Desktop configuration
echo "⚙️  Configuration for Claude Desktop:"
echo ""
echo "{"
echo "  \"mcpServers\": {"
first=true
for server_entry in "$MCP_INSTALL_DIR"/*/build/index.js; do
    dir_name=$(basename "$(dirname "$(dirname "$server_entry")")")
    [ "$dir_name" = "mcp-shared" ] && continue
    mcp_name=$(derive_mcp_name "$dir_name")
    [ "$first" = "true" ] && first=false || echo ","
    printf "    \"%s\": {\n      \"command\": \"node\",\n      \"args\": [\"%s\"]\n    }" "$mcp_name" "$server_entry"
done
echo ""
echo "  }"
echo "}"
echo ""

# Save configuration to file
CONFIG_FILE="claude_desktop_config.json"
{
    echo "{"
    echo "  \"mcpServers\": {"
    first=true
    for server_entry in "$MCP_INSTALL_DIR"/*/build/index.js; do
        dir_name=$(basename "$(dirname "$(dirname "$server_entry")")")
        [ "$dir_name" = "mcp-shared" ] && continue
        mcp_name=$(derive_mcp_name "$dir_name")
        [ "$first" = "true" ] && first=false || echo ","
        printf "    \"%s\": {\n      \"command\": \"node\",\n      \"args\": [\"%s\"]\n    }" "$mcp_name" "$server_entry"
    done
    echo ""
    echo "  }"
    echo "}"
} > "$CONFIG_FILE"
echo -e "${GREEN}✓ Configuration saved to $CONFIG_FILE${NC}"
echo ""

# Instructions when no CLI was auto-registered
if [ "$CLI_REGISTERED" = "false" ]; then
    echo "📝 No CLI tools detected. Register MCP servers manually:"
    echo ""
    echo "=== Claude Code ==="
    echo "  claude mcp add -s user <name> -- node \"$MCP_INSTALL_DIR/<server>/build/index.js\""
    echo ""
    echo "=== Gemini CLI ==="
    echo "  gemini mcp add <name> node -- \"$MCP_INSTALL_DIR/<server>/build/index.js\""
    echo ""
    echo "=== Codex CLI ==="
    echo "  codex mcp add <name> -- node \"$MCP_INSTALL_DIR/<server>/build/index.js\""
    echo ""
fi

echo "=== Claude Desktop ==="
echo ""
echo "1. Copy the configuration to Claude Desktop:"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
    echo "   macOS:"
    echo "   cp $CONFIG_FILE \"$CONFIG_PATH\""
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
    echo "   Linux:"
    echo "   cp $CONFIG_FILE \"$CONFIG_PATH\""
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
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
echo -e "   MCP servers are installed to ${YELLOW}$MCP_INSTALL_DIR${NC}"
echo -e "   You can safely delete this repo clone — servers will keep working."
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
            register_component "mcp-servers/${server}" "$ver" "mcp-servers/${server}/"
            echo "  ✓ ${server} (v${ver})"
        fi
    done

    # Also keep legacy manifest data for backward compatibility
    SERVERS_LIST=$(ls -d */build/index.js 2>/dev/null | sed 's|/build/index.js||' | paste -sd ',' - | sed 's/,/", "/g')
    update_manifest "mcp-servers" "{\"servers\": [\"${SERVERS_LIST}\"], \"install_dir\": \"${MCP_INSTALL_DIR}\"}"
fi

echo "📚 Documentation:"
echo "  • QUICKGUIDE.md - Get started quickly"
echo "  • README.md - Feature overview"
echo "  • INSTALL.md - Detailed installation"
echo "  • ARCHITECTURE.md - Technical details"
echo ""
