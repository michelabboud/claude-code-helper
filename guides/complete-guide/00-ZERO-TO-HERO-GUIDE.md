# Claude Code: Zero to Hero Complete Guide

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Level 1: Basics](#level-1-basics)
4. [Level 2: Intermediate](#level-2-intermediate)
5. [Level 3: Advanced](#level-3-advanced)
6. [Level 4: Expert](#level-4-expert)
7. [Level 5: Master](#level-5-master)
8. [Real-World Projects](#real-world-projects)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the complete Claude Code learning path! This guide will take you from zero knowledge to mastering all aspects of Claude Code, including Skills, Sub-agents, MCP servers, Slash Commands, Hooks, Plugins, and the Agent SDK.

### What You'll Learn

By the end of this guide, you'll be able to:
- Set up and configure Claude Code for any project
- Create custom Skills that work across all Claude platforms
- Build specialized Sub-agents for complex workflows
- Integrate external tools via MCP
- Automate repetitive tasks with Hooks
- Package and distribute custom Plugins
- Build production-ready autonomous agents with the Agent SDK

### Prerequisites

- Basic command line knowledge
- Understanding of Git (helpful but not required)
- A Claude account (Pro, Team, or Enterprise for advanced features)
- Node.js installed (for MCP servers)
- Python installed (for Skills with scripts)

---

## Getting Started

### Installation

**Step 1: Install Claude Code CLI**

```bash
# macOS/Linux
curl -fsSL https://cli.claude.ai/install.sh | sh

# Or with Homebrew
brew install claude-code

# Windows (use WSL or download from website)
# Visit: https://claude.ai/download
```

**Step 2: Verify Installation**

```bash
claude --version
```

**Step 3: Login**

```bash
# Start Claude Code (it will prompt for login)
claude

# Inside Claude Code, login if needed
/login
```

**Step 4: Check Your Setup**

```bash
# Inside Claude Code
/help       # See available commands
/stats      # View your usage
```

### Your First Interaction

Once logged in, try these basic commands:

```bash
# Navigate to a project directory
cd ~/my-project

# Start Claude Code
claude

# Ask Claude to understand your project
> What does this project do?

# Get Claude to help with code
> Create a simple hello world function in Python

# Review changes before accepting
> Show me what you changed
```

**Key Concepts to Remember:**
- Claude Code works best when it has context about your project
- Always review changes before accepting them
- Use `/clear` to start fresh conversations
- Use `/compact` to condense conversation history

---

## Level 1: Basics

### Understanding CLAUDE.md

The `CLAUDE.md` file is your project's memory. Claude reads it every time it starts.

**Exercise 1.1: Create Your First CLAUDE.md**

```bash
cd ~/my-project
```

Create `CLAUDE.md`:

```markdown
# My Project

## Overview
A personal finance tracker built with React and Node.js

## Tech Stack
- Frontend: React 18, TypeScript, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Testing: Jest, React Testing Library

## Project Structure
```
src/
├── components/    # React components
├── api/          # API routes
├── db/           # Database schemas
└── utils/        # Helper functions
```

## Coding Standards
- Use TypeScript strict mode
- All functions must have JSDoc comments
- Follow functional programming patterns
- Write tests for all business logic

## Common Tasks
- Start dev server: `npm run dev`
- Run tests: `npm test`
- Build: `npm run build`
```

**Exercise 1.2: Test Your CLAUDE.md**

```bash
# Start Claude Code
claude

# Ask a question that should use the context
> Where should I put a new React component?

# Claude should respond based on your project structure
# "Based on your project structure, new React components should go in src/components/"
```

### Basic Slash Commands

Slash commands are quick shortcuts for common tasks.

**Built-in Commands:**

```bash
/help           # Show available commands
/clear          # Start a new conversation
/compact        # Condense conversation history
/login          # Login or switch accounts
/stats          # View usage statistics
/resume <name>  # Resume a previous session
/rename         # Give current session a memorable name
```

**Exercise 1.3: Session Management**

```bash
# Start working on a feature
claude

> Help me build an authentication module

# ... after some work ...

# Give your session a memorable name
/rename auth-implementation

# Start a different task
/clear

> Now help me with the dashboard

# Later, come back to authentication
/resume auth-implementation
```

### Understanding the File System

**Exercise 1.4: Navigate and Explore**

```bash
# Start Claude Code in your project
claude

# Have Claude explore your project
> Show me the project structure

> What files are in the src/ directory?

> Read the package.json file

> Find all TypeScript files
```

**What Claude Can Do:**
- ✅ Read files
- ✅ Write/edit files (with your permission)
- ✅ Run bash commands
- ✅ Search your codebase
- ✅ Make commits
- ✅ Create branches

**What Claude Cannot Do:**
- ❌ Delete files without confirmation
- ❌ Push to remote without permission
- ❌ Run destructive commands without approval

---

## Level 2: Intermediate

### Creating Custom Slash Commands

Custom slash commands let you save repetitive prompts as shortcuts.

**Exercise 2.1: Create a Code Review Command**

Create `.claude/commands/review.md`:

```markdown
---
description: Perform comprehensive code review
allowed-tools: Read, Grep, Glob
model: claude-sonnet-4-5-20250929
---

# Code Review Command

Perform a thorough code review of the current changes:

1. **Security Check**
   - Look for SQL injection vulnerabilities
   - Check for XSS risks
   - Verify authentication/authorization
   - Check for exposed secrets or API keys

2. **Code Quality**
   - Check naming conventions
   - Look for code duplication
   - Verify error handling
   - Check for proper logging

3. **Performance**
   - Identify potential bottlenecks
   - Check for N+1 queries
   - Look for unnecessary re-renders (React)
   - Check for memory leaks

4. **Testing**
   - Verify test coverage
   - Check for edge cases
   - Look for missing tests

Provide specific line numbers and suggestions for improvements.
```

**Exercise 2.2: Create a Documentation Command**

Create `.claude/commands/document.md`:

```markdown
---
description: Add comprehensive documentation to code
allowed-tools: Read, Write, Edit
---

# Documentation Command

Add comprehensive documentation to the specified files:

1. **Function Documentation**
   - Add JSDoc/docstring for each function
   - Include parameter descriptions
   - Document return values
   - Add usage examples

2. **File Headers**
   - Add file purpose description
   - List main exports
   - Document dependencies

3. **Inline Comments**
   - Explain complex logic
   - Document "why" not just "what"
   - Add TODOs for improvements

4. **README Updates**
   - Update installation instructions
   - Add usage examples
   - Document configuration options
```

**Exercise 2.3: Use Your Commands**

```bash
# Start Claude Code
claude

# Use your new commands
/review

# After making changes
/document src/auth/login.ts
```

### Working with Git

**Exercise 2.4: Git Workflow**

```bash
claude

# Create a new branch for a feature
> Create a new branch called "feature/user-auth"

# Make some changes
> Implement JWT authentication

# Review changes
> Show me the git diff

# Commit changes
> Commit these changes with a descriptive message

# Claude will suggest a commit message like:
# "feat: implement JWT authentication with refresh tokens"

# You can modify before accepting
```

### Using Built-in Sub-agents

Claude Code comes with built-in sub-agents you can leverage.

**Exercise 2.5: Plan Mode**

```bash
claude

# Enter plan mode to explore before acting
> /plan Help me refactor the authentication module

# Claude will:
# 1. Spawn the Plan sub-agent
# 2. Explore your auth code
# 3. Analyze the structure
# 4. Present a plan
# 5. Ask for confirmation before proceeding
```

**Exercise 2.6: Explore Sub-agent**

```bash
# Have Claude explore your codebase
> Use the Explore sub-agent to find all database queries

# The Explore sub-agent is:
# - Read-only (safe)
# - Fast
# - Great for searching and analyzing
```

---

## Level 3: Advanced

### Creating Custom Skills

Skills are auto-invoked based on context and work everywhere (Claude.ai, Claude Code, API).

**Exercise 3.1: Create a Simple Skill**

Create `~/.claude/skills/api-documentation/SKILL.md`:

```markdown
---
name: api-documentation
description: Generate comprehensive API documentation following OpenAPI 3.0 standards when creating or documenting REST APIs
---

# API Documentation Skill

When documenting or creating APIs, follow these standards:

## OpenAPI 3.0 Structure

```yaml
openapi: 3.0.0
info:
  title: API Name
  version: 1.0.0
  description: API description

paths:
  /resource:
    get:
      summary: Brief description
      parameters:
        - name: param
          in: query
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Resource'
```

## Documentation Guidelines

1. **Endpoint Documentation**
   - Clear summary (1 line)
   - Detailed description (2-3 sentences)
   - All parameters documented
   - All response codes covered
   - Example requests/responses

2. **Schema Definitions**
   - Use $ref for reusable schemas
   - Include field descriptions
   - Specify required fields
   - Add validation rules

3. **Error Responses**
   - Standard error format
   - Error codes documented
   - Example error responses

4. **Authentication**
   - Document auth method
   - Include security schemes
   - Provide auth examples

## Example Output Format

For each endpoint, provide:
- HTTP method and path
- Description
- Parameters table
- Request body schema (if applicable)
- Response schemas for all status codes
- Code examples in curl and JavaScript

## Best Practices

- Use consistent naming conventions
- Version your API
- Include rate limiting information
- Document deprecations
- Provide migration guides
```

**Exercise 3.2: Test Your Skill**

```bash
claude

# Your skill will auto-activate when you ask about APIs
> Help me document this REST API endpoint

# Claude will use your skill automatically and follow the standards you defined
```

**Exercise 3.3: Create a Testing Skill**

Create `~/.claude/skills/testing-standards/SKILL.md`:

```markdown
---
name: testing-standards
description: Generate comprehensive tests following TDD principles. Use when writing tests for any code, including unit tests, integration tests, and E2E tests
---

# Testing Standards Skill

## Test Structure

Follow the AAA pattern:
- **Arrange**: Set up test data and preconditions
- **Act**: Execute the code being tested
- **Assert**: Verify the results

## Test File Organization

```
__tests__/
├── unit/           # Pure function tests
├── integration/    # Component integration tests
└── e2e/           # End-to-end scenarios
```

## Test Naming Convention

Use descriptive names that explain what's being tested:

```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {})
    it('should throw error when email is invalid', () => {})
    it('should hash password before saving', () => {})
  })
})
```

## Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical paths (auth, payments, data validation)
- Test all error conditions
- Test edge cases

## Test Categories

### Unit Tests
- Test single functions/methods
- Mock all dependencies
- Fast execution (< 100ms each)
- No external dependencies

### Integration Tests
- Test component interactions
- Use test database
- May involve file system
- Moderate execution time

### E2E Tests
- Test complete user flows
- Use real browser (Playwright)
- Test critical paths only
- Slower execution acceptable

## Mocking Guidelines

Mock external services:
- APIs
- Databases
- File system
- Third-party SDKs

Don't mock:
- Your own code
- Simple utilities
- Pure functions

## Test Data

Use factories for test data:

```javascript
const userFactory = (overrides = {}) => ({
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  ...overrides
})
```

## Assertions

Be specific:

```javascript
// ❌ Bad
expect(result).toBeTruthy()

// ✅ Good
expect(result.status).toBe(200)
expect(result.data.id).toBeDefined()
expect(result.data.email).toBe('test@example.com')
```

## Common Patterns

### Testing Async Code
```javascript
it('should fetch user data', async () => {
  const data = await getUserData(123)
  expect(data).toMatchObject({ id: 123 })
})
```

### Testing Errors
```javascript
it('should throw on invalid input', () => {
  expect(() => validateEmail('invalid'))
    .toThrow('Invalid email format')
})
```

### Testing Promises
```javascript
it('should resolve with user', () => {
  return expect(getUser(123))
    .resolves
    .toMatchObject({ id: 123 })
})
```

When generating tests:
1. Start with happy path
2. Add error cases
3. Test edge cases
4. Verify side effects
5. Check async behavior
```

**Exercise 3.4: Skill with Executable Code**

Create `~/.claude/skills/data-analyzer/SKILL.md`:

```markdown
---
name: data-analyzer
description: Analyze CSV and JSON data files using pandas. Use for data exploration, statistics, and visualization tasks
dependencies:
  - pandas
  - matplotlib
  - seaborn
---

# Data Analyzer Skill

This skill helps analyze data files using pandas.

## Available Scripts

See `scripts/analyze.py` for data analysis functions.

## Usage

When analyzing data:
1. Load the data file
2. Run the analysis script
3. Generate summary statistics
4. Create visualizations if needed

## Analysis Types

- **Descriptive Statistics**: mean, median, mode, std dev
- **Data Quality**: missing values, duplicates, outliers
- **Correlations**: relationship between variables
- **Distributions**: histograms, box plots
```

Create `~/.claude/skills/data-analyzer/scripts/analyze.py`:

```python
#!/usr/bin/env python3
import pandas as pd
import sys
import json

def analyze_csv(filepath):
    """Analyze a CSV file and return summary statistics."""
    try:
        df = pd.read_csv(filepath)
        
        analysis = {
            'shape': df.shape,
            'columns': list(df.columns),
            'dtypes': df.dtypes.astype(str).to_dict(),
            'missing_values': df.isnull().sum().to_dict(),
            'numeric_summary': df.describe().to_dict(),
            'duplicates': int(df.duplicated().sum()),
            'memory_usage': int(df.memory_usage(deep=True).sum())
        }
        
        return analysis
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Usage: analyze.py <filepath>'}))
        sys.exit(1)
    
    result = analyze_csv(sys.argv[1])
    print(json.dumps(result, indent=2))
```

### Creating Custom Sub-agents

Sub-agents are specialized Claude instances for specific tasks.

**Exercise 3.5: Create a Code Reviewer Sub-agent**

Create `.claude/agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Comprehensive code quality and security review specialist. Invoke when reviewing code changes or performing security audits
tools: Read, Grep, Glob
model: sonnet
permissionMode: default
---

# Code Reviewer Sub-agent

You are an expert code reviewer focusing on security, quality, and maintainability.

## Review Priorities

Review code in this order:

1. **Security Vulnerabilities** (CRITICAL)
   - SQL injection
   - XSS vulnerabilities
   - Authentication/authorization issues
   - Data exposure risks
   - Cryptographic weaknesses

2. **Logic Errors** (HIGH)
   - Race conditions
   - Off-by-one errors
   - Null pointer exceptions
   - Incorrect algorithm implementation

3. **Performance Issues** (MEDIUM)
   - N+1 queries
   - Memory leaks
   - Inefficient algorithms
   - Unnecessary re-renders

4. **Code Quality** (LOW)
   - Naming conventions
   - Code duplication
   - Complex functions
   - Missing documentation

## Review Process

1. **Initial Scan**
   - Read all changed files
   - Identify high-risk areas
   - Note dependencies

2. **Detailed Analysis**
   - Review each changed section
   - Check for security issues
   - Verify error handling
   - Assess test coverage

3. **Report**
   - List findings by priority
   - Provide specific line numbers
   - Suggest fixes
   - Rate overall code quality (1-10)

## Output Format

```
## Security Issues
[List any security vulnerabilities found]

## Logic Errors
[List any logic errors]

## Performance Concerns
[List performance issues]

## Code Quality
[List code quality improvements]

## Positive Aspects
[Highlight good practices]

## Overall Assessment
Rating: X/10
Summary: [Brief overall assessment]
```

## Best Practices

- Be constructive, not critical
- Provide code examples for suggestions
- Link to relevant documentation
- Distinguish between "must fix" and "nice to have"
- Acknowledge good code patterns
```

**Exercise 3.6: Create a Test Writer Sub-agent**

Create `.claude/agents/test-writer.md`:

```markdown
---
name: test-writer
description: Specialized agent for writing comprehensive test suites. Use when generating tests for any code
tools: Read, Write, Edit
model: sonnet
skills: testing-standards
---

# Test Writer Sub-agent

You are a testing specialist who writes comprehensive, maintainable test suites.

## Your Mission

Generate high-quality tests that:
- Cover all code paths
- Test edge cases
- Are easy to understand
- Run fast
- Are maintainable

## Test Generation Process

1. **Analyze Code**
   - Understand the function/module
   - Identify all code paths
   - Note dependencies
   - Find edge cases

2. **Plan Tests**
   - List happy path scenarios
   - List error scenarios
   - List edge cases
   - Determine mocking needs

3. **Write Tests**
   - Start with happy path
   - Add error cases
   - Add edge cases
   - Verify mocking

4. **Validate**
   - Check coverage
   - Verify test names
   - Ensure readability
   - Confirm independence

## Test Template

```javascript
describe('[Component/Function]', () => {
  // Setup
  beforeEach(() => {
    // Arrange common test data
  })

  afterEach(() => {
    // Cleanup
  })

  // Happy path
  describe('when [normal condition]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = // test data
      
      // Act
      const result = functionUnderTest(input)
      
      // Assert
      expect(result).toBe(expected)
    })
  })

  // Error cases
  describe('when [error condition]', () => {
    it('should throw [specific error]', () => {
      expect(() => functionUnderTest(invalid))
        .toThrow('Expected error message')
    })
  })

  // Edge cases
  describe('when [edge case]', () => {
    it('should handle [edge condition]', () => {
      // test edge case
    })
  })
})
```

## Mocking Strategy

- Mock external dependencies
- Use real implementations for your own code
- Prefer dependency injection for testability
- Use factories for test data

## Coverage Goals

- Aim for 100% statement coverage
- Achieve 100% branch coverage
- Test all error paths
- Cover edge cases

When you write tests:
1. Make them readable
2. Make them maintainable  
3. Make them fast
4. Make them reliable
```

**Exercise 3.7: Use Your Sub-agents**

```bash
claude

# Manually invoke a sub-agent
> Use the code-reviewer sub-agent to review my latest changes

# Or let Claude decide
> Review my code for security issues
# (Claude will automatically use code-reviewer sub-agent)

# Generate tests
> Use the test-writer sub-agent to create tests for src/auth/login.ts
```

### Integrating MCP Servers

MCP servers connect Claude to external tools and services.

**Exercise 3.8: Add GitHub MCP**

```bash
# Get GitHub personal access token from https://github.com/settings/tokens
# Need: repo, workflow permissions

# Add GitHub MCP server
claude mcp add-json github '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
  }
}' --scope user

# Test it
claude

> List my open pull requests in github.com/username/repo

> Create an issue in my repo with title "Bug: Login fails"

> Get the latest commit message from main branch
```

**Exercise 3.9: Add File System MCP**

```bash
# Add filesystem MCP for read/write access
claude mcp add-json filesystem '{
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/path/to/your/project"
  ]
}' --scope project
```

**Exercise 3.10: Add Brave Search MCP**

```bash
# Get API key from https://brave.com/search/api/

claude mcp add-json brave-search '{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "your_api_key_here"
  }
}' --scope user

# Test it
claude

> Search for the latest React 19 features using Brave
```

**Exercise 3.11: Verify MCP Servers**

```bash
# List all MCP servers
claude mcp list

# Get details for specific server
claude mcp get github

# Inside Claude Code, check status
claude
/mcp
```

---

## Level 4: Expert

### Creating Hooks

Hooks automate actions at specific points in Claude's workflow.

**Exercise 4.1: Auto-Lint Hook**

Create `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx eslint --fix $FILE"
          }
        ]
      }
    ]
  }
}
```

**Exercise 4.2: Test Runner Hook**

Update `.claude/settings.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm test -- --findRelatedTests $FILE"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "afplay ~/notification.mp3"
          }
        ]
      }
    ]
  }
}
```

**Exercise 4.3: Git Hooks**

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "git stash"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "git stash pop"
          }
        ]
      }
    ]
  }
}
```

### Building a Complete Plugin

**Exercise 4.4: Create a Full-Stack Plugin**

Create plugin structure:

```bash
mkdir -p my-dev-plugin/{.claude-plugin,commands,agents,skills,hooks}
```

**Create plugin manifest:**

`my-dev-plugin/.claude-plugin/plugin.json`:

```json
{
  "name": "my-dev-toolkit",
  "description": "Complete development toolkit with commands, agents, and skills",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/my-dev-plugin"
  }
}
```

**Add commands:**

`my-dev-plugin/commands/feature.md`:

```markdown
---
description: Start a new feature with proper branch and structure
allowed-tools: Bash, Read, Write
---

# Feature Starter Command

1. Create a new git branch: feature/[name]
2. Create feature directory structure:
   - src/features/[name]/
   - src/features/[name]/components/
   - src/features/[name]/hooks/
   - src/features/[name]/tests/
3. Create initial files:
   - index.ts
   - README.md
   - [Feature].test.ts
4. Update main index.ts to export new feature

Ask for feature name and then execute these steps.
```

**Add agents:**

`my-dev-plugin/agents/architect.md`:

```markdown
---
name: architect
description: System architecture and design specialist. Use for system design questions and architectural decisions
tools: Read, Grep, Glob
model: opus
---

# Architect Sub-agent

You are a senior software architect specializing in:
- System design
- Architecture patterns
- Scalability
- Performance optimization
- Technology selection

When consulted:
1. Understand requirements
2. Analyze constraints
3. Consider tradeoffs
4. Propose architecture
5. Explain decisions

Focus on:
- Maintainability
- Scalability
- Performance
- Security
- Cost-effectiveness
```

**Add skills:**

`my-dev-plugin/skills/api-design/SKILL.md`:

```markdown
---
name: api-design
description: RESTful API design following industry best practices. Use when designing or documenting APIs
---

# API Design Skill

## REST Principles

- Resource-based URLs
- HTTP methods for CRUD
- Stateless requests
- Proper status codes

## URL Structure

```
GET    /api/users          # List all users
GET    /api/users/:id      # Get specific user
POST   /api/users          # Create user
PUT    /api/users/:id      # Update user
PATCH  /api/users/:id      # Partial update
DELETE /api/users/:id      # Delete user
```

## Response Format

```json
{
  "data": {},
  "meta": {
    "timestamp": "2025-01-09T10:00:00Z",
    "version": "1.0"
  },
  "errors": []
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error
```

**Add hooks:**

`my-dev-plugin/hooks/hooks.json`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npm run lint:fix"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Task complete!'"
          }
        ]
      }
    ]
  }
}
```

**Add MCP:**

`my-dev-plugin/.mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Exercise 4.5: Test Your Plugin**

```bash
# Test locally
claude --plugin-dir ./my-dev-plugin

# Inside Claude Code
/plugin list

# Test commands
/my-dev-toolkit:feature user-profile

# Test agents
> Use the architect agent to design a microservices architecture
```

**Exercise 4.6: Package and Distribute**

```bash
# Create README
# my-dev-plugin/README.md

# Create repository on GitHub
git init
git add .
git commit -m "Initial plugin"
git remote add origin https://github.com/yourusername/my-dev-plugin
git push -u origin main

# Others can now install with:
# /plugin install github:yourusername/my-dev-plugin
```

### Advanced Sub-agent Patterns

**Exercise 4.7: Parallel Sub-agents**

```bash
claude

# Launch multiple sub-agents in parallel
> Research OAuth 2.0 best practices while simultaneously documenting our current auth flow and writing tests for new implementation

# Claude will spawn 3 sub-agents:
# 1. Research sub-agent (OAuth 2.0)
# 2. Documentation sub-agent (current auth flow)
# 3. Test-writer sub-agent (new tests)

# They work simultaneously and report back
```

**Exercise 4.8: Sub-agent Coordination**

Create `.claude/agents/coordinator.md`:

```markdown
---
name: coordinator
description: Coordinates multiple sub-agents for complex multi-step tasks
tools: Read, Write, Bash
model: opus
---

# Coordinator Sub-agent

You coordinate complex tasks across multiple specialized sub-agents.

## Process

1. **Analyze Task**
   - Break down requirements
   - Identify sub-tasks
   - Determine dependencies

2. **Delegate**
   - Assign tasks to appropriate sub-agents
   - Provide clear context
   - Set expectations

3. **Coordinate**
   - Manage execution order
   - Handle dependencies
   - Resolve conflicts

4. **Synthesize**
   - Combine results
   - Verify completeness
   - Present unified outcome

## Available Sub-agents

- **architect**: System design
- **code-reviewer**: Code quality
- **test-writer**: Test generation
- **documentation**: Doc writing

Use them wisely and in the right order.
```

---

## Level 5: Master

### Building with Agent SDK

The Agent SDK allows you to build autonomous agents programmatically.

**Exercise 5.1: Setup Agent SDK Project**

```bash
# Create new project
mkdir my-agent-project
cd my-agent-project
npm init -y

# Install Agent SDK
npm install @anthropic-ai/claude-agent-sdk

# Or for Python
pip install anthropic-agent-sdk
```

**Exercise 5.2: Basic Agent**

Create `agent.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function runAgent() {
  for await (const message of query({
    prompt: "Analyze this codebase and suggest improvements",
    options: {
      maxTurns: 10,
      settingSources: ['project']
    }
  })) {
    if (message.type === 'assistant') {
      console.log(message.content);
    }
    
    if (message.type === 'tool_use') {
      console.log(`Using tool: ${message.name}`);
    }
  }
}

runAgent();
```

**Exercise 5.3: Agent with Sub-agents**

Create `advanced-agent.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function buildFeature(featureName: string) {
  console.log(`Building feature: ${featureName}`);
  
  for await (const message of query({
    prompt: `Build a complete feature called "${featureName}" with:
    1. Component structure
    2. Business logic
    3. Tests
    4. Documentation
    
    Use appropriate sub-agents for each task.`,
    options: {
      maxTurns: 20,
      settingSources: ['project'],
      agents: [
        { type: 'local', path: './.claude/agents/architect.md' },
        { type: 'local', path: './.claude/agents/test-writer.md' }
      ]
    }
  })) {
    if (message.type === 'system' && message.subtype === 'init') {
      console.log('Available agents:', message.agents);
    }
    
    if (message.type === 'assistant') {
      console.log('Agent:', message.content);
    }
    
    if (message.type === 'error') {
      console.error('Error:', message.error);
    }
  }
}

// Run it
buildFeature('user-authentication');
```

**Exercise 5.4: Agent with MCP**

Create `mcp-agent.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function deployWithGitHub(branch: string) {
  for await (const message of query({
    prompt: `Deploy the ${branch} branch:
    1. Run tests
    2. Build the project
    3. Create GitHub release
    4. Deploy to production`,
    options: {
      maxTurns: 15,
      mcpServers: [
        {
          name: 'github',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-github'],
          env: {
            GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN
          }
        }
      ]
    }
  })) {
    if (message.type === 'assistant') {
      console.log(message.content);
    }
  }
}

deployWithGitHub('main');
```

**Exercise 5.5: Production Agent with Error Handling**

Create `production-agent.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

class ProductionAgent {
  private maxRetries = 3;
  
  async runTask(task: string): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        await this.executeTask(task);
        console.log('Task completed successfully');
        return;
      } catch (error) {
        attempt++;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt >= this.maxRetries) {
          throw new Error(`Task failed after ${this.maxRetries} attempts`);
        }
        
        await this.delay(1000 * attempt); // Exponential backoff
      }
    }
  }
  
  private async executeTask(task: string): Promise<void> {
    for await (const message of query({
      prompt: task,
      options: {
        maxTurns: 10,
        settingSources: ['project']
      }
    })) {
      if (message.type === 'error') {
        throw new Error(message.error);
      }
      
      if (message.type === 'assistant') {
        console.log(message.content);
      }
    }
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage
const agent = new ProductionAgent();
agent.runTask('Refactor authentication module');
```

**Exercise 5.6: Agent with Evaluation**

Create `eval-agent.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function generateWithEvaluation(prompt: string) {
  let iterations = 0;
  const maxIterations = 3;
  
  while (iterations < maxIterations) {
    console.log(`\n--- Iteration ${iterations + 1} ---`);
    
    // Generate code
    let generatedCode = '';
    for await (const message of query({
      prompt,
      options: { maxTurns: 5 }
    })) {
      if (message.type === 'assistant') {
        generatedCode = message.content;
      }
    }
    
    // Evaluate code
    const evaluation = await evaluateCode(generatedCode);
    
    if (evaluation.passed) {
      console.log('Code passed evaluation!');
      return generatedCode;
    }
    
    // Refine based on feedback
    console.log('Issues found:', evaluation.issues);
    prompt = `${prompt}\n\nPrevious attempt had these issues:\n${evaluation.issues.join('\n')}\nPlease fix them.`;
    iterations++;
  }
  
  throw new Error('Failed to generate valid code');
}

async function evaluateCode(code: string): Promise<{passed: boolean, issues: string[]}> {
  // Run linter
  // Run tests
  // Check security
  // Return evaluation results
  return { passed: true, issues: [] };
}

// Usage
generateWithEvaluation('Create a secure login function');
```

### Advanced Patterns

**Exercise 5.7: Multi-Agent System**

Create `multi-agent-system.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

class MultiAgentSystem {
  async buildCompleteFeature(featureName: string) {
    // Phase 1: Architecture
    const architecture = await this.runAgent('architect', `
      Design architecture for ${featureName} feature
    `);
    
    // Phase 2: Implementation (parallel)
    const [frontend, backend, tests] = await Promise.all([
      this.runAgent('frontend-dev', `
        Implement frontend for ${featureName}
        Architecture: ${architecture}
      `),
      this.runAgent('backend-dev', `
        Implement backend for ${featureName}
        Architecture: ${architecture}
      `),
      this.runAgent('test-writer', `
        Write tests for ${featureName}
        Architecture: ${architecture}
      `)
    ]);
    
    // Phase 3: Review
    const review = await this.runAgent('code-reviewer', `
      Review implementation:
      Frontend: ${frontend}
      Backend: ${backend}
      Tests: ${tests}
    `);
    
    // Phase 4: Documentation
    const docs = await this.runAgent('doc-writer', `
      Document ${featureName} feature
      Implementation details: ${architecture}
    `);
    
    return {
      architecture,
      frontend,
      backend,
      tests,
      review,
      docs
    };
  }
  
  private async runAgent(agentPath: string, prompt: string): Promise<string> {
    let result = '';
    
    for await (const message of query({
      prompt,
      options: {
        agents: [{ type: 'local', path: `./.claude/agents/${agentPath}.md` }]
      }
    })) {
      if (message.type === 'assistant') {
        result = message.content;
      }
    }
    
    return result;
  }
}

// Usage
const system = new MultiAgentSystem();
system.buildCompleteFeature('user-profile');
```

---

## Real-World Projects

### Project 1: Automated Code Review System

**Goal:** Build a system that automatically reviews PRs.

**Components:**
1. GitHub MCP for PR access
2. Code-reviewer sub-agent
3. Security-scanner skill
4. Hook to run on PR creation

**Implementation:**

1. Create the workflow:

`.claude/agents/pr-reviewer.md`:

```markdown
---
name: pr-reviewer
description: Automated PR review specialist
tools: Read, Grep, Glob
model: sonnet
skills: security-patterns, testing-standards
---

# PR Reviewer

Review pull requests comprehensively:

1. Fetch PR diff
2. Analyze changes
3. Check security
4. Verify tests
5. Suggest improvements
6. Post review comments
```

2. Create automation script:

`scripts/auto-review.ts`:

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

async function reviewPR(prNumber: number) {
  for await (const message of query({
    prompt: `Review PR #${prNumber} using the pr-reviewer agent`,
    options: {
      agents: [{ type: 'local', path: './.claude/agents/pr-reviewer.md' }],
      mcpServers: [{
        name: 'github',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github']
      }]
    }
  })) {
    if (message.type === 'assistant') {
      console.log(message.content);
    }
  }
}

// Run on PR webhook
reviewPR(123);
```

### Project 2: Documentation Generator

**Goal:** Auto-generate comprehensive documentation from code.

**Components:**
1. Documentation skill
2. API-documentation skill
3. Slash command for quick doc generation
4. Hook to update docs on code changes

**Implementation:**

1. Create documentation skill:

`~/.claude/skills/doc-generator/SKILL.md`:

```markdown
---
name: doc-generator
description: Generate comprehensive documentation from code including API docs, README, and inline comments
---

# Documentation Generator

Generate documentation at multiple levels:

## Code Comments
- JSDoc for functions
- Inline comments for complex logic
- File headers

## API Documentation
- OpenAPI specs
- Endpoint descriptions
- Example requests/responses

## README Files
- Installation instructions
- Usage examples
- Configuration options
- Architecture overview

## Developer Guides
- Setup instructions
- Development workflow
- Testing guide
- Deployment process
```

2. Create command:

`.claude/commands/generate-docs.md`:

```markdown
---
description: Generate complete documentation for the project
allowed-tools: Read, Write, Edit
---

# Generate Documentation

1. Scan codebase
2. Generate API documentation
3. Create/update README
4. Add inline comments
5. Generate developer guide
```

### Project 3: Test Automation System

**Goal:** Automatically generate and maintain test coverage.

**Components:**
1. Test-writer sub-agent
2. Testing-standards skill
3. Hook to generate tests after code changes
4. Coverage reporter

**Implementation:**

Create `.claude/agents/test-automator.md`:

```markdown
---
name: test-automator
description: Automated test generation and maintenance
tools: Read, Write, Edit, Bash
skills: testing-standards
---

# Test Automator

Maintain 100% test coverage:

1. Detect code changes
2. Identify untested code
3. Generate tests
4. Run tests
5. Report coverage
6. Fix failing tests
```

---

## Best Practices

### For Skills

1. **Be Specific in Descriptions**
   - Include exact use cases
   - Use trigger keywords
   - Mention when NOT to use

2. **Progressive Disclosure**
   - Start with overview
   - Link to detailed docs
   - Use references for deep details

3. **Include Examples**
   - Show expected output
   - Provide templates
   - Demonstrate patterns

4. **Test Thoroughly**
   - Test trigger conditions
   - Verify outputs
   - Check edge cases

### For Sub-agents

1. **Clear Purpose**
   - Single responsibility
   - Specific expertise
   - Clear boundaries

2. **Tool Selection**
   - Only necessary tools
   - Read-only when possible
   - Minimal permissions

3. **Context Management**
   - Keep prompts concise
   - Reference skills for details
   - Use clear communication

4. **Error Handling**
   - Anticipate failures
   - Provide fallbacks
   - Report issues clearly

### For MCP Servers

1. **Security First**
   - Use environment variables for secrets
   - Minimal permissions
   - Regular audits

2. **Scope Appropriately**
   - User scope for personal tools
   - Project scope for team tools
   - Local scope for experiments

3. **Monitor Performance**
   - Check connection status
   - Monitor token usage
   - Optimize requests

4. **Documentation**
   - Document setup process
   - Provide examples
   - List requirements

### For Hooks

1. **Start Simple**
   - One hook at a time
   - Test thoroughly
   - Add complexity gradually

2. **Error Handling**
   - Handle failures gracefully
   - Log errors
   - Don't block workflow

3. **Performance**
   - Keep hooks fast
   - Avoid heavy operations
   - Use async when possible

4. **Maintenance**
   - Document purpose
   - Test regularly
   - Update as needed

### For Plugins

1. **Organization**
   - Clear structure
   - Good documentation
   - Version properly

2. **Dependencies**
   - Minimize dependencies
   - Document requirements
   - Handle missing deps

3. **Distribution**
   - Use semantic versioning
   - Provide changelog
   - Test installation

4. **Support**
   - Provide examples
   - Answer questions
   - Fix issues promptly

---

## Troubleshooting

### Common Issues

#### "Skill not loading"

**Symptoms:**
- Skill doesn't activate
- Claude doesn't mention the skill

**Solutions:**
1. Check skill location:
   ```bash
   # Should be in:
   ~/.claude/skills/your-skill/SKILL.md
   # Or:
   .claude/skills/your-skill/SKILL.md
   ```

2. Verify YAML frontmatter:
   ```yaml
   ---
   name: your-skill
   description: Very specific description with trigger words
   ---
   ```

3. Make description more specific:
   ```yaml
   # ❌ Too vague
   description: Helps with documents

   # ✅ Specific
   description: Create and edit Word documents with formatting, tables, and images. Use when working with .docx files
   ```

4. Test manually:
   ```bash
   claude
   > What skills are available?
   > Use the your-skill skill to [specific task]
   ```

#### "Sub-agent not appearing"

**Symptoms:**
- Sub-agent not in `/agents` list
- Can't invoke sub-agent

**Solutions:**
1. Check file location and format
2. Verify YAML frontmatter is valid
3. Restart Claude Code
4. Check file permissions

#### "MCP server connection failed"

**Symptoms:**
- Server shows as disconnected
- Tools not available

**Solutions:**
1. Check configuration:
   ```bash
   claude mcp get servername
   ```

2. Verify command works:
   ```bash
   npx @modelcontextprotocol/server-github
   ```

3. Check environment variables
4. Restart Claude Code

#### "Hook not triggering"

**Symptoms:**
- Hook doesn't run
- No output from hook

**Solutions:**
1. Check hooks configuration:
   ```json
   {
     "hooks": {
       "PostToolUse": [...]
     }
   }
   ```

2. Test command manually:
   ```bash
   npm run lint:fix src/file.ts
   ```

3. Check matcher pattern
4. Enable debug mode:
   ```bash
   claude --debug
   ```

#### "Plugin not installing"

**Symptoms:**
- Installation fails
- Plugin not available

**Solutions:**
1. Check plugin structure:
   ```
   plugin/
   ├── .claude-plugin/
   │   └── plugin.json
   └── ...
   ```

2. Verify plugin.json is valid JSON
3. Check repository access
4. Try local installation:
   ```bash
   claude --plugin-dir ./plugin
   ```

### Performance Issues

#### "Claude Code is slow"

**Solutions:**
1. Reduce MCP servers:
   ```bash
   # Disable unused servers
   /mcp
   # Toggle off unneeded servers
   ```

2. Compact context:
   ```bash
   /compact
   ```

3. Disable unused skills temporarily
4. Clear old sessions

#### "High token usage"

**Solutions:**
1. Use more concise CLAUDE.md
2. Reduce skill complexity
3. Use sub-agents for isolation
4. Monitor with:
   ```bash
   /stats
   ```

### Getting Help

1. **Official Documentation**
   - https://code.claude.com/docs
   - https://docs.claude.com

2. **Community**
   - Reddit: r/ClaudeAI
   - Discord: Anthropic Community
   - GitHub Discussions

3. **Debug Mode**
   ```bash
   claude --debug
   ```

4. **Report Issues**
   - GitHub issues
   - Support forum
   - Feedback in Claude.ai

---

## Next Steps

### Continue Learning

1. **Experiment Daily**
   - Try new skills
   - Create custom commands
   - Build sub-agents

2. **Join Community**
   - Share your creations
   - Learn from others
   - Contribute to plugins

3. **Build Real Projects**
   - Start small
   - Iterate quickly
   - Share results

4. **Stay Updated**
   - Follow release notes
   - Try new features
   - Update dependencies

### Advanced Topics to Explore

1. **Custom MCP Servers**
   - Build your own
   - Python or TypeScript
   - Integrate services

2. **Complex Agent Systems**
   - Multi-agent coordination
   - Parallel execution
   - Error recovery

3. **Enterprise Deployment**
   - Team management
   - Access control
   - Compliance

4. **Performance Optimization**
   - Token management
   - Context efficiency
   - Speed optimization

---

## Conclusion

You've now learned the complete Claude Code ecosystem from basics to advanced patterns. Remember:

1. **Start Simple**: Master basics before advanced features
2. **Practice Regularly**: Build real projects
3. **Share Knowledge**: Help others learn
4. **Keep Learning**: Technology evolves

The most important skill is knowing which tool to use when. With practice, you'll develop intuition for:
- When to use Skills vs Sub-agents
- When to create MCP integrations
- When to use Hooks vs Commands
- When to build Plugins vs keep configs local

Keep experimenting, and you'll discover powerful workflows unique to your needs.

Happy coding with Claude! 🚀
