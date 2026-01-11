#!/bin/bash
#
# Complete Test Automation Orchestration Script
#
# This script runs the complete test automation pipeline:
# 1. Parse test cases from TESTING-GUIDE.md
# 2. Execute all tests via Claude Code CLI
# 3. Generate comprehensive HTML and Markdown reports
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TESTING_GUIDE="${REPO_ROOT}/TESTING-GUIDE.md"
TEST_CASES_FILE="${SCRIPT_DIR}/tests/test-cases.json"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_DIR="${SCRIPT_DIR}/results"
REPORTS_DIR="${SCRIPT_DIR}/reports"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

#
# Functions
#

print_header() {
    echo ""
    echo -e "${PURPLE}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║                                                               ║${NC}"
    echo -e "${PURPLE}║${NC}     ${CYAN}Claude Code Helper - Test Automation Suite${NC}          ${PURPLE}║${NC}"
    echo -e "${PURPLE}║                                                               ║${NC}"
    echo -e "${PURPLE}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "\n${BLUE}▶${NC} ${CYAN}$1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking Prerequisites"

    local all_good=true

    # Check Python
    if command -v python3 &> /dev/null; then
        print_success "Python 3 found: $(python3 --version)"
    else
        print_error "Python 3 not found"
        all_good=false
    fi

    # Check Claude Code CLI
    if command -v claude &> /dev/null; then
        print_success "Claude Code CLI found"
    else
        print_error "Claude Code CLI not found"
        all_good=false
    fi

    # Check jq
    if command -v jq &> /dev/null; then
        print_success "jq found"
    else
        print_error "jq not found (required for JSON processing)"
        all_good=false
    fi

    # Check bc
    if command -v bc &> /dev/null; then
        print_success "bc found"
    else
        print_warning "bc not found (optional, for calculations)"
    fi

    # Check testing guide
    if [ -f "${TESTING_GUIDE}" ]; then
        print_success "Testing guide found: ${TESTING_GUIDE}"
    else
        print_error "Testing guide not found: ${TESTING_GUIDE}"
        all_good=false
    fi

    if [ "${all_good}" = false ]; then
        echo ""
        print_error "Prerequisites check failed. Please install missing dependencies."
        exit 1
    fi

    print_success "All prerequisites met"
}

# Step 1: Parse test cases
parse_test_cases() {
    print_step "Step 1: Parsing Test Cases from TESTING-GUIDE.md"

    python3 "${SCRIPT_DIR}/test-parser.py" "${TESTING_GUIDE}" "${TEST_CASES_FILE}"

    if [ $? -eq 0 ]; then
        local test_count=$(jq 'length' "${TEST_CASES_FILE}")
        print_success "Parsed ${test_count} test cases"
    else
        print_error "Test parsing failed"
        exit 1
    fi
}

# Step 2: Run tests
run_tests() {
    print_step "Step 2: Executing Tests via Claude Code CLI"

    chmod +x "${SCRIPT_DIR}/test-runner.sh"

    if bash "${SCRIPT_DIR}/test-runner.sh"; then
        print_success "Test execution completed"
    else
        print_warning "Some tests failed (expected for validation)"
    fi

    # Find the most recent results file
    LATEST_RESULTS=$(ls -t "${RESULTS_DIR}"/test-results-*.json 2>/dev/null | head -1)

    if [ -z "${LATEST_RESULTS}" ]; then
        print_error "No test results found"
        exit 1
    fi

    print_success "Results saved: ${LATEST_RESULTS}"
}

# Step 3: Generate reports
generate_reports() {
    print_step "Step 3: Generating Comprehensive Reports"

    mkdir -p "${REPORTS_DIR}"

    local html_report="${REPORTS_DIR}/test-report-${TIMESTAMP}.html"
    local md_report="${REPORTS_DIR}/test-report-${TIMESTAMP}.md"

    python3 "${SCRIPT_DIR}/report-generator.py" "${LATEST_RESULTS}" \
        --html "${html_report}" \
        --md "${md_report}"

    if [ $? -eq 0 ]; then
        print_success "HTML report: ${html_report}"
        print_success "Markdown report: ${md_report}"

        # Create latest symlinks
        ln -sf "$(basename ${html_report})" "${REPORTS_DIR}/latest.html"
        ln -sf "$(basename ${md_report})" "${REPORTS_DIR}/latest.md"

        print_success "Latest reports: ${REPORTS_DIR}/latest.{html,md}"
    else
        print_error "Report generation failed"
        exit 1
    fi
}

# Print final summary
print_final_summary() {
    print_step "Test Automation Complete"

    # Extract summary from results
    local total=$(jq -r '.summary.total' "${LATEST_RESULTS}")
    local passed=$(jq -r '.summary.passed' "${LATEST_RESULTS}")
    local failed=$(jq -r '.summary.failed' "${LATEST_RESULTS}")
    local skipped=$(jq -r '.summary.skipped' "${LATEST_RESULTS}")
    local pass_rate=$(jq -r '.summary.pass_rate' "${LATEST_RESULTS}")

    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo -e "                   ${PURPLE}FINAL RESULTS${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  Total Tests:     ${total}"
    echo -e "  ${GREEN}Passed:${NC}          ${passed}"
    echo -e "  ${RED}Failed:${NC}          ${failed}"
    echo -e "  ${YELLOW}Skipped:${NC}         ${skipped}"
    echo ""
    echo -e "  Pass Rate:       ${pass_rate}%"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════${NC}"
    echo ""

    # Determine status
    if (( $(echo "${pass_rate} >= 95" | bc -l) )); then
        echo -e "${GREEN}✓${NC} ${GREEN}EXCELLENT!${NC} All tests passing."
    elif (( $(echo "${pass_rate} >= 80" | bc -l) )); then
        echo -e "${YELLOW}⚠${NC} ${YELLOW}GOOD${NC} but some attention needed."
    else
        echo -e "${RED}✗${NC} ${RED}NEEDS ATTENTION${NC} - Low pass rate."
    fi

    echo ""
    echo -e "📊 View detailed HTML report:"
    echo -e "   ${CYAN}${REPORTS_DIR}/latest.html${NC}"
    echo ""
    echo -e "📝 View markdown report:"
    echo -e "   ${CYAN}${REPORTS_DIR}/latest.md${NC}"
    echo ""

    # Open HTML report (if supported)
    if command -v xdg-open &> /dev/null; then
        echo -e "Opening HTML report in browser..."
        xdg-open "${REPORTS_DIR}/latest.html" 2>/dev/null &
    elif command -v open &> /dev/null; then
        echo -e "Opening HTML report in browser..."
        open "${REPORTS_DIR}/latest.html" 2>/dev/null &
    fi
}

# Clean old results (keep last 10)
cleanup_old_results() {
    print_step "Cleaning Up Old Results"

    # Keep last 10 result files
    ls -t "${RESULTS_DIR}"/test-results-*.json 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    # Keep last 10 log files
    ls -t "${RESULTS_DIR}"/test-run-*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    # Keep last 10 HTML reports
    ls -t "${REPORTS_DIR}"/test-report-*.html 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    # Keep last 10 MD reports
    ls -t "${REPORTS_DIR}"/test-report-*.md 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    print_success "Cleanup complete (kept last 10 runs)"
}

# Handle errors
handle_error() {
    print_error "An error occurred during test execution"
    echo "Check the log file for details: ${RESULTS_DIR}/test-run-${TIMESTAMP}.log"
    exit 1
}

trap handle_error ERR

#
# Main execution
#

main() {
    print_header

    local start_time=$(date +%s)

    check_prerequisites
    parse_test_cases
    run_tests
    generate_reports
    cleanup_old_results
    print_final_summary

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    echo -e "${CYAN}Total execution time: ${duration}s${NC}\n"
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Automated test suite for Claude Code Helper"
        echo ""
        echo "Options:"
        echo "  --help, -h         Show this help message"
        echo "  --parse-only       Only parse test cases, don't run tests"
        echo "  --run-only         Only run tests (skip parsing)"
        echo "  --report-only      Only generate reports from latest results"
        echo ""
        echo "The script will:"
        echo "  1. Parse test cases from TESTING-GUIDE.md"
        echo "  2. Execute tests via Claude Code CLI"
        echo "  3. Generate comprehensive HTML and Markdown reports"
        echo ""
        exit 0
        ;;
    --parse-only)
        print_header
        check_prerequisites
        parse_test_cases
        exit 0
        ;;
    --run-only)
        print_header
        check_prerequisites
        run_tests
        exit 0
        ;;
    --report-only)
        print_header
        LATEST_RESULTS=$(ls -t "${RESULTS_DIR}"/test-results-*.json 2>/dev/null | head -1)
        if [ -z "${LATEST_RESULTS}" ]; then
            print_error "No test results found"
            exit 1
        fi
        generate_reports
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Run '$0 --help' for usage information"
        exit 1
        ;;
esac
