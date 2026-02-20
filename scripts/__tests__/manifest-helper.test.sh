#!/bin/bash
# manifest-helper.test.sh
#
# Tests for scripts/manifest-helper.sh
# Uses a minimal inline test framework (no external dependencies).
# Uses a temporary HOME directory so tests never touch the real ~/.claude/

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
        ERRORS+=("FAIL [$label]: '$needle' not found in value")
        echo "  FAIL [$label]: '$needle' not found in value" >&2
        echo "  Actual: $haystack" >&2
    fi
}

assert_not_empty() {
    local value="$1"
    local label="${2:-assert_not_empty}"
    if [ -n "$value" ]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("FAIL [$label]: value was empty")
        echo "  FAIL [$label]: value was empty" >&2
    fi
}

assert_file_exists() {
    local file="$1"
    local label="${2:-assert_file_exists}"
    if [ -f "$file" ]; then
        PASS=$((PASS + 1))
    else
        FAIL=$((FAIL + 1))
        ERRORS+=("FAIL [$label]: file not found: $file")
        echo "  FAIL [$label]: file not found: $file" >&2
    fi
}

assert_json_field() {
    # assert_json_field <file> <js-expr> <expected-value> <label>
    local file="$1"
    local expr="$2"
    local expected="$3"
    local label="${4:-assert_json_field}"
    local actual
    actual=$(node -e "
const d = JSON.parse(require('fs').readFileSync('$file', 'utf8'));
const v = $expr;
console.log(v === null || v === undefined ? 'null' : String(v));
" 2>/dev/null || echo "ERROR")
    assert_eq "$actual" "$expected" "$label"
}

run_test() {
    local name="$1"
    echo "  running: $name"
}

# ── Paths & temp environment ─────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER="$REPO_ROOT/scripts/manifest-helper.sh"

# Create a temporary HOME so we never pollute the real ~/.claude/
FAKE_HOME="$(mktemp -d)"
trap 'rm -rf "$FAKE_HOME"' EXIT

export HOME="$FAKE_HOME"
export REPO_ROOT

echo ""
echo "=== manifest-helper.sh tests ==="
echo ""

# ── Test: source the helper without errors ───────────────────────────────────

run_test "helper can be sourced without errors"
source_result=0
# shellcheck source=/dev/null
source "$HELPER" 2>&1 || source_result=$?
assert_eq "$source_result" "0" "source exits cleanly"

# Source it for real now so functions are available
# shellcheck source=/dev/null
source "$HELPER"

# ── Test: required functions are defined after sourcing ─────────────────────

run_test "register_component function is defined"
fn_type=$(type -t register_component 2>/dev/null || echo "undefined")
assert_eq "$fn_type" "function" "register_component is a function"

run_test "register_all_installed function is defined"
fn_type2=$(type -t register_all_installed 2>/dev/null || echo "undefined")
assert_eq "$fn_type2" "function" "register_all_installed is a function"

run_test "ensure_manifest_v2 function is defined"
fn_type3=$(type -t ensure_manifest_v2 2>/dev/null || echo "undefined")
assert_eq "$fn_type3" "function" "ensure_manifest_v2 is a function"

run_test "get_repo_version function is defined"
fn_type4=$(type -t get_repo_version 2>/dev/null || echo "undefined")
assert_eq "$fn_type4" "function" "get_repo_version is a function"

run_test "update_manifest function is defined (legacy)"
fn_type5=$(type -t update_manifest 2>/dev/null || echo "undefined")
assert_eq "$fn_type5" "function" "update_manifest is a function"

# ── Test: ensure_manifest_v2 creates a proper v2 manifest from scratch ───────

run_test "ensure_manifest_v2 creates manifest file from scratch"
MANIFEST_FILE="$FAKE_HOME/.claude/claude-code-helper.json"
ensure_manifest_v2 "$REPO_ROOT" 2>/dev/null || true
assert_file_exists "$MANIFEST_FILE" "manifest file created"

run_test "ensure_manifest_v2 sets manifestVersion to 2"
assert_json_field "$MANIFEST_FILE" "d.manifestVersion" "2" "manifestVersion is 2"

run_test "ensure_manifest_v2 sets installed as an object"
installed_type=$(node -e "
const d = JSON.parse(require('fs').readFileSync('$MANIFEST_FILE', 'utf8'));
console.log(typeof d.installed);
" 2>/dev/null || echo "ERROR")
assert_eq "$installed_type" "object" "installed field is object"

run_test "ensure_manifest_v2 is idempotent (running twice is safe)"
ensure_manifest_v2 "$REPO_ROOT" 2>/dev/null || true
assert_json_field "$MANIFEST_FILE" "d.manifestVersion" "2" "manifestVersion still 2 after second call"

# ── Test: register_component adds an entry ───────────────────────────────────

run_test "register_component adds an entry to installed"
register_component "agents/domain-experts/test-agent" "1.2.3" "agents/test-agent.md" 2>/dev/null || true
assert_file_exists "$MANIFEST_FILE" "manifest still exists after register_component"

run_test "register_component stores the correct version"
assert_json_field \
    "$MANIFEST_FILE" \
    "d.installed && d.installed['agents/domain-experts/test-agent'] && d.installed['agents/domain-experts/test-agent'].version" \
    "1.2.3" \
    "stored version is 1.2.3"

run_test "register_component stores the installed file path"
assert_json_field \
    "$MANIFEST_FILE" \
    "d.installed && d.installed['agents/domain-experts/test-agent'] && d.installed['agents/domain-experts/test-agent'].file" \
    "agents/test-agent.md" \
    "stored file is agents/test-agent.md"

run_test "register_component stores an installedAt timestamp"
installed_at=$(node -e "
const d = JSON.parse(require('fs').readFileSync('$MANIFEST_FILE', 'utf8'));
const v = d.installed && d.installed['agents/domain-experts/test-agent'] && d.installed['agents/domain-experts/test-agent'].installedAt;
console.log(v || '');
" 2>/dev/null || echo "")
assert_not_empty "$installed_at" "installedAt is set"

# ── Test: register_component can update an existing entry ────────────────────

run_test "register_component updates an existing entry with new version"
register_component "agents/domain-experts/test-agent" "2.0.0" "agents/test-agent.md" 2>/dev/null || true
assert_json_field \
    "$MANIFEST_FILE" \
    "d.installed && d.installed['agents/domain-experts/test-agent'] && d.installed['agents/domain-experts/test-agent'].version" \
    "2.0.0" \
    "updated version is 2.0.0"

# ── Test: multiple components can be registered without collision ─────────────

run_test "multiple components can be registered independently"
register_component "skills/pm-dashboard" "1.0.0" "skills/pm-dashboard/" 2>/dev/null || true
register_component "hooks/auto-format" "1.1.0" "hooks/auto-format.md" 2>/dev/null || true

count=$(node -e "
const d = JSON.parse(require('fs').readFileSync('$MANIFEST_FILE', 'utf8'));
console.log(Object.keys(d.installed || {}).length);
" 2>/dev/null || echo "0")
# Should have at least 3: test-agent (updated), pm-dashboard, auto-format
[ "$count" -ge 3 ] && PASS=$((PASS + 1)) || {
    FAIL=$((FAIL + 1))
    ERRORS+=("FAIL [multiple registrations]: expected >= 3 entries, got $count")
    echo "  FAIL [multiple registrations]: expected >= 3 entries, got $count" >&2
}

# ── Test: get_repo_version returns a non-empty string ────────────────────────

run_test "get_repo_version returns a non-empty version string"
repo_ver=$(get_repo_version "$REPO_ROOT" 2>/dev/null || echo "")
assert_not_empty "$repo_ver" "get_repo_version returns non-empty value"

run_test "get_repo_version matches root package.json version"
expected_ver=$(node -e "console.log(require('$REPO_ROOT/package.json').version)" 2>/dev/null || echo "")
assert_eq "$repo_ver" "$expected_ver" "get_repo_version matches package.json"

# ── Test: manifest updatedAt changes after register_component ────────────────

run_test "manifest updatedAt field is set after registration"
updated_at=$(node -e "
const d = JSON.parse(require('fs').readFileSync('$MANIFEST_FILE', 'utf8'));
console.log(d.updatedAt || '');
" 2>/dev/null || echo "")
assert_not_empty "$updated_at" "updatedAt is set"

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
