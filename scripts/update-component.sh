#!/bin/bash
# update-component.sh - Update a single component from the local repo clone
#
# Usage:
#   ./scripts/update-component.sh <component-key>
#
# Examples:
#   ./scripts/update-component.sh agents/domain-experts/api-expert
#   ./scripts/update-component.sh mcp-servers/rag-mcp
#   ./scripts/update-component.sh skills/pm-dashboard
#
# Reads component-versions.json from the repo root to determine source paths,
# install paths, and whether a build step is required.

set -e

# ── Colors ──

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── Paths ──

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERSIONS_FILE="$REPO_ROOT/component-versions.json"

# ── Source manifest helper (register_component will be available) ──

source "$SCRIPT_DIR/manifest-helper.sh"

# ── Helpers ──

# jq-free JSON reading via Node.js
# Usage: json_get <file> <js-expression>
#   e.g. json_get "$VERSIONS_FILE" 'data.components["skills/pm-dashboard"].file'
json_get() {
    local file="$1"
    local expr="$2"
    node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('${file}', 'utf8'));
const result = ${expr};
if (result === undefined || result === null) {
    process.exit(1);
}
console.log(typeof result === 'object' ? JSON.stringify(result) : String(result));
" 2>/dev/null
}

# ── Validate arguments ──

if [ -z "$1" ]; then
    echo -e "${RED}Error: Missing component key${NC}"
    echo ""
    echo "Usage: $0 <component-key>"
    echo ""
    echo "Examples:"
    echo "  $0 agents/domain-experts/api-expert"
    echo "  $0 mcp-servers/rag-mcp"
    echo "  $0 skills/pm-dashboard"
    exit 1
fi

COMPONENT_KEY="$1"

# ── Validate component-versions.json exists ──

if [ ! -f "$VERSIONS_FILE" ]; then
    echo -e "${RED}Error: component-versions.json not found at ${VERSIONS_FILE}${NC}"
    echo "Please ensure the file exists in the repo root."
    exit 1
fi

# ── Look up component in the versions file ──

COMPONENT_SOURCE=$(json_get "$VERSIONS_FILE" "data.components[\"${COMPONENT_KEY}\"].file") || {
    echo -e "${RED}Error: Component '${COMPONENT_KEY}' not found in component-versions.json${NC}"
    exit 1
}

COMPONENT_INSTALL_PATH=$(json_get "$VERSIONS_FILE" "data.components[\"${COMPONENT_KEY}\"].installPath") || {
    echo -e "${RED}Error: No installPath defined for '${COMPONENT_KEY}'${NC}"
    exit 1
}

COMPONENT_VERSION=$(json_get "$VERSIONS_FILE" "data.components[\"${COMPONENT_KEY}\"].version") || {
    echo -e "${RED}Error: No version defined for '${COMPONENT_KEY}'${NC}"
    exit 1
}

# buildRequired is optional -- default to false
BUILD_REQUIRED=$(json_get "$VERSIONS_FILE" "data.components[\"${COMPONENT_KEY}\"].buildRequired" 2>/dev/null || echo "false")

# ── Resolve full paths ──

SOURCE_PATH="$REPO_ROOT/$COMPONENT_SOURCE"
INSTALL_DIR="$HOME/.claude/$COMPONENT_INSTALL_PATH"

# ── Record old version (if manifest tracks it) ──

OLD_VERSION=$(json_get "$HOME/.claude/claude-code-helper.json" "data.installed && data.installed[\"${COMPONENT_KEY}\"] && data.installed[\"${COMPONENT_KEY}\"].version" 2>/dev/null || echo "none")

# ── Perform the update ──

if [ "$BUILD_REQUIRED" = "true" ]; then
    # ── MCP server: install deps and build ──

    # Extract server directory name from the component key (e.g. "mcp-servers/rag-mcp" -> "rag-mcp")
    SERVER_NAME=$(basename "$COMPONENT_KEY")
    SERVER_DIR="$REPO_ROOT/mcp-servers/$SERVER_NAME"

    if [ ! -d "$SERVER_DIR" ]; then
        echo -e "${RED}Error: MCP server directory not found: ${SERVER_DIR}${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Building MCP server: ${SERVER_NAME}${NC}"

    cd "$SERVER_DIR"

    echo "  Installing dependencies..."
    if ! npm install --silent 2>&1; then
        echo -e "${RED}Error: npm install failed for ${SERVER_NAME}${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}Dependencies installed${NC}"

    echo "  Building..."
    if ! npm run build --silent 2>&1; then
        echo -e "${RED}Error: npm run build failed for ${SERVER_NAME}${NC}"
        exit 1
    fi

    # Verify build output
    if [ ! -f "build/index.js" ]; then
        echo -e "${RED}Error: Build output not found at ${SERVER_DIR}/build/index.js${NC}"
        exit 1
    fi
    echo -e "  ${GREEN}Build successful${NC}"

    cd "$REPO_ROOT"

else
    # ── File-based component: copy to ~/.claude/ ──

    # Check if source exists
    if [ ! -e "$SOURCE_PATH" ]; then
        echo -e "${RED}Error: Source not found: ${SOURCE_PATH}${NC}"
        exit 1
    fi

    # Determine if this is a directory-based component (installPath ends with /)
    if [[ "$COMPONENT_INSTALL_PATH" == */ ]]; then
        # Directory-based component (e.g. skills with SKILL.md + supporting files)
        echo -e "${YELLOW}Copying directory: ${COMPONENT_SOURCE} -> ~/.claude/${COMPONENT_INSTALL_PATH}${NC}"

        # Ensure parent directory exists
        mkdir -p "$INSTALL_DIR"

        # Copy the entire directory contents
        if [ -d "$SOURCE_PATH" ]; then
            cp -r "$SOURCE_PATH"/* "$INSTALL_DIR"
        else
            # Source is a file but install path is a directory -- copy into it
            cp "$SOURCE_PATH" "$INSTALL_DIR"
        fi
    else
        # Single file component
        echo -e "${YELLOW}Copying file: ${COMPONENT_SOURCE} -> ~/.claude/${COMPONENT_INSTALL_PATH}${NC}"

        # Ensure parent directory exists
        mkdir -p "$(dirname "$INSTALL_DIR")"

        cp "$SOURCE_PATH" "$INSTALL_DIR"
    fi

    # Make shell scripts executable
    if [[ "$INSTALL_DIR" == *.sh ]]; then
        chmod +x "$INSTALL_DIR"
        echo -e "  ${GREEN}Made executable: $(basename "$INSTALL_DIR")${NC}"
    fi

    # For directory copies, make any .sh files inside executable
    if [[ "$COMPONENT_INSTALL_PATH" == */ ]] && [ -d "$INSTALL_DIR" ]; then
        find "$INSTALL_DIR" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
    fi

    echo -e "  ${GREEN}Copied successfully${NC}"
fi

# ── Update manifest via register_component (will be available in manifest-helper.sh) ──

if type register_component &>/dev/null; then
    register_component "$COMPONENT_KEY" "$COMPONENT_VERSION"
fi

# ── Print summary ──

echo ""
echo -e "${GREEN}Updated ${COMPONENT_KEY}: ${OLD_VERSION} -> ${COMPONENT_VERSION}${NC}"
