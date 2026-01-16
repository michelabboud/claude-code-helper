# Example Agent Configurations

Pre-configured specialized agents for common workflows.

**12 specialized agents** for different aspects of software development:
- **8 Production agents** (fully tested with agent configs)
- **4 Experimental agents** (new, under active development)

---

## Production Agents (8)

### 🔒 Security Reviewer
**File:** `security-reviewer.json`

**Purpose:** Security vulnerability scanning and remediation

**Uses:** Code Review MCP (security_scan tool)

**Best for:**
- Security audits
- Pre-deployment scans
- API endpoint reviews
- Critical code paths

**Example usage:**
```bash
claude-code --agent security-reviewer
# Prompt: "Scan the ./api directory for security issues"
```

---

### 🧪 Test Quality Enforcer
**File:** `test-quality-enforcer.json`

**Purpose:** Ensure comprehensive test coverage and quality

**Uses:** Testing MCP (all tools)

**Best for:**
- Pre-merge quality gates
- Test coverage analysis
- Identifying flaky tests
- Test suite improvements

**Example usage:**
```bash
claude-code --agent test-quality-enforcer
# Prompt: "Ensure my app meets testing standards"
```

---

### 🎨 Design System Guardian
**File:** `design-system-guardian.json`

**Purpose:** Validate UI consistency and accessibility

**Uses:** Design System MCP (all tools)

**Best for:**
- Component library validation
- Accessibility compliance
- Design token enforcement
- Brand consistency

**Example usage:**
```bash
claude-code --agent design-system-guardian
# Prompt: "Review all components for design compliance"
```

---

### ⚡ Performance Optimizer
**File:** `performance-optimizer.json`

**Purpose:** Identify and fix performance bottlenecks

**Uses:** Code Review MCP (complexity, duplicates) + Testing MCP

**Best for:**
- Performance reviews
- Code optimization
- Complexity reduction
- Bundle size reduction

**Example usage:**
```bash
claude-code --agent performance-optimizer
# Prompt: "Find performance issues in my app"
```

---

### 🔍 Full Stack Reviewer
**File:** `full-stack-reviewer.json`

**Purpose:** Comprehensive multi-phase code review

**Uses:** All three MCP servers

**Best for:**
- Complete PR reviews
- Pre-production checks
- Quality gate enforcement
- Comprehensive audits

**Example usage:**
```bash
claude-code --agent full-stack-reviewer
# Prompt: "Review my changes comprehensively"
```

---

### 🔌 API Specialist
**File:** `api-specialist.json`

**Purpose:** Comprehensive API testing, validation, and security

**Uses:** API Specialist MCP (all tools)

**Best for:**
- API security audits
- OpenAPI spec validation
- Endpoint testing with auth
- Load testing and performance
- API design review
- Documentation generation

**Example usage:**
```bash
claude-code --agent api-specialist
# Prompt: "Audit my API at https://api.example.com"
```

---

### 🎭 UI/UX Reviewer
**File:** `uiux-reviewer.json`

**Purpose:** Comprehensive UI/UX design review from screenshots

**Uses:** UI/UX Review MCP (all tools)

**Best for:**
- Design review from screenshots
- WCAG accessibility audits
- Typography and spacing analysis
- Color scheme validation
- Usability heuristics evaluation

**Example usage:**
```bash
claude-code --agent uiux-reviewer
# Prompt: "Review this design screenshot for accessibility"
```

---

### 🎨 UI/UX Design Critic
**File:** `uiux-design-critic.json`

**Purpose:** Expert design critique with actionable recommendations

**Uses:** UI/UX Review MCP (all tools)

**Best for:**
- Professional design critique
- Wireframe generation
- Design comparison (A/B testing)
- Comprehensive improvement suggestions
- Design system validation

**Example usage:**
```bash
claude-code --agent uiux-design-critic
# Prompt: "Critique this landing page design and suggest improvements"
```

---

## Experimental Agents (4) 🧪

These agents are newly created for experimental MCP servers. Full documentation and testing coming soon.

### 🚀 CI/CD Engineer
**File:** `cicd-engineer.json`

**Purpose:** CI/CD pipeline generation, optimization, and troubleshooting

**Uses:** CI/CD Pipeline MCP (8 tools)

**Best for:**
- Generating CI/CD configs (GitHub Actions, GitLab CI, Jenkins)
- Pipeline optimization and cost reduction
- Troubleshooting failed builds
- Security scanning integration
- Deployment strategies (blue-green, canary, rolling)

**Example usage:**
```bash
claude-code --agent cicd-engineer
# Prompt: "Generate a GitHub Actions pipeline for my Node.js app"
```

---

### 🗄️ Database Engineer
**File:** `database-engineer.json`

**Purpose:** Database schema management, migrations, and query optimization

**Uses:** Database Operations MCP (8 tools)

**Best for:**
- Writing and optimizing SQL queries
- Generating and validating migrations
- Schema analysis and design
- Database backup strategies
- Query performance tuning

**Example usage:**
```bash
claude-code --agent database-engineer
# Prompt: "Generate a migration to add user_roles table"
```

---

### 📦 Dependency Manager
**File:** `dependency-manager.json`

**Purpose:** Dependency security, updates, licenses, and optimization

**Uses:** Dependency Management MCP (8 tools)

**Best for:**
- Security vulnerability scanning
- Dependency update recommendations
- License compliance checking
- Bundle size optimization
- Removing unused dependencies

**Example usage:**
```bash
claude-code --agent dependency-manager
# Prompt: "Scan my dependencies for security vulnerabilities"
```

---

### 🔄 Automation Architect
**File:** `automation-architect.json`

**Purpose:** n8n workflow automation design and optimization

**Uses:** n8n Automation MCP (6 tools)

**Best for:**
- Designing n8n workflows
- Optimizing automation performance
- Troubleshooting workflow failures
- Data transformation workflows
- Service integration suggestions

**Example usage:**
```bash
claude-code --agent automation-architect
# Prompt: "Create an n8n workflow to sync data from Airtable to Notion"
```

---

## Using Agents

### With Claude Code

```bash
# Use a specific agent
claude-code --agent full-stack-reviewer

# Or specify path
claude-code --agent ./example-agents/security-reviewer.json
```

### With Claude Desktop

Agents work automatically through conversation:
```
You: "Act as a security reviewer and scan my code"
Claude: [Uses security tools automatically]
```

### Configuration Location

**For Claude Code:**
- Copy to: `~/.claude-code/agents/`
- Or use directly: `--agent ./example-agents/security-reviewer.json`

**Structure:**
```
~/.claude/
└── agents/
    ├── Production Agents (8):
    │   ├── security-reviewer.json
    │   ├── test-quality-enforcer.json
    │   ├── design-system-guardian.json
    │   ├── performance-optimizer.json
    │   ├── full-stack-reviewer.json
    │   ├── api-specialist.json
    │   ├── uiux-reviewer.json
    │   └── uiux-design-critic.json
    └── Experimental Agents (4):
        ├── cicd-engineer.json
        ├── database-engineer.json
        ├── dependency-manager.json
        └── automation-architect.json
```

---

## Creating Custom Agents

### Agent Configuration Schema

```json
{
  "name": "agent-name",
  "description": "Brief description",
  "instructions": "Detailed role and responsibilities",
  "mcp_servers": ["server1", "server2"],
  "temperature": 0.7,
  "max_tokens": 4000
}
```

### Fields Explained

- **name:** Unique identifier (lowercase-with-hyphens)
- **description:** One-line summary
- **instructions:** Detailed prompt defining behavior
- **mcp_servers:** Which MCP servers to use (subset of available)
- **temperature:** 0.0-1.0 (lower = more focused)
- **max_tokens:** Output limit (optional)

### Best Practices

1. **Clear Role Definition**
   ```json
   "instructions": "You are a [specific role]. Your responsibilities: ..."
   ```

2. **Specific Tool Usage**
   ```json
   "Use the security_scan tool to find vulnerabilities"
   ```

3. **Quality Criteria**
   ```json
   "Do not approve code with <80% coverage"
   ```

4. **Output Format**
   ```json
   "Provide: 1. Summary, 2. Issues list, 3. Recommendations"
   ```

---

## Agent Combinations

### Sequential Pipeline

```bash
# Run agents in sequence
claude-code --agent security-reviewer
claude-code --agent test-quality-enforcer
claude-code --agent design-system-guardian
```

### Parallel Review

```bash
# Use full-stack-reviewer for comprehensive parallel checks
claude-code --agent full-stack-reviewer
```

### Custom Workflow

Create a custom orchestration agent:

```json
{
  "name": "pr-review-pipeline",
  "instructions": "You orchestrate a PR review. First invoke security-reviewer, then test-quality-enforcer, then design-system-guardian. Aggregate all findings and provide a pass/fail decision.",
  "mcp_servers": ["code-review", "testing", "design-system"]
}
```

---

## Example Workflows

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running security scan..."
claude-code --agent security-reviewer --auto-approve

echo "Checking test coverage..."
claude-code --agent test-quality-enforcer --auto-approve

if [ $? -eq 0 ]; then
  echo "✅ All checks passed!"
else
  echo "❌ Checks failed. Commit aborted."
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/review.yml
- name: Code Review
  run: |
    claude-code --agent full-stack-reviewer \
      --prompt "Review all changes in this PR" \
      --output report.md

- name: Upload Report
  uses: actions/upload-artifact@v2
  with:
    name: review-report
    path: report.md
```

### Daily Audit

```bash
#!/bin/bash
# daily-audit.sh

echo "Running daily security audit..."
claude-code --agent security-reviewer \
  --prompt "Scan entire codebase for vulnerabilities"

echo "Checking test coverage trends..."
claude-code --agent test-quality-enforcer \
  --prompt "Analyze test coverage for all modules"

echo "Design system compliance check..."
claude-code --agent design-system-guardian \
  --prompt "Validate all components against design system"
```

---

## Customization Tips

### Adjust Strictness

**Lenient:**
```json
{
  "temperature": 0.7,
  "instructions": "Be flexible with minor issues..."
}
```

**Strict:**
```json
{
  "temperature": 0.2,
  "instructions": "Zero tolerance for violations..."
}
```

### Domain-Specific

```json
{
  "name": "api-security-specialist",
  "instructions": "Focus exclusively on API endpoints. Check authentication, authorization, rate limiting, input validation...",
  "mcp_servers": ["code-review"]
}
```

### Project-Specific

```json
{
  "name": "acme-corp-reviewer",
  "instructions": "Follow ACME Corp standards: 90% coverage, ESLint airbnb config, Material UI tokens only...",
  "mcp_servers": ["code-review", "testing", "design-system"]
}
```

---

## Troubleshooting

### Agent Not Found

```bash
# Check path
ls -la ~/.claude-code/agents/

# Use full path
claude-code --agent /full/path/to/agent.json
```

### Agent Not Using Tools

Ensure:
1. MCP servers are configured
2. Agent lists correct `mcp_servers`
3. Instructions mention specific tools

### Agent Too Verbose

Lower temperature:
```json
{
  "temperature": 0.2
}
```

### Agent Missing Issues

Raise temperature and be more specific:
```json
{
  "temperature": 0.5,
  "instructions": "Be thorough and check for: [specific list]"
}
```

---

## Contributing Agents

Have a useful agent configuration? Share it!

**To contribute:**
1. Test thoroughly with real projects
2. Document use cases clearly
3. Include example prompts
4. Specify prerequisites

---

## Resources

- **Agent Design Guide:** See CONTRIBUTING.md
- **MCP Server Docs:** See ARCHITECTURE.md
- **Quick Start:** See QUICKGUIDE.md

---

Build amazing specialized agents! 🤖

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** MIT

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
