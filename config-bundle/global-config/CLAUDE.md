# Global Claude Code Configuration

## User Configuration (Edit This Section)

MODEL_MODE: default
# Options:
#   default      - Auto-switch: opus for planning, sonnet for coding, haiku for quick
#   opus-only    - Always use Claude Opus 4.6 (best for MAX plan users who want max quality)
#   sonnet-only  - Always use Claude Sonnet 4.6 (fast + capable, good for Pro plan)
#   haiku-only   - Always use Claude Haiku (fastest, cheapest)
#   custom       - Use PLAN_MODEL / CODE_MODEL / QUICK_MODEL settings below

# Custom model settings (only used when MODEL_MODE: custom)
PLAN_MODEL: opus
CODE_MODEL: sonnet
QUICK_MODEL: haiku

---

## Model Transparency

**CRITICAL**: Always prefix your responses with the current model name in square brackets.

Format: `[model] Your response...`

Examples:
- `[sonnet] I'm implementing the authentication function...`
- `[opusplan] Let me plan the architecture for this system...`
- `[opus] I'm analyzing this complex algorithm...`
- `[haiku] Quick response: here's the fix...`

This is **MANDATORY** - never respond without the model prefix. Which prefix to use is determined by MODEL_MODE above.

## Automatic Model Selection

**Read MODEL_MODE from User Configuration above first.**

You have access to different models optimized for different tasks:
- **opusplan**: Superior planning, architecture, and strategic thinking
- **sonnet**: Fast, efficient implementation and coding
- **haiku**: Quick tasks and fast responses

### Model Mode Behavior

**If MODEL_MODE is `opus-only`:**
- Always use opus for ALL tasks regardless of type
- Prefix all responses with `[opus]`
- Never switch models — ignore task-type detection rules

**If MODEL_MODE is `sonnet-only`:**
- Always use sonnet for ALL tasks
- Prefix all responses with `[sonnet]`
- Never switch models

**If MODEL_MODE is `haiku-only`:**
- Always use haiku for ALL tasks
- Prefix all responses with `[haiku]`
- Never switch models

**If MODEL_MODE is `custom`:**
- Use PLAN_MODEL for planning/architecture triggers → prefix `[<PLAN_MODEL>]`
- Use CODE_MODEL for coding/implementation triggers → prefix `[<CODE_MODEL>]`
- Use QUICK_MODEL for simple/quick tasks → prefix `[<QUICK_MODEL>]`
- Apply detection rules below to determine which category each task falls into

**If MODEL_MODE is `default` (apply these detection rules):**

### Detection Rules (used when MODEL_MODE is `default` or `custom`)

**Use opusplan (or PLAN_MODEL) when user asks:**
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

**Use sonnet (or CODE_MODEL) when user asks:**
- "Implement..."
- "Write code for..."
- "Fix this bug..."
- "Refactor this..."
- "Add a feature to..."
- Direct coding tasks

**Use haiku (or QUICK_MODEL) for:**
- Quick questions
- Simple fixes
- Fast responses needed

### Workflow

1. Check MODEL_MODE in User Configuration above
2. If not `default`/`custom`: use the single specified model for everything
3. If `default` or `custom`: detect task type from user's request, select appropriate model
4. Announce model transparently, execute the task
5. If planning (`default` mode), switch back to sonnet for implementation

Example (default mode):
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
