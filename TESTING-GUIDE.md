# Comprehensive Testing Guide

**Purpose:** Validate that all installed components work correctly
**Version:** v1.3.0
**Date:** 2026-01-11
**Components to Test:** 11 MCP servers (68 tools), 60 agents, 14 skills

---

## 📋 Testing Overview

This guide provides specific test prompts and validation criteria for every component in the claude-code-helper toolkit.

### Testing Strategy

```
Phase 1: Prerequisites & Setup (10 min)
Phase 2: MCP Tools Testing (60 min)
Phase 3: Agent Testing (45 min)
Phase 4: Skill Testing (30 min)
Phase 5: Command Testing (15 min)
Phase 6: Integration Testing (30 min)

Total Estimated Time: 3 hours
```

### Test Result Legend

- ✅ **PASS** - Feature works as expected
- ⚠️ **PARTIAL** - Feature works with issues
- ❌ **FAIL** - Feature does not work
- ⏭️ **SKIP** - Test skipped (optional/not applicable)
- 🔍 **INVESTIGATE** - Requires further investigation

---

## Prerequisites & Setup

### 1. Verify Claude Code Installation

```bash
# Test prompt
claude --version

# Expected output
Claude Code v2.1.3+ (or higher)

# Validation
✅ Version >= 2.1.3
```

### 2. Verify MCP Server Configuration

**Test Steps:**
1. Check if Claude Desktop is configured:

```bash
# macOS
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Linux
cat ~/.config/Claude/claude_desktop_config.json
```

2. Expected output should include MCP server configurations

```json
{
  "mcpServers": {
    "api-specialist": { ... },
    "code-review": { ... },
    ...
  }
}
```

**Validation:**
- ✅ File exists
- ✅ Contains at least 5 MCP servers
- ✅ Paths are absolute and correct

### 3. Verify Agent Installation

```bash
# Test command
ls -1 ~/.claude/agents/ | wc -l

# Expected output
46 or more

# Detailed check
ls -1 ~/.claude/agents/

# Validation
✅ Contains *.json files (MCP agents)
✅ Contains *.md files (sub-agents)
✅ Total count >= 46
```

### 4. Verify Skill Installation

```bash
# Test command
ls -1 ~/.claude/skills/

# Expected output (10 skills)
api-design-patterns
auto-plan
ci-best-practices
database-design-patterns
documentation
refactoring-strategy
release-management
testing

# Validation
✅ Count >= 10 directories
✅ Each contains SKILL.md
```

### 5. Verify Command Installation

```bash
# Test command
ls -1 ~/.claude/commands/

# Expected output
document.md
observability.sh
plan.md
refactor.md
review.md
scaffold.md
test-generate.md

# Validation
✅ Contains 7 files
✅ .sh files are executable
```

---

## Phase 1: MCP Tools Testing (60 tools)

### Setup: Create Test Project

```bash
# Create test directory
mkdir -p /tmp/claude-test-project
cd /tmp/claude-test-project

# Create sample files for testing
cat > test-api.js << 'EOF'
const express = require('express');
const app = express();

app.get('/api/users', (req, res) => {
  const password = 'hardcoded-secret-123'; // Security issue
  res.json({ users: [] });
});

function complexFunction(a, b, c, d, e) {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (d > 0) {
          if (e > 0) {
            return a + b + c + d + e;
          }
        }
      }
    }
  }
  return 0;
}

module.exports = app;
EOF

cat > test.spec.js << 'EOF'
describe('API Tests', () => {
  it('should return users', () => {
    expect(true).toBe(true);
  });
});
EOF

cat > package.json << 'EOF'
{
  "name": "test-project",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.17.1"
  }
}
EOF
```

---

### 1. API Specialist MCP (8 tools)

#### Tool 1.1: validate_openapi

**Test Prompt:**
```
I need to validate an OpenAPI specification. Can you check if this OpenAPI spec is valid?

openapi: 3.0.0
info:
  title: Test API
  version: 1.0.0
paths:
  /users:
    get:
      responses:
        '200':
          description: Success
```

**Expected Output:**
- ✅ Validation result (pass/fail)
- ✅ Specific errors if invalid
- ✅ OpenAPI version detected

**Validation Criteria:**
- Tool executes without error
- Returns structured validation result
- Identifies spec issues if present

---

#### Tool 1.2: test_endpoint

**Test Prompt:**
```
Test this API endpoint for me:
URL: https://jsonplaceholder.typicode.com/users/1
Method: GET

Check if it returns valid JSON and responds within 2 seconds.
```

**Expected Output:**
- ✅ HTTP status code
- ✅ Response time
- ✅ Response body sample
- ✅ Content-type validation

**Validation Criteria:**
- Successfully makes HTTP request
- Returns response details
- Measures response time

---

#### Tool 1.3: check_api_security

**Test Prompt:**
```
Perform a security audit on this API endpoint configuration:

URL: http://api.example.com/users
Method: POST
Headers: None
Body: { "username": "test", "password": "pass" }

What security issues do you find?
```

**Expected Output:**
- ✅ HTTP vs HTTPS check
- ✅ Authentication header check
- ✅ SQL injection vulnerability check
- ✅ Specific recommendations

**Validation Criteria:**
- Identifies HTTP (not HTTPS) as issue
- Notes missing authentication
- Provides security recommendations

---

#### Tool 1.4: analyze_api_structure

**Test Prompt:**
```
Analyze this API structure and tell me if it follows REST best practices:

POST /getUser
GET /createUser
PUT /deleteUser
DELETE /updateUser

What's wrong with these endpoints?
```

**Expected Output:**
- ✅ REST verb analysis
- ✅ Naming convention issues
- ✅ Specific recommendations
- ✅ Best practice guidance

**Validation Criteria:**
- Identifies incorrect HTTP verbs
- Notes non-RESTful naming
- Provides correct alternatives

---

#### Tool 1.5: load_test

**Test Prompt:**
```
Can you load test this endpoint with 10 concurrent requests?

URL: https://jsonplaceholder.typicode.com/posts/1
Method: GET
Concurrency: 10
```

**Expected Output:**
- ✅ Total requests sent
- ✅ Success rate
- ✅ Average response time
- ✅ Min/max times

**Validation Criteria:**
- Executes load test
- Returns performance metrics
- Calculates statistics correctly

---

#### Tool 1.6: generate_api_docs

**Test Prompt:**
```
Generate API documentation in Markdown format for these endpoints:

GET /api/users - Returns list of users
POST /api/users - Creates a new user (requires: name, email)
DELETE /api/users/:id - Deletes a user by ID
```

**Expected Output:**
- ✅ Markdown formatted documentation
- ✅ Endpoint descriptions
- ✅ Parameters documented
- ✅ Request/response examples

**Validation Criteria:**
- Generates valid markdown
- Documents all endpoints
- Includes examples

---

#### Tool 1.7: suggest_improvements

**Test Prompt:**
```
Review this API design and suggest improvements:

POST /api/v1/users/create
POST /api/v1/users/update
POST /api/v1/users/delete
GET /api/v1/users/list

What can be improved?
```

**Expected Output:**
- ✅ Prioritized list of improvements
- ✅ RESTful alternatives
- ✅ Versioning recommendations
- ✅ Specific reasoning

**Validation Criteria:**
- Identifies design issues
- Provides alternatives
- Explains improvements

---

#### Tool 1.8: validate_api_response

**Test Prompt:**
```
Validate this API response against the expected schema:

Expected: { "id": number, "name": string, "email": string }
Actual: { "id": 123, "name": "John", "email": "john@example.com" }

Does it match?
```

**Expected Output:**
- ✅ Validation result (pass/fail)
- ✅ Field-by-field comparison
- ✅ Type checking
- ✅ Missing/extra fields noted

**Validation Criteria:**
- Validates schema structure
- Checks data types
- Reports discrepancies

---

### 2. Code Review MCP (4 tools)

#### Tool 2.1: lint_file

**Test Prompt:**
```
Lint this JavaScript file for me:
/tmp/claude-test-project/test-api.js

Use ESLint and check for:
- Unused variables
- Console statements
- Complexity issues
```

**Expected Output:**
- ✅ Linting results
- ✅ Specific line numbers
- ✅ Rule violations
- ✅ Severity levels

**Validation Criteria:**
- Executes linter successfully
- Identifies issues in test file
- Returns structured results

---

#### Tool 2.2: security_scan

**Test Prompt:**
```
Scan this file for security vulnerabilities:
/tmp/claude-test-project/test-api.js

Look for:
- Hardcoded secrets
- SQL injection risks
- Insecure dependencies
```

**Expected Output:**
- ✅ Security findings
- ✅ Line numbers
- ✅ Severity ratings
- ✅ Remediation suggestions

**Validation Criteria:**
- Finds hardcoded password
- Provides severity rating
- Suggests fixes

---

#### Tool 2.3: analyze_complexity

**Test Prompt:**
```
Analyze the cyclomatic complexity of:
/tmp/claude-test-project/test-api.js

Flag any functions with complexity > 5
```

**Expected Output:**
- ✅ Complexity scores per function
- ✅ Functions exceeding threshold
- ✅ Specific locations
- ✅ Refactoring suggestions

**Validation Criteria:**
- Calculates complexity correctly
- Identifies complexFunction as high
- Provides refactoring advice

---

#### Tool 2.4: find_duplicates

**Test Prompt:**
```
Check for code duplication in:
/tmp/claude-test-project/

Flag any duplicated code blocks > 5 lines
```

**Expected Output:**
- ✅ Duplicate code blocks found
- ✅ Locations of duplicates
- ✅ Similarity percentage
- ✅ Refactoring suggestions

**Validation Criteria:**
- Scans directory successfully
- Reports duplicates if found
- Provides locations

---

### 3. Design System MCP (5 tools)

#### Tool 3.1: validate_tokens

**Test Prompt:**
```
Validate these design tokens:

{
  "colors": {
    "primary": "#007bff",
    "secondary": "#6c757d",
    "danger": "red"
  },
  "spacing": {
    "sm": "8px",
    "md": "16px",
    "large": "24px"
  }
}

Check for naming consistency and valid values.
```

**Expected Output:**
- ✅ Validation results
- ✅ Naming convention issues
- ✅ Value format issues
- ✅ Recommendations

**Validation Criteria:**
- Identifies inconsistent naming ("large" vs "lg")
- Validates color formats
- Checks spacing units

---

#### Tool 3.2: check_component

**Test Prompt:**
```
Review this React component for design system compliance:

<Button variant="primary" size="large" color="#ff0000">
  Click me
</Button>

Our design system uses: variants=[primary, secondary], sizes=[sm, md, lg]
Hardcoded colors are not allowed.

What's wrong?
```

**Expected Output:**
- ✅ Compliance issues found
- ✅ Specific violations
- ✅ Correct alternatives
- ✅ Design token recommendations

**Validation Criteria:**
- Identifies "large" should be "lg"
- Flags hardcoded color
- Suggests design token usage

---

#### Tool 3.3: validate_color_palette

**Test Prompt:**
```
Check these color combinations for accessibility (WCAG AA):

Background: #ffffff (white)
Text colors:
- #cccccc (light gray)
- #666666 (medium gray)
- #000000 (black)

Which combinations pass?
```

**Expected Output:**
- ✅ Contrast ratios calculated
- ✅ WCAG AA pass/fail per combination
- ✅ Specific contrast values
- ✅ Recommendations

**Validation Criteria:**
- Calculates contrast ratios
- Identifies #cccccc fails AA
- Shows passing combinations

---

#### Tool 3.4: analyze_spacing

**Test Prompt:**
```
Analyze the spacing in this CSS:

.card {
  padding: 12px;
  margin: 15px;
  gap: 10px;
}

.button {
  padding: 13px;
  margin: 16px;
}

Our spacing scale is: 8, 16, 24, 32 (8px intervals)
Find inconsistencies.
```

**Expected Output:**
- ✅ Non-scale values identified
- ✅ Specific CSS properties
- ✅ Recommended scale values
- ✅ Consistency score

**Validation Criteria:**
- Finds 12px, 15px, 10px, 13px as off-scale
- Suggests nearest scale values
- Calculates consistency

---

#### Tool 3.5: generate_report

**Test Prompt:**
```
Generate a design system compliance report for the components we just tested:
- Button component (from 3.2)
- Color palette (from 3.3)
- Spacing (from 3.4)

Create a summary report.
```

**Expected Output:**
- ✅ Summary of findings
- ✅ Pass/fail counts
- ✅ Critical issues highlighted
- ✅ Action items

**Validation Criteria:**
- Aggregates previous results
- Provides clear summary
- Prioritizes issues

---

### 4. Testing MCP (4 tools)

#### Tool 4.1: run_tests

**Test Prompt:**
```
Run the test suite in:
/tmp/claude-test-project/

Use Jest and report results.
```

**Expected Output:**
- ✅ Test execution results
- ✅ Pass/fail counts
- ✅ Execution time
- ✅ Test output

**Validation Criteria:**
- Attempts to run tests
- Returns structured results
- Reports execution time

---

#### Tool 4.2: get_coverage

**Test Prompt:**
```
Generate code coverage report for:
/tmp/claude-test-project/test-api.js

Minimum threshold: 80%
```

**Expected Output:**
- ✅ Coverage percentage
- ✅ Line coverage
- ✅ Branch coverage
- ✅ Uncovered lines

**Validation Criteria:**
- Calculates coverage
- Identifies uncovered code
- Compares to threshold

---

#### Tool 4.3: analyze_test_quality

**Test Prompt:**
```
Analyze test quality of:
/tmp/claude-test-project/test.spec.js

Check for:
- Assertion count
- Test descriptions
- Mock usage
```

**Expected Output:**
- ✅ Quality metrics
- ✅ Assertion analysis
- ✅ Best practice violations
- ✅ Improvement suggestions

**Validation Criteria:**
- Counts assertions
- Evaluates test descriptions
- Provides recommendations

---

#### Tool 4.4: generate_test_report

**Test Prompt:**
```
Create a comprehensive test report summarizing:
- Test execution (from 4.1)
- Coverage (from 4.2)
- Quality (from 4.3)

Format as HTML.
```

**Expected Output:**
- ✅ HTML report
- ✅ All metrics included
- ✅ Visual summaries
- ✅ Recommendations section

**Validation Criteria:**
- Generates valid HTML
- Includes all metrics
- Formatted correctly

---

### 5. UI/UX Review MCP (9 tools)

**Note:** These tools require screenshots or design mockups. Create test images or use examples.

#### Tool 5.1: analyze_design

**Test Prompt:**
```
Analyze this design for me:
[Provide a screenshot of a web page or use a sample URL]

Review:
- Visual hierarchy
- Color usage
- Typography
- Layout balance
```

**Expected Output:**
- ✅ Scored findings (1-10)
- ✅ Specific observations
- ✅ Strengths identified
- ✅ Weaknesses noted

**Validation Criteria:**
- Provides comprehensive analysis
- Uses scoring system
- Covers all requested aspects

---

#### Tool 5.2: check_accessibility

**Test Prompt:**
```
Audit this HTML for WCAG 2.1 AA accessibility:

<div style="background: #fff;">
  <img src="logo.png">
  <button style="color: #ccc;">Submit</button>
  <input type="text" placeholder="Name">
</div>

What accessibility issues exist?
```

**Expected Output:**
- ✅ WCAG violations listed
- ✅ Severity levels
- ✅ Specific fixes
- ✅ WCAG guideline references

**Validation Criteria:**
- Identifies missing alt text
- Notes low contrast button
- Flags missing label
- Provides remediation

---

#### Tool 5.3: review_typography

**Test Prompt:**
```
Review the typography in this CSS:

body { font-family: Arial; font-size: 14px; line-height: 1.2; }
h1 { font-size: 18px; font-weight: normal; }
h2 { font-size: 16px; }
p { font-size: 14px; line-height: 1.5; }

What's wrong with this type scale?
```

**Expected Output:**
- ✅ Type scale analysis
- ✅ Hierarchy issues
- ✅ Readability problems
- ✅ Recommendations

**Validation Criteria:**
- Identifies poor hierarchy
- Notes low line-height issues
- Suggests improvements

---

#### Tool 5.4: validate_spacing

**Test Prompt:**
```
Check the spacing consistency in this layout:

Header: padding 15px, margin 10px
Content: padding 18px, margin 12px
Footer: padding 20px, margin 8px

What spacing issues exist?
```

**Expected Output:**
- ✅ Inconsistencies identified
- ✅ Pattern analysis
- ✅ Grid system suggestions
- ✅ Consistent values recommended

**Validation Criteria:**
- Identifies irregular spacing
- Suggests consistent system
- Provides specific values

---

#### Tool 5.5: check_color_scheme

**Test Prompt:**
```
Analyze this color palette:

Primary: #007bff
Secondary: #ff0000
Success: #00ff00
Warning: #ffff00
Text: #333333

Check for:
- Color harmony
- Contrast ratios
- Accessibility
```

**Expected Output:**
- ✅ Color harmony analysis
- ✅ Contrast calculations
- ✅ Accessibility pass/fail
- ✅ Palette improvements

**Validation Criteria:**
- Evaluates color relationships
- Calculates contrast
- Provides recommendations

---

#### Tool 5.6: suggest_improvements

**Test Prompt:**
```
Based on the UI/UX reviews above, suggest prioritized improvements for:
- Typography (from 5.3)
- Spacing (from 5.4)
- Colors (from 5.5)

Rank by impact.
```

**Expected Output:**
- ✅ Prioritized list
- ✅ Impact ratings
- ✅ Specific actions
- ✅ Effort estimates

**Validation Criteria:**
- Aggregates findings
- Provides priority ranking
- Actionable recommendations

---

#### Tool 5.7: generate_wireframe

**Test Prompt:**
```
Generate a wireframe in HTML for a login page with:
- Logo at top
- Email input
- Password input
- Submit button
- "Forgot password" link

Make it responsive and accessible.
```

**Expected Output:**
- ✅ HTML wireframe
- ✅ Semantic markup
- ✅ Accessibility features
- ✅ Responsive layout

**Validation Criteria:**
- Generates valid HTML
- Uses semantic elements
- Includes ARIA labels
- Mobile-friendly

---

#### Tool 5.8: compare_designs

**Test Prompt:**
```
Compare these two button designs:

Design A: Blue button, white text, 16px font, rounded corners
Design B: Green button, white text, 14px font, square corners

Which is better for a primary CTA and why?
```

**Expected Output:**
- ✅ Comparison analysis
- ✅ Pros/cons for each
- ✅ Recommendation
- ✅ Context considerations

**Validation Criteria:**
- Provides balanced analysis
- Considers UX principles
- Makes clear recommendation

---

#### Tool 5.9: check_usability

**Test Prompt:**
```
Evaluate this navigation menu against Nielsen's 10 usability heuristics:

<nav>
  <a href="/home">🏠</a>
  <a href="/products">SHOP NOW</a>
  <a href="/contact">Contact Us</a>
  <button onclick="alert('Cart')">🛒</button>
</nav>

What usability issues exist?
```

**Expected Output:**
- ✅ Heuristic violations
- ✅ Specific examples
- ✅ User impact
- ✅ Recommendations

**Validation Criteria:**
- References Nielsen's heuristics
- Identifies icon-only issue
- Notes inconsistent styling
- Suggests improvements

---

### 6-9. Experimental MCP Servers (30 tools)

**Note:** Experimental servers follow similar testing patterns. Here are sample tests for each:

#### 6. CI/CD Pipeline MCP (8 tools)

**Quick Test:**
```
Generate a GitHub Actions workflow for a Node.js project that:
- Runs on push to main
- Installs dependencies
- Runs tests
- Deploys to Vercel

Show me the YAML configuration.
```

**Validation:**
- ✅ Generates valid GitHub Actions YAML
- ✅ Includes all requested steps
- ✅ Proper syntax and structure

---

#### 7. Database Operations MCP (8 tools)

**Quick Test:**
```
Generate a database migration to add a 'users' table with:
- id (primary key, auto-increment)
- email (unique, not null)
- created_at (timestamp)

Show SQL for PostgreSQL.
```

**Validation:**
- ✅ Generates valid SQL
- ✅ Includes constraints
- ✅ Proper data types

---

#### 8. Dependency Management MCP (8 tools)

**Quick Test:**
```
Scan this package.json for vulnerabilities:

{
  "dependencies": {
    "express": "4.16.0",
    "lodash": "4.17.0"
  }
}

What security issues exist?
```

**Validation:**
- ✅ Identifies vulnerable versions
- ✅ Provides CVE details
- ✅ Suggests updates

---

#### 9. n8n Automation MCP (6 tools)

**Quick Test:**
```
Create an n8n workflow that:
1. Triggers on webhook
2. Parses JSON data
3. Saves to Airtable
4. Sends Slack notification

Show the workflow JSON.
```

**Validation:**
- ✅ Generates n8n workflow JSON
- ✅ Includes all nodes
- ✅ Proper connections

---

## Phase 2: Agent Testing (48 agents)

### MCP Agents (14 configs)

#### Test 1: security-reviewer

**Test Prompt:**
```
@security-reviewer

Scan this code for security vulnerabilities:

function login(username, password) {
  const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;
  return db.query(query);
}

What security issues do you find?
```

**Expected Output:**
- ✅ Agent activates
- ✅ Uses security_scan tool
- ✅ Identifies SQL injection
- ✅ Provides remediation

**Validation:**
```
✅ Agent responds
✅ Uses MCP tools
✅ Finds security issues
✅ Provides fixes
```

---

#### Test 2: test-quality-enforcer

**Test Prompt:**
```
@test-quality-enforcer

Review this test file:

describe('Calculator', () => {
  it('works', () => {
    expect(true).toBe(true);
  });
});

Does this meet quality standards?
```

**Expected Output:**
- ✅ Agent analyzes test
- ✅ Identifies poor assertions
- ✅ Requests improvements
- ✅ Suggests specific tests

**Validation:**
```
✅ Agent responds
✅ Identifies quality issues
✅ Provides recommendations
```

---

#### Test 3: api-specialist

**Test Prompt:**
```
@api-specialist

Test this API endpoint:
GET https://jsonplaceholder.typicode.com/posts/1

Check:
1. Response time
2. Valid JSON
3. Status code
4. Security headers
```

**Expected Output:**
- ✅ Agent uses API tools
- ✅ Tests endpoint
- ✅ Reports all metrics
- ✅ Security analysis

**Validation:**
```
✅ Makes HTTP request
✅ Reports metrics
✅ Security check done
```

---

#### Test 4: design-system-guardian

**Test Prompt:**
```
@design-system-guardian

Check this component for design system compliance:

<Button color="#ff0000" padding="13px">
  Click me
</Button>

Our system uses design tokens and 8px spacing grid.
```

**Expected Output:**
- ✅ Identifies violations
- ✅ Suggests tokens
- ✅ Notes spacing issue
- ✅ Provides corrections

**Validation:**
```
✅ Uses design system tools
✅ Finds violations
✅ Suggests fixes
```

---

#### Test 5: full-stack-reviewer

**Test Prompt:**
```
@full-stack-reviewer

Comprehensively review this code:

function processPayment(amount, card) {
  console.log('Processing:', amount);
  if (amount > 0) {
    if (card.valid) {
      if (card.balance >= amount) {
        return charge(card, amount);
      }
    }
  }
}

Check security, complexity, and testing.
```

**Expected Output:**
- ✅ Multi-phase review
- ✅ Security findings
- ✅ Complexity analysis
- ✅ Test recommendations

**Validation:**
```
✅ Uses multiple MCP servers
✅ Comprehensive analysis
✅ Actionable feedback
```

---

#### Tests 6-14: Remaining MCP Agents

**Quick validation for each:**

```bash
@performance-optimizer
Test: Analyze slow function
Expected: Performance recommendations

@cicd-engineer
Test: Generate GitHub Actions workflow
Expected: Valid YAML configuration

@database-engineer
Test: Generate migration
Expected: Valid SQL

@dependency-manager
Test: Scan dependencies
Expected: Vulnerability report

@automation-architect
Test: Create n8n workflow
Expected: Workflow JSON

@planner
Test: Plan a feature
Expected: Comprehensive plan

@implementer
Test: Implement simple function
Expected: Working code

@uiux-reviewer
Test: Review design mockup
Expected: UX feedback

@uiux-design-critic
Test: Critique landing page
Expected: Design improvements
```

### Sub-Agents (34 configs) - Sample Tests

#### Test: android-dev

**Test Prompt:**
```
@android-dev

Create a simple Android Activity that displays "Hello World" in a TextView.
```

**Expected Output:**
- ✅ Kotlin/Java code
- ✅ Android-specific syntax
- ✅ Proper Activity structure

---

#### Test: nodejs-typescript-backend-expert

**Test Prompt:**
```
@nodejs-typescript-backend-expert

Create an Express.js route handler in TypeScript for:
GET /api/users/:id
```

**Expected Output:**
- ✅ TypeScript syntax
- ✅ Express.js patterns
- ✅ Type definitions

---

#### Test: react-nextjs-expert

**Test Prompt:**
```
@react-nextjs-expert

Create a Next.js page component for a blog post with:
- Server-side props
- SEO metadata
- Responsive layout
```

**Expected Output:**
- ✅ Next.js patterns
- ✅ React components
- ✅ SEO implementation

---

#### Remaining Sub-Agents Quick Test

**For each sub-agent, test with technology-specific prompt:**

```
@[agent-name]
Create a simple example of [technology-specific feature]

Validate:
✅ Agent responds with expertise
✅ Code is technology-appropriate
✅ Best practices followed
```

---

## Phase 3: Skill Testing (10 skills)

### Skill 1: testing (subcommand: tdd)

**Test Prompt:**
```
Guide me through TDD workflow for creating a function that validates email addresses.
```

**Expected Output:**
- ✅ Red-Green-Refactor guidance
- ✅ Test-first approach
- ✅ Step-by-step process

**Validation:**
```
✅ Explains TDD cycle
✅ Writes test first
✅ Then implements
```

---

### Skill 3: refactoring-strategy

**Test Prompt:**
```
Help me refactor this code:

function process(data) {
  let result = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].active) {
      if (data[i].valid) {
        result.push(data[i]);
      }
    }
  }
  return result;
}
```

**Expected Output:**
- ✅ Refactoring steps
- ✅ Improved code
- ✅ Explanation of changes

**Validation:**
```
✅ Identifies issues
✅ Suggests improvements
✅ Shows better version
```

---

### Skills 4-10: Quick Tests

**For each skill:**

```
Skill: api-design-patterns
Test: "Design a RESTful API for a blog"
Expected: REST principles applied

Skill: documentation (subcommand: api)
Test: "Document this API endpoint"
Expected: Comprehensive docs

Skill: database-design-patterns
Test: "Design a user-profile schema"
Expected: Normalized schema

Skill: ci-best-practices
Test: "Review this CI pipeline"
Expected: Best practice advice

Skill: release-management
Test: "Plan v2.0.0 release"
Expected: Release strategy

Skill: testing (subcommand: visual)
Test: "Set up visual regression tests"
Expected: Testing approach

Skill: testing (subcommand: contract)
Test: "Implement contract tests"
Expected: Contract testing setup

Skill: testing (subcommand: mutation)
Test: "Explain mutation testing"
Expected: Mutation testing guide

Skill: testing (subcommand: bdd)
Test: "Write BDD scenarios"
Expected: Gherkin examples

Skill: testing (subcommand: e2e)
Test: "Design E2E test suite"
Expected: E2E strategy
```

---

## Phase 4: Command Testing (7 commands)

### Command 1: /plan

**Test Prompt:**
```
/plan Create a REST API for a todo app with user authentication
```

**Expected Output:**
- ✅ Invokes planner agent
- ✅ Comprehensive plan
- ✅ Implementation steps
- ✅ Technical decisions

**Validation:**
```
✅ Command recognized
✅ Agent activated
✅ Plan generated
```

---

### Command 2: /review

**Test Prompt:**
```
/review

function authenticate(user, pass) {
  if (user == 'admin' && pass == 'password123') {
    return true;
  }
  return false;
}
```

**Expected Output:**
- ✅ Code review performed
- ✅ Security issues found
- ✅ Recommendations provided

**Validation:**
```
✅ Command executes
✅ Review completed
✅ Issues identified
```

---

### Command 3: /test-generate

**Test Prompt:**
```
/test-generate

function isPalindrome(str) {
  return str === str.split('').reverse().join('');
}
```

**Expected Output:**
- ✅ Test suite generated
- ✅ Edge cases covered
- ✅ Test framework used

**Validation:**
```
✅ Tests created
✅ Multiple scenarios
✅ Runnable tests
```

---

### Command 4: /scaffold

**Test Prompt:**
```
/scaffold React component library with TypeScript and Storybook
```

**Expected Output:**
- ✅ Project structure
- ✅ Configuration files
- ✅ Example components

**Validation:**
```
✅ Structure created
✅ All files present
✅ Ready to build
```

---

### Command 5: /document

**Test Prompt:**
```
/document

function calculateTax(income, rate) {
  return income * (rate / 100);
}
```

**Expected Output:**
- ✅ JSDoc comments
- ✅ Parameter descriptions
- ✅ Usage examples

**Validation:**
```
✅ Documentation added
✅ Comprehensive
✅ Correct format
```

---

### Command 6: /refactor

**Test Prompt:**
```
/refactor

function getData() {
  let x = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].a) {
      x.push(items[i]);
    }
  }
  return x;
}
```

**Expected Output:**
- ✅ Refactored code
- ✅ Better naming
- ✅ Modern syntax

**Validation:**
```
✅ Code improved
✅ More readable
✅ Same functionality
```

---

### Command 7: /observability

**Test Prompt:**
```
/observability status
```

**Expected Output:**
- ✅ Current settings
- ✅ Model indicators
- ✅ Status line info

**Validation:**
```
✅ Shows configuration
✅ Toggle options
✅ Current state
```

---

## Phase 5: Integration Testing

### Test 1: Multi-Agent Workflow

**Test Prompt:**
```
I need to:
1. Plan a feature (@planner)
2. Implement it (@implementer)
3. Review it (@security-reviewer)
4. Test it (@test-quality-enforcer)

Feature: User registration with email validation
```

**Expected Flow:**
1. ✅ Planner creates plan
2. ✅ Implementer writes code
3. ✅ Security reviewer checks it
4. ✅ Test enforcer validates tests

**Validation:**
```
✅ Agents coordinate
✅ Hand-off works
✅ Complete workflow
```

---

### Test 2: Skill + Command Combination

**Test Prompt:**
```
Use the TDD workflow skill and /test-generate command together to create a function that validates credit card numbers.
```

**Expected Output:**
- ✅ TDD process followed
- ✅ Tests generated first
- ✅ Implementation follows

**Validation:**
```
✅ Both activate
✅ Work together
✅ Complete feature
```

---

### Test 3: MCP Tool Chain

**Test Prompt:**
```
For this API:
1. Validate its OpenAPI spec (api-specialist)
2. Test the endpoint (api-specialist)
3. Check security (api-specialist)
4. Generate documentation (api-specialist)

API: https://jsonplaceholder.typicode.com/users
```

**Expected Output:**
- ✅ All tools execute sequentially
- ✅ Results build on each other
- ✅ Comprehensive analysis

**Validation:**
```
✅ Tool chain works
✅ Results connected
✅ Final report complete
```

---

## 📋 Testing Checklist

### Pre-Testing

- [ ] Claude Code v2.1.3+ installed
- [ ] All MCP servers configured in Claude Desktop
- [ ] Claude Desktop restarted
- [ ] Test project created
- [ ] Backup created (optional)

### MCP Servers (60 tools)

**API Specialist MCP (8)**
- [ ] validate_openapi
- [ ] test_endpoint
- [ ] check_api_security
- [ ] analyze_api_structure
- [ ] load_test
- [ ] generate_api_docs
- [ ] suggest_improvements
- [ ] validate_api_response

**Code Review MCP (4)**
- [ ] lint_file
- [ ] security_scan
- [ ] analyze_complexity
- [ ] find_duplicates

**Design System MCP (5)**
- [ ] validate_tokens
- [ ] check_component
- [ ] validate_color_palette
- [ ] analyze_spacing
- [ ] generate_report

**Testing MCP (4)**
- [ ] run_tests
- [ ] get_coverage
- [ ] analyze_test_quality
- [ ] generate_test_report

**UI/UX Review MCP (9)**
- [ ] analyze_design
- [ ] check_accessibility
- [ ] review_typography
- [ ] validate_spacing
- [ ] check_color_scheme
- [ ] suggest_improvements
- [ ] generate_wireframe
- [ ] compare_designs
- [ ] check_usability

**Experimental Servers (30 tools)**
- [ ] CI/CD Pipeline (8 tools sample)
- [ ] Database Operations (8 tools sample)
- [ ] Dependency Management (8 tools sample)
- [ ] n8n Automation (6 tools sample)

### Agents (48 configs)

**MCP Agents (14)**
- [ ] api-specialist
- [ ] automation-architect
- [ ] cicd-engineer
- [ ] database-engineer
- [ ] dependency-manager
- [ ] design-system-guardian
- [ ] full-stack-reviewer
- [ ] implementer
- [ ] performance-optimizer
- [ ] planner
- [ ] security-reviewer
- [ ] test-quality-enforcer
- [ ] uiux-design-critic
- [ ] uiux-reviewer

**Sub-Agents (sample of 34)**
- [ ] android-dev
- [ ] nodejs-typescript-backend-expert
- [ ] react-nextjs-expert
- [ ] python-backend-expert
- [ ] [others as needed]

### Skills (10)

- [ ] testing (subcommands: tdd, e2e, bdd, contract, mutation, visual)
- [ ] documentation (subcommand: api)
- [ ] refactoring-strategy
- [ ] release-management
- [ ] ci-best-practices
- [ ] api-design-patterns
- [ ] database-design-patterns
- [ ] auto-plan

### Commands (7)

- [ ] /plan
- [ ] /review
- [ ] /test-generate
- [ ] /scaffold
- [ ] /document
- [ ] /refactor
- [ ] /observability

### Integration Tests

- [ ] Multi-agent workflow
- [ ] Skill + Command combination
- [ ] MCP tool chain
- [ ] Error handling
- [ ] Hot-reload (skills)

---

## 🎯 Success Criteria

### Minimum Success (80% pass rate)

```
✅ At least 48/60 MCP tools working
✅ At least 38/48 agents functional
✅ At least 8/10 skills operational
✅ All 7/7 commands working
✅ Basic integration tests pass
```

### Full Success (95%+ pass rate)

```
✅ 57/60+ MCP tools working
✅ 46/48+ agents functional
✅ 10/10 skills operational
✅ 7/7 commands working
✅ All integration tests pass
```

### Expected Issues

**Common problems:**
- MCP servers not configured (easy fix)
- External tools not installed (ESLint, etc.)
- Experimental servers have bugs
- Agent prompts need refinement
- Network timeouts on API calls

---

## 📊 Results Template

```markdown
# Testing Results

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Duration:** [Hours]

## Summary

| Component | Tested | Passed | Failed | Pass Rate |
|-----------|--------|--------|--------|-----------|
| MCP Tools | 60 | XX | XX | XX% |
| Agents | 48 | XX | XX | XX% |
| Skills | 10 | XX | XX | XX% |
| Commands | 7 | XX | XX | XX% |
| Integration | 5 | XX | XX | XX% |
| **TOTAL** | **130** | **XX** | **XX** | **XX%** |

## Issues Found

### Critical (Blockers)
- [ ] Issue 1: [Description]
- [ ] Issue 2: [Description]

### Major (Should Fix)
- [ ] Issue 3: [Description]

### Minor (Nice to Have)
- [ ] Issue 4: [Description]

## Recommendations

1. [Recommendation 1]
2. [Recommendation 2]

## Overall Assessment

[Pass/Fail with justification]
```

---

**Generated:** 2026-01-11
**Version:** claude-code-helper v1.3.0
**Author:** Michel Abboud
**AI Assistance:** Claude Sonnet 4.5
