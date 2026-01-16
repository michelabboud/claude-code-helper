#!/bin/bash
# Quick Repository Validation Script

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     Claude Code Helper - Repository Validation Report         ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "Date: $(date)"
echo ""

PASS=0
FAIL=0
WARN=0

echo "📁 Directory Structure"
echo "─────────────────────────────────────────"

check_dir() {
    if [ -d "$1" ]; then
        echo "✅ $1"
        PASS=$((PASS + 1))
    else
        echo "❌ $1 missing"
        FAIL=$((FAIL + 1))
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo "✅ $1"
        PASS=$((PASS + 1))
    else
        echo "❌ $1 missing"
        FAIL=$((FAIL + 1))
    fi
}

check_dir "agents"
check_dir "agents/domain-experts"
check_dir "agents/mcp-integrated"
check_dir "skills"
check_dir "commands"
check_dir "hooks"
check_dir "plugins"
check_dir "mcp-servers"
check_dir "docs"
check_dir "guides"

echo ""
echo "📄 Key Files"
echo "─────────────────────────────────────────"
check_file "README.md"
check_file "CLAUDE.md"
check_file "QUICKSTART.md"
check_file "CHANGELOG.md"
check_file "TOOLS-INDEX.md"
check_file "TESTING-GUIDE.md"
check_file ".gitignore"

echo ""
echo "👥 Agents"
echo "─────────────────────────────────────────"
DOMAIN_COUNT=$(find agents/domain-experts -name "*.md" 2>/dev/null | grep -v README | wc -l)
MCP_COUNT=$(find agents/mcp-integrated -name "*.json" 2>/dev/null | wc -l)
echo "   Domain experts: $DOMAIN_COUNT"
echo "   MCP-integrated: $MCP_COUNT"
if [ "$DOMAIN_COUNT" -ge 30 ]; then
    echo "✅ Domain experts ($DOMAIN_COUNT >= 30)"
    PASS=$((PASS + 1))
else
    echo "⚠️  Domain experts ($DOMAIN_COUNT < 30)"
    WARN=$((WARN + 1))
fi
if [ "$MCP_COUNT" -ge 10 ]; then
    echo "✅ MCP-integrated ($MCP_COUNT >= 10)"
    PASS=$((PASS + 1))
else
    echo "⚠️  MCP-integrated ($MCP_COUNT < 10)"
    WARN=$((WARN + 1))
fi

echo ""
echo "🛠️  Skills"
echo "─────────────────────────────────────────"
SKILLS_COUNT=$(find skills -maxdepth 1 -name "*.md" 2>/dev/null | grep -v README | wc -l)
SKILLS_WITH_AGENT=$(grep -l "^agent:" skills/*.md 2>/dev/null | wc -l)
echo "   Skills: $SKILLS_COUNT"
echo "   With agent: field: $SKILLS_WITH_AGENT"
if [ "$SKILLS_COUNT" -ge 10 ]; then
    echo "✅ Skills count ($SKILLS_COUNT >= 10)"
    PASS=$((PASS + 1))
else
    echo "⚠️  Skills ($SKILLS_COUNT < 10)"
    WARN=$((WARN + 1))
fi

echo ""
echo "🔧 MCP Servers (Production)"
echo "─────────────────────────────────────────"
for server in api-specialist-mcp code-review-mcp design-system-mcp testing-mcp uiux-review-mcp; do
    if [ -f "mcp-servers/$server/build/index.js" ]; then
        echo "✅ $server (built)"
        PASS=$((PASS + 1))
    elif [ -d "mcp-servers/$server" ]; then
        echo "⚠️  $server (not built)"
        WARN=$((WARN + 1))
    else
        echo "❌ $server (missing)"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "🔧 MCP Servers (Experimental)"
echo "─────────────────────────────────────────"
for server in cicd-pipeline database-operations dependency-management n8n-automation rag-mcp; do
    if [ -f "mcp-servers/$server/build/index.js" ]; then
        echo "✅ $server (built)"
        PASS=$((PASS + 1))
    elif [ -d "mcp-servers/$server" ]; then
        echo "⚠️  $server (not built)"
        WARN=$((WARN + 1))
    fi
done

echo ""
echo "📚 Documentation"
echo "─────────────────────────────────────────"
check_dir "docs/reference"
check_dir "docs/releases"
check_dir "docs/mcp-configs"
check_dir "guides/complete-guide"
check_dir "guides/subagents-guide"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo "   ✅ Passed:   $PASS"
echo "   ⚠️  Warnings: $WARN"
echo "   ❌ Failed:   $FAIL"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo "🎉 Repository validation PASSED!"
    exit 0
else
    echo "⚠️  Repository has $FAIL issues"
    exit 1
fi
