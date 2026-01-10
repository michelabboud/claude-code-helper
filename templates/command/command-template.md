---
description: [Brief description of what this command does - shown in /help]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
arguments:
  - name: target
    description: The target file, directory, or identifier to operate on
    required: true
  - name: options
    description: Additional options (e.g., --verbose, --dry-run)
    required: false
---

# /your-command-name

## Purpose

This command [DESCRIBE PRIMARY PURPOSE]. Use it when you need to:
- [Use case 1]
- [Use case 2]
- [Use case 3]

## Usage

```
/your-command-name <target> [options]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `target` | Yes | [Description of what target should be] |
| `options` | No | [Description of available options] |

### Examples

```bash
# Basic usage
/your-command-name src/main.ts

# With options
/your-command-name src/ --verbose

# Specific scenario
/your-command-name ./api --dry-run
```

## Workflow

When this command is invoked, follow these steps:

### Step 1: Validate Input
- Verify the target exists (if applicable)
- Parse and validate any options
- Check for required prerequisites

### Step 2: Analyze
- [Description of analysis step]
- Gather necessary context
- Identify what needs to be done

### Step 3: Execute
- [Description of main execution]
- Apply changes or generate output
- Handle any errors gracefully

### Step 4: Report
- Summarize what was done
- Highlight any issues or warnings
- Provide next steps if applicable

## Implementation Guidelines

### Input Validation
```
If target is a file:
  - Verify file exists
  - Check file type is supported

If target is a directory:
  - Verify directory exists
  - Identify relevant files within

If target is invalid:
  - Provide helpful error message
  - Suggest correct usage
```

### Output Format

Provide output in this format:

```
## [Command Name] Results

### Summary
- [Key metric 1]: [value]
- [Key metric 2]: [value]

### Details
[Detailed findings or results]

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

### Next Steps
- [Suggested action 1]
- [Suggested action 2]
```

## Options Reference

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed output | false |
| `--dry-run` | Preview changes without applying | false |
| `--format` | Output format (json, markdown, text) | markdown |
| `--output` | Write results to file | stdout |

## Error Handling

### Common Errors

**Error: Target not found**
```
The specified target '[target]' was not found.
Please verify the path and try again.
```

**Error: Permission denied**
```
Unable to access '[target]'. Check file permissions.
```

**Error: Invalid options**
```
Unknown option '[option]'.
Available options: --verbose, --dry-run, --format, --output
```

## Integration

This command works well with:
- `/related-command-1` - [How they work together]
- `/related-command-2` - [How they work together]

## Examples in Context

### Example 1: [Scenario]
```
User: /your-command-name src/components/Button.tsx

Claude: [Example of expected response]
```

### Example 2: [Scenario]
```
User: /your-command-name ./api --verbose

Claude: [Example of expected response]
```

---

**Instructions for customization:**
1. Replace `your-command-name` with a short, memorable command name
2. Update the `description` - this appears in /help listings
3. Adjust `allowed-tools` to only include what your command needs
4. Define your `arguments` with clear names and descriptions
5. Fill in all bracketed `[PLACEHOLDERS]` with your specific content
6. Remove or add sections as needed for your command
7. Place this file in `~/.claude/commands/your-command-name.md`
