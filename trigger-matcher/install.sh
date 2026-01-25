#!/bin/bash
# Install Claude Code Trigger Matcher

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"
HOOKS_DIR="${CLAUDE_DIR}/hooks"

echo "📦 Installing Claude Code Trigger Matcher..."

# Create directories
mkdir -p "${HOOKS_DIR}"

# Build the library
echo "🔨 Building trigger-matcher library..."
cd "${SCRIPT_DIR}"
npm install
npm run build

# Copy hook files
echo "📋 Installing hook files..."
cp "${SCRIPT_DIR}/../hooks/file-trigger-hook.json" "${HOOKS_DIR}/"
cp "${SCRIPT_DIR}/../hooks/file-trigger-matcher.js" "${HOOKS_DIR}/"
chmod +x "${HOOKS_DIR}/file-trigger-matcher.js"

# Install minimatch in hooks directory for the standalone script
echo "📦 Installing hook dependencies..."
cd "${HOOKS_DIR}"
if [ ! -f "package.json" ]; then
  npm init -y > /dev/null 2>&1
fi
npm install minimatch --save > /dev/null 2>&1

echo ""
echo "✅ Installation complete!"
echo ""
echo "📁 Installed files:"
echo "   ${HOOKS_DIR}/file-trigger-hook.json"
echo "   ${HOOKS_DIR}/file-trigger-matcher.js"
echo ""
echo "📝 To enable file triggers, add to your settings.json:"
echo ""
echo '   "hooks": {'
echo '     "file": "'${HOOKS_DIR}/file-trigger-hook.json'"'
echo '   }'
echo ""
echo "Or merge the hook configuration manually."
