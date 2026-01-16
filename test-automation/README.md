# Test Automation Framework

**Automated testing suite for Claude Code Helper toolkit**

Version: 1.0.0
Last Updated: 2026-01-11

---

## 📋 Overview

This framework automates the testing of all 131 components in the claude-code-helper toolkit:
- 60 MCP Tools (9 servers)
- 48 Agents (14 MCP + 34 sub-agents)
- 16 Skills
- 7 Commands

**Features:**
- ✅ Automated test execution via Claude Code CLI
- ✅ Comprehensive HTML and Markdown reports
- ✅ Detailed statistics and performance metrics
- ✅ Actionable recommendations
- ✅ Test result history tracking

---

## 🚀 Quick Start

### Prerequisites

Install required dependencies:

```bash
# Claude Code CLI
curl -fsSL https://install.claude.ai/code | sh

# Python 3 (usually pre-installed)
python3 --version  # Should be >= 3.7

# jq (JSON processor)
# macOS
brew install jq

# Linux (Debian/Ubuntu)
sudo apt-get install jq

# bc (calculator - optional)
sudo apt-get install bc  # Linux
brew install bc          # macOS
```

### Run Complete Test Suite

```bash
# From repository root
cd test-automation

# Make scripts executable
chmod +x *.sh

# Run all tests
./run-all-tests.sh
```

This will:
1. Parse 136+ test cases from TESTING-GUIDE.md
2. Execute tests via Claude Code CLI
3. Generate HTML and Markdown reports
4. Open the report in your browser

**Duration:** ~3 hours for complete suite (most tests are automatable)

---

## 📁 Directory Structure

```
test-automation/
├── README.md                  # This file
├── run-all-tests.sh           # Main orchestration script
├── test-parser.py             # Extracts tests from TESTING-GUIDE.md
├── test-runner.sh             # Executes tests via Claude Code CLI
├── report-generator.py        # Generates HTML/MD reports
├── tests/
│   └── test-cases.json        # Parsed test cases (generated)
├── results/
│   ├── test-results-*.json    # Test execution results
│   └── test-run-*.log         # Execution logs
└── reports/
    ├── test-report-*.html     # HTML reports
    ├── test-report-*.md       # Markdown reports
    ├── latest.html            # Symlink to latest HTML report
    └── latest.md              # Symlink to latest MD report
```

---

## 🔧 Component Details

### 1. Test Parser (`test-parser.py`)

**Purpose:** Extracts structured test cases from TESTING-GUIDE.md

**Usage:**
```bash
python3 test-parser.py ../TESTING-GUIDE.md tests/test-cases.json
```

**Output Format (JSON):**
```json
{
  "id": "mcp_tool_1",
  "type": "mcp_tool",
  "category": "API Specialist",
  "name": "validate_openapi",
  "prompt": "Test prompt here...",
  "expected": ["Expected output 1", "Expected output 2"],
  "validation": ["Validation criteria 1", "Validation criteria 2"],
  "automated": true
}
```

**Features:**
- Extracts 136+ test cases
- Categorizes by type (MCP tool, agent, skill, command)
- Determines if test is automatable
- Preserves expected outputs and validation criteria

---

### 2. Test Runner (`test-runner.sh`)

**Purpose:** Executes test cases via Claude Code CLI

**Usage:**
```bash
./test-runner.sh
```

**Features:**
- Runs tests via `claude` CLI command
- 120-second timeout per test (adjustable via TEST_TIMEOUT)
- Captures output and errors
- Generates JSON results file
- Provides real-time progress updates

**Environment Variables:**
```bash
TEST_FILTER="api"     # Filter tests by name pattern
TEST_TIMEOUT=120      # Timeout per test (seconds)
```

**Output:** `results/test-results-TIMESTAMP.json`

---

### 3. Report Generator (`report-generator.py`)

**Purpose:** Generates comprehensive HTML and Markdown reports

**Usage:**
```bash
python3 report-generator.py results/test-results-*.json \
    --html reports/report.html \
    --md reports/report.md
```

**HTML Report Features:**
- 📊 Executive summary with metrics
- 📈 Detailed statistics by test type
- 🔍 Filterable test results (passed/failed/skipped)
- 💡 Actionable recommendations
- ⚡ Performance metrics
- 🎨 Beautiful, responsive design

**Markdown Report Features:**
- Clean, readable format
- Summary tables
- Failed test details
- Recommendations

---

### 4. Orchestration Script (`run-all-tests.sh`)

**Purpose:** Runs the complete testing pipeline

**Usage:**
```bash
# Run complete pipeline
./run-all-tests.sh

# Options
./run-all-tests.sh --help           # Show help
./run-all-tests.sh --parse-only     # Only parse test cases
./run-all-tests.sh --run-only       # Only run tests
./run-all-tests.sh --report-only    # Only generate reports
```

**Pipeline Steps:**
1. ✅ Check prerequisites
2. 📋 Parse test cases from TESTING-GUIDE.md
3. 🚀 Execute tests via Claude Code CLI
4. 📊 Generate HTML and Markdown reports
5. 🧹 Clean up old results (keep last 10)
6. 📈 Display final summary

---

## 📊 Understanding Reports

### HTML Report Sections

**1. Executive Summary**
- Overall status badge (EXCELLENT / GOOD / NEEDS ATTENTION)
- Key metrics (total, passed, failed, skipped)
- Visual progress bar
- Pass rate percentage

**2. Detailed Statistics**
- Results by test type (MCP tools, agents, skills, commands)
- Performance metrics (avg, min, max duration)
- Pass rates per category

**3. Test Results**
- Filterable by status (all, passed, failed, skipped)
- Failed tests shown first (most important)
- Detailed error messages
- Output previews
- Passed tests collapsed by default

**4. Recommendations**
- Prioritized action items (HIGH / MEDIUM / LOW)
- Specific guidance for improvements
- Context-aware suggestions

### Interpreting Results

**Pass Rate:**
- **95%+**: Excellent - All systems operational
- **80-94%**: Good - Minor issues to address
- **<80%**: Needs attention - Critical issues present

**Test Categories:**
- **MCP Tools**: Direct tool execution tests
- **Agents**: Agent invocation and behavior tests
- **Skills**: Skill activation and workflow tests
- **Commands**: Slash command execution tests

---

## 🔬 Test Categories

### Automated Tests (~110 tests)

Tests that can run automatically:
- ✅ MCP tool executions (API calls, linting, validation)
- ✅ Agent invocations (security scans, reviews)
- ✅ Skill workflows (TDD, refactoring patterns)
- ✅ Command executions (planning, scaffolding)

### Manual Tests (~26 tests)

Tests requiring human judgment:
- 👁️ Visual design reviews
- 🎨 UI/UX assessments
- 📸 Screenshot-based tests
- 🖼️ Design mockup evaluations

**Status:** Automatically skipped during test run

---

## 🎯 Usage Scenarios

### Daily Development

Run quick tests for components you're working on:

```bash
# Filter specific tests
TEST_FILTER="api" ./test-runner.sh
TEST_FILTER="security" ./test-runner.sh
```

### Before Release

Run complete test suite:

```bash
./run-all-tests.sh
```

Review HTML report for any issues.

### Continuous Integration

Integrate into CI/CD pipeline:

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    cd test-automation
    ./run-all-tests.sh

- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: test-automation/reports/
```

### Post-Installation Validation

After installing the toolkit:

```bash
# Validate installation
./run-all-tests.sh

# Check pass rate
# - 95%+: Perfect installation
# - 80-94%: Minor configuration needed
# - <80%: Review MCP server configs
```

---

## 🐛 Troubleshooting

### Issue: "Claude Code CLI not found"

**Solution:**
```bash
# Install Claude Code
curl -fsSL https://install.claude.ai/code | sh

# Verify installation
claude --version
```

### Issue: "No test results found"

**Cause:** Test runner failed or was interrupted

**Solution:**
```bash
# Check logs
tail -f test-automation/results/test-run-*.log

# Re-run tests
./test-runner.sh
```

### Issue: "Many tests timing out"

**Cause:** MCP servers not configured or Claude Desktop not running

**Solution:**
1. Verify MCP servers are configured in Claude Desktop config
2. Restart Claude Desktop
3. Run tests again

### Issue: "Permission denied" on scripts

**Solution:**
```bash
chmod +x *.sh
```

### Issue: Low pass rate (<80%)

**Investigate:**
1. Check `test-automation/reports/latest.html`
2. Review "Failed Tests" section
3. Check error messages
4. Verify MCP server configurations
5. Ensure all dependencies installed

---

## 📈 Performance Tips

### Speed Up Tests

**Run Specific Categories:**
```bash
# Only MCP tool tests
TEST_FILTER="mcp_tool" ./test-runner.sh

# Only agent tests
TEST_FILTER="agent" ./test-runner.sh
```

**Adjust Timeouts:**
```bash
# Reduce timeout for faster execution
TEST_TIMEOUT=30 ./test-runner.sh
```

**Parallel Execution (Future Enhancement):**
```bash
# Not yet implemented
# Will allow running multiple tests concurrently
```

### Optimize Report Generation

Reports are lightweight and fast:
- HTML: ~500KB
- MD: ~50KB
- Generation time: <5 seconds

---

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Claude Code
        run: curl -fsSL https://install.claude.ai/code | sh

      - name: Install Dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y jq bc

      - name: Run Tests
        run: |
          cd test-automation
          ./run-all-tests.sh

      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test-automation/reports/

      - name: Fail if low pass rate
        run: |
          PASS_RATE=$(jq -r '.summary.pass_rate' test-automation/results/test-results-*.json | tail -1)
          if (( $(echo "$PASS_RATE < 80" | bc -l) )); then
            echo "Pass rate ${PASS_RATE}% is below 80%"
            exit 1
          fi
```

### GitLab CI

```yaml
test:
  script:
    - curl -fsSL https://install.claude.ai/code | sh
    - apt-get update && apt-get install -y jq bc
    - cd test-automation
    - ./run-all-tests.sh
  artifacts:
    when: always
    paths:
      - test-automation/reports/
```

---

## 📝 Extending the Framework

### Add Custom Tests

**1. Add to TESTING-GUIDE.md:**
```markdown
#### Tool X.Y: my_custom_tool

**Test Prompt:**
```
Test my custom functionality
```

**Expected Output:**
- ✅ Expected result 1
- ✅ Expected result 2

**Validation Criteria:**
- Tool executes successfully
- Returns expected format
```

**2. Re-run parser:**
```bash
python3 test-parser.py ../TESTING-GUIDE.md tests/test-cases.json
```

**3. Run tests:**
```bash
./run-all-tests.sh
```

### Add Custom Validations

Edit `test-runner.sh` to add custom validation logic:

```bash
# Add custom validation function
validate_custom_output() {
    local output="$1"
    # Your validation logic here
    if [[ "$output" == *"expected_string"* ]]; then
        return 0  # Pass
    else
        return 1  # Fail
    fi
}
```

---

## 🎓 Best Practices

### Testing Workflow

1. **Before Changes:**
   - Run baseline tests
   - Note pass rate

2. **After Changes:**
   - Run tests again
   - Compare pass rates
   - Investigate any regressions

3. **Before Release:**
   - Run complete suite
   - Require 95%+ pass rate
   - Review all failed tests

### Report Management

- Keep last 10 test runs (automatic cleanup)
- Archive important reports separately
- Share HTML reports with team
- Track pass rate trends over time

### Maintenance

- Update TESTING-GUIDE.md when adding features
- Re-parse tests after guide updates
- Review skipped tests periodically
- Consider automating manual tests when possible

---

## 📚 Related Documentation

- **[TESTING-GUIDE.md](../TESTING-GUIDE.md)** - Manual test procedures
- **[INSTALLATION-STATISTICS.md](../docs/reports/INSTALLATION-STATISTICS.md)** - Resource metrics
- **[TOOLS-CHEATSHEET.md](../TOOLS-CHEATSHEET.md)** - Component reference
- **[README.md](../README.md)** - Main documentation

---

## 🤝 Contributing

To improve the test automation framework:

1. Add test cases to TESTING-GUIDE.md
2. Improve test parsers (test-parser.py)
3. Enhance report generation (report-generator.py)
4. Add parallel execution support
5. Create custom validators

---

## 📊 Statistics

**Current Coverage:**
- Test Cases: 136+
- Automatable: ~110 (81%)
- Manual: ~26 (19%)

**Execution Time:**
- Parse: ~5 seconds
- Execute: ~2-3 hours (full suite)
- Report: ~5 seconds
- **Total: ~2-3 hours**

**Report Sizes:**
- HTML: ~500KB
- Markdown: ~50KB
- JSON Results: ~200KB

---

## 🔮 Future Enhancements

**Planned Features:**
- [ ] Parallel test execution
- [ ] Test result comparison (diff between runs)
- [ ] Slack/email notifications
- [ ] Custom test configurations
- [ ] Video recording for visual tests
- [ ] Performance benchmarking
- [ ] Historical trend analysis
- [ ] Integration with test management tools

---

**Version:** 1.0.0
**Author:** Michel Abboud
**AI Assistance:** Claude Sonnet 4.5
**License:** MIT
**Last Updated:** 2026-01-11
