#!/usr/bin/env bash
# PM Dashboard - Terminal UI
# Renders project health scores, tasks, risks in the terminal
# Reads from .claude/pm-dashboard.json in the current project

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Multi-project mode: pm-tui.sh --multi file1.json file2.json ...
if [ "${1:-}" = "--multi" ]; then
    shift
    if [ $# -eq 0 ]; then
        echo -e "${RED}Usage: pm-tui.sh --multi project1.json project2.json ...${NC}"
        exit 1
    fi

    echo ""
    echo -e "${BOLD}${BLUE}======================================================${NC}"
    echo -e "${BOLD}${WHITE}      MULTI-PROJECT HEALTH OVERVIEW${NC}"
    echo -e "${BOLD}${BLUE}======================================================${NC}"
    printf "  ${BOLD}%-28s %6s  %s${NC}\n" "Project" "Score" "Status"
    echo -e "${BLUE}------------------------------------------------------${NC}"

    for f in "$@"; do
        if [ ! -f "$f" ]; then
            printf "  %-28s ${DIM}%6s  %s${NC}\n" "$(basename "$(dirname "$(dirname "$f")")")" "--" "File not found"
            continue
        fi
        pname=$(jq -r '.projectName // "Unknown"' "$f")
        pscore=$(jq -r '.overallScore // "null"' "$f")
        passessed=$(jq -r '.lastAssessment // "Never"' "$f")
        task_count=$(jq '.tasks | length' "$f")
        risk_count=$(jq '[.risks[] | select(.severity == "critical" or .severity == "high")] | length' "$f")

        if [ "$pscore" = "null" ]; then
            color="${DIM}"
            label="Not Assessed"
        elif [ "$(echo "$pscore" | cut -d. -f1)" -ge 7 ]; then
            color="${GREEN}"
            label="Healthy"
        elif [ "$(echo "$pscore" | cut -d. -f1)" -ge 5 ]; then
            color="${YELLOW}"
            label="Fair"
        elif [ "$(echo "$pscore" | cut -d. -f1)" -ge 3 ]; then
            color="${RED}"
            label="Needs Work"
        else
            color="${RED}${BOLD}"
            label="CRITICAL"
        fi

        printf "  %-28s ${color}%4s/10${NC}  ${color}%-12s${NC} ${DIM}%d tasks, %d risks${NC}\n" \
            "$pname" "$pscore" "$label" "$task_count" "$risk_count"
    done

    echo -e "${BOLD}${BLUE}======================================================${NC}"

    # Show cross-project critical risks
    echo ""
    echo -e "  ${BOLD}${RED}CROSS-PROJECT CRITICAL RISKS${NC}"
    echo -e "${BLUE}------------------------------------------------------${NC}"
    has_risks=false
    for f in "$@"; do
        [ ! -f "$f" ] && continue
        pname=$(jq -r '.projectName // "Unknown"' "$f")
        jq -r --arg pn "$pname" '.risks[] | select(.severity == "critical") | "\($pn)|\(.description)|\(.expert)"' "$f" 2>/dev/null | while IFS='|' read -r proj desc expert; do
            has_risks=true
            printf "  ${RED}${BOLD}CRIT${NC} ${WHITE}%-20s${NC} %s ${DIM}[%s]${NC}\n" "$proj" "$desc" "$expert"
        done
    done
    if [ "$has_risks" = false ]; then
        echo -e "  ${GREEN}No critical risks across projects${NC}"
    fi

    # Show lowest-scoring domains across all projects
    echo ""
    echo -e "  ${BOLD}${YELLOW}LOWEST SCORES ACROSS PORTFOLIO${NC}"
    echo -e "${BLUE}------------------------------------------------------${NC}"
    for f in "$@"; do
        [ ! -f "$f" ] && continue
        pname=$(jq -r '.projectName // "Unknown"' "$f")
        jq -r --arg pn "$pname" '.experts | to_entries[] | select(.value.score != null and .value.score <= 4) | "\($pn)|\(.key)|\(.value.score)"' "$f" 2>/dev/null | while IFS='|' read -r proj domain score; do
            printf "  ${RED}%s/10${NC}  %-20s  %s\n" "$score" "$proj" "$domain"
        done
    done

    echo ""
    echo -e "${BOLD}${BLUE}======================================================${NC}"
    echo ""
    exit 0
fi

# Single-project mode
DATA_FILE="${1:-.claude/pm-dashboard.json}"

if [ ! -f "$DATA_FILE" ]; then
    echo -e "${RED}No dashboard data found at: ${DATA_FILE}${NC}"
    echo -e "${DIM}Run a project assessment with the project-manager agent first.${NC}"
    echo ""
    echo -e "  ${CYAN}claude --agent project-manager${NC}"
    echo -e "  ${DIM}Then ask: \"Assess this project and tell me what to do next\"${NC}"
    exit 1
fi

# Check for jq
if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq is required but not installed.${NC}"
    echo -e "  ${DIM}Install: sudo apt install jq (Linux) or brew install jq (macOS)${NC}"
    exit 1
fi

# Read data
PROJECT=$(jq -r '.projectName // "Unknown Project"' "$DATA_FILE")
LAST_ASSESSMENT=$(jq -r '.lastAssessment // "Never"' "$DATA_FILE")
ASSESSMENT_COUNT=$(jq -r '.assessmentCount // 0' "$DATA_FILE")
OVERALL=$(jq -r '.overallScore // 0' "$DATA_FILE")

# Score to color
score_color() {
    local score=$1
    if [ "$score" = "null" ] || [ -z "$score" ]; then
        echo -e "${DIM}"
    elif [ "$score" -ge 9 ]; then
        echo -e "${GREEN}"
    elif [ "$score" -ge 7 ]; then
        echo -e "${GREEN}"
    elif [ "$score" -ge 5 ]; then
        echo -e "${YELLOW}"
    elif [ "$score" -ge 3 ]; then
        echo -e "${RED}"
    else
        echo -e "${RED}${BOLD}"
    fi
}

# Score to bar
score_bar() {
    local score=$1
    if [ "$score" = "null" ] || [ -z "$score" ]; then
        echo "    --    "
        return
    fi
    local filled=$score
    local empty=$((10 - filled))
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="="; done
    for ((i=0; i<empty; i++)); do bar+=" "; done
    echo "$bar"
}

# Score to label
score_label() {
    local score=$1
    if [ "$score" = "null" ] || [ -z "$score" ]; then
        echo "Not Assessed"
    elif [ "$score" -ge 9 ]; then
        echo "Excellent"
    elif [ "$score" -ge 7 ]; then
        echo "Good"
    elif [ "$score" -ge 5 ]; then
        echo "Fair"
    elif [ "$score" -ge 3 ]; then
        echo "Poor"
    else
        echo "CRITICAL"
    fi
}

# Overall score color
overall_color() {
    local score=$(echo "$1" | cut -d. -f1)
    score_color "$score"
}

# Header
echo ""
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo -e "${BOLD}${WHITE}         PROJECT HEALTH DASHBOARD${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo -e "  ${DIM}Project:${NC}     ${WHITE}${PROJECT}${NC}"
echo -e "  ${DIM}Last Check:${NC}  ${LAST_ASSESSMENT}"
echo -e "  ${DIM}Assessments:${NC} ${ASSESSMENT_COUNT}"
echo -e "${BLUE}------------------------------------------------------${NC}"

# Expert scores
EXPERTS=("qa:QA & Testing" "uiux:UI/UX Design" "security:Security" "devops:DevOps & IT" "networking:Networking" "development:Development" "architecture:Architecture" "product:Product/Specs" "api:API Quality" "monitoring:Monitoring" "database:Database" "performance:Performance" "documentation:Documentation" "specifications:Specifications" "projectDocs:Project Docs" "progress:Progress")

printf "  ${BOLD}%-24s %5s  %-12s %s${NC}\n" "Expert Domain" "Score" "Bar" "Status"
echo -e "${BLUE}------------------------------------------------------${NC}"

for entry in "${EXPERTS[@]}"; do
    key="${entry%%:*}"
    label="${entry#*:}"
    score=$(jq -r ".experts.${key}.score // \"null\"" "$DATA_FILE")
    color=$(score_color "$score")
    bar=$(score_bar "$score")
    status=$(score_label "$score")

    if [ "$score" = "null" ]; then
        printf "  %-24s ${DIM}%4s${NC}  ${DIM}[%s]${NC} ${DIM}%s${NC}\n" "$label" "--" "$bar" "$status"
    else
        printf "  %-24s ${color}%4s/10${NC}  ${color}[%s]${NC} ${color}%s${NC}\n" "$label" "$score" "$bar" "$status"
    fi
done

echo -e "${BLUE}------------------------------------------------------${NC}"
OC=$(overall_color "$OVERALL")
printf "  ${BOLD}%-24s ${OC}%4s/10${NC}${BOLD}  OVERALL HEALTH${NC}\n" "" "$OVERALL"
echo -e "${BOLD}${BLUE}======================================================${NC}"

# Tasks
TASK_COUNT=$(jq '.tasks | length' "$DATA_FILE")
if [ "$TASK_COUNT" -gt 0 ]; then
    echo ""
    echo -e "  ${BOLD}${WHITE}PRIORITIZED TASKS${NC}"
    echo -e "${BLUE}------------------------------------------------------${NC}"

    jq -r '.tasks | sort_by(.priority) | .[] | "\(.priority)|\(.status)|\(.title)|\(.impact)|\(.effort)|\(.quadrant)"' "$DATA_FILE" | while IFS='|' read -r priority status title impact effort quadrant; do
        case "$status" in
            done|completed)
                icon="${GREEN}[x]${NC}" ;;
            in-progress|in_progress)
                icon="${CYAN}[>]${NC}" ;;
            *)
                icon="${DIM}[ ]${NC}" ;;
        esac

        case "$quadrant" in
            quick-win)
                qtag="${GREEN}QW${NC}" ;;
            major-project)
                qtag="${YELLOW}MP${NC}" ;;
            fill-in)
                qtag="${DIM}FI${NC}" ;;
            reconsider)
                qtag="${DIM}RC${NC}" ;;
            *)
                qtag="${DIM}--${NC}" ;;
        esac

        printf "  %b #%-2s %b %-36s ${DIM}[%b]${NC}\n" "$icon" "$priority" "" "$title" "$qtag"
    done
    echo ""
    echo -e "  ${DIM}QW=Quick Win  MP=Major Project  FI=Fill-in  RC=Reconsider${NC}"
fi

# Risks
RISK_COUNT=$(jq '.risks | length' "$DATA_FILE")
if [ "$RISK_COUNT" -gt 0 ]; then
    echo ""
    echo -e "  ${BOLD}${RED}RISK ALERTS${NC}"
    echo -e "${BLUE}------------------------------------------------------${NC}"

    jq -r '.risks[] | "\(.severity)|\(.likelihood)|\(.description)|\(.expert)"' "$DATA_FILE" | while IFS='|' read -r severity likelihood desc expert; do
        case "$severity" in
            critical)
                sev_color="${RED}${BOLD}" ;;
            high)
                sev_color="${RED}" ;;
            medium)
                sev_color="${YELLOW}" ;;
            *)
                sev_color="${DIM}" ;;
        esac
        printf "  %b%-8s${NC} ${DIM}(%s)${NC} %s ${DIM}[%s]${NC}\n" "$sev_color" "$severity" "$likelihood" "$desc" "$expert"
    done
fi

# Technical Debt summary
DEBT_COUNT=$(jq '.technicalDebt | length' "$DATA_FILE")
if [ "$DEBT_COUNT" -gt 0 ]; then
    ACCRUING=$(jq '[.technicalDebt[] | select(.interestRate == "accruing")] | length' "$DATA_FILE")
    echo ""
    echo -e "  ${BOLD}${YELLOW}TECHNICAL DEBT${NC}  ${DIM}(${DEBT_COUNT} items, ${ACCRUING} accruing)${NC}"
    echo -e "${BLUE}------------------------------------------------------${NC}"

    jq -r '.technicalDebt[] | "\(.interestRate)|\(.impact)|\(.item)|\(.category)"' "$DATA_FILE" | while IFS='|' read -r rate impact item category; do
        case "$rate" in
            accruing)
                rate_icon="${RED}^${NC}" ;;
            stable)
                rate_icon="${YELLOW}-${NC}" ;;
            declining)
                rate_icon="${GREEN}v${NC}" ;;
            *)
                rate_icon="${DIM}?${NC}" ;;
        esac
        printf "  %b %s ${DIM}(%s, %s)${NC}\n" "$rate_icon" "$item" "$category" "$impact"
    done
fi

echo ""
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo -e "  ${DIM}Run: pm-tui.sh .claude/pm-dashboard.json${NC}"
echo -e "  ${DIM}Web: open .claude/pm-dashboard.html${NC}"
echo -e "${BOLD}${BLUE}======================================================${NC}"
echo ""
