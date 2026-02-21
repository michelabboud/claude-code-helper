#!/usr/bin/env bash
# download-component.sh
#
# Downloads a component from GitHub without needing a local repo clone.
# Creates a backup before overwriting and updates the local manifest.
#
# Usage:
#   ./scripts/download-component.sh <component-key> [--branch <branch>]
#
# Examples:
#   ./scripts/download-component.sh agents/domain-experts/redis-expert
#   ./scripts/download-component.sh skills/pm-dashboard
#   ./scripts/download-component.sh mcp-servers/rag-mcp
#
# Environment:
#   CLAUDE_HOME  Override ~/.claude (default: $HOME/.claude)

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REPO_OWNER="michelabboud"
REPO_NAME="claude-code-helper"
BRANCH="main"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
BACKUP_DIR="$CLAUDE_HOME/backups/components"
MANIFEST="$CLAUDE_HOME/claude-code-helper.json"
MAX_BACKUPS=3

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

COMPONENT_KEY=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: ./scripts/download-component.sh <component-key> [--branch <branch>]"
      echo ""
      echo "Downloads a component from GitHub and installs it to ~/.claude/"
      echo ""
      echo "Examples:"
      echo "  ./scripts/download-component.sh agents/domain-experts/redis-expert"
      echo "  ./scripts/download-component.sh skills/pm-dashboard"
      echo "  ./scripts/download-component.sh mcp-servers/rag-mcp"
      exit 0
      ;;
    *)
      COMPONENT_KEY="$1"
      shift
      ;;
  esac
done

if [[ -z "$COMPONENT_KEY" ]]; then
  echo -e "${RED}Error: component-key is required${NC}"
  echo "Usage: ./scripts/download-component.sh <component-key>"
  exit 1
fi

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

json_get() {
  local file="$1"
  local key="$2"
  node -e "
    const data = JSON.parse(require('fs').readFileSync('$file', 'utf-8'));
    const val = $key;
    if (val !== undefined && val !== null) process.stdout.write(String(val));
  " 2>/dev/null || true
}

raw_url() {
  echo "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/$1"
}

api_url() {
  echo "https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/$1?ref=${BRANCH}"
}

# ---------------------------------------------------------------------------
# Fetch component-versions.json from remote
# ---------------------------------------------------------------------------

echo -e "${YELLOW}Fetching component index...${NC}"
VERSIONS_URL=$(raw_url "component-versions.json")
VERSIONS_JSON=$(curl -fsSL "$VERSIONS_URL" 2>/dev/null) || {
  echo -e "${RED}Error: Failed to fetch component-versions.json from GitHub${NC}"
  exit 1
}

# Look up component
FILE=$(echo "$VERSIONS_JSON" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const c = data.components['$COMPONENT_KEY'];
  if (c) process.stdout.write(c.file || '');
" 2>/dev/null) || true

INSTALL_PATH=$(echo "$VERSIONS_JSON" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const c = data.components['$COMPONENT_KEY'];
  if (c) process.stdout.write(c.installPath || '');
" 2>/dev/null) || true

VERSION=$(echo "$VERSIONS_JSON" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const c = data.components['$COMPONENT_KEY'];
  if (c) process.stdout.write(c.version || '');
" 2>/dev/null) || true

BUILD_REQUIRED=$(echo "$VERSIONS_JSON" | node -e "
  const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
  const c = data.components['$COMPONENT_KEY'];
  if (c && c.buildRequired) process.stdout.write('true');
" 2>/dev/null) || true

if [[ -z "$FILE" ]]; then
  echo -e "${RED}Error: Component '$COMPONENT_KEY' not found in index${NC}"
  echo ""
  echo "Available components (first 20):"
  echo "$VERSIONS_JSON" | node -e "
    const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    Object.keys(data.components).sort().slice(0, 20).forEach(k => console.log('  ' + k));
  " 2>/dev/null
  exit 1
fi

# ---------------------------------------------------------------------------
# Handle MCP servers (build required)
# ---------------------------------------------------------------------------

if [[ "$BUILD_REQUIRED" == "true" ]]; then
  echo -e "${YELLOW}MCP server detected: ${COMPONENT_KEY}${NC}"
  echo ""
  echo "MCP servers require building from source. Auto-download is not supported."
  echo ""
  echo "To install or update this MCP server:"
  echo ""
  echo "  Option 1 — From a repo clone (recommended):"
  echo "    cd /path/to/claude-code-helper"
  echo "    git pull"
  echo "    ./scripts/update-component.sh ${COMPONENT_KEY}"
  echo ""
  echo "  Option 2 — Install all MCP servers at once:"
  echo "    cd /path/to/claude-code-helper/mcp-servers"
  echo "    ./install-all.sh"
  echo ""
  echo "Both options build the server and copy it to ~/.claude/mcp-servers/."
  echo "Once installed, you can safely delete the repo clone."
  exit 0
fi

# ---------------------------------------------------------------------------
# Create backup
# ---------------------------------------------------------------------------

TARGET="$CLAUDE_HOME/$INSTALL_PATH"

if [[ -e "$TARGET" ]]; then
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  BACKUP_DEST="$BACKUP_DIR/$COMPONENT_KEY/$TIMESTAMP"
  mkdir -p "$BACKUP_DEST"

  if [[ -d "$TARGET" ]]; then
    cp -r "$TARGET"/* "$BACKUP_DEST/" 2>/dev/null || true
  else
    cp "$TARGET" "$BACKUP_DEST/" 2>/dev/null || true
  fi
  echo -e "${GREEN}Backup created: $BACKUP_DEST${NC}"

  # Prune old backups (keep last N)
  BACKUP_PARENT="$BACKUP_DIR/$COMPONENT_KEY"
  if [[ -d "$BACKUP_PARENT" ]]; then
    # shellcheck disable=SC2012
    ls -1dt "$BACKUP_PARENT"/*/ 2>/dev/null | tail -n +"$((MAX_BACKUPS + 1))" | while read -r old; do
      rm -rf "$old"
    done
  fi
fi

# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------

echo -e "${YELLOW}Downloading ${COMPONENT_KEY} (v${VERSION:-unknown})...${NC}"

if [[ "$INSTALL_PATH" == */ ]]; then
  # Directory component (e.g., skills/pm-dashboard/) — use GitHub API to list files
  DIR_PATH="${FILE%/*}"  # e.g., skills/pm-dashboard
  mkdir -p "$TARGET"

  FILES_JSON=$(curl -fsSL "$(api_url "$DIR_PATH")" 2>/dev/null) || {
    echo -e "${RED}Error: Failed to list directory contents from GitHub API${NC}"
    exit 1
  }

  echo "$FILES_JSON" | node -e "
    const files = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf-8'));
    if (Array.isArray(files)) {
      files.filter(f => f.type === 'file').forEach(f => console.log(f.path + '|' + f.name));
    }
  " 2>/dev/null | while IFS='|' read -r remote_path filename; do
    echo "  Downloading: $filename"
    curl -fsSL "$(raw_url "$remote_path")" -o "$TARGET/$filename" 2>/dev/null || {
      echo -e "${RED}  Failed to download: $filename${NC}"
    }
  done
else
  # Single file component
  mkdir -p "$(dirname "$TARGET")"
  curl -fsSL "$(raw_url "$FILE")" -o "$TARGET" 2>/dev/null || {
    echo -e "${RED}Error: Failed to download ${FILE}${NC}"
    exit 1
  }

  # Make .sh files executable
  if [[ "$TARGET" == *.sh ]]; then
    chmod +x "$TARGET"
  fi
fi

echo -e "${GREEN}Downloaded: ${INSTALL_PATH}${NC}"

# ---------------------------------------------------------------------------
# Update manifest
# ---------------------------------------------------------------------------

if [[ -f "$MANIFEST" ]]; then
  node -e "
    const fs = require('fs');
    const manifest = JSON.parse(fs.readFileSync('$MANIFEST', 'utf-8'));
    if (!manifest.installed) manifest.installed = {};
    manifest.installed['$COMPONENT_KEY'] = {
      version: '$VERSION',
      installedAt: new Date().toISOString(),
      file: '$INSTALL_PATH'
    };
    manifest.updatedAt = new Date().toISOString();
    fs.writeFileSync('$MANIFEST', JSON.stringify(manifest, null, 2) + '\n');
  " 2>/dev/null && echo -e "${GREEN}Manifest updated${NC}" || echo -e "${YELLOW}Warning: Could not update manifest${NC}"
fi

echo -e "\n${GREEN}Successfully installed ${COMPONENT_KEY} v${VERSION:-unknown}${NC}"
