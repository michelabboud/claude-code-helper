# Credits Template

Use this template when adding credits to resources in the claude-code-helper repository.

---

## Standard Credits Format

All resources (skills, agents, MCP servers, guides) should include a credits section at the end:

```markdown
---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

---

## When to Add Credits

### Required:
- ✅ All skill files (`.md`)
- ✅ All agent files (`.md`)
- ✅ MCP server README files
- ✅ Guide and documentation files
- ✅ Example implementations

### Not Required:
- ❌ JSON configuration files (`.json`)
- ❌ Shell scripts (`.sh`)
- ❌ Test files
- ❌ Build configuration files

---

## Placement

### For Markdown Files (.md)

Place credits **at the very end** of the file, after all content:

```markdown
[... your content ...]

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

### For TypeScript/JavaScript Files (.ts, .js)

Add credits in JSDoc format at the top of the file:

```typescript
/**
 * [File description]
 *
 * @author Michel Abboud (https://github.com/michelabboud)
 * @license Apache-2.0
 */
```

---

## Examples

### Skill Example

```markdown
# My Awesome Skill

Description and content...

## Usage

...

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

### Agent Example

```markdown
---
name: my-agent
description: Agent description
---

# My Agent

Agent content...

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

### MCP Server README Example

```markdown
# My MCP Server

Server description and documentation...

## Tools Provided

...

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

---

## Customization

### For External Contributors

If you're contributing to the repository, use this format with your own information:

```markdown
---

## Credits

**Author:** [Your Name](https://github.com/yourusername)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

### For Co-Authored Work

```markdown
---

## Credits

**Authors:**
- [Michel Abboud](https://github.com/michelabboud)
- [Your Name](https://github.com/yourusername)

**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
```

---

## Consistency Guidelines

### Do ✅:
- Use the exact format shown above
- Place credits at the end of markdown files
- Include all three fields: Author, AI Assistance, License
- Add the "Want more?" call-to-action
- Use proper markdown formatting

### Don't ❌:
- Change the wording of the template
- Add emojis to the credits section (except the 💡 in call-to-action)
- Place credits in the middle of files
- Omit any of the required fields
- Use different punctuation or formatting

---

## Validation

Before submitting a pull request, verify:
1. ✅ Credits section exists at end of file
2. ✅ All required fields are present
3. ✅ Formatting matches the template exactly
4. ✅ Links are correct and functional
5. ✅ No typos in author names or URLs

---

## Tools

### Check for Missing Credits

```bash
# Find markdown files without credits
find . -name "*.md" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" -exec grep -L "## Credits" {} \;
```

### Validate Credits Format

```bash
# Check if credits follow the template
grep -A 5 "## Credits" your-file.md
```

---

## Questions?

If you have questions about the credits format or need help adding credits to your contribution, please:
1. Check this template first
2. Look at existing files in the repository for examples
3. Open an issue in the repository

---

**Template Version:** 1.0.0
**Last Updated:** January 12, 2026
