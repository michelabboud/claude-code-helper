#!/bin/bash
# Advanced Sub-Agents Installation Script
# Installs all agents to ~/.claude/agents/
#
# ─────────────────────────────────────────────────────────────────────────────
# Credits:
#   Author: Michel Abboud (https://github.com/michelabboud)
#   AI Assistance: Created with the help of Claude Code (Anthropic)
#   License: MIT - Free to use for personal and commercial projects
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_AGENTS_DIR="$HOME/.claude/agents"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Advanced Sub-Agents Installation${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Check if Claude Code is installed
if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude Code not found!${NC}"
    echo "Please install Claude Code first: https://code.claude.com"
    exit 1
fi

echo -e "${GREEN}✓ Claude Code found${NC}"
echo

# Create agents directory if it doesn't exist
if [ ! -d "$CLAUDE_AGENTS_DIR" ]; then
    echo -e "${YELLOW}Creating agents directory...${NC}"
    mkdir -p "$CLAUDE_AGENTS_DIR"
    echo -e "${GREEN}✓ Directory created: $CLAUDE_AGENTS_DIR${NC}"
else
    echo -e "${GREEN}✓ Agents directory exists${NC}"
fi

# Backup existing agents
if [ "$(ls -A $CLAUDE_AGENTS_DIR)" ]; then
    BACKUP_DIR="$HOME/.claude/agents-backup-$(date +%Y%m%d-%H%M%S)"
    echo -e "${YELLOW}Backing up existing agents to: $BACKUP_DIR${NC}"
    mkdir -p "$BACKUP_DIR"
    cp -r "$CLAUDE_AGENTS_DIR"/* "$BACKUP_DIR"
    echo -e "${GREEN}✓ Backup complete${NC}"
fi

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Select installation mode:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1) Install all agents (recommended)"
echo "2) Install core agents only (essential)"
echo "3) Install custom agents only (tailored for you)"
echo "4) Custom selection"
echo "5) Exit"
echo

read -p "Enter your choice (1-5): " choice

install_agent() {
    local agent_file=$1
    local agent_name=$2
    
    if [ -f "$SCRIPT_DIR/$agent_file" ]; then
        cp "$SCRIPT_DIR/$agent_file" "$CLAUDE_AGENTS_DIR/"
        echo -e "${GREEN}✓${NC} Installed: $agent_name"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} Not found: $agent_name (skipping)"
        return 1
    fi
}

case $choice in
    1)
        echo
        echo "Installing all agents..."
        echo
        
        # Core development agents
        install_agent "examples/android-dev.md" "Android Developer"
        install_agent "examples/database-expert.md" "Database Expert"
        install_agent "examples/api-expert.md" "API Expert"
        install_agent "examples/css-tailwind-expert.md" "CSS/Tailwind Expert"
        install_agent "examples/git-expert.md" "Git Expert"
        install_agent "examples/performance-optimizer.md" "Performance Optimizer"
        
        # Custom agents
        install_agent "custom/michel-custom-agents.md" "Custom Agents Collection"
        
        echo
        echo -e "${GREEN}✓ All agents installed successfully!${NC}"
        ;;
        
    2)
        echo
        echo "Installing core agents..."
        echo
        
        install_agent "examples/database-expert.md" "Database Expert"
        install_agent "examples/api-expert.md" "API Expert"
        install_agent "examples/git-expert.md" "Git Expert"
        
        echo
        echo -e "${GREEN}✓ Core agents installed successfully!${NC}"
        ;;
        
    3)
        echo
        echo "Installing custom agents..."
        echo
        
        install_agent "examples/android-dev.md" "Android Developer"
        install_agent "examples/css-tailwind-expert.md" "CSS/Tailwind Expert"
        install_agent "custom/michel-custom-agents.md" "Custom Agents Collection"
        
        echo
        echo -e "${GREEN}✓ Custom agents installed successfully!${NC}"
        ;;
        
    4)
        echo
        echo "Select agents to install (space-separated numbers):"
        echo "1) Android Developer"
        echo "2) Database Expert"
        echo "3) API Expert"
        echo "4) CSS/Tailwind Expert"
        echo "5) Git Expert"
        echo "6) Performance Optimizer"
        echo "7) Custom Agents Collection"
        echo
        
        read -p "Enter numbers (e.g., 1 2 4): " -a selections
        
        echo
        for num in "${selections[@]}"; do
            case $num in
                1) install_agent "examples/android-dev.md" "Android Developer" ;;
                2) install_agent "examples/database-expert.md" "Database Expert" ;;
                3) install_agent "examples/api-expert.md" "API Expert" ;;
                4) install_agent "examples/css-tailwind-expert.md" "CSS/Tailwind Expert" ;;
                5) install_agent "examples/git-expert.md" "Git Expert" ;;
                6) install_agent "examples/performance-optimizer.md" "Performance Optimizer" ;;
                7) install_agent "custom/michel-custom-agents.md" "Custom Agents Collection" ;;
                *) echo -e "${RED}Invalid selection: $num${NC}" ;;
            esac
        done
        
        echo
        echo -e "${GREEN}✓ Selected agents installed successfully!${NC}"
        ;;
        
    5)
        echo "Installation cancelled."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Installation Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Agents directory: ${BLUE}$CLAUDE_AGENTS_DIR${NC}"
echo -e "Installed agents: ${GREEN}$(ls -1 $CLAUDE_AGENTS_DIR | wc -l)${NC}"
echo

# List installed agents
echo "Installed agents:"
ls -1 "$CLAUDE_AGENTS_DIR" | sed 's/^/  • /'

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next Steps"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Restart Claude Code:"
echo -e "   ${BLUE}claude${NC}"
echo
echo "2. Verify agents are loaded:"
echo -e "   ${BLUE}/agents${NC}"
echo
echo "3. Try using an agent:"
echo -e "   ${BLUE}> Use the database-expert to optimize this query${NC}"
echo
echo "4. Read the documentation:"
echo -e "   ${BLUE}cat $(dirname $SCRIPT_DIR)/README.md${NC}"
echo
echo -e "${GREEN}Happy coding with sub-agents! 🚀${NC}"
