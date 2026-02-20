#!/bin/bash
# Shared helper functions for writing the installation manifest
# Sourced by install scripts to track installed components in ~/.claude/claude-code-helper.json
#
# Manifest v2: Per-component tracking with individual version entries.
#
# Usage:
#   source "$(dirname "$0")/../scripts/manifest-helper.sh"  # or adjust path
#   register_component "agents/domain-experts/api-expert" "1.0.0" "agents/api-expert.md"
#   register_all_installed "/path/to/repo"
#
# Legacy (v1) function still works for backward compat:
#   update_manifest "config-bundle" '{"agents": 47, "skills": 18}'

MANIFEST_FILE="${HOME}/.claude/claude-code-helper.json"

# Get the version from the repo's package.json
# Usage: VERSION=$(get_repo_version "/path/to/repo")
get_repo_version() {
    local repo_root="${1:-.}"
    node -e "console.log(require('${repo_root}/package.json').version)" 2>/dev/null || echo "unknown"
}

# ── Manifest v2 Functions ──

# Ensure the manifest is v2 format, migrating from v1 if needed
# Usage: ensure_manifest_v2 "/path/to/repo"
ensure_manifest_v2() {
    local repo_root="${REPO_ROOT:-${1:-.}}"
    local version
    version=$(get_repo_version "$repo_root")
    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local source_url="https://github.com/michelabboud/claude-code-helper"

    mkdir -p "$(dirname "$MANIFEST_FILE")"

    node -e "
const fs = require('fs');
const path = '${MANIFEST_FILE}';

let manifest = {};
try {
    manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {
    // File doesn't exist or is invalid - start fresh
}

if (manifest.manifestVersion === 2) {
    process.exit(0); // Already v2
}

// Migrate v1 → v2
const migrated = {
    manifestVersion: 2,
    repoVersion: '${version}',
    source: '${source_url}',
    repoPath: '${repo_root}',
    installedAt: manifest.installedAt || '${now}',
    updatedAt: '${now}',
    installed: {},
    _legacyComponents: manifest.components || {}
};

fs.writeFileSync(path, JSON.stringify(migrated, null, 2) + '\n');
console.log('  Manifest migrated to v2: ' + path);
" 2>/dev/null
}

# Register a single component in the manifest
# Usage: register_component "agents/domain-experts/api-expert" "1.0.0" "agents/api-expert.md"
#   $1 = component key (repo-relative path prefix)
#   $2 = version string
#   $3 = installed file path (relative to ~/.claude/), or empty for MCP servers
register_component() {
    local component_key="$1"
    local component_version="$2"
    local install_file="${3:-}"
    local repo_root="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

    ensure_manifest_v2 "$repo_root"

    local now
    now=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local version
    version=$(get_repo_version "$repo_root")

    node -e "
const fs = require('fs');
const path = '${MANIFEST_FILE}';
const key = '${component_key}';
const ver = '${component_version}';
const file = '${install_file}';
const now = '${now}';

let manifest = {};
try {
    manifest = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {}

manifest.repoVersion = '${version}';
manifest.updatedAt = now;

if (!manifest.installed) manifest.installed = {};

manifest.installed[key] = {
    version: ver,
    installedAt: now
};
if (file) manifest.installed[key].file = file;

fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
" 2>/dev/null
}

# Extract version from a YAML frontmatter .md file
# Usage: VERSION=$(extract_md_version "/path/to/file.md")
extract_md_version() {
    local file="$1"
    node -e "
const fs = require('fs');
const content = fs.readFileSync('${file}', 'utf8');
const match = content.match(/^---[\\r\\n]+([\\s\\S]*?)[\\r\\n]+---/);
if (match) {
    const vm = match[1].match(/^version:\\s*(.+)$/m);
    if (vm) { console.log(vm[1].trim()); process.exit(0); }
}
console.log('1.0.0');
" 2>/dev/null
}

# Extract version from a JSON file
# Usage: VERSION=$(extract_json_version "/path/to/file.json" "version")
extract_json_version() {
    local file="$1"
    local field="${2:-version}"
    node -e "
const data = require('${file}');
console.log(data['${field}'] || '1.0.0');
" 2>/dev/null
}

# Scan all installed components under ~/.claude/ and register them
# Usage: register_all_installed "/path/to/repo"
register_all_installed() {
    local repo_root="${REPO_ROOT:-${1:-.}}"

    ensure_manifest_v2 "$repo_root"

    echo "  Registering installed components..."
    local count=0

    # Agents (.md files in ~/.claude/agents/)
    if [ -d "${HOME}/.claude/agents" ]; then
        for f in "${HOME}/.claude/agents"/*.md; do
            [ -f "$f" ] || continue
            local bname
            bname=$(basename "$f" .md)
            local ver
            ver=$(extract_md_version "$f")
            # Try to find the source in domain-experts
            if [ -f "${repo_root}/agents/domain-experts/${bname}.md" ]; then
                register_component "agents/domain-experts/${bname}" "$ver" "agents/${bname}.md"
            else
                register_component "agents/${bname}" "$ver" "agents/${bname}.md"
            fi
            count=$((count + 1))
        done
        # JSON agents
        for f in "${HOME}/.claude/agents"/*.json; do
            [ -f "$f" ] || continue
            local bname
            bname=$(basename "$f" .json)
            local ver
            ver=$(extract_json_version "$f")
            register_component "agents/mcp-integrated/${bname}" "$ver" "agents/${bname}.json"
            count=$((count + 1))
        done
    fi

    # Skills (.md files in ~/.claude/skills/)
    if [ -d "${HOME}/.claude/skills" ]; then
        # Directory-based skills (SKILL.md)
        for d in "${HOME}/.claude/skills"/*/; do
            [ -d "$d" ] || continue
            if [ -f "${d}SKILL.md" ]; then
                local dname
                dname=$(basename "$d")
                local ver
                ver=$(extract_md_version "${d}SKILL.md")
                register_component "skills/${dname}" "$ver" "skills/${dname}/"
                count=$((count + 1))
            fi
        done
        # Standalone skill files
        for f in "${HOME}/.claude/skills"/*.md; do
            [ -f "$f" ] || continue
            local bname
            bname=$(basename "$f" .md)
            [ "$bname" = "README" ] && continue
            local ver
            ver=$(extract_md_version "$f")
            register_component "skills/${bname}" "$ver" "skills/${bname}.md"
            count=$((count + 1))
        done
    fi

    # Hooks (.md files in ~/.claude/hooks/)
    if [ -d "${HOME}/.claude/hooks" ]; then
        for f in "${HOME}/.claude/hooks"/*.md; do
            [ -f "$f" ] || continue
            local bname
            bname=$(basename "$f" .md)
            [ "$bname" = "README" ] && continue
            local ver
            ver=$(extract_md_version "$f")
            register_component "hooks/${bname}" "$ver" "hooks/${bname}.md"
            count=$((count + 1))
        done
    fi

    echo "  Registered ${count} components"
}

# ── Legacy v1 Function (backward compat) ──

# Update the installation manifest with component data (v1 style)
# This is additive - running one install script doesn't erase another's data
# Now also triggers v2 migration internally.
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
manifest.repoVersion = version;
manifest.version = version; // backward compat
manifest.source = sourceUrl;
if (!manifest.installedAt) {
    manifest.installedAt = now;
}
manifest.updatedAt = now;

// Update legacy component data
if (!manifest._legacyComponents) {
    manifest._legacyComponents = manifest.components || {};
}

const componentData = JSON.parse('${component_data}');
manifest._legacyComponents[component] = {
    ...componentData,
    version: version,
    installedAt: now
};

// Keep old 'components' for backward compat readers
manifest.components = manifest._legacyComponents;

// Ensure v2 fields exist
if (!manifest.manifestVersion) manifest.manifestVersion = 2;
if (!manifest.installed) manifest.installed = {};

fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + '\n');
console.log('  Manifest updated: ' + path);
" 2>/dev/null

    if [ $? -ne 0 ]; then
        echo "  Warning: Could not update installation manifest" >&2
    fi
}
