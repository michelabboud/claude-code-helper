# Claude Code Skills

Reusable skills that teach Claude specialized knowledge, workflows, and best practices.

## What Are Skills?

Skills are knowledge modules that enhance Claude's capabilities in specific domains. Unlike commands (which are action-oriented), skills provide context, patterns, and expertise that Claude applies when relevant.

**Key characteristics:**
- Activated based on context and user requests
- Provide comprehensive knowledge in a domain
- Can include examples, patterns, and best practices
- Hot-reload when saved (no restart needed)

## Available Skills

| Skill | Description | Category |
|-------|-------------|----------|
| **api-documentation** | OpenAPI 3.0 and REST documentation standards | Documentation |
| **testing-standards** | Comprehensive testing guidelines | Testing |
| **tdd-workflow** | Red-Green-Refactor cycle and TDD patterns | Testing |
| **bdd-framework-examples** | Cucumber, Behave, SpecFlow examples | Testing |
| **contract-testing** | Pact and consumer-driven contracts | Testing |
| **mutation-testing** | Stryker, PITest, Mutmut patterns | Testing |
| **visual-regression-testing** | Percy, Chromatic, BackstopJS | Testing |
| **advanced-e2e-testing** | Complex workflows, auth, mocking | Testing |
| **code-review-workflow** | Systematic code review process | Quality |
| **refactoring-strategy** | Safe refactoring patterns | Development |
| **api-design-patterns** | RESTful API design best practices | Development |
| **database-design-patterns** | Schema design and optimization | Development |
| **ci-best-practices** | CI/CD pipeline patterns | DevOps |
| **release-management** | Release workflows and versioning | DevOps |
| **caching-expert** | Static, Object, HTTP, CDN caching | Performance |

## Installation

### Install All Skills (Global)

```bash
mkdir -p ~/.claude/skills
cp -r *.md ~/.claude/skills/
cp -r api-documentation ~/.claude/skills/
cp -r testing-standards ~/.claude/skills/
```

### Install All Skills (Project-Specific)

```bash
mkdir -p .claude/skills
cp -r /path/to/skills/* .claude/skills/
```

### Install Single Skill

```bash
# Skills with subdirectories (SKILL.md format)
cp -r api-documentation ~/.claude/skills/

# Standalone skill files
cp tdd-workflow.md ~/.claude/skills/
```

### Quick Install via curl

```bash
mkdir -p ~/.claude/skills

# Install a specific skill
curl -sO ~/.claude/skills/tdd-workflow.md \
  https://raw.githubusercontent.com/michelabboud/claude-code-helper/main/skills/tdd-workflow.md
```

## Skill Formats

### Format 1: Standalone Markdown

Single `.md` file with frontmatter:

```markdown
---
name: skill-name
description: When to activate this skill
---

# Skill Content

Knowledge, patterns, examples...
```

**Location**: `~/.claude/skills/skill-name.md`

### Format 2: Directory with SKILL.md

For skills with multiple resources:

```
skill-name/
├── SKILL.md          # Main skill content
├── templates/        # Optional templates
└── examples/         # Optional examples
```

**Location**: `~/.claude/skills/skill-name/SKILL.md`

## Usage

Skills activate automatically based on context:

```bash
# Claude detects testing context
> Help me write tests for this function

# tdd-workflow or testing-standards skill activates
# Claude applies TDD patterns and best practices
```

Or reference explicitly:

```bash
> Using the API design patterns skill, review my endpoint design
```

## Skill Reference

### Testing Skills

#### tdd-workflow
Red-Green-Refactor cycle, test-first development, TDD best practices.

**Covers**:
- Red-Green-Refactor cycle
- TDD patterns (Fake It, Triangulation, Obvious)
- When to use TDD
- Common pitfalls
- Framework-specific examples

#### bdd-framework-examples
Behavior-Driven Development with Gherkin syntax.

**Covers**:
- Cucumber (JavaScript/Ruby)
- Behave (Python)
- SpecFlow (.NET)
- Feature file structure
- Step definitions

#### contract-testing
Consumer-driven contract testing patterns.

**Covers**:
- Pact framework
- Provider verification
- Consumer tests
- Contract versioning

#### mutation-testing
Measure test quality through mutation analysis.

**Covers**:
- Stryker (JavaScript/TypeScript)
- PITest (Java)
- Mutmut (Python)
- Mutation score interpretation

#### visual-regression-testing
Catch visual bugs with screenshot comparison.

**Covers**:
- Percy integration
- Chromatic for Storybook
- BackstopJS setup
- Baseline management

#### advanced-e2e-testing
Complex E2E testing scenarios.

**Covers**:
- Authentication flows
- Multi-step workflows
- API mocking
- Flaky test handling

---

### Development Skills

#### api-design-patterns
RESTful API design best practices.

**Covers**:
- Resource naming
- HTTP methods
- Status codes
- Pagination
- Versioning

#### database-design-patterns
Schema design and optimization.

**Covers**:
- Normalization
- Indexing strategies
- Query optimization
- Migration patterns

#### refactoring-strategy
Safe, systematic code refactoring.

**Covers**:
- Extract patterns
- Rename strategies
- Move operations
- Safety checks

#### code-review-workflow
Systematic code review process.

**Covers**:
- Review checklist
- Security review
- Performance review
- Feedback patterns

---

### DevOps Skills

#### ci-best-practices
CI/CD pipeline patterns.

**Covers**:
- Pipeline structure
- Caching strategies
- Parallelization
- Deployment gates

#### release-management
Release workflows and versioning.

**Covers**:
- Semantic versioning
- Changelog generation
- Release branches
- Hotfix processes

---

### Performance Skills

#### caching-expert
Comprehensive caching strategies.

**Covers**:
- Static file caching
- Object caching (Redis, Memcached)
- HTTP caching headers
- CDN configuration

## Creating Custom Skills

### Basic Template

```markdown
---
name: my-custom-skill
description: Describe when this skill should activate
category: Development
---

# My Custom Skill

## Overview
Brief introduction to what this skill teaches.

## Key Concepts
- Concept 1
- Concept 2

## Patterns

### Pattern Name
Description and example...

## Best Practices
- Practice 1
- Practice 2

## Examples

### Example 1: Basic Usage
\`\`\`typescript
// Code example
\`\`\`

---

**Version**: 1.0.0
```

### Skill Frontmatter Options

| Field | Description |
|-------|-------------|
| `name` | Skill identifier |
| `description` | When to activate (used for matching) |
| `category` | Grouping category |
| `priority` | P0-P3 priority level |
| `hooks` | Inline hook definitions |
| `context` | `fork` for isolated execution |
| `agent` | Specify agent type |

### Best Practices

1. **Be comprehensive** - Skills should teach, not just list
2. **Include examples** - Real code examples help Claude apply knowledge
3. **Structure well** - Use clear headings and sections
4. **Update regularly** - Keep patterns current
5. **Focus on one domain** - Don't mix unrelated topics

## Skills vs Commands

| Aspect | Skills | Commands |
|--------|--------|----------|
| Purpose | Teach knowledge | Perform actions |
| Activation | Context-based | Explicit invocation |
| Content | Comprehensive | Lean instructions |
| Format | Can be long | Should be short |
| Example | TDD patterns | `/refactor` |

## Related Resources

- [Commands Examples](../commands/) - Action-oriented commands
- [Agents Examples](../agents/) - Specialized agents
- [Complete Guide](../../guides/complete-guide/) - Full Claude Code guide

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: MIT - Free to use for personal and commercial projects.

---

**Version**: 1.0.0
