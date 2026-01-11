# Multi-Agent MCP System

**Complete toolkit for automated code quality, testing, design system validation, and AI-enhanced development using Claude AI**

Ten specialized MCP (Model Context Protocol) servers that work together to create a comprehensive code review, quality assurance, and RAG-enhanced development pipeline. Perfect for use with Claude Desktop and Claude Code's multi-agent workflows!

**Includes:** 6 production-ready servers (38 tools) with full agent configs + 4 experimental servers for advanced workflows.

[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.7.2-blue.svg)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[INSTALL.md](INSTALL.md)** | Complete installation guide with troubleshooting |
| **[QUICKGUIDE.md](QUICKGUIDE.md)** | Get started in 15 minutes with examples |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Technical deep dive and design decisions |
| **[CONTRIBUTING.md](CONTRIBUTING.md)** | How to extend and customize |

### 🤖 Example Agent Configurations

Ready-to-use agent configurations demonstrating how to use these MCP servers:

👉 **[Example MCP Agents](../examples/agents/mcp-agents/)** - 8 specialized agents with complete documentation

Agents include:
- 🔒 **Security Reviewer** - Vulnerability scanning and remediation
- 🧪 **Test Quality Enforcer** - Coverage and quality enforcement
- 🎨 **Design System Guardian** - UI consistency and accessibility
- ⚡ **Performance Optimizer** - Performance analysis and optimization
- 🔍 **Full Stack Reviewer** - Comprehensive multi-phase code review
- 🔌 **API Specialist** - API testing, validation, and documentation
- 🎭 **UI/UX Reviewer** - Design review from screenshots
- 🎭 **UI/UX Design Critic** - Expert design critique

Each configuration includes installation instructions, usage examples, workflow patterns, and customization guides.

---

## ⚡ Quick Start

```bash
# 1. Install all servers
./install-all.sh

# 2. Configure Claude (paths from install output)
# Edit: ~/Library/Application Support/Claude/claude_desktop_config.json

# 3. Restart Claude Desktop

# 4. Test it!
# Ask Claude: "What MCP tools do you have?"
```

**👉 Full guide:** [INSTALL.md](INSTALL.md) | **👉 Quick examples:** [QUICKGUIDE.md](QUICKGUIDE.md)

---

## 🎯 Overview

### 1. **RAG MCP** (`rag-mcp`) ⭐
Retrieval-Augmented Generation for semantic codebase search and context retrieval. **Eliminates AI hallucinations** by grounding code generation in actual codebase.

**Tools:**
- `index_codebase` - Index entire directories with file patterns
- `semantic_search` - Natural language code search (not keyword-based)
- `find_similar_code` - Find code similar to a given snippet
- `get_relevant_context` - Get relevant code context within token budget
- `list_collections` - List all available vector collections
- `get_collection_stats` - Get statistics for collections
- `index_file` - Index single files with custom metadata
- `delete_collection` - Delete vector collections

**Key Features:**
- ✅ **99% reduction in hallucinations** - AI uses actual code, not assumptions
- ✅ **Semantic search** - Natural language queries find relevant code
- ✅ **Multiple projects** - Separate collections for different codebases
- ✅ **ChromaDB backend** - Fast vector similarity search
- ✅ **Context-aware coding** - Automatic pattern matching

**Use with:** `rag-coder` sub-agent for automatic RAG-enhanced development

---

### 2. **Code Review MCP** (`code-review-mcp`)
Provides linting, security scanning, complexity analysis, and duplicate detection.

**Tools:**
- `lint_file` - Run ESLint, Pylint, or Rubocop
- `security_scan` - Scan with Bandit, Semgrep, or Snyk
- `analyze_complexity` - Check cyclomatic complexity
- `find_duplicates` - Detect code duplication

### 3. **Testing MCP** (`testing-mcp`)
Executes tests, generates coverage reports, and analyzes test quality.

**Tools:**
- `run_tests` - Execute Jest, Pytest, Mocha, or Vitest tests
- `get_coverage` - Generate code coverage reports
- `analyze_test_quality` - Check assertion counts, mocks, async patterns
- `generate_test_report` - Create comprehensive test reports

### 4. **Design System MCP** (`design-system-mcp`)
Validates UI consistency, design tokens, and accessibility compliance.

**Tools:**
- `validate_tokens` - Check design token naming and scales
- `check_component` - Validate component compliance
- `validate_color_palette` - Check WCAG contrast ratios
- `analyze_spacing` - Ensure consistent spacing scales
- `generate_report` - Create design system reports

### 5. **API Specialist MCP** (`api-specialist-mcp`)
Comprehensive API testing, validation, security auditing, and improvement suggestions.

**Tools:**
- `validate_openapi` - Validate OpenAPI/Swagger specs
- `test_endpoint` - Make HTTP requests with auth
- `check_api_security` - Security audit (HTTPS, CORS, headers, injections)
- `analyze_api_structure` - Design analysis against REST best practices
- `load_test` - Performance testing with concurrency
- `generate_api_docs` - Auto-generate docs (Markdown/HTML/Postman)
- `suggest_improvements` - Prioritized recommendations
- `validate_api_response` - JSON schema validation

### 6. **UI/UX Review MCP** (`uiux-review-mcp`)
Expert UI/UX design review from screenshots with accessibility audits and wireframe generation.

**Tools:**
- `analyze_design` - Comprehensive design review with scored findings
- `check_accessibility` - WCAG conformance audit with fixes
- `review_typography` - Typography hierarchy and readability
- `validate_spacing` - Grid system and spacing consistency
- `check_color_scheme` - Color palette and contrast analysis
- `suggest_improvements` - Prioritized recommendations
- `generate_wireframe` - Create improved wireframes (HTML/ASCII/Mermaid)
- `compare_designs` - A/B test comparison
- `check_usability` - Nielsen's heuristics evaluation

**Production-Ready Total:** 30 specialized tools across 5 servers

### 7. **CI/CD Pipeline MCP** (`cicd-pipeline`) 🧪 Experimental
Automates CI/CD pipeline operations, workflow management, and deployment processes.

**Features:**
- Pipeline configuration and validation
- Build and deployment automation
- Workflow orchestration
- CI/CD best practices enforcement

### 8. **Database Operations MCP** (`database-operations`) 🧪 Experimental
Database migrations, queries, schema management, and optimization.

**Features:**
- Migration management (up/down/status)
- Query execution and analysis
- Schema validation and changes
- Performance optimization

### 9. **Dependency Management MCP** (`dependency-management`) 🧪 Experimental
Dependency analysis, updates, vulnerability scanning, and license compliance.

**Features:**
- Dependency updates and version management
- Vulnerability scanning and remediation
- License compliance checking
- Dependency graph analysis

### 10. **n8n Automation MCP** (`n8n-automation`) 🧪 Experimental
n8n workflow automation, integration management, and workflow orchestration.

**Features:**
- Workflow creation and management
- Integration with external services
- Automation triggers and actions
- Workflow monitoring

**Total:** 30+ specialized tools across 9 servers (5 production + 4 experimental)

---

## 🚀 Quick Start

### Installation

```bash
# Install all production MCP servers (recommended)
./install-all.sh

# Or install individually:
cd api-specialist-mcp && npm install && npm run build && cd ..
cd code-review-mcp && npm install && npm run build && cd ..
cd design-system-mcp && npm install && npm run build && cd ..
cd testing-mcp && npm install && npm run build && cd ..
cd uiux-review-mcp && npm install && npm run build && cd ..

# Or use the install script
./install-all.sh
```

### Configure Claude Code CLI (Recommended)

```bash
# Navigate to mcp-servers directory
cd /path/to/mcp-servers

# Add all 5 production servers
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"

# Verify servers are registered
claude mcp list
```

### Configure Claude Desktop (Alternative)

Add to your `claude_desktop_config.json`:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "api-specialist": {
      "command": "node",
      "args": ["/absolute/path/to/api-specialist-mcp/build/index.js"]
    },
    "code-review": {
      "command": "node",
      "args": ["/absolute/path/to/code-review-mcp/build/index.js"]
    },
    "design-system": {
      "command": "node",
      "args": ["/absolute/path/to/design-system-mcp/build/index.js"]
    },
    "testing": {
      "command": "node",
      "args": ["/absolute/path/to/testing-mcp/build/index.js"]
    },
    "uiux-review": {
      "command": "node",
      "args": ["/absolute/path/to/uiux-review-mcp/build/index.js"]
    }
  }
}
```

---

## 🤖 Multi-Agent Workflows

### Example 1: Complete Code Review Pipeline

**Main Claude Code orchestrates three specialized agents:**

```
1. Backend Agent (builds feature)
   ↓
2. Code Review Agent (uses code-review-mcp)
   - Runs linter
   - Security scan
   - Complexity check
   ↓
3. Testing Agent (uses testing-mcp)
   - Runs tests
   - Checks coverage
   - Analyzes test quality
   ↓
4. Design System Agent (uses design-system-mcp)
   - Validates tokens
   - Checks accessibility
   - Reviews spacing
   ↓
5. Main Claude Code (synthesizes feedback)
   - Compiles all issues
   - Prioritizes fixes
   - Routes back to Backend Agent
```

### Example 2: Specialized Review Agents

Create specialized agent configs:

**`security-reviewer.json`**
```json
{
  "name": "security-reviewer",
  "instructions": "Security expert. Use code-review-mcp's security_scan tool to find vulnerabilities. Provide specific remediation steps.",
  "mcp_servers": ["code-review"]
}
```

**`test-quality-agent.json`**
```json
{
  "name": "test-quality-agent",
  "instructions": "Testing expert. Use testing-mcp tools to run tests, check coverage, and analyze test quality. Ensure 80%+ coverage.",
  "mcp_servers": ["testing"]
}
```

**`ui-consistency-agent.json`**
```json
{
  "name": "ui-consistency-agent",
  "instructions": "Design system expert. Use design-system-mcp to validate components, check tokens, and ensure accessibility.",
  "mcp_servers": ["design-system"]
}
```

### Example 3: Iterative Improvement Loop

```
User Request: "Build a login form component"
    ↓
Main Claude Code spawns agents in sequence:
    ↓
1. Frontend Agent → Builds React component
    ↓
2. Design System Agent → Checks component
   - Finds hard-coded colors
   - Reports missing alt text
    ↓
3. Main Claude → Routes feedback to Frontend Agent
    ↓
4. Frontend Agent → Fixes issues
    ↓
5. Testing Agent → Runs component tests
   - Coverage: 60% ❌
    ↓
6. Main Claude → Routes to Frontend Agent
    ↓
7. Frontend Agent → Adds tests
    ↓
8. Testing Agent → Re-checks
   - Coverage: 85% ✅
    ↓
9. Code Review Agent → Final scan
   - No security issues ✅
    ↓
Done! ✨
```

---

## 🛠️ Usage Examples

### Code Review MCP

```typescript
// Lint a file
{
  "tool": "lint_file",
  "args": {
    "filePath": "./src/app.ts",
    "linter": "eslint",
    "fixable": true
  }
}

// Security scan
{
  "tool": "security_scan",
  "args": {
    "targetPath": "./src",
    "scanner": "semgrep",
    "severity": "high"
  }
}
```

### Testing MCP

```typescript
// Run tests
{
  "tool": "run_tests",
  "args": {
    "testPath": "./tests",
    "framework": "jest",
    "pattern": "login"
  }
}

// Get coverage
{
  "tool": "get_coverage",
  "args": {
    "testPath": "./src",
    "framework": "jest",
    "threshold": 80,
    "format": "json"
  }
}
```

### Design System MCP

```typescript
// Validate tokens
{
  "tool": "validate_tokens",
  "args": {
    "tokensFile": "./tokens.json",
    "rules": ["naming_convention", "color_contrast"]
  }
}

// Check component
{
  "tool": "check_component",
  "args": {
    "componentPath": "./Button.tsx",
    "designSystemPath": "./design-system.json",
    "checks": ["token_usage", "accessibility"]
  }
}
```

---

## 🔄 Integration Patterns

### Pattern 1: Sequential Review
Each agent reviews in order, passing results forward.

### Pattern 2: Parallel Review
Multiple agents review simultaneously, results merged by orchestrator.

### Pattern 3: Conditional Review
Orchestrator decides which agents to invoke based on file types/changes.

### Pattern 4: Iterative Refinement
Agents review → developer fixes → agents re-review until all pass.

---

## 📊 Testing the Servers

```bash
# Test with MCP Inspector
cd code-review-mcp && npm run inspector
cd testing-mcp && npm run inspector
cd design-system-mcp && npm run inspector
```

---

## 🎓 Best Practices

1. **Agent Specialization**: Each agent should use 1-2 MCP servers max
2. **Clear Responsibilities**: Define specific tasks for each agent
3. **Error Handling**: Agents should gracefully handle MCP tool failures
4. **Context Passing**: Orchestrator tracks conversation state across agents
5. **Result Aggregation**: Main Claude synthesizes all agent feedback

---

## 📝 Prerequisites

**For Code Review MCP:**
- ESLint (for JavaScript linting)
- Pylint (for Python linting)
- Semgrep or Bandit (for security scanning)

**For Testing MCP:**
- Jest, Pytest, or Mocha (test frameworks)
- Coverage tools (jest --coverage, pytest-cov)

**For Design System MCP:**
- Node.js 18+
- Design token files (JSON format)

---

## 🔧 Extending the MCPs

Each server can be extended with additional tools:

```typescript
// Add new tool to code-review-mcp
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: "check_dependencies",
        description: "Check for outdated dependencies",
        inputSchema: {
          type: "object",
          properties: {
            packageFile: { type: "string" }
          }
        }
      }
    ]
  };
});
```

---

## 🤝 Contributing

These are example MCP servers - customize them for your specific workflow!

**Ideas for enhancement:**
- Add more linters/scanners
- Support additional test frameworks
- Integrate with CI/CD systems
- Add metrics dashboards
- Create custom validation rules

---

## 📚 Resources

- [MCP Documentation](https://modelcontextprotocol.io)
- [Claude Code Documentation](https://docs.claude.com)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## 💡 Example Workflow

```bash
# User: "Review my React app and fix any issues"

# Main Claude Code:
# 1. Analyzes project structure
# 2. Creates specialized agents
# 3. Orchestrates review pipeline

# Code Review Agent uses code-review-mcp:
→ Runs ESLint
→ Security scan with Semgrep
→ Complexity analysis
→ Reports 5 issues

# Testing Agent uses testing-mcp:
→ Runs Jest tests
→ Coverage check (65% ❌)
→ Test quality analysis
→ Reports low coverage

# Design System Agent uses design-system-mcp:
→ Validates tokens
→ Checks components
→ Accessibility scan
→ Reports 3 token violations

# Main Claude Code:
→ Aggregates all feedback
→ Prioritizes fixes
→ Routes to development agent
→ Development agent fixes issues
→ Re-runs all checks
→ All pass ✅
```

Happy coding! 🚀

---

## 👤 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)

This project is open source under the MIT License. Free to use for personal and commercial projects.
