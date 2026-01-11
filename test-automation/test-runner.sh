#!/bin/bash
#
# Test Runner for Claude Code Helper
#
# Executes test cases via Claude Code CLI and captures results
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="${SCRIPT_DIR}/tests"
RESULTS_DIR="${SCRIPT_DIR}/results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="${RESULTS_DIR}/test-results-${TIMESTAMP}.json"
LOG_FILE="${RESULTS_DIR}/test-run-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Initialize results JSON
echo '{' > "${RESULTS_FILE}"
echo '  "timestamp": "'$(date -Iseconds)'",' >> "${RESULTS_FILE}"
echo '  "test_run_id": "'${TIMESTAMP}'",' >> "${RESULTS_FILE}"
echo '  "tests": [' >> "${RESULTS_FILE}"

#
# Functions
#

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $*" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${RED}✗${NC} $*" | tee -a "${LOG_FILE}"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*" | tee -a "${LOG_FILE}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if claude CLI is available
    if ! command -v claude &> /dev/null; then
        log_error "Claude Code CLI not found. Please install it first."
        exit 1
    fi

    # Check Claude Code version
    CLAUDE_VERSION=$(claude --version 2>&1 || echo "unknown")
    log_info "Claude Code version: ${CLAUDE_VERSION}"

    # Check if test cases file exists
    if [ ! -f "${TESTS_DIR}/test-cases.json" ]; then
        log_error "Test cases file not found: ${TESTS_DIR}/test-cases.json"
        log_info "Run: python test-parser.py ../TESTING-GUIDE.md"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Run a single test
run_test() {
    local test_id="$1"
    local test_type="$2"
    local test_name="$3"
    local test_prompt="$4"
    local automated="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log_info "Running test ${TOTAL_TESTS}: ${test_name} (${test_type})"

    # Skip non-automated tests
    if [ "${automated}" != "true" ]; then
        log_warning "Test ${test_name} requires manual validation - SKIPPED"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        echo "    {" >> "${RESULTS_FILE}"
        echo "      \"id\": \"${test_id}\"," >> "${RESULTS_FILE}"
        echo "      \"name\": \"${test_name}\"," >> "${RESULTS_FILE}"
        echo "      \"type\": \"${test_type}\"," >> "${RESULTS_FILE}"
        echo "      \"status\": \"skipped\"," >> "${RESULTS_FILE}"
        echo "      \"reason\": \"Requires manual validation\"," >> "${RESULTS_FILE}"
        echo "      \"timestamp\": \"$(date -Iseconds)\"" >> "${RESULTS_FILE}"
        echo "    }," >> "${RESULTS_FILE}"
        return
    fi

    # Create temporary file for test prompt
    local prompt_file=$(mktemp)
    echo "${test_prompt}" > "${prompt_file}"

    # Run test via Claude Code CLI with timeout
    local output_file=$(mktemp)
    local start_time=$(date +%s)
    local status="unknown"
    local error_message=""

    # Execute test with timeout (120 seconds)
    if timeout 120s claude < "${prompt_file}" > "${output_file}" 2>&1; then
        status="passed"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        log_success "Test ${test_name} PASSED"
    else
        local exit_code=$?
        if [ ${exit_code} -eq 124 ]; then
            status="timeout"
            error_message="Test timed out after 120 seconds"
            log_error "Test ${test_name} TIMEOUT"
        else
            status="failed"
            error_message="Claude Code CLI exited with code ${exit_code}"
            log_error "Test ${test_name} FAILED (exit code: ${exit_code})"
        fi
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Capture output (first 1000 chars)
    local output=$(head -c 1000 "${output_file}" | sed 's/"/\\"/g' | tr '\n' ' ')

    # Write test result to JSON
    echo "    {" >> "${RESULTS_FILE}"
    echo "      \"id\": \"${test_id}\"," >> "${RESULTS_FILE}"
    echo "      \"name\": \"${test_name}\"," >> "${RESULTS_FILE}"
    echo "      \"type\": \"${test_type}\"," >> "${RESULTS_FILE}"
    echo "      \"status\": \"${status}\"," >> "${RESULTS_FILE}"
    echo "      \"duration_seconds\": ${duration}," >> "${RESULTS_FILE}"
    echo "      \"timestamp\": \"$(date -Iseconds)\"," >> "${RESULTS_FILE}"
    if [ -n "${error_message}" ]; then
        echo "      \"error\": \"${error_message}\"," >> "${RESULTS_FILE}"
    fi
    echo "      \"output_preview\": \"${output}\"" >> "${RESULTS_FILE}"
    echo "    }," >> "${RESULTS_FILE}"

    # Cleanup
    rm -f "${prompt_file}" "${output_file}"
}

# Main test execution
run_all_tests() {
    log_info "Starting test execution..."
    log_info "Test cases file: ${TESTS_DIR}/test-cases.json"

    # Read and parse test cases
    # Note: This is a simplified version. For production, use jq or Python
    local test_count=$(jq length "${TESTS_DIR}/test-cases.json")
    log_info "Found ${test_count} test cases"

    # Run each test
    local index=0
    while [ ${index} -lt ${test_count} ]; do
        local test=$(jq -r ".[$index]" "${TESTS_DIR}/test-cases.json")
        local test_id=$(echo "$test" | jq -r '.id')
        local test_type=$(echo "$test" | jq -r '.type')
        local test_name=$(echo "$test" | jq -r '.name')
        local test_prompt=$(echo "$test" | jq -r '.prompt')
        local automated=$(echo "$test" | jq -r '.automated')

        run_test "${test_id}" "${test_type}" "${test_name}" "${test_prompt}" "${automated}"

        index=$((index + 1))
    done
}

# Finalize results JSON
finalize_results() {
    # Remove trailing comma from last test
    sed -i '$ s/,$//' "${RESULTS_FILE}"

    # Close tests array and add summary
    cat >> "${RESULTS_FILE}" << EOF
  ],
  "summary": {
    "total": ${TOTAL_TESTS},
    "passed": ${PASSED_TESTS},
    "failed": ${FAILED_TESTS},
    "skipped": ${SKIPPED_TESTS},
    "pass_rate": $(echo "scale=2; ${PASSED_TESTS} * 100 / ${TOTAL_TESTS}" | bc)
  }
}
EOF

    log_info "Results saved to: ${RESULTS_FILE}"
}

# Print summary
print_summary() {
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "           TEST EXECUTION SUMMARY"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "  Total Tests:   ${TOTAL_TESTS}"
    echo -e "  ${GREEN}Passed:${NC}        ${PASSED_TESTS}"
    echo -e "  ${RED}Failed:${NC}        ${FAILED_TESTS}"
    echo -e "  ${YELLOW}Skipped:${NC}       ${SKIPPED_TESTS}"
    echo ""
    local pass_rate=$(echo "scale=2; ${PASSED_TESTS} * 100 / ${TOTAL_TESTS}" | bc)
    echo "  Pass Rate:     ${pass_rate}%"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Results: ${RESULTS_FILE}"
    echo "Log:     ${LOG_FILE}"
    echo ""
}

#
# Main execution
#

main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║     Claude Code Helper - Automated Test Runner       ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""

    check_prerequisites
    run_all_tests
    finalize_results
    print_summary

    # Exit with failure if any tests failed
    if [ ${FAILED_TESTS} -gt 0 ]; then
        exit 1
    fi
}

# Handle script arguments
if [ $# -gt 0 ]; then
    case "$1" in
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --help, -h     Show this help message"
            echo "  --version      Show version information"
            echo ""
            echo "Environment Variables:"
            echo "  TEST_FILTER    Filter tests by name pattern"
            echo "  TEST_TIMEOUT   Timeout per test in seconds (default: 60)"
            echo ""
            exit 0
            ;;
        --version)
            echo "Test Runner v1.0.0"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
fi

main "$@"
