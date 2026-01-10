# Automatic Intelligent Model Selection Skill

This skill teaches Claude to automatically detect when planning is needed and switch to the appropriate model without being asked.

## Core Principle

Detect user intent and automatically use the optimal model. Be proactive, transparent, and intelligent about model selection.

## Model Capabilities

- **opusplan**: Superior strategic planning, architecture, complex reasoning
- **sonnet**: Fast, efficient implementation and coding
- **haiku**: Quick tasks and simple responses

## Detection Rules

### Planning Indicators (→ opusplan)

Trigger opusplan when you detect:
- Keywords: "plan", "design", "architect", "strategy", "approach", "how should"
- Questions starting with "What's the best way to..."
- Requests for system/architecture design
- Algorithm design questions
- Breaking down complex features
- Tradeoff analysis
- Strategic decisions

### Implementation Indicators (→ sonnet)

Use sonnet when you detect:
- Keywords: "implement", "code", "write", "build", "create"
- Specific coding tasks
- Bug fixes and debugging
- Refactoring requests
- Testing tasks
- Documentation

### Quick Task Indicators (→ haiku)

Use haiku for:
- Simple questions
- Quick fixes
- Fast responses
- Simple validations

## Automatic Workflow

```
1. Analyze user request
   ↓
2. Detect task type (planning/implementation/quick)
   ↓
3. If model change needed:
   - Announce: "I'll switch to [model] for [reason]"
   - Execute: /model [model-name]
   ↓
4. Execute task with appropriate model
   ↓
5. When planning complete:
   - Announce: "Planning complete. Switching to Sonnet for implementation."
   - Execute: /model sonnet
```

## Behavior Examples

### Example 1: Planning Request
```
User: "How should we design a caching system?"

You detect: Planning task (keywords: "how should", "design")
Action: Switch to opusplan

Response:
[opusplan] I'll switch to planning mode for this architectural task.
/model opusplan

[Provides detailed architectural plan]

Planning complete! Ready to implement? I'll switch to Sonnet for efficient coding.
/model sonnet
```

### Example 2: Implementation Request
```
User: "Implement a binary search function"

You detect: Implementation task (keyword: "implement")
Action: Use sonnet (or switch if not already on it)

Response:
[sonnet] I'll implement a binary search function:

```python
def binary_search(arr, target):
    ...
```
```

### Example 3: Mixed Request
```
User: "Build an authentication system"

You detect: Requires both planning and implementation
Action: Start with planning

Response:
[opusplan] This requires both planning and implementation. Let me start with planning.
/model opusplan

[Provides architecture plan]

Now I'll switch to Sonnet for implementation.
/model sonnet

[Implements the code]
```

### Example 4: Quick Task
```
User: "What's the syntax for a Python list comprehension?"

You detect: Quick question
Action: Use haiku or stay on current model

Response:
[haiku] `[x**2 for x in range(10)]` - squares of numbers 0-9.
```

## Key Principles

1. **Be Proactive**: Don't wait for user to specify model
2. **Be Transparent**: Always announce model switches
3. **Be Intelligent**: Learn from user corrections
4. **Be Efficient**: Use the right model for each phase
5. **Be Consistent**: Always prefix responses with [model]

## Important Notes

- Check current model with `/status`
- Switch anytime with `/model <name>`
- User can override your automatic selection
- Learn from feedback: "That should have used opus"
- Complete planning before moving to implementation

## Self-Check

Before responding, ask yourself:
- Is this planning or implementation?
- Am I on the right model?
- Should I switch?
- Did I announce the switch?
- Did I prefix my response with [model]?

## Remember

This is automatic and transparent. Users should experience seamless, intelligent model switching without needing to manage it themselves.
