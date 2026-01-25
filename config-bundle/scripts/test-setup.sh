#!/bin/bash
# Test Claude Code Configuration
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: Apache-2.0 - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

echo "========================================="
echo "Claude Code Configuration Test"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

# Test function
test_item() {
    local name="$1"
    local command="$2"
    
    echo -n "Testing $name... "
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}"
        ((FAILED++))
    fi
}

# Check Claude Code installation
echo "== Installation Checks =="
test_item "Claude Code binary" "command -v claude"
test_item "Node.js installation" "command -v node"
test_item "npm installation" "command -v npm"
echo ""

# Check directories
echo "== Directory Structure =="
test_item "~/.claude directory" "[ -d ~/.claude ]"
test_item "statuslines directory" "[ -d ~/.claude/statuslines ]"
test_item "commands directory" "[ -d ~/.claude/commands ]"
test_item "skills directory" "[ -d ~/.claude/skills ]"
test_item "agents directory" "[ -d ~/.claude/agents ]"
echo ""

# Check configuration files
echo "== Configuration Files =="
test_item "settings.json" "[ -f ~/.claude/settings.json ]"
test_item "CLAUDE.md" "[ -f ~/.claude/CLAUDE.md ]"
echo ""

# Check status line scripts
echo "== Status Line Scripts =="
test_item "model-display.sh exists" "[ -f ~/.claude/statuslines/model-display.sh ]"
test_item "model-display.sh executable" "[ -x ~/.claude/statuslines/model-display.sh ]"
test_item "detailed-status.sh exists" "[ -f ~/.claude/statuslines/detailed-status.sh ]"
test_item "detailed-status.sh executable" "[ -x ~/.claude/statuslines/detailed-status.sh ]"
echo ""

# Check commands
echo "== Custom Commands =="
test_item "plan.md exists" "[ -f ~/.claude/commands/plan.md ]"
test_item "observability.sh exists" "[ -f ~/.claude/commands/observability.sh ]"
test_item "observability.sh executable" "[ -x ~/.claude/commands/observability.sh ]"
echo ""

# Check skills
echo "== Skills =="
test_item "auto-plan skill exists" "[ -f ~/.claude/skills/auto-plan/SKILL.md ]"
echo ""

# Check agents
echo "== Agents =="
test_item "planner agent exists" "[ -f ~/.claude/agents/planner.json ]"
test_item "implementer agent exists" "[ -f ~/.claude/agents/implementer.json ]"
echo ""

# Check environment
echo "== Environment =="
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "API Key: ${GREEN}✓ SET${NC} (using API billing)"
else
    echo -e "API Key: ${YELLOW}○ NOT SET${NC} (using subscription)"
fi

if [ -n "$ANTHROPIC_MODEL" ]; then
    echo -e "Default Model: ${GREEN}$ANTHROPIC_MODEL${NC}"
else
    echo -e "Default Model: ${YELLOW}○ NOT SET${NC} (will use default)"
fi
echo ""

# Test status line execution
echo "== Status Line Execution =="
if [ -x ~/.claude/statuslines/model-display.sh ]; then
    echo -n "Status line output: "
    ~/.claude/statuslines/model-display.sh
else
    echo -e "${RED}✗ Cannot execute status line script${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
    echo "Your Claude Code configuration is ready to use."
    echo ""
    echo "Try these commands:"
    echo "  claude                  # Start Claude Code"
    echo "  /status                 # Check model and auth"
    echo "  /plan <task>            # Use planning workflow"
    echo "  /observability status   # Check observability settings"
else
    echo -e "${RED}⚠️  Some tests failed${NC}"
    echo ""
    echo "Please check the failed items above."
    echo "You may need to run the installation script:"
    echo "  ./scripts/install-all.sh"
fi
echo ""
