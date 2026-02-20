---
skill_name: Code Review Workflow
description: Comprehensive code review with security, quality, and performance analysis. Systematic review process with checklists and best practices.
category: Quality
priority: P1
argument-hint: '[target-file-or-directory]'
allowed-tools: Read, Grep, Glob
agent: code-review-expert
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Code Review Workflow Skill

Comprehensive guide to conducting effective, thorough code reviews with focus on quality, security, and maintainability.

## Usage

```
/code-review-workflow                    # Review current changes
/code-review-workflow src/api/auth.ts    # Review specific file
/code-review-workflow src/services/      # Review directory
```

## Analysis Areas

- **Security**: Vulnerabilities, injection risks, auth issues
- **Quality**: Code smells, complexity, maintainability
- **Performance**: Bottlenecks, memory issues, optimization opportunities
- **Best Practices**: Patterns, conventions, documentation

## Overview

Code review is a critical quality gate in software development. This skill provides systematic approaches, checklists, and best practices for reviewing code across different languages and frameworks.

## Advanced Frontmatter Options

Claude Code v2.1+ supports enhanced frontmatter options for skills:

### Context Forking
```yaml
---
skill_name: Code Review Workflow
context: fork
---
```
Use `context: fork` to execute this skill in a forked context, providing isolation from the main conversation while maintaining tool access. This is useful for lengthy code reviews that might clutter the main conversation.

### Agent Specification
```yaml
---
skill_name: Code Review Workflow
agent: code-review-expert
---
```
Use the `agent` field to automatically invoke a specific sub-agent when this skill is executed. For code review, you might specify a specialized code review agent with enhanced context.

### Skill Hot-Reload
Skills are now automatically hot-reloaded when changed in `~/.claude/skills/` or `.claude/skills/` - no restart required. This enables rapid iteration during skill development.

## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/code-review-workflow
cp code-review-workflow.md ~/.claude/skills/code-review-workflow/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/code-review-workflow
cp code-review-workflow.md .claude/skills/code-review-workflow/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill when you ask about code reviews or request a PR review.

## Pre-Review Checklist

Before starting code review:
- [ ] Automated tests pass
- [ ] Linter checks pass
- [ ] Build succeeds
- [ ] CI/CD pipeline is green
- [ ] PR description is clear
- [ ] Changes are reasonably sized (< 400 lines preferred)

## Review Categories

### 1. Functionality Review
- Does the code do what it's supposed to do?
- Are edge cases handled?
- Is error handling comprehensive?
- Are there any logical errors?

### 2. Code Quality Review
- Is the code readable and maintainable?
- Are variable/function names descriptive?
- Is there unnecessary complexity?
- Are there code smells?
- Is the code DRY (Don't Repeat Yourself)?

### 3. Security Review
- Are inputs validated?
- Are outputs properly encoded?
- Are sensitive data protected?
- Are there SQL injection vulnerabilities?
- Are there XSS vulnerabilities?
- Is authentication/authorization correct?

### 4. Performance Review
- Are there performance bottlenecks?
- Are database queries optimized?
- Is caching used appropriately?
- Are there memory leaks?
- Is there unnecessary computation?

### 5. Testing Review
- Are tests comprehensive?
- Do tests cover edge cases?
- Are tests maintainable?
- Is test data realistic?
- Are there integration tests?

### 6. Documentation Review
- Are functions/classes documented?
- Are complex algorithms explained?
- Is the README updated?
- Are API changes documented?

## Language-Specific Checklists

### JavaScript/TypeScript
- [ ] Types are properly defined (TypeScript)
- [ ] Async/await used correctly
- [ ] Error boundaries in place (React)
- [ ] No unused variables/imports
- [ ] Proper dependency array in hooks (React)
- [ ] No console.log in production code

### Python
- [ ] Type hints used appropriately
- [ ] Following PEP 8 style guide
- [ ] Context managers used for resources
- [ ] Proper exception handling
- [ ] No mutable default arguments
- [ ] Virtual environment requirements updated

### Go
- [ ] Errors properly handled
- [ ] Goroutines don't leak
- [ ] Proper use of context
- [ ] No race conditions
- [ ] Defer used appropriately

## Review Process

### 1. High-Level Review (5-10 minutes)
- Read PR description
- Understand the purpose
- Check overall structure
- Identify major concerns

### 2. Detailed Review (20-30 minutes)
- Review code line-by-line
- Check against checklists
- Note both issues and good practices
- Consider alternatives

### 3. Testing Review (10 minutes)
- Review test coverage
- Check test quality
- Verify edge cases

### 4. Documentation Review (5 minutes)
- Check inline comments
- Verify README updates
- Review API documentation

## Providing Feedback

### Feedback Structure
```
[Category] [Severity]: [Description]

[Code snippet or location]

[Suggestion or explanation]

[Example if applicable]
```

### Severity Levels
- **Blocker**: Must be fixed before merge
- **Major**: Should be fixed before merge
- **Minor**: Could be fixed in follow-up
- **Nit**: Stylistic preference

### Example Feedback

**Good**:
```
[Security] Blocker: SQL injection vulnerability

Line 45: User input is directly concatenated into SQL query

Suggestion: Use parameterized queries

Example:
// Bad
query = `SELECT * FROM users WHERE id = ${userId}`

// Good
query = 'SELECT * FROM users WHERE id = ?'
db.execute(query, [userId])
```

**Avoid**:
```
This code is bad.
```

## Tools & Automation

### Automated Checks
- ESLint/Prettier for JavaScript
- Pylint/Black for Python
- golangci-lint for Go
- SonarQube for code quality
- Snyk for security

### Code Review Tools
- GitHub Pull Requests
- GitLab Merge Requests
- Gerrit
- Review Board
- Crucible

## Best Practices

### For Reviewers
1. **Be constructive**: Focus on improvement, not criticism
2. **Be specific**: Provide actionable feedback
3. **Be timely**: Review within 24 hours
4. **Ask questions**: Seek to understand intent
5. **Recognize good work**: Acknowledge improvements
6. **Focus on important issues**: Don't nitpick everything

### For Authors
1. **Keep PRs small**: Easier to review
2. **Provide context**: Clear PR description
3. **Self-review first**: Catch obvious issues
4. **Be responsive**: Address feedback promptly
5. **Ask for clarification**: If feedback is unclear
6. **Learn from feedback**: Improve future code

## Anti-Patterns to Avoid

❌ **Rubber Stamping**: Approving without thorough review
❌ **Bike-Shedding**: Focusing on trivial issues
❌ **Personal Preferences**: Enforcing style over substance
❌ **Blocking on Nits**: Holding up PRs for minor issues
❌ **Being Defensive**: Taking feedback personally

## Metrics to Track

- Time to first review
- Time to merge
- Comments per PR
- Defects found in review
- Post-merge bugs

## When to Use This Skill

Use this skill when:
- Reviewing pull requests
- Establishing code review standards
- Training new team members on reviews
- Improving review quality
- Reducing post-merge bugs

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
