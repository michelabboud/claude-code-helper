#!/bin/bash
# sync-version.sh - Maintainer utility for version management
#
# Reads the version from package.json and optionally creates a git tag
# and GitHub release with release notes extracted from CHANGELOG.md.
#
# Usage:
#   ./scripts/sync-version.sh              # Check version and tag status
#   ./scripts/sync-version.sh --create-release  # Create tag + GitHub release
#
# Requirements:
#   - Node.js (for reading package.json)
#   - gh CLI (for --create-release only)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Read version from package.json
VERSION=$(node -e "console.log(require('${REPO_ROOT}/package.json').version)")
TAG="v${VERSION}"

echo -e "${BLUE}Version Sync Check${NC}"
echo "========================="
echo "  package.json version: ${VERSION}"
echo "  Expected git tag:     ${TAG}"
echo ""

# Generate component-versions.json before release
if [ -f "${REPO_ROOT}/scripts/generate-version-index.mjs" ]; then
    echo -e "${BLUE}Generating component-versions.json...${NC}"
    node "${REPO_ROOT}/scripts/generate-version-index.mjs"
    echo ""
fi

# Check if tag exists locally
if git tag -l "$TAG" | grep -q "$TAG"; then
    echo -e "${GREEN}Tag ${TAG} exists locally${NC}"
    TAG_EXISTS_LOCAL=true
else
    echo -e "${YELLOW}Tag ${TAG} does NOT exist locally${NC}"
    TAG_EXISTS_LOCAL=false
fi

# Check if tag exists on remote
if git ls-remote --tags origin "$TAG" 2>/dev/null | grep -q "$TAG"; then
    echo -e "${GREEN}Tag ${TAG} exists on remote${NC}"
    TAG_EXISTS_REMOTE=true
else
    echo -e "${YELLOW}Tag ${TAG} does NOT exist on remote${NC}"
    TAG_EXISTS_REMOTE=false
fi

echo ""

# If not creating release, just report status
if [ "$1" != "--create-release" ]; then
    if [ "$TAG_EXISTS_LOCAL" = true ] && [ "$TAG_EXISTS_REMOTE" = true ]; then
        echo -e "${GREEN}Everything in sync.${NC}"
    else
        echo "To create tag and GitHub release, run:"
        echo "  ./scripts/sync-version.sh --create-release"
    fi
    exit 0
fi

# --- Create Release ---

# Check for gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: gh CLI is required for --create-release${NC}"
    echo "Install from: https://cli.github.com/"
    exit 1
fi

# Check gh auth
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with gh CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Extract release notes from CHANGELOG.md
echo -e "${BLUE}Extracting release notes for ${VERSION}...${NC}"
RELEASE_NOTES=$(node -e "
const fs = require('fs');
const changelog = fs.readFileSync('${REPO_ROOT}/CHANGELOG.md', 'utf8');

// Find the section for this version
const versionHeader = '## [${VERSION}]';
const altHeader = '## ${VERSION}';
const startIdx = changelog.indexOf(versionHeader) !== -1
    ? changelog.indexOf(versionHeader)
    : changelog.indexOf(altHeader);

if (startIdx === -1) {
    console.error('Version ${VERSION} not found in CHANGELOG.md');
    process.exit(1);
}

// Find the next version header (## [x.y.z] or ## x.y.z)
const afterStart = changelog.substring(startIdx + 5);
const nextHeaderMatch = afterStart.match(/\n## [\[0-9]/);
const endIdx = nextHeaderMatch
    ? startIdx + 5 + nextHeaderMatch.index
    : changelog.length;

const notes = changelog.substring(startIdx, endIdx).trim();
console.log(notes);
" 2>/dev/null)

if [ -z "$RELEASE_NOTES" ]; then
    echo -e "${YELLOW}Warning: Could not extract release notes from CHANGELOG.md${NC}"
    RELEASE_NOTES="Release ${VERSION}"
fi

echo ""
echo -e "${BLUE}Release notes preview:${NC}"
echo "$RELEASE_NOTES" | head -20
echo ""

# Confirm with user
echo -e "${YELLOW}This will create:${NC}"
echo "  - Git tag: ${TAG}"
echo "  - GitHub release: ${TAG}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Create tag if needed
if [ "$TAG_EXISTS_LOCAL" = false ]; then
    echo -e "${BLUE}Creating tag ${TAG}...${NC}"
    git tag -a "$TAG" -m "Release ${VERSION}"
    echo -e "${GREEN}Tag created${NC}"
fi

# Push tag if needed
if [ "$TAG_EXISTS_REMOTE" = false ]; then
    echo -e "${BLUE}Pushing tag ${TAG} to origin...${NC}"
    git push origin "$TAG"
    echo -e "${GREEN}Tag pushed${NC}"
fi

# Create GitHub release
echo -e "${BLUE}Creating GitHub release...${NC}"
gh release create "$TAG" \
    --title "v${VERSION}" \
    --notes "$RELEASE_NOTES"

echo ""
echo -e "${GREEN}Release ${TAG} created successfully!${NC}"
echo ""
echo "View at:"
gh release view "$TAG" --json url -q .url 2>/dev/null || echo "  https://github.com/michelabboud/claude-code-helper/releases/tag/${TAG}"
