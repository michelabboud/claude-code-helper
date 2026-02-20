#!/bin/bash
# update-component.test.sh
#
# Tests for scripts/update-component.sh
# Uses a minimal inline test framework (no external dependencies).

set -euo pipefail

# ── Test framework ──────────────────────────────────────────────────────────

PASS=0
FAIL=0
ERRORS=()

assert_eq() {
    local actual="$1"
    local expected="$2"
    local label="${3:-assert_eq}"
    if [ "$actual" = "$expected" ]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("FAIL [$label]: expected '$expected', got '$actual'")
        echo "  FAIL [$label]: expected '$expected', got '$actual'" >&2
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local label="${3:-assert_contains}"
    if echo "$haystack" | grep -qF "$needle"; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("FAIL [$label]: '$needle' not found in output")
        echo "  FAIL [$label]: '$needle' not found in output" >&2
        echo "  Actual output: $haystack" >&2
    fi
}

assert_not_zero() {
    local code="$1"
    local label="${2:-assert_not_zero}"
    if [ "$code" -ne 0 ]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("FAIL [$label]: expected non-zero exit code, got $code")
        echo "  FAIL [$label]: expected non-zero exit code, got $code" >&2
    fi
}

run_test() {
    local name="$1"
    echo "  running: $name"
}

# ── Paths ───────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/update-component.sh"

echo ""
echo "=== update-component.sh tests ==="
echo ""

# ── Test: no argument → exit 1 ──────────────────────────────────────────────

run_test "exits with error when no argument provided"
no_arg_output=$("$SCRIPT" 2>&1) || no_arg_exit=$?
no_arg_exit="${no_arg_exit:-0}"
assert_not_zero "$no_arg_exit" "no-arg exit code non-zero"
assert_contains "$no_arg_output" "Error: Missing component key" "no-arg error message"

# ── Test: usage block is printed when no argument ────────────────────────────

run_test "prints usage info when called without args"
usage_output=$("$SCRIPT" 2>&1) || true
assert_contains "$usage_output" "Usage:" "usage block present"

# ── Test: non-existent component key → exit 1 ───────────────────────────────

run_test "exits with error for non-existent component key"

# Ensure component-versions.json exists (run the generator if needed)
VERSIONS_FILE="$REPO_ROOT/component-versions.json"
if [ ! -f "$VERSIONS_FILE" ]; then
    node "$REPO_ROOT/scripts/generate-version-index.mjs" >/dev/null 2>&1
fi

fake_key_output=$("$SCRIPT" "definitely/not/a/real/component/key" 2>&1) || fake_key_exit=$?
fake_key_exit="${fake_key_exit:-0}"
assert_not_zero "$fake_key_exit" "nonexistent-key exit code non-zero"
assert_contains "$fake_key_output" "not found" "nonexistent-key error message"

# ── Test: examples shown in usage / help output ──────────────────────────────

run_test "usage output includes example component key paths"
usage2=$("$SCRIPT" 2>&1) || true
assert_contains "$usage2" "agents/domain-experts" "usage shows agents example"

# ── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "${#ERRORS[@]}" -gt 0 ]; then
    echo ""
    echo "Failed assertions:"
    for err in "${ERRORS[@]}"; do
        echo "  $err"
    done
fi

[ "$FAIL" -eq 0 ] || exit 1
