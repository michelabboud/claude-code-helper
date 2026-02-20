#!/bin/bash
# Shared helper functions for writing the installation manifest
# Sources by install scripts to track installed components in ~/.claude/claude-code-helper.json
#
# Usage:
#   source "$(dirname "$0")/../scripts/manifest-helper.sh"  # or adjust path
#   update_manifest "config-bundle" '{"agents": 47, "skills": 18}'

MANIFEST_FILE="${HOME}/.claude/claude-code-helper.json"

# Get the version from the repo's package.json
# Usage: VERSION=$(get_repo_version "/path/to/repo")
get_repo_version() {
    local repo_root="${1:-.}"
    node -e "console.log(require('${repo_root}/package.json').version)" 2>/dev/null || echo "unknown"
}

# Update the installation manifest with component data
# This is additive - running one install script doesn't erase another's data
#
# Usage: update_manifest "component-name" '{"key": "value"}'
#   $1 = component name (e.g., "config-bundle", "mcp-servers", "trigger-matcher")
#   $2 = JSON string with component-specific data
#   $REPO_ROOT or $3 = path to repo root (for reading version)
update_manifest() {
    local component="$1"
    local component_data="$2"
    local repo_root="${REPO_ROOT:-${3:-.}}"

    mkdir -p "$(dirname "$MANIFEST_FILE")"

    local version
    version=$(get_repo_version "$repo_root")
    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local source_url="https://github.com/michelabboud/claude-code-helper"

    # Use Node.js for JSON manipulation (already a prerequisite, avoids jq dependency)
    node -e "
const fs = require('fs');
const path = '${MANIFEST_FILE}';
const component = '${component}';
const version = '${version}';
const now = '${now}';
const sourceUrl = '${source_url}';

let manifest = {};
try {
    manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {
    // File doesn't exist or is invalid - start fresh
}

// Update top-level fields
manifest.version = version;
manifest.source = sourceUrl;
if (!manifest.installedAt) {
    manifest.installedAt = now;
}
manifest.updatedAt = now;

// Update component data
if (!manifest.components) {
    manifest.components = {};
}

const componentData = JSON.parse('${component_data}');
manifest.components[component] = {
    ...componentData,
    version: version,
    installedAt: now
};

fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
console.log('  Manifest updated: ' + path);
" 2>/dev/null

    if [ $? -ne 0 ]; then
        echo "  Warning: Could not update installation manifest" >&2
    fi
}
