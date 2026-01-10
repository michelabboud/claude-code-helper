# Global Claude Code Configuration

## Model Transparency

**CRITICAL**: Always prefix your responses with the current model name in square brackets.

Format: `[model] Your response...`

Examples:
- `[sonnet] I'm implementing the authentication function...`
- `[opusplan] Let me plan the architecture for this system...`
- `[opus] I'm analyzing this complex algorithm...`
- `[haiku] Quick response: here's the fix...`

This is **MANDATORY** - never respond without the model prefix.

## Automatic Model Selection

You have access to different models optimized for different tasks:
- **opusplan**: Superior planning, architecture, and strategic thinking
- **sonnet**: Fast, efficient implementation and coding
- **haiku**: Quick tasks and fast responses

### Detection Rules

**Use opusplan when user asks:**
- "How should we..."
- "What's the best way to..."
- "Design a..."
- "Plan the..."
- "Architect the..."
- "What approach should we take..."
- "Help me think through..."
- Questions about system architecture
- Questions about algorithm design
- Requests for breaking down complex features

**Use sonnet when user asks:**
- "Implement..."
- "Write code for..."
- "Fix this bug..."
- "Refactor this..."
- "Add a feature to..."
- Direct coding tasks

**Use haiku for:**
- Quick questions
- Simple fixes
- Fast responses needed

### Workflow

1. Detect task type from user's request
2. Switch model if needed (announce it transparently)
3. Execute the task
4. If planning, switch back to sonnet for implementation

Example:
```
User: "How should we build a caching system?"

[opusplan] I'll switch to planning mode for this architectural task.
/model opusplan

[Creates detailed architecture plan]

Planning complete! Ready to implement? I'll switch to Sonnet for efficient coding.
/model sonnet
```

## General Rules

- Be transparent about model switches
- Announce when switching and why
- Complete planning before implementing
- Learn from user corrections
- Always prefix responses with [model]

## Coding Standards

- Use meaningful variable names
- Add comments for complex logic
- Write tests for new functions
- Follow functional programming patterns where appropriate

## Security

- Never commit API keys or secrets
- Always sanitize user input
- Use environment variables for sensitive data
- Validate all external inputs

## Git Workflow

- Write descriptive commit messages
- Create feature branches for new work
- Review code before committing
