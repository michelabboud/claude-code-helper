# Code Review MCP Server

Comprehensive code quality analysis, linting, security scanning, and duplicate detection tools for software development projects.

---

## 🎯 Features

### 4 Specialized Tools

| Tool | Purpose | Key Features |
|------|---------|--------------|
| **lint_file** | Run linters on files | ESLint, Pylint, Rubocop with auto-fix support |
| **security_scan** | Security vulnerability scanning | Bandit, Semgrep, Snyk with severity filtering |
| **analyze_complexity** | Code complexity metrics | Cyclomatic complexity, maintainability index, LOC |
| **find_duplicates** | Duplicate code detection | Cross-file duplicate detection, refactoring opportunities |

---

## 📦 Installation

```bash
cd code-review-mcp
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
    "code-review": {
      "command": "node",
      "args": ["/absolute/path/to/code-review-mcp/build/index.js"]
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
      "name": "code-review",
      "command": "node",
      "args": ["/absolute/path/to/code-review-mcp/build/index.js"]
    }
  ]
}
```

---

## 🚀 Usage Examples

### 1. Lint a File

```javascript
{
  "tool": "lint_file",
  "args": {
    "filePath": "./src/index.js",
    "linter": "eslint",
    "fixable": true
  }
}
```

**Supported Linters:**
- **ESLint** - JavaScript/TypeScript linting
- **Pylint** - Python code analysis
- **Rubocop** - Ruby style checking

**Auto-fix:** Set `fixable: true` to automatically fix issues (when supported by the linter)

**Output:**
```json
{
  "issues": [
    {
      "line": 42,
      "column": 10,
      "severity": "error",
      "message": "Unexpected console statement",
      "rule": "no-console"
    }
  ],
  "summary": {
    "errors": 1,
    "warnings": 3,
    "fixed": 2
  }
}
```

---

### 2. Security Scan

```javascript
{
  "tool": "security_scan",
  "args": {
    "targetPath": "./src",
    "scanner": "semgrep",
    "severity": "high"
  }
}
```

**Supported Scanners:**
- **Bandit** - Python security linter
- **Semgrep** - Multi-language security scanning
- **Snyk** - Vulnerability and dependency scanning

**Severity Levels:** `low`, `medium`, `high`, `critical`

**Output:**
```json
{
  "vulnerabilities": [
    {
      "file": "src/auth.py",
      "line": 15,
      "severity": "high",
      "title": "SQL Injection Risk",
      "description": "User input directly concatenated into SQL query",
      "cwe": "CWE-89"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 3,
    "low": 5
  }
}
```

---

### 3. Analyze Code Complexity

```javascript
{
  "tool": "analyze_complexity",
  "args": {
    "filePath": "./src/utils.js",
    "language": "javascript"
  }
}
```

**Supported Languages:** `javascript`, `python`, `java`

**Metrics Analyzed:**
- **Cyclomatic Complexity** - Number of independent paths
- **Maintainability Index** - Overall maintainability score (0-100)
- **Lines of Code** - Total, source, and comment lines
- **Function Count** - Number of functions/methods
- **Average Complexity** - Mean complexity per function

**Output:**
```json
{
  "file": "src/utils.js",
  "complexity": {
    "cyclomatic": 8,
    "maintainability": 72,
    "linesOfCode": {
      "total": 150,
      "source": 120,
      "comments": 30
    },
    "functions": 12,
    "averageComplexity": 4.2
  },
  "hotspots": [
    {
      "function": "processData",
      "line": 45,
      "complexity": 15,
      "recommendation": "Consider refactoring - complexity exceeds threshold of 10"
    }
  ]
}
```

---

### 4. Find Duplicate Code

```javascript
{
  "tool": "find_duplicates",
  "args": {
    "directory": "./src",
    "minLines": 5
  }
}
```

**Parameters:**
- `directory` - Root directory to scan
- `minLines` - Minimum lines for duplicate detection (default: 5)

**Output:**
```json
{
  "duplicates": [
    {
      "lines": 12,
      "occurrences": 3,
      "files": [
        "src/auth.js:45-57",
        "src/admin.js:23-35",
        "src/user.js:67-79"
      ],
      "snippet": "function validateUser(user) { ... }",
      "recommendation": "Extract to shared utility function"
    }
  ],
  "summary": {
    "totalDuplicates": 5,
    "duplicatedLines": 78,
    "potentialSavings": "520 lines"
  }
}
```

---

## 🔧 External Tool Requirements

This MCP server requires external linting and security tools to be installed:

### Linters

**ESLint (JavaScript/TypeScript):**
```bash
npm install -g eslint
```

**Pylint (Python):**
```bash
pip install pylint
```

**Rubocop (Ruby):**
```bash
gem install rubocop
```

### Security Scanners

**Bandit (Python):**
```bash
pip install bandit
```

**Semgrep (Multi-language):**
```bash
brew install semgrep  # macOS
# or
pip install semgrep
```

**Snyk (All languages):**
```bash
npm install -g snyk
snyk auth  # Requires account
```

**Note:** The MCP server will work without these tools installed, but will return helpful error messages indicating which tools are missing when you try to use specific features.

---

## 💡 Best Practices

### 1. Start with Linting

Run linters first to catch basic code quality issues:
```
"Lint all JavaScript files in src/ using ESLint with auto-fix"
```

### 2. Security Scan Critical Paths

Focus security scans on authentication and data handling code:
```
"Run Semgrep security scan on src/auth/ and src/api/ for high severity issues"
```

### 3. Monitor Complexity

Track complexity metrics to identify refactoring opportunities:
```
"Analyze complexity of src/controllers/ and flag functions with complexity > 10"
```

### 4. Eliminate Duplicates

Regular duplicate detection helps maintain DRY principles:
```
"Find duplicate code blocks in src/ with minimum 8 lines"
```

---

## 🎯 Common Workflows

### Pre-Commit Quality Check

```
"Run a complete code review check:
1. Lint all changed files with ESLint (auto-fix enabled)
2. Security scan the src/ directory with Semgrep
3. Check complexity of modified files
4. Find duplicates in the codebase
Summarize all issues found"
```

### Security Audit

```
"Perform security audit:
1. Scan with Semgrep for all severities
2. Scan with Bandit (Python files)
3. Run Snyk for dependency vulnerabilities
Report all critical and high severity issues"
```

### Code Quality Report

```
"Generate code quality report:
1. Analyze complexity of all source files
2. Identify functions with complexity > 15
3. Find duplicate code blocks (min 10 lines)
4. Provide refactoring recommendations"
```

---

## 🚨 Limitations

- External tools (ESLint, Pylint, etc.) must be installed separately
- Complexity analysis accuracy varies by language
- Duplicate detection is based on exact text matching (not semantic analysis)
- Security scans require tool-specific configuration files for best results

---

## 🤝 Integration with Other MCPs

Works great with:
- **Testing MCP:** Combine linting with test execution
- **API Specialist MCP:** Security scan API endpoints
- **Design System MCP:** Code quality for component libraries

---

## 📊 Example Agent Configuration

See `../../agents/mcp-integrated/security-reviewer.json` for a pre-configured agent that uses this MCP server for security-focused code review.

---

Happy code reviewing! 🔍

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 14+ skills, 11 MCP servers, and comprehensive guides.
