# Testing MCP Server

Comprehensive test execution, coverage analysis, quality metrics, and reporting tools for test-driven development workflows.

---

## 🎯 Features

### 4 Specialized Tools

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **run_tests** | Execute tests | Jest, Pytest, Mocha, Vitest with pattern matching (watch mode is not supported, see below) |
| **get_coverage** | Coverage analysis | Jest, Pytest, Vitest; configurable thresholds, multiple formats (JSON, HTML, text) |
| **analyze_test_quality** | Test quality metrics | Assertions, mocks, async patterns, flakiness detection |
| **generate_test_report** | Comprehensive reports | Markdown, HTML with flaky test analysis (PDF is accepted as a format value but not implemented) |

---

## 📦 Installation

```bash
cd testing-mcp
npm install
npm run build
```

**Verify:**
```bash
npm run inspector
```

---

## ⚙️ Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "testing": {
      "command": "node",
      "args": ["/absolute/path/to/testing-mcp/build/index.js"]
    }
  }
}
```

### Claude Code

Add to `.claude-code/config.json`:

```json
{
  "mcp_servers": [
    {
      "name": "testing",
      "command": "node",
      "args": ["/absolute/path/to/testing-mcp/build/index.js"]
    }
  ]
}
```

---

## 🚀 Usage Examples

### 1. Run Tests

```javascript
{
  "tool": "run_tests",
  "args": {
    "testPath": "./tests",
    "framework": "jest",
    "pattern": "should handle errors"
  }
}
```

**Supported Frameworks:**
- **Jest** - JavaScript/TypeScript testing
- **Pytest** - Python testing framework
- **Mocha** - JavaScript test framework
- **Vitest** - Vite-native unit testing

**Pattern Matching:** Filter tests by name (e.g., `"should handle errors"`)

**Watch Mode is NOT supported.** MCP tool calls run synchronously over stdio and must return a single result; a watch-mode process runs indefinitely, so `watch: true` is rejected with an error instead of hanging the call until the 5-minute timeout. Run your framework's watch mode directly in a terminal for interactive development.

**Local devDependencies:** Node-based frameworks (`jest`, `mocha`, `vitest`) are resolved via `npx --no-install <framework>`, which finds a project-local install in `node_modules/.bin` before falling back to a global install — the common case of a framework listed only in `devDependencies` works without any extra PATH setup. `pytest` is invoked directly and must be on `PATH` (e.g. inside an activated virtualenv).

**Output:**
```json
{
  "framework": "jest",
  "testPath": "./tests",
  "pattern": "should handle errors",
  "success": true,
  "results": {
    "numTotalTests": 24,
    "numPassedTests": 22,
    "numFailedTests": 2,
    "numPendingTests": 0
  },
  "summary": {
    "passed": 22,
    "failed": 2,
    "duration": "4.2s",
    "coverage": "87%"
  }
}
```

---

### 2. Get Coverage Report

```javascript
{
  "tool": "get_coverage",
  "args": {
    "testPath": "./src",
    "framework": "jest",
    "threshold": 80,
    "format": "html"
  }
}
```

**Supported Frameworks:** `jest`, `pytest`, `vitest`

**Threshold:** Minimum coverage percentage (default: 80)

**Formats:**
- **json** - Machine-readable coverage data
- **html** - Interactive HTML report
- **text** - Terminal-friendly summary

**Output:**
```json
{
  "coverage": {
    "lines": {
      "total": 1250,
      "covered": 1087,
      "percentage": 86.96
    },
    "branches": {
      "total": 340,
      "covered": 275,
      "percentage": 80.88
    },
    "functions": {
      "total": 145,
      "covered": 132,
      "percentage": 91.03
    },
    "statements": {
      "total": 1430,
      "covered": 1245,
      "percentage": 87.06
    }
  },
  "thresholdMet": true,
  "uncoveredFiles": [
    "src/utils/legacy.js (42% coverage)",
    "src/config/deprecated.js (0% coverage)"
  ]
}
```

---

### 3. Analyze Test Quality

```javascript
{
  "tool": "analyze_test_quality",
  "args": {
    "testPath": "./tests",
    "metrics": ["assertions", "mocks", "async", "flakiness"]
  }
}
```

**Metrics Analyzed:**
- **assertions** - Number and quality of assertions per test
- **mocks** - Mock usage patterns and potential issues
- **async** - Async/await patterns and race conditions
- **flakiness** - Tests that may fail intermittently

**Output:**
```json
{
  "metrics": {
    "assertions": {
      "totalTests": 150,
      "testsWithAssertions": 145,
      "averageAssertionsPerTest": 3.2,
      "testsWithNoAssertions": [
        "tests/auth.test.js:45 - 'should initialize auth'"
      ]
    },
    "mocks": {
      "totalMocks": 78,
      "unmockedExternalCalls": 5,
      "potentialIssues": [
        "tests/api.test.js:67 - Mock not reset between tests"
      ]
    },
    "async": {
      "asyncTests": 89,
      "awaitPatterns": 156,
      "potentialRaceConditions": [
        "tests/db.test.js:34 - Multiple async operations without proper sequencing"
      ]
    },
    "flakiness": {
      "flakyTests": 3,
      "indicators": [
        {
          "test": "tests/timing.test.js:12",
          "reason": "Hardcoded timeout value",
          "recommendation": "Use more flexible timing assertions"
        }
      ]
    }
  },
  "summary": {
    "testQualityScore": 85,
    "issues": 8,
    "warnings": 12
  }
}
```

---

### 4. Generate Test Report

```javascript
{
  "tool": "generate_test_report",
  "args": {
    "resultsPath": "./test-results.json",
    "format": "markdown",
    "includeFlaky": true
  }
}
```

**Formats:**
- **markdown** - GitHub-friendly reports
- **html** - Interactive web reports
- **pdf** - NOT implemented. `format: "pdf"` is accepted by the schema for forward-compatibility but always returns an error (`PDF report generation is not implemented`) rather than silently substituting another format. Real PDF export would need an additional rendering dependency (e.g. puppeteer or md-to-pdf) that hasn't been added/vetted yet.

**Flaky Test Analysis:** Set `includeFlaky: true` to include detailed flaky test detection

**Output:** (Markdown example)
```markdown
# Test Report

## Summary
- **Total Tests:** 150
- **Passed:** 145 (96.7%)
- **Failed:** 3 (2.0%)
- **Skipped:** 2 (1.3%)
- **Duration:** 24.5s

## Failed Tests
1. `auth.test.js:45` - Authentication token validation fails for expired tokens
2. `api.test.js:78` - Rate limiting not enforced correctly
3. `db.test.js:123` - Connection pool exhaustion under load

## Flaky Tests (3 detected)
1. `timing.test.js:12` - Uses setTimeout(100) which may fail on slow CI
   - **Recommendation:** Use Jest fake timers
2. `network.test.js:56` - External API call without timeout
   - **Recommendation:** Mock external dependencies
```

---

## 🔧 External Tool Requirements

This MCP server requires test frameworks to be installed in your project:

### Jest (JavaScript/TypeScript)

```bash
npm install --save-dev jest @types/jest
```

### Pytest (Python)

```bash
pip install pytest pytest-cov pytest-json-report
```

### Mocha (JavaScript)

```bash
npm install --save-dev mocha chai
```

### Vitest (Vite projects)

```bash
npm install --save-dev vitest @vitest/ui
```

**Note:** There is no framework auto-detection. You must pick the correct `framework` value for your project; the server does not inspect `package.json`/`pyproject.toml` to guess which one is in use. `jest`/`mocha`/`vitest` are resolved via `npx --no-install <framework>` (so a local `devDependency` install works without extra PATH setup); if the chosen framework still can't be resolved (locally or globally), the tool call returns the underlying OS-level error (e.g. `npm error could not determine executable to run`) rather than a friendly suggestion.

---

## 💡 Best Practices

### 1. Run Tests First

Always verify tests pass before other quality checks:
```
"Run all tests with Jest and show me any failures"
```

### 2. Monitor Coverage

Track coverage trends to ensure adequate testing:
```
"Get coverage report with 85% threshold and generate HTML output"
```

### 3. Analyze Test Quality

Regular quality checks help maintain test effectiveness:
```
"Analyze test quality focusing on assertions and flakiness"
```

### 4. Generate Reports

Create comprehensive reports for team reviews:
```
"Generate HTML test report including flaky test analysis"
```

---

## 🎯 Common Workflows

### Pre-Merge Quality Gate

```
"Quality gate check:
1. Run all tests with Jest
2. Get coverage report (minimum 80% threshold)
3. Analyze test quality for flakiness
4. Generate markdown report
Fail if any tests fail or coverage below threshold"
```

### CI/CD Integration

```
"CI test execution:
1. Run tests matching 'integration' pattern
2. Generate coverage in JSON format
3. Create HTML test report
4. Analyze for flaky tests
Report summary and upload artifacts"
```

### Test Quality Audit

```
"Test quality audit:
1. Analyze all tests for assertions and mocks
2. Identify tests without proper assertions
3. Find potential race conditions in async tests
4. List flaky tests with recommendations
Provide prioritized improvement list"
```

---

## 🚨 Limitations

- Test frameworks must be installed and configured in the project (no framework auto-detection)
- Coverage reports depend on framework-specific coverage tools; `mocha` has no built-in coverage support and is not accepted by `get_coverage`
- Flaky test detection is heuristic-based (not guaranteed to catch all cases)
- Watch mode is not supported at all — `run_tests` rejects `watch: true` with an error (MCP tool calls run synchronously over stdio and can't stream an indefinitely-running watch process)
- PDF generation is not implemented — `generate_test_report` rejects `format: "pdf"` with an error; use `markdown` or `html`

---

## 🤝 Integration with Other MCPs

Works great with:
- **Code Review MCP:** Combine testing with linting and complexity analysis
- **API Specialist MCP:** Integration testing for APIs
- **Design System MCP:** Component testing for UI libraries

---

## 📊 Example Agent Configuration

See `../../agents/mcp-integrated/test-quality-enforcer.json` for a pre-configured agent that uses this MCP server for comprehensive test quality enforcement.

---

Happy testing! 🧪

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 14+ skills, 11 MCP servers, and comprehensive guides.
