# Agent Loop Prevention - Avoiding "Ralph Wiggum Loops"

**Comprehensive guide to preventing infinite loops and unproductive cycles in agentic workflows**

> "I'm in danger!" - Ralph Wiggum (and your agent stuck in a loop)

---

## Table of Contents

1. [What Are Ralph Wiggum Loops?](#what-are-ralph-wiggum-loops)
2. [Common Causes](#common-causes)
3. [Detection Strategies](#detection-strategies)
4. [Prevention Patterns](#prevention-patterns)
5. [Configuration Options](#configuration-options)
6. [Circuit Breaker Pattern](#circuit-breaker-pattern)
7. [Progress Tracking](#progress-tracking)
8. [Exit Conditions](#exit-conditions)
9. [Examples](#examples)
10. [Troubleshooting Stuck Agents](#troubleshooting-stuck-agents)

---

## What Are Ralph Wiggum Loops?

**Ralph Wiggum Loops** (named after The Simpsons character) are situations where an agent gets stuck in:

- **Infinite loops** - Repeating the same actions indefinitely
- **Unproductive cycles** - Making no forward progress despite activity
- **Circular reasoning** - Going in circles without reaching conclusions
- **Tool thrashing** - Repeatedly calling the same tools with same inputs
- **Context amnesia** - Forgetting what it just did and redoing it

### Why This Matters

In production agentic systems, loops cause:
- ❌ **Wasted API calls** (expensive with token-based pricing)
- ❌ **Poor user experience** (users waiting indefinitely)
- ❌ **Resource exhaustion** (memory, CPU, rate limits)
- ❌ **Loss of trust** (users lose confidence in AI tools)

---

## Common Causes

### 1. **Ambiguous Exit Conditions**

```markdown
❌ BAD - No clear stopping point:
---
name: research-agent
description: Research topics until you have enough information
---

✅ GOOD - Clear exit condition:
---
name: research-agent
description: Research topic. Stop after finding 5 credible sources or 10 search attempts.
---
```

### 2. **Missing Progress Verification**

Agent doesn't check if it's making progress:

```python
# Agent keeps trying the same failed approach
while not task_complete:
    result = try_approach_a()  # Keeps failing
    # No check if approach_a is working!
```

### 3. **Circular Dependencies**

Agent A calls Agent B, which calls Agent A:

```
User → Agent A → Agent B → Agent A → Agent B → ...
```

### 4. **Tool Call Loops**

Repeatedly calling the same tool with same parameters:

```
Grep "pattern" → No results → Grep "pattern" → No results → ...
```

### 5. **Lack of Max Turns**

No hard limit on agent iterations:

```markdown
❌ BAD - No turn limit:
---
name: explorer
tools: Task, Glob, Grep, Read
---

✅ GOOD - Turn limit enforced:
---
name: explorer
tools: Task, Glob, Grep, Read
max_turns: 10
---
```

### 6. **Context Window Overflow**

Agent forgets early decisions due to context truncation, then repeats them.

### 7. **Poor Error Recovery**

Agent encounters error, retries same action indefinitely:

```
Try task → Error → Try same task → Error → ...
```

---

## Detection Strategies

### 1. **Tool Call Tracking**

Track tool invocations to detect repetition:

```typescript
class ToolCallTracker {
  private calls: Map<string, number> = new Map()

  track(toolName: string, args: string): boolean {
    const signature = `${toolName}:${JSON.stringify(args)}`
    const count = this.calls.get(signature) || 0
    this.calls.set(signature, count + 1)

    // Alert if same call repeated more than 3 times
    if (count >= 3) {
      console.warn(`Loop detected: ${signature} called ${count} times`)
      return true  // Is looping
    }
    return false
  }
}
```

### 2. **State Change Monitoring**

Verify that agent is making measurable progress:

```typescript
class ProgressMonitor {
  private stateHistory: string[] = []

  checkProgress(currentState: any): boolean {
    const stateHash = JSON.stringify(currentState)

    // Check last 3 states
    const recent = this.stateHistory.slice(-3)
    if (recent.every(s => s === stateHash)) {
      console.warn('No state change in last 3 iterations')
      return false  // Not making progress
    }

    this.stateHistory.push(stateHash)
    return true  // Making progress
  }
}
```

### 3. **Time-Based Detection**

Set maximum wall-clock time:

```markdown
---
name: time-limited-agent
timeout: 300000  # 5 minutes max
---
```

### 4. **Outcome Verification**

Check if agent's actions produce desired outcomes:

```typescript
function verifyOutcome(action: string, expectedChange: any): boolean {
  const beforeState = getSystemState()
  executeAction(action)
  const afterState = getSystemState()

  if (deepEqual(beforeState, afterState)) {
    console.warn('Action produced no change')
    return false
  }
  return true
}
```

---

## Prevention Patterns

### Pattern 1: **Max Turns Configuration**

Always set `max_turns` for Task tool usage:

```markdown
---
name: safe-explorer
description: Explore codebase with turn limits
tools: Task, Glob, Grep, Read
model: sonnet
---

# Safe Code Explorer

When exploring code, I use the Task tool with explicit turn limits:

```typescript
// Launch exploration with max turns
Task({
  subagent_type: "Explore",
  description: "Find authentication code",
  prompt: "Locate auth implementation. Max 5 file searches.",
  max_turns: 5  // Hard stop at 5 turns
})
```

**Never** launch open-ended exploration.
```

### Pattern 2: **Progress Checkpoints**

Define clear milestones:

```markdown
---
name: feature-implementer
description: Implement features with progress tracking
---

# Feature Implementation Agent

## Progress Checkpoints

I track progress through clear milestones:

1. ✅ **Planning complete** - Architecture documented
2. ✅ **Code written** - Files created/modified
3. ✅ **Tests passing** - Test suite green
4. ✅ **Documentation updated** - README reflects changes

If I'm not making progress toward next checkpoint after 3 attempts, I:
- Report to user what's blocking me
- Request clarification or alternative approach
- **Exit** rather than loop
```

### Pattern 3: **Deduplication Check**

Before repeating an action, verify it hasn't been tried:

```markdown
## Deduplication Strategy

Before executing any search or exploration:

1. Check if I already tried this exact query
2. Check if similar query already failed
3. If yes to either: **try different approach** instead
4. Keep log of attempted strategies

Example:
- ❌ Already tried: `Grep "handleAuth"`
- ❌ Already tried: `Glob "**/auth*.ts"`
- ✅ Will try: `Read package.json` to understand structure
```

### Pattern 4: **Alternative Strategy Escalation**

After N failed attempts, escalate to different approach:

```markdown
## Escalation Strategy

**Attempt 1-2:** Use primary strategy (e.g., Grep)
**Attempt 3-4:** Switch to alternative (e.g., Glob + Read)
**Attempt 5+:** Ask user for guidance

```typescript
if (attempts >= 5) {
  askUser("I've tried multiple approaches without success. Can you provide more context about where to look?")
  return  // Exit rather than continue
}
```
```

### Pattern 5: **Circuit Breaker**

Implement circuit breaker for external calls:

```typescript
class CircuitBreaker {
  private failures = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private lastFailureTime = 0

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = 'half-open'  // Try again after 1 minute
      } else {
        throw new Error('Circuit breaker is open - too many failures')
      }
    }

    try {
      const result = await fn()
      if (this.state === 'half-open') {
        this.state = 'closed'  // Success! Close circuit
        this.failures = 0
      }
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()

      if (this.failures >= 3) {
        this.state = 'open'  // Open circuit after 3 failures
      }
      throw error
    }
  }
}

// Usage in agent
const breaker = new CircuitBreaker()

for (let i = 0; i < 10; i++) {
  try {
    await breaker.execute(() => callExternalAPI())
  } catch (error) {
    console.error('Circuit breaker tripped - stopping attempts')
    break  // Exit loop when circuit opens
  }
}
```

### Pattern 6: **Context Preservation**

Maintain list of completed actions to prevent amnesia:

```markdown
## Action Log

I maintain a log of completed actions in agent context:

**Actions Completed:**
- [x] Searched for "auth" in codebase
- [x] Read auth.service.ts
- [x] Analyzed authentication flow
- [x] Identified JWT implementation

**Next Actions:** (Not yet done)
- [ ] Review token refresh logic
- [ ] Check security vulnerabilities

Before taking any action, I verify it's not already in "Actions Completed".
```

---

## Configuration Options

### Claude Code Agent Configuration

```markdown
---
name: my-safe-agent
description: Production agent with loop prevention
tools: Task, Read, Write, Grep, Glob
model: sonnet
max_turns: 15        # Hard stop at 15 iterations
timeout: 600000      # 10 minute timeout
---
```

### Task Tool Configuration

```typescript
// When launching sub-agents
Task({
  subagent_type: "Explore",
  description: "Find bug",
  prompt: "Locate the bug. If not found in 5 attempts, report what you tried.",
  max_turns: 5,      // Limit sub-agent turns
  model: "haiku"     // Use faster model for bounded tasks
})
```

### Hook-Based Monitoring

Create a pre-tool-use hook to detect loops:

**~/.claude/hooks/loop-detector.md**

```markdown
---
event: PreToolUse
---

# Loop Detection Hook

```bash
#!/bin/bash
# Track tool calls in temp file
TOOL_LOG="/tmp/claude-tool-calls.log"

# Get tool name and args
TOOL_NAME="$CLAUDE_TOOL_NAME"
TOOL_ARGS="$CLAUDE_TOOL_ARGS"

SIGNATURE="${TOOL_NAME}:${TOOL_ARGS}"

# Count occurrences
COUNT=$(grep -c "$SIGNATURE" "$TOOL_LOG" 2>/dev/null || echo "0")

# Log this call
echo "$SIGNATURE" >> "$TOOL_LOG"

# Alert if repeated more than 3 times
if [ "$COUNT" -ge 3 ]; then
  echo "⚠️  WARNING: Possible loop detected - ${TOOL_NAME} called ${COUNT} times with same args"
  echo "Consider alternative approach or exit condition"
fi
```
```

---

## Circuit Breaker Pattern

Full implementation example:

**~/.claude/skills/circuit-breaker/SKILL.md**

```markdown
---
name: circuit-breaker
description: Prevent infinite retry loops with circuit breaker pattern
---

# Circuit Breaker Pattern

Apply this pattern when making repeated attempts that might fail:

## Pattern

```typescript
interface CircuitBreakerOptions {
  maxFailures: number     // Open circuit after N failures
  resetTimeout: number    // Try again after N milliseconds
  failureThreshold: number // % of calls that must fail
}

class CircuitBreaker {
  private failures = 0
  private successes = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private lastStateChange = Date.now()

  async call<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): Promise<T> {
    // Check if circuit should transition
    this.checkStateTransition(options)

    // If circuit is open, fail fast
    if (this.state === 'open') {
      throw new Error(`Circuit breaker open: too many failures (${this.failures})`)
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(options)
      throw error
    }
  }

  private checkStateTransition(options: CircuitBreakerOptions) {
    const elapsed = Date.now() - this.lastStateChange

    if (this.state === 'open' && elapsed > options.resetTimeout) {
      this.state = 'half-open'
      this.lastStateChange = Date.now()
      console.log('Circuit breaker: moving to half-open state')
    }
  }

  private onSuccess() {
    this.successes++
    if (this.state === 'half-open') {
      this.state = 'closed'
      this.failures = 0
      this.lastStateChange = Date.now()
      console.log('Circuit breaker: closed after successful test')
    }
  }

  private onFailure(options: CircuitBreakerOptions) {
    this.failures++

    const total = this.failures + this.successes
    const failureRate = this.failures / total

    if (this.failures >= options.maxFailures ||
        failureRate >= options.failureThreshold) {
      this.state = 'open'
      this.lastStateChange = Date.now()
      console.log(`Circuit breaker: opened after ${this.failures} failures`)
    }
  }
}
```

## Usage Example

```typescript
const breaker = new CircuitBreaker()

// Wrap risky operations
for (let i = 0; i < 10; i++) {
  try {
    const result = await breaker.call(
      () => riskytOperation(),
      {
        maxFailures: 3,
        resetTimeout: 60000,  // 1 minute
        failureThreshold: 0.5  // 50% failure rate
      }
    )
    console.log('Success:', result)
  } catch (error) {
    if (error.message.includes('Circuit breaker open')) {
      console.log('Stopping attempts - circuit is open')
      break  // Exit loop
    }
    console.log('Attempt failed, will retry')
  }
}
```

## Integration with Claude Code

```markdown
When performing repeated operations that might fail:

1. Wrap in circuit breaker
2. Set appropriate thresholds (usually 3-5 failures)
3. Set reset timeout (30-60 seconds)
4. **Exit loop** when circuit opens rather than continuing
5. Report to user what failed and why
```
```

---

## Progress Tracking

### Pattern: Milestone-Based Progress

```markdown
---
name: milestone-tracker
description: Track agent progress through explicit milestones
---

# Milestone Tracking Agent

I track progress using numbered milestones:

## Implementation Milestones

**Phase 1: Discovery** (Expected: 2-3 turns)
- [ ] Milestone 1.1: Located relevant files
- [ ] Milestone 1.2: Understood current implementation
- [ ] Milestone 1.3: Identified change points

**Phase 2: Implementation** (Expected: 3-5 turns)
- [ ] Milestone 2.1: Written core logic
- [ ] Milestone 2.2: Added error handling
- [ ] Milestone 2.3: Integrated with existing code

**Phase 3: Verification** (Expected: 2-3 turns)
- [ ] Milestone 3.1: Tests written
- [ ] Milestone 3.2: Tests passing
- [ ] Milestone 3.3: Documentation updated

## Loop Prevention

If I spend >expected turns on a milestone:
1. Report current progress
2. Identify what's blocking me
3. Request user guidance
4. **Do not** continue attempting same approach
```

### Pattern: Diff-Based Progress

Verify actual changes are being made:

```bash
#!/bin/bash
# Check if agent is making progress

BEFORE_HASH=$(git rev-parse HEAD)
sleep 30  # Let agent work

AFTER_HASH=$(git rev-parse HEAD)
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | wc -l)

if [ "$BEFORE_HASH" = "$AFTER_HASH" ] && [ "$CHANGED_FILES" -eq 0 ]; then
  echo "⚠️  No progress detected - no files changed in 30 seconds"
  echo "Agent might be stuck in a loop"
fi
```

---

## Exit Conditions

### Clear Exit Conditions Template

```markdown
## Exit Conditions

I will stop and report when ANY of these conditions are met:

**Success Conditions:**
- ✅ Task completed successfully
- ✅ All requested changes made
- ✅ Tests passing

**Failure Conditions:**
- ❌ Attempted 5 different approaches without progress
- ❌ Reached max_turns limit
- ❌ Encountered unrecoverable error
- ❌ Required information not available

**Escalation Conditions:**
- ⚠️  Ambiguous requirements (ask user for clarification)
- ⚠️  Multiple valid solutions (present options to user)
- ⚠️  External blockers (report what's blocking)

**In ALL cases: I report what I accomplished and what remains.**
```

---

## Examples

### Example 1: Safe File Search

```markdown
---
name: safe-file-finder
description: Find files with loop prevention
tools: Glob, Grep, Read
max_turns: 8
---

# Safe File Finder

I search for files with built-in loop prevention.

## Strategy

**Attempt 1:** Glob pattern search
```bash
Glob("**/*auth*.ts")
```

**Attempt 2:** If Glob fails, try Grep
```bash
Grep("authentication", type="ts")
```

**Attempt 3:** If both fail, try broader search
```bash
Glob("**/*.ts") | filter by keyword
```

**Attempt 4-5:** Read package.json and explore from known entry points

**Attempt 6+:** Report findings and ask user for more specific location hints

## Loop Prevention

- Maximum 8 attempts
- Each attempt uses **different strategy**
- Track what's already been tried
- Exit if no progress after 3 attempts
```

### Example 2: Retry with Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxAttempts) {
        console.error(`Failed after ${maxAttempts} attempts`)
        throw lastError
      }

      // Exponential backoff: 1s, 2s, 4s, 8s, ...
      const delay = baseDelay * Math.pow(2, attempt - 1)
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Usage
try {
  const result = await retryWithBackoff(
    () => callUnreliableAPI(),
    3,  // Max 3 attempts
    1000 // Start with 1 second delay
  )
} catch (error) {
  console.error('All retry attempts exhausted')
  // Exit gracefully rather than loop forever
}
```

### Example 3: Agent with Self-Awareness

```markdown
---
name: self-aware-agent
description: Agent that monitors its own progress
tools: Task, Read, Write, Grep, Glob
max_turns: 10
---

# Self-Aware Agent

I monitor my own progress and exit gracefully when stuck.

## Self-Monitoring

After every 2 actions, I ask myself:

1. **Am I making progress?**
   - Have I learned something new?
   - Have I moved closer to the goal?
   - Have I made any code/file changes?

2. **Am I repeating myself?**
   - Have I tried this exact approach before?
   - Am I seeing the same results?
   - Am I using the same tools repeatedly?

3. **Do I need help?**
   - Is information missing?
   - Are requirements unclear?
   - Am I blocked by external factors?

## Actions When Stuck

If I answer "No" to progress OR "Yes" to repeating:

1. **Stop current approach**
2. **Review what I've tried**
3. **Either:**
   - Try completely different approach, OR
   - Report to user and ask for guidance
4. **Never** continue same failing approach
```

---

## Troubleshooting Stuck Agents

### Symptoms of Stuck Agents

1. **Same tool calls repeating**
   ```
   Grep "pattern" → Grep "pattern" → Grep "pattern" → ...
   ```

2. **No measurable progress**
   - No files created/modified
   - No new information discovered
   - Same error messages

3. **Context repetition**
   - Agent keeps mentioning same files
   - Agent rediscovering same information

4. **Time without output**
   - No response for extended period
   - No tool calls being made

### Debug Steps

**Step 1: Check tool call history**
```bash
# View recent tool calls
tail -f ~/.claude/logs/tool-calls.log

# Look for repeated patterns
sort ~/.claude/logs/tool-calls.log | uniq -c | sort -rn | head -20
```

**Step 2: Review agent configuration**
```bash
# Check if max_turns is set
cat ~/.claude/agents/my-agent.md | grep "max_turns"

# Check if timeout is set
cat ~/.claude/agents/my-agent.md | grep "timeout"
```

**Step 3: Interrupt and redirect**
```
User: STOP. You've called Grep 5 times with the same pattern. Try a different approach.

Agent: You're right. Let me try Glob instead to find files by name pattern.
```

**Step 4: Add explicit exit conditions**
```markdown
Update agent with:

## Exit Conditions
- After 5 failed attempts, report findings and stop
- If no progress in 3 turns, ask user for guidance
- Maximum 10 turns total
```

### Recovery Strategies

**Strategy 1: Kill and Restart**
```bash
# Background the stuck agent
Ctrl+B

# Start fresh session
claude

# Review what the previous agent attempted
# Start with different approach
```

**Strategy 2: Reduce Scope**
```
Instead of: "Find and fix all bugs"
Try: "Find one specific bug in auth.ts"
```

**Strategy 3: Add Checkpoints**
```
Break into smaller tasks:
1. First, just locate the file
2. Then, read and understand it
3. Then, identify the issue
4. Then, propose a fix
```

**Strategy 4: Use Haiku for Bounded Tasks**
```markdown
For simple, well-defined tasks with clear exit conditions:
- Use model: haiku (faster, cheaper)
- Set low max_turns (3-5)
- Clear success criteria
```

---

## Best Practices Summary

### DO ✅

- **Always set `max_turns`** for Task tool usage
- **Define clear exit conditions** upfront
- **Track progress** with milestones or state changes
- **Use circuit breakers** for repeated operations
- **Verify deduplication** before repeating actions
- **Escalate to user** when stuck (don't loop silently)
- **Log attempted strategies** to avoid repetition
- **Set timeouts** for time-bounded operations
- **Use haiku** for simple, bounded tasks
- **Break complex tasks** into smaller subtasks

### DON'T ❌

- **Never launch unbounded agents** without max_turns
- **Don't repeat failed approaches** more than 2-3 times
- **Don't assume progress** without verification
- **Don't create circular agent dependencies**
- **Don't ignore repeated tool calls** as a warning sign
- **Don't let agents run indefinitely** without checkpoints
- **Don't use opus** for simple tasks that might loop
- **Don't ignore user interruption** attempts

---

## Quick Reference

### Agent Configuration Checklist

```markdown
---
name: my-agent
description: Clear description with exit conditions
tools: [List only needed tools]
max_turns: [Set appropriate limit: 5-15]
timeout: [Set timeout: 300000-600000ms]
model: [sonnet for complex, haiku for simple]
---

## Exit Conditions
[List all conditions when agent should stop]

## Progress Tracking
[How agent verifies it's making progress]

## Loop Prevention
[What agent does if stuck]
```

### Loop Detection Quick Check

```bash
# Are you repeating the same tool calls?
# Check last 10 tool calls
echo "Last 10 tool calls:"
tail -10 tool-history.log

# Are you making file changes?
git status --short

# Are you stuck on same file?
echo "Files accessed in last 5 minutes:"
find . -type f -amin -5

# Time check - how long on current task?
echo "Task started: [time]"
echo "Current time: $(date)"
```

---

## Zero-to-Hero: Practical Examples with Playwright & 3rd Party Tools

Real-world scenarios showing loop prevention from beginner to expert level.

### Level 1: Beginner - The Ralph Wiggum Trap 🐛

**Scenario:** E2E test agent using Playwright without loop protection

```typescript
// ❌ DANGER: This WILL loop forever on slow pages
async function testLogin() {
  while (true) {
    try {
      await page.goto('https://app.example.com/login')
      await page.fill('#username', 'test@example.com')
      await page.fill('#password', 'password123')
      await page.click('button[type="submit"]')

      // Wait for dashboard...
      await page.waitForSelector('.dashboard')  // Might never appear!
      console.log('Login successful!')
      break  // Never reached if selector never appears
    } catch (error) {
      console.log('Login failed, retrying...')
      // LOOP: Keeps retrying forever!
    }
  }
}
```

**What Goes Wrong:**
- Infinite retries if dashboard never loads
- No timeout on waitForSelector
- No maximum attempt limit
- No alternative success condition

---

### Level 2: Intermediate - Basic Protection 🛡️

**Scenario:** Add timeouts and retry limits

```typescript
// ✅ BETTER: Timeouts and retry limits
async function testLoginWithLimits() {
  const MAX_ATTEMPTS = 3
  const PAGE_TIMEOUT = 30000  // 30 seconds

  page.setDefaultTimeout(PAGE_TIMEOUT)

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`Login attempt ${attempt}/${MAX_ATTEMPTS}`)

      await page.goto('https://app.example.com/login', {
        waitUntil: 'networkidle',
        timeout: PAGE_TIMEOUT
      })

      await page.fill('#username', 'test@example.com')
      await page.fill('#password', 'password123')
      await page.click('button[type="submit"]')

      // Wait with timeout
      await page.waitForSelector('.dashboard', {
        timeout: PAGE_TIMEOUT
      })

      console.log('✅ Login successful!')
      return true

    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message)

      if (attempt === MAX_ATTEMPTS) {
        console.error('❌ All login attempts exhausted')
        return false
      }

      // Wait before retry (exponential backoff)
      await page.waitForTimeout(1000 * attempt)
    }
  }
}
```

**Improvements:**
- ✅ Maximum 3 attempts
- ✅ 30-second timeout per operation
- ✅ Exponential backoff between retries
- ✅ Clear success/failure return

---

### Level 3: Advanced - Circuit Breaker & Progress Tracking 🎯

**Scenario:** Production-ready E2E with state management

```typescript
// ✅ PRODUCTION: Circuit breaker + progress tracking
import { test, expect } from '@playwright/test'

class PlaywrightCircuitBreaker {
  private failures = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private lastFailure = 0

  constructor(
    private maxFailures = 3,
    private resetTimeout = 60000
  ) {}

  async execute<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Check if circuit should reset
    if (this.state === 'open' &&
        Date.now() - this.lastFailure > this.resetTimeout) {
      console.log(`🔄 Circuit breaker ${name}: half-open (testing)`)
      this.state = 'half-open'
    }

    // Fail fast if circuit is open
    if (this.state === 'open') {
      throw new Error(
        `Circuit breaker ${name} is OPEN (${this.failures} failures)`
      )
    }

    try {
      const result = await fn()

      // Success - reset or close circuit
      if (this.state === 'half-open') {
        console.log(`✅ Circuit breaker ${name}: closed (recovered)`)
        this.state = 'closed'
        this.failures = 0
      }

      return result

    } catch (error) {
      this.failures++
      this.lastFailure = Date.now()

      if (this.failures >= this.maxFailures) {
        console.log(`🔥 Circuit breaker ${name}: OPEN`)
        this.state = 'open'
      }

      throw error
    }
  }
}

test.describe('Login Flow with Circuit Breaker', () => {
  const loginBreaker = new PlaywrightCircuitBreaker(3, 60000)
  const apiBreaker = new PlaywrightCircuitBreaker(5, 30000)

  test('should handle login with progressive failure handling', async ({ page }) => {
    // Track progress
    const progress = {
      pageLoaded: false,
      formFilled: false,
      submitted: false,
      authenticated: false
    }

    try {
      // Step 1: Load page with circuit breaker
      await loginBreaker.execute('page-load', async () => {
        await page.goto('https://app.example.com/login', {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        })
        progress.pageLoaded = true
        console.log('✅ Progress: Page loaded')
      })

      // Step 2: Fill form
      await loginBreaker.execute('form-fill', async () => {
        await page.fill('#username', 'test@example.com', { timeout: 5000 })
        await page.fill('#password', 'password123', { timeout: 5000 })
        progress.formFilled = true
        console.log('✅ Progress: Form filled')
      })

      // Step 3: Submit with API circuit breaker
      await apiBreaker.execute('login-submit', async () => {
        // Listen for API response
        const responsePromise = page.waitForResponse(
          resp => resp.url().includes('/api/auth/login') && resp.status() === 200,
          { timeout: 10000 }
        )

        await page.click('button[type="submit"]')
        await responsePromise

        progress.submitted = true
        console.log('✅ Progress: Submitted successfully')
      })

      // Step 4: Verify authentication
      await loginBreaker.execute('verify-auth', async () => {
        await expect(page.locator('.dashboard')).toBeVisible({ timeout: 10000 })
        progress.authenticated = true
        console.log('✅ Progress: Authenticated')
      })

      console.log('🎉 Login flow completed successfully')

    } catch (error) {
      console.error('❌ Login failed. Progress:', progress)

      // Take screenshot for debugging
      await page.screenshot({
        path: `login-failure-${Date.now()}.png`,
        fullPage: true
      })

      throw error
    }
  })
})
```

**Advanced Features:**
- ✅ Circuit breaker for page operations
- ✅ Separate circuit breaker for API calls
- ✅ Progress tracking at each step
- ✅ Failure screenshots for debugging
- ✅ Clear progress logging
- ✅ Fail-fast when circuit opens

---

### Level 4: Expert - Production System with Monitoring 🏆

**Scenario:** Full production agent with Playwright, monitoring, and intelligent recovery

```typescript
// ✅ EXPERT: Production-ready with full observability
import { test, Page } from '@playwright/test'
import { EventEmitter } from 'events'

interface LoopMetrics {
  operation: string
  attempts: number
  successes: number
  failures: number
  lastAttemptTime: number
  averageLatency: number
}

class ProductionPlaywrightAgent extends EventEmitter {
  private metrics = new Map<string, LoopMetrics>()
  private operationHistory: string[] = []
  private circuitBreakers = new Map<string, PlaywrightCircuitBreaker>()

  constructor(
    private page: Page,
    private config = {
      maxRetries: 3,
      timeoutMs: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetMs: 60000,
      loopDetectionWindow: 5
    }
  ) {
    super()
  }

  /**
   * Execute operation with full loop prevention
   */
  async safeExecute<T>(
    operation: string,
    fn: () => Promise<T>,
    options: {
      retryable?: boolean
      timeout?: number
      progressCheck?: () => Promise<boolean>
    } = {}
  ): Promise<T> {
    const startTime = Date.now()

    // Detect if we're looping on same operation
    if (this.isLooping(operation)) {
      this.emit('loop-detected', { operation, history: this.operationHistory })
      throw new Error(
        `Loop detected: ${operation} attempted ${this.config.loopDetectionWindow} times recently`
      )
    }

    // Get or create circuit breaker for this operation type
    const operationType = operation.split(':')[0]  // e.g., "page-load" from "page-load:login"
    if (!this.circuitBreakers.has(operationType)) {
      this.circuitBreakers.set(
        operationType,
        new PlaywrightCircuitBreaker(
          this.config.circuitBreakerThreshold,
          this.config.circuitBreakerResetMs
        )
      )
    }
    const breaker = this.circuitBreakers.get(operationType)!

    // Initialize metrics
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        operation,
        attempts: 0,
        successes: 0,
        failures: 0,
        lastAttemptTime: 0,
        averageLatency: 0
      })
    }
    const metrics = this.metrics.get(operation)!

    // Track operation history
    this.operationHistory.push(operation)
    if (this.operationHistory.length > 20) {
      this.operationHistory.shift()  // Keep last 20 operations
    }

    // Execute with circuit breaker
    const maxAttempts = options.retryable !== false ? this.config.maxRetries : 1
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        metrics.attempts++
        metrics.lastAttemptTime = Date.now()

        console.log(`🔄 ${operation} (attempt ${attempt}/${maxAttempts})`)

        // Execute with circuit breaker and timeout
        const result = await breaker.execute(operation, async () => {
          return await Promise.race([
            fn(),
            this.timeout(options.timeout || this.config.timeoutMs, operation)
          ])
        })

        // Verify progress if check provided
        if (options.progressCheck) {
          const hasProgress = await options.progressCheck()
          if (!hasProgress) {
            throw new Error(`No progress detected for ${operation}`)
          }
        }

        // Success
        metrics.successes++
        const latency = Date.now() - startTime
        metrics.averageLatency =
          (metrics.averageLatency * (metrics.successes - 1) + latency) / metrics.successes

        console.log(`✅ ${operation} succeeded (${latency}ms)`)
        this.emit('operation-success', { operation, attempt, latency, metrics })

        return result

      } catch (error) {
        lastError = error as Error
        metrics.failures++

        console.error(`❌ ${operation} failed (attempt ${attempt}):`, lastError.message)
        this.emit('operation-failure', { operation, attempt, error: lastError, metrics })

        // Check if circuit breaker is open
        if (lastError.message.includes('Circuit breaker')) {
          console.error(`🔥 Circuit breaker opened for ${operationType} - stopping retries`)
          break
        }

        // Last attempt or non-retryable
        if (attempt === maxAttempts || options.retryable === false) {
          break
        }

        // Exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000)
        console.log(`⏳ Waiting ${backoffMs}ms before retry...`)
        await this.page.waitForTimeout(backoffMs)
      }
    }

    // All attempts failed
    this.emit('operation-exhausted', { operation, metrics, error: lastError })
    throw lastError || new Error(`Operation ${operation} failed after ${maxAttempts} attempts`)
  }

  /**
   * Detect if we're stuck in a loop
   */
  private isLooping(operation: string): boolean {
    const recent = this.operationHistory.slice(-this.config.loopDetectionWindow)
    return recent.length === this.config.loopDetectionWindow &&
           recent.every(op => op === operation)
  }

  /**
   * Timeout helper
   */
  private timeout(ms: number, operation: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${ms}ms for ${operation}`))
      }, ms)
    })
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(): Map<string, LoopMetrics> {
    return this.metrics
  }

  /**
   * Get operation history
   */
  getHistory(): string[] {
    return [...this.operationHistory]
  }
}

// Usage in Playwright test
test.describe('Production E2E with Full Loop Prevention', () => {
  let agent: ProductionPlaywrightAgent

  test.beforeEach(async ({ page }) => {
    agent = new ProductionPlaywrightAgent(page, {
      maxRetries: 3,
      timeoutMs: 30000,
      circuitBreakerThreshold: 5,
      circuitBreakerResetMs: 60000,
      loopDetectionWindow: 5
    })

    // Set up monitoring
    agent.on('loop-detected', (data) => {
      console.error('🚨 LOOP DETECTED:', data)
    })

    agent.on('operation-failure', (data) => {
      console.warn('⚠️  Operation failed:', data.operation, data.metrics)
    })

    agent.on('operation-exhausted', async (data) => {
      console.error('💀 Operation exhausted:', data.operation)
      // Take screenshot
      await page.screenshot({
        path: `failure-${data.operation}-${Date.now()}.png`,
        fullPage: true
      })
    })
  })

  test('complete user journey with monitoring', async ({ page }) => {
    // 1. Navigate to login
    await agent.safeExecute('page-load:login', async () => {
      await page.goto('https://app.example.com/login', {
        waitUntil: 'domcontentloaded'
      })
    }, {
      progressCheck: async () => {
        // Verify page actually loaded
        return await page.locator('#username').isVisible()
      }
    })

    // 2. Perform login
    await agent.safeExecute('auth:login', async () => {
      await page.fill('#username', 'test@example.com')
      await page.fill('#password', 'password123')
      await page.click('button[type="submit"]')

      // Wait for API response
      await page.waitForResponse(
        resp => resp.url().includes('/api/auth/login') && resp.ok()
      )
    }, {
      progressCheck: async () => {
        // Verify auth token in localStorage
        const token = await page.evaluate(() => localStorage.getItem('authToken'))
        return token !== null
      }
    })

    // 3. Navigate to dashboard
    await agent.safeExecute('page-load:dashboard', async () => {
      await page.waitForSelector('.dashboard', { state: 'visible' })
    }, {
      progressCheck: async () => {
        // Verify dashboard content loaded
        const widgets = await page.locator('.dashboard-widget').count()
        return widgets > 0
      }
    })

    // 4. Interact with feature
    await agent.safeExecute('feature:create-item', async () => {
      await page.click('[data-testid="create-button"]')
      await page.fill('[data-testid="item-name"]', 'Test Item')
      await page.click('[data-testid="save-button"]')

      // Wait for success toast
      await page.waitForSelector('.toast-success')
    }, {
      progressCheck: async () => {
        // Verify item appears in list
        const items = await page.locator('[data-testid="item-list"] .item').count()
        return items > 0
      }
    })

    // Print metrics
    console.log('\n📊 Operation Metrics:')
    for (const [op, metrics] of agent.getMetrics()) {
      console.log(`  ${op}:`, {
        attempts: metrics.attempts,
        successes: metrics.successes,
        failures: metrics.failures,
        avgLatency: `${metrics.averageLatency.toFixed(0)}ms`
      })
    }

    console.log('\n📜 Operation History:', agent.getHistory())
  })
})
```

**Expert Features:**
- ✅ Full loop detection with operation history
- ✅ Circuit breakers per operation type
- ✅ Comprehensive metrics tracking
- ✅ Progress verification at each step
- ✅ Event emitter for monitoring
- ✅ Automatic screenshots on failure
- ✅ Exponential backoff with cap
- ✅ Configurable thresholds
- ✅ Production-ready observability

---

## Real-Life Scenarios with 3rd Party Tools

### Scenario 1: API Integration Loop Hell

**Problem:** External API calls retry forever on 500 errors

```typescript
// ❌ DANGER: Infinite API retry loop
async function fetchUserData(userId: string) {
  while (true) {
    try {
      const response = await fetch(`https://api.example.com/users/${userId}`)
      if (!response.ok) throw new Error('API error')
      return await response.json()
    } catch (error) {
      console.log('API call failed, retrying...')
      // Loops forever on persistent API issues!
    }
  }
}
```

**Solution:** Retry with backoff + circuit breaker

```typescript
// ✅ SAFE: Limited retries with circuit breaker
import pRetry from 'p-retry'

const apiBreaker = new CircuitBreaker()

async function fetchUserDataSafe(userId: string) {
  return await apiBreaker.execute(async () => {
    return await pRetry(
      async () => {
        const response = await fetch(`https://api.example.com/users/${userId}`, {
          signal: AbortSignal.timeout(5000)  // 5s timeout
        })

        if (response.status >= 500) {
          // Retry on 5xx errors
          throw new pRetry.AbortError('Server error - will retry')
        }

        if (!response.ok) {
          // Don't retry on 4xx errors
          throw new Error(`API error: ${response.status}`)
        }

        return await response.json()
      },
      {
        retries: 3,
        factor: 2,  // Exponential backoff
        minTimeout: 1000,
        maxTimeout: 10000,
        onFailedAttempt: error => {
          console.log(`Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`)
        }
      }
    )
  })
}
```

---

### Scenario 2: Database Connection Pool Exhaustion

**Problem:** Failed DB queries retry, exhausting connection pool

```typescript
// ❌ DANGER: Connection pool exhaustion
import { Pool } from 'pg'

const pool = new Pool({ max: 10 })

async function queryDatabase(sql: string) {
  let attempts = 0
  while (attempts < 100) {  // Way too many!
    const client = await pool.connect()  // Gets connection
    try {
      return await client.query(sql)
    } catch (error) {
      // Connection still held in catch block!
      attempts++
    } finally {
      client.release()  // Finally block runs, but pool might be exhausted
    }
  }
}
```

**Solution:** Proper connection management + circuit breaker

```typescript
// ✅ SAFE: Connection pool protection
import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
})

const dbBreaker = new CircuitBreaker(3, 30000)

async function queryDatabaseSafe(sql: string, params: any[] = []) {
  return await dbBreaker.execute(async () => {
    let client: PoolClient | undefined

    try {
      // Wait max 5s for connection
      client = await Promise.race([
        pool.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Pool exhausted')), 5000)
        )
      ]) as PoolClient

      // Set statement timeout
      await client.query('SET statement_timeout = 10000')  // 10s

      const result = await client.query(sql, params)
      return result.rows

    } catch (error) {
      console.error('Database query failed:', error)
      throw error

    } finally {
      // ALWAYS release connection
      if (client) {
        try {
          client.release()
        } catch (releaseError) {
          console.error('Error releasing client:', releaseError)
        }
      }
    }
  })
}
```

---

### Scenario 3: File Upload/Download Hangs

**Problem:** S3 upload retries infinitely on network issues

```typescript
// ❌ DANGER: Infinite upload retry
import AWS from 'aws-sdk'

const s3 = new AWS.S3()

async function uploadFile(file: Buffer, key: string) {
  while (true) {
    try {
      await s3.putObject({
        Bucket: 'my-bucket',
        Key: key,
        Body: file
      }).promise()
      break
    } catch (error) {
      console.log('Upload failed, retrying...')
      // Loops forever on network issues!
    }
  }
}
```

**Solution:** Timeout + retry limit + progress tracking

```typescript
// ✅ SAFE: Upload with progress and limits
import AWS from 'aws-sdk'
import { Upload } from '@aws-sdk/lib-storage'
import { S3Client } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  requestHandler: {
    requestTimeout: 30000,  // 30s timeout per request
    connectionTimeout: 5000  // 5s connection timeout
  }
})

const uploadBreaker = new CircuitBreaker(3, 60000)

async function uploadFileSafe(
  file: Buffer,
  key: string,
  onProgress?: (progress: number) => void
) {
  return await uploadBreaker.execute(async () => {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: 'my-bucket',
        Key: key,
        Body: file
      },
      queueSize: 4,  // Concurrent parts
      partSize: 5 * 1024 * 1024,  // 5MB parts
      leavePartsOnError: false
    })

    // Track progress
    let lastProgress = 0
    let noProgressCount = 0

    upload.on('httpUploadProgress', (progress) => {
      const pct = (progress.loaded! / progress.total!) * 100

      if (onProgress) {
        onProgress(pct)
      }

      // Detect stalls
      if (pct === lastProgress) {
        noProgressCount++
        if (noProgressCount > 5) {
          console.warn('Upload stalled - no progress for 5 updates')
          upload.abort()
        }
      } else {
        noProgressCount = 0
        lastProgress = pct
      }
    })

    try {
      const result = await Promise.race([
        upload.done(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Upload timeout')), 120000)  // 2min total
        )
      ])

      console.log('✅ Upload complete:', key)
      return result

    } catch (error) {
      console.error('Upload failed:', error)
      await upload.abort()
      throw error
    }
  })
}
```

---

### Scenario 4: Web Scraping Infinite Pagination

**Problem:** Crawler loops forever on pagination

```typescript
// ❌ DANGER: Infinite pagination loop
import puppeteer from 'puppeteer'

async function scrapeAllPages(url: string) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)

  while (true) {
    // Scrape current page
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.item')).map(el => el.textContent)
    })

    // Click next button
    const nextButton = await page.$('.next-button')
    if (nextButton) {
      await nextButton.click()
      await page.waitForNavigation()
      // Loops forever if pagination is circular!
    } else {
      break
    }
  }
}
```

**Solution:** Track visited URLs + page limit

```typescript
// ✅ SAFE: Pagination with loop detection
import puppeteer, { Page } from 'puppeteer'

interface ScrapingOptions {
  maxPages: number
  timeout: number
  useCircuitBreaker: boolean
}

async function scrapeAllPagesSafe(
  startUrl: string,
  options: ScrapingOptions = {
    maxPages: 100,
    timeout: 30000,
    useCircuitBreaker: true
  }
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  })

  const page = await browser.newPage()
  page.setDefaultTimeout(options.timeout)

  const scrapedData: any[] = []
  const visitedUrls = new Set<string>()
  const urlQueue = [startUrl]

  const breaker = options.useCircuitBreaker
    ? new CircuitBreaker(5, 60000)
    : null

  try {
    while (urlQueue.length > 0 && visitedUrls.size < options.maxPages) {
      const currentUrl = urlQueue.shift()!

      // Check if already visited (loop detection)
      if (visitedUrls.has(currentUrl)) {
        console.log(`⏭️  Skipping already visited: ${currentUrl}`)
        continue
      }

      visitedUrls.add(currentUrl)
      console.log(`📄 Scraping page ${visitedUrls.size}/${options.maxPages}: ${currentUrl}`)

      // Scrape with circuit breaker
      const pageData = breaker
        ? await breaker.execute(`scrape:${visitedUrls.size}`, async () =>
            await scrapePage(page, currentUrl)
          )
        : await scrapePage(page, currentUrl)

      scrapedData.push(...pageData)

      // Find next page links
      const nextUrls = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a.next-page, a.pagination'))
          .map(a => (a as HTMLAnchorElement).href)
          .filter(href => href && href.startsWith('http'))
      })

      // Add unvisited URLs to queue
      for (const url of nextUrls) {
        if (!visitedUrls.has(url) && !urlQueue.includes(url)) {
          urlQueue.push(url)
        }
      }

      // Rate limiting
      await page.waitForTimeout(1000)
    }

    console.log(`✅ Scraping complete: ${visitedUrls.size} pages, ${scrapedData.length} items`)
    return scrapedData

  } finally {
    await browser.close()
  }
}

async function scrapePage(page: Page, url: string): Promise<any[]> {
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000
  })

  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => ({
      title: el.querySelector('.title')?.textContent,
      description: el.querySelector('.description')?.textContent,
      link: el.querySelector('a')?.href
    }))
  })
}
```

**Features:**
- ✅ Visited URL tracking (prevents loops)
- ✅ Maximum page limit
- ✅ Circuit breaker for reliability
- ✅ Rate limiting
- ✅ Proper resource cleanup

---

### Scenario 5: CI/CD Pipeline Retry Loops

**Problem:** Pipeline steps retry infinitely on flaky tests

```yaml
# ❌ DANGER: Infinite retry in CI
name: CI Pipeline
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          while ! npm test; do
            echo "Tests failed, retrying..."
            # Loops forever on persistent test failures!
          done
```

**Solution:** Retry limit + timeout + failure analysis

```yaml
# ✅ SAFE: Limited retries with smart failure handling
name: CI Pipeline with Loop Prevention
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30  # Hard timeout

    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci
        timeout-minutes: 10

      - name: Run tests with retry
        uses: nick-invision/retry@v2
        with:
          timeout_minutes: 15
          max_attempts: 3
          retry_wait_seconds: 10
          command: npm test
          on_retry_command: |
            echo "Test attempt failed. Analyzing failure..."
            # Take screenshot if available
            if [ -d "test-results/screenshots" ]; then
              echo "Screenshots available for debugging"
              ls test-results/screenshots
            fi

      - name: Upload test results on failure
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
          retention-days: 7

      - name: Notify on repeated failures
        if: failure()
        run: |
          echo "⚠️ Tests failed after 3 attempts"
          echo "This indicates persistent issues, not flakiness"
          echo "Manual investigation required"
          exit 1
```

---

## Claude Code Agent Example: Playwright Test Agent

Complete agent implementing all loop prevention patterns:

**~/.claude/agents/playwright-test-agent.md**

```markdown
---
name: playwright-test-agent
description: Run Playwright E2E tests with comprehensive loop prevention. Use when writing or running browser automation tests.
tools: Read, Write, Bash, Grep, Glob
model: sonnet
max_turns: 20
timeout: 600000
---

# Playwright Test Agent with Loop Prevention

I run Playwright E2E tests with production-ready loop prevention.

## Configuration

**Max Test Retries:** 3
**Page Timeout:** 30 seconds
**Circuit Breaker Threshold:** 5 failures
**Loop Detection Window:** 5 identical operations

## Workflow

### 1. Pre-Flight Checks

Before running tests, I verify:
- [ ] Playwright is installed
- [ ] Test files exist
- [ ] Browser binaries available
- [ ] No tests currently running

### 2. Test Execution Strategy

```bash
# Run with built-in retry and timeout
npx playwright test \
  --retries=2 \
  --timeout=30000 \
  --max-failures=5 \
  --reporter=list,html
```

### 3. Loop Prevention Measures

#### A. Timeout Configuration
- Set `timeout: 30000` in playwright.config.ts
- Use `expect.configure({ timeout: 10000 })`
- Set navigation timeout: `page.setDefaultTimeout(30000)`

#### B. Retry Limits
- Test-level retries: Max 2
- Action-level retries: Use `{ trial: true }` for checks
- Never retry more than 3 times

#### C. Progress Verification
After each test action, verify:
```typescript
// Check if action made progress
const before = await page.textContent('body')
await page.click('button')
const after = await page.textContent('body')

if (before === after) {
  throw new Error('Action made no changes - possible loop')
}
```

### 4. Circuit Breaker Implementation

```typescript
// In test setup
let consecutiveFailures = 0
const MAX_CONSECUTIVE_FAILURES = 5

test.afterEach(async ({ }, testInfo) => {
  if (testInfo.status === 'failed') {
    consecutiveFailures++
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error('🔥 Circuit breaker tripped - stopping test suite')
      process.exit(1)
    }
  } else {
    consecutiveFailures = 0  // Reset on success
  }
})
```

### 5. Loop Detection

I track operations and detect loops:
```typescript
const operationLog: string[] = []

function trackOperation(op: string) {
  operationLog.push(op)

  // Check last 5 operations
  const recent = operationLog.slice(-5)
  if (recent.every(o => o === op)) {
    throw new Error(`Loop detected: ${op} repeated 5 times`)
  }
}
```

## Exit Conditions

I stop testing when:

**Success:**
- ✅ All tests pass
- ✅ Specified tests complete

**Failure:**
- ❌ Max retries exhausted
- ❌ Circuit breaker opens (5 consecutive failures)
- ❌ Timeout reached (10 minutes)
- ❌ Loop detected (same operation 5+ times)

**Escalation:**
- ⚠️ Flaky tests detected → Report for investigation
- ⚠️ Infrastructure issues → Report and suggest offline run
- ⚠️ Missing dependencies → Report what's needed

## Error Recovery

When tests fail:

1. **Analyze failure pattern**
   - One-time failure? → Retry
   - Consistent failure? → Report and stop
   - Flaky failure? → Report pattern

2. **Collect diagnostics**
   - Screenshots
   - Videos
   - Trace files
   - Console logs

3. **Report findings**
   - What failed
   - How many attempts
   - Failure pattern
   - Recommended action

## Example Usage

```bash
# Run all tests with loop prevention
claude --agent playwright-test-agent "Run E2E tests with full monitoring"

# Run specific test file
claude --agent playwright-test-agent "Run tests/login.spec.ts with retries"

# Debug failing test
claude --agent playwright-test-agent "Debug tests/checkout.spec.ts - it's looping on payment"
```

## Monitoring Output

I provide real-time feedback:
```
🔄 Test attempt 1/3: tests/login.spec.ts
✅ Login test passed (2.3s)

🔄 Test attempt 1/3: tests/checkout.spec.ts
❌ Checkout test failed (timeout)

🔄 Test attempt 2/3: tests/checkout.spec.ts
❌ Checkout test failed (timeout)

🔄 Test attempt 3/3: tests/checkout.spec.ts
❌ Checkout test failed (timeout)

🚨 Circuit breaker: checkout.spec.ts failed 3 times
📊 Failure pattern: All timeouts on payment button
💡 Recommendation: Check if payment service is running
🔥 Stopping test suite - persistent failure detected
```

## Prevention Checklist

Before starting tests:
- [ ] Set max_turns=20
- [ ] Set timeout=600000 (10 minutes)
- [ ] Configure Playwright retries
- [ ] Enable circuit breaker
- [ ] Set up loop detection
- [ ] Prepare failure screenshots

During tests:
- [ ] Track operation history
- [ ] Verify progress after actions
- [ ] Monitor consecutive failures
- [ ] Collect diagnostics

After tests:
- [ ] Report final status
- [ ] Analyze failure patterns
- [ ] Provide recommendations
- [ ] Clean up resources
```

---

## Summary: Loop Prevention Best Practices

### The 10 Commandments of Loop-Free Agents

1. **Thou shalt always set `max_turns`** - No unbounded agents
2. **Thou shalt use timeouts** - Every operation has a time limit
3. **Thou shalt track progress** - Verify each step makes changes
4. **Thou shalt detect repetition** - Track operation history
5. **Thou shalt use circuit breakers** - Fail fast on persistent errors
6. **Thou shalt retry with backoff** - Exponential backoff between attempts
7. **Thou shalt limit retries** - Maximum 3-5 attempts
8. **Thou shalt escalate to users** - Ask for help when stuck
9. **Thou shalt clean up resources** - Always release connections/browsers
10. **Thou shalt monitor and alert** - Emit events for observability

### Quick Decision Tree

```
Is operation likely to hang or fail?
├─ YES
│  ├─ Set timeout
│  ├─ Add retry limit (3-5)
│  ├─ Use circuit breaker
│  ├─ Track attempts
│  └─ Verify progress
└─ NO
   └─ Still set timeout (safety first!)
```

---

##

- **Multi-Agent Orchestration:** [multi-agent-orchestration.md](./multi-agent-orchestration.md)
- **Testing Strategy:** [testing-strategy.md](./testing-strategy.md)
- **Sub-Agents Guide:** [../../guides/subagents-guide/README.md](../../guides/subagents-guide/README.md)
- **Coordination Patterns:** [../../guides/subagents-guide/patterns/coordination-patterns.md](../../guides/subagents-guide/patterns/coordination-patterns.md)

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with Claude Code (Anthropic)
**License:** MIT
**Repository:** [claude-code-helper](https://github.com/michelabboud/claude-code-helper)

---

**Remember:** A well-designed agent knows when to stop. "I'm helping!" becomes "I'm stuck!" without proper loop prevention. 🎯
