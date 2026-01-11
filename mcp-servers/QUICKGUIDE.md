# Quick Start Guide

Get up and running with the Multi-Agent MCP System in 15 minutes!

---

## 🚀 Super Quick Start

### Option 1: Claude Code CLI (Recommended - 2 minutes)

```bash
# 1. Install all servers
./install-all.sh

# 2. Add servers using Claude Code CLI
cd /path/to/mcp-servers
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"

# 3. Verify installation
claude mcp list

# 4. Test it!
# Run: claude
# Ask: "What MCP tools do you have?"
```

### Option 2: Claude Desktop (5 minutes)

```bash
# 1. Install all servers
./install-all.sh

# 2. Get absolute paths
pwd
# Example output: /Users/you/projects/mcp-system

# 3. Configure Claude Desktop (use YOUR path from step 2)
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
# Or: ~/.config/Claude/claude_desktop_config.json (Linux)
{
  "mcpServers": {
    "api-specialist": {
      "command": "node",
      "args": ["/Users/you/projects/mcp-system/api-specialist-mcp/build/index.js"]
    },
    "code-review": {
      "command": "node",
      "args": ["/Users/you/projects/mcp-system/code-review-mcp/build/index.js"]
    },
    "design-system": {
      "command": "node",
      "args": ["/Users/you/projects/mcp-system/design-system-mcp/build/index.js"]
    },
    "testing": {
      "command": "node",
      "args": ["/Users/you/projects/mcp-system/testing-mcp/build/index.js"]
    },
    "uiux-review": {
      "command": "node",
      "args": ["/Users/you/projects/mcp-system/uiux-review-mcp/build/index.js"]
    }
  }
}

# 4. Restart Claude Desktop

# 5. Test it!
# In Claude: "What MCP tools do you have?"
```

---

## 📋 Available Tools Reference

### Code Review MCP (4 tools)

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `lint_file` | Run linters | "Lint my TypeScript file" |
| `security_scan` | Find vulnerabilities | "Scan for security issues" |
| `analyze_complexity` | Check code complexity | "Is this function too complex?" |
| `find_duplicates` | Detect duplicate code | "Find repeated code blocks" |

### Testing MCP (4 tools)

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `run_tests` | Execute tests | "Run my Jest tests" |
| `get_coverage` | Coverage reports | "Check test coverage" |
| `analyze_test_quality` | Test metrics | "How good are my tests?" |
| `generate_test_report` | Create reports | "Generate test report" |

### Design System MCP (5 tools)

| Tool | Purpose | Example Use |
|------|---------|-------------|
| `validate_tokens` | Check design tokens | "Validate my design tokens" |
| `check_component` | Component compliance | "Is my Button component compliant?" |
| `validate_color_palette` | Color contrast | "Check WCAG compliance" |
| `analyze_spacing` | Spacing consistency | "Analyze spacing values" |
| `generate_report` | Design reports | "Create design system report" |

---

## 💬 Common Prompts

### Single Tool Usage

**Code Review:**
```
"Lint the file src/app.ts using ESLint and fix any issues"

"Run a security scan on the ./api directory using Semgrep"

"Check the complexity of src/utils/parser.js"

"Find duplicate code in the ./components directory"
```

**Testing:**
```
"Run all tests in the tests/ folder using Jest"

"Check code coverage for the src/ directory with an 80% threshold"

"Analyze the quality of tests in tests/auth.test.js"

"Generate an HTML test report from results.json"
```

**Design System:**
```
"Validate the design tokens in tokens.json"

"Check if Button.tsx follows our design system"

"Validate color contrast in colors.json for WCAG AA"

"Analyze spacing consistency in the styles/ directory"
```

### Multi-Agent Workflows

**Complete Code Review:**
```
"Review my React app:
1. Run ESLint on all files
2. Check security with Semgrep
3. Run tests with Jest
4. Validate components against design system
5. Summarize all issues"
```

**Quality Gate:**
```
"Before I merge this PR, check:
- No lint errors
- All tests pass
- 80%+ code coverage
- No security vulnerabilities
- Design tokens are used correctly"
```

**Component Audit:**
```
"Audit the LoginForm.tsx component:
- Check for accessibility issues
- Validate design token usage
- Ensure it has tests
- Check for security vulnerabilities
Report any violations"
```

---

## 🎯 Real-World Examples

### Example 1: Full Stack App Review

**Your prompt:**
```
"I have a Next.js app. Review it thoroughly:
- Check TypeScript code quality
- Find security issues
- Ensure 80%+ test coverage
- Validate UI components use design tokens
- Check accessibility
Give me a prioritized list of issues to fix"
```

**What happens:**
1. Claude runs ESLint on all `.ts/.tsx` files
2. Runs Semgrep security scan
3. Executes Jest tests + coverage
4. Validates components against design system
5. Checks WCAG compliance
6. Synthesizes report with priorities

### Example 2: Component Development

**Your prompt:**
```
"I'm building a Card component. Help me:
1. Write the component with proper design tokens
2. Add comprehensive tests
3. Validate accessibility
4. Check it meets our design system standards"
```

**Workflow:**
1. You write initial component
2. Design System MCP validates token usage
3. Claude suggests fixes
4. You implement fixes
5. Testing MCP runs tests
6. Code Review MCP checks quality
7. Final validation ✅

### Example 3: Legacy Code Cleanup

**Your prompt:**
```
"I have a messy legacy codebase. Help me:
- Find duplicate code to refactor
- Identify complex functions that need simplification
- Add tests where coverage is low
- Fix security vulnerabilities
Start with the worst issues first"
```

**What Claude does:**
1. Runs duplicate detection
2. Analyzes complexity scores
3. Checks test coverage
4. Runs security scan
5. Creates prioritized cleanup plan

---

## 🤖 Creating Specialized Agents

### Security Reviewer Agent

**Create:** `~/.claude-code/agents/security-reviewer.json`
```json
{
  "name": "security-reviewer",
  "description": "Security expert that scans code for vulnerabilities",
  "instructions": "You are a security expert. Use the security_scan tool from code-review-mcp to find vulnerabilities. For each issue found, explain the risk and provide specific remediation steps. Focus on high and critical severity issues first.",
  "mcp_servers": ["code-review"]
}
```

**Usage:**
```bash
claude-code --agent security-reviewer
# Then: "Scan my API for security issues"
```

### Test Quality Enforcer

**Create:** `~/.claude-code/agents/test-enforcer.json`
```json
{
  "name": "test-enforcer",
  "description": "Ensures comprehensive test coverage",
  "instructions": "You enforce testing standards. Use testing-mcp tools to check coverage (minimum 80%), test quality metrics, and identify untested code paths. Flag any file with <80% coverage and suggest test cases to add.",
  "mcp_servers": ["testing"]
}
```

**Usage:**
```bash
claude-code --agent test-enforcer
# Then: "Ensure my app meets testing standards"
```

### Design System Guardian

**Create:** `~/.claude-code/agents/design-guardian.json`
```json
{
  "name": "design-guardian",
  "description": "Validates UI consistency and accessibility",
  "instructions": "You ensure design system compliance. Check that components use design tokens (no hard-coded colors/spacing), validate WCAG AA accessibility, and verify consistent spacing scales. Report any violations with specific line numbers.",
  "mcp_servers": ["design-system"]
}
```

**Usage:**
```bash
claude-code --agent design-guardian
# Then: "Review all components for design compliance"
```

---

## 🔄 Multi-Agent Orchestration

### Pattern 1: Sequential Review Pipeline

```
User: "Review and fix my code"
  ↓
Main Claude: Creates pipeline:
  1. Code Review Agent → Finds 5 issues
  2. Testing Agent → Coverage 65% ❌
  3. Design Agent → 3 token violations
  ↓
Main Claude: Prioritizes and routes to Developer Agent
  ↓
Developer Agent: Fixes issues
  ↓
Re-run agents → All pass ✅
```

### Pattern 2: Parallel Review

```
User: "Quick health check"
  ↓
Main Claude: Launches 3 agents simultaneously:
  - Code Review Agent → Linting
  - Testing Agent → Coverage
  - Design Agent → Token validation
  ↓
Main Claude: Aggregates results in 1 response
```

### Pattern 3: Iterative Refinement

```
User: "Build a login form"
  ↓
1. Developer Agent → Builds component
2. Design Agent → Reviews
   - Hard-coded colors found ❌
3. Developer Agent → Fixes
4. Design Agent → Re-reviews
   - Tokens used correctly ✅
5. Testing Agent → Checks tests
   - Coverage 45% ❌
6. Developer Agent → Adds tests
7. Testing Agent → Re-checks
   - Coverage 85% ✅
8. Code Review Agent → Final scan
   - All clean ✅
```

---

## 📊 Interpreting Results

### Lint Results

```json
{
  "issues": [
    {
      "line": 42,
      "column": 10,
      "rule": "no-unused-vars",
      "severity": "error",
      "message": "Variable 'foo' is defined but never used"
    }
  ]
}
```

**Action:** Fix unused variables

### Security Scan Results

```json
{
  "vulnerabilities": [
    {
      "severity": "high",
      "file": "api/auth.js",
      "line": 15,
      "rule": "sql-injection",
      "message": "Possible SQL injection"
    }
  ]
}
```

**Action:** Use parameterized queries immediately

### Coverage Results

```json
{
  "coverage": {
    "lines": 65.5,
    "functions": 70.2,
    "branches": 58.3
  },
  "meetsThreshold": false
}
```

**Action:** Add tests for uncovered code

### Design Token Results

```json
{
  "errors": [],
  "warnings": [
    {
      "rule": "token_usage",
      "message": "Found 5 hard-coded color values"
    }
  ]
}
```

**Action:** Replace hard-coded values with tokens

---

## ⚡ Tips & Tricks

### 1. Batch Operations

Instead of:
```
"Lint file1.ts"
"Lint file2.ts"
"Lint file3.ts"
```

Do:
```
"Lint all TypeScript files in src/"
```

### 2. Set Quality Gates

```
"Before merging, ensure:
- Zero lint errors
- 80%+ coverage
- No high/critical security issues
- All components use design tokens"
```

### 3. Use Agents for Specialized Tasks

```bash
# Instead of general prompt
"Review my code"

# Use specialized agent
claude-code --agent security-reviewer
"Focus on security vulnerabilities"
```

### 4. Save Common Workflows

Create shell aliases:
```bash
alias review-pr="claude-code 'Run full review: lint, security, tests, design'"
alias quick-check="claude-code 'Quick health check: lint and tests only'"
alias security-audit="claude-code --agent security-reviewer 'Full security scan'"
```

### 5. Combine with CI/CD

```yaml
# .github/workflows/mcp-review.yml
- name: MCP Review
  run: |
    claude-code --agent code-reviewer "Review PR changes"
    claude-code --agent test-enforcer "Ensure 80% coverage"
```

---

## 🐛 Quick Troubleshooting

| Issue | Quick Fix |
|-------|-----------|
| Tools not showing | Restart Claude Desktop |
| "Module not found" | `npm install && npm run build` |
| Lint errors | Install tool: `npm i -g eslint` |
| Permission denied | `chmod +x build/index.js` |
| Wrong Node version | `nvm use 20` |

---

## 🤖 Example Agent Configurations

Want pre-configured agents that use these MCP tools? Check out our example agents:

👉 **[Example MCP Agents](../examples/agents/mcp-agents/)** - 8 ready-to-use agent configurations

Quick install:
```bash
# Install example agents
cp ../examples/agents/mcp-agents/*.json ~/.claude/agents/

# Use them
claude --agent security-reviewer
claude --agent test-quality-enforcer
claude --agent api-specialist
```

Available agents:
- **Security Reviewer** - Automated security scanning
- **Test Quality Enforcer** - Test coverage and quality gates
- **Design System Guardian** - UI consistency validation
- **Performance Optimizer** - Performance analysis
- **Full Stack Reviewer** - Comprehensive code review
- **API Specialist** - API testing and validation
- **UI/UX Reviewer** - Design review from screenshots
- **UI/UX Design Critic** - Expert design critique

Each includes complete usage examples and customization guides.

---

## 📚 Next Steps

✅ Now you're ready to use the system!

**Learn more:**
- [README.md](./README.md) - Detailed features and workflows
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical deep dive
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Extend and customize
- [Example Agents](../examples/agents/mcp-agents/) - Pre-configured agent examples

**Practice workflows:**
1. Start with simple single-tool commands
2. Try example agent configurations
3. Progress to multi-step reviews
4. Create custom agents for your workflow
5. Build orchestrated multi-agent pipelines

Happy coding! 🚀
