# Advanced Sub-Agent Coordination Patterns

This guide covers advanced patterns for orchestrating multiple sub-agents to solve complex tasks.

## Table of Contents

1. [Orchestration Patterns](#orchestration-patterns)
2. [Parallel Execution](#parallel-execution)
3. [Sequential Workflows](#sequential-workflows)
4. [Conditional Routing](#conditional-routing)
5. [Error Handling](#error-handling)
6. [Context Management](#context-management)

---

## Orchestration Patterns

### Pattern 1: Coordinator Agent

**When to use:** Complex tasks requiring multiple specialists

**Create: `~/.claude/agents/feature-coordinator.md`**

```markdown
---
name: feature-coordinator
description: Orchestrates multiple agents to implement complete features. Use when starting a new feature or major change that requires planning, implementation, testing, and documentation.
tools: Task, Read, Write, Grep, Glob
model: sonnet
---

# Feature Implementation Coordinator

[feature-coordinator] I orchestrate the complete feature development workflow.

## Workflow

### Phase 1: Planning
1. Invoke **planner** agent to design architecture
2. Invoke **researcher** agent for best practices
3. Create implementation plan

### Phase 2: Implementation
1. Invoke **implementer** agent to write code
2. Invoke **database-expert** for schema changes
3. Invoke **api-expert** for API endpoints

### Phase 3: Quality
1. Invoke **test-writer** for test suite
2. Invoke **code-reviewer** for code review
3. Invoke **performance-optimizer** for optimization

### Phase 4: Documentation
1. Invoke **docs-writer** for documentation
2. Invoke **git-expert** for commit strategy

## Example Usage

```
User: Implement user authentication with JWT

[feature-coordinator] I'll orchestrate a complete implementation:

1. [Launching planner] Designing authentication architecture...
2. [Launching database-expert] Creating user schema...
3. [Launching api-expert] Implementing auth endpoints...
4. [Launching test-writer] Writing test suite...
5. [Launching docs-writer] Creating API documentation...

Feature complete!
```

## Coordination Strategy

- Launch agents **in parallel** when possible
- Pass context between agents via shared files
- Aggregate results at each phase
- Provide unified summary to user
```

### Pattern 2: Research Aggregator

**Create: `~/.claude/agents/research-aggregator.md`**

```markdown
---
name: research-aggregator
description: Coordinates multiple research agents to gather comprehensive information. Use for complex research tasks requiring multiple sources and perspectives.
tools: Task, Read, Write, WebSearch, WebFetch, Grep
model: opus
---

# Research Aggregation Coordinator

[research-aggregator] I coordinate comprehensive research across multiple domains.

## Research Strategy

### Parallel Research Streams

1. **Web Documentation** (general-purpose agent)
   - Official docs
   - Technical articles
   - Best practices

2. **Community Research** (general-purpose agent)
   - Stack Overflow
   - GitHub issues
   - Community forums

3. **Codebase Analysis** (Explore agent)
   - Existing patterns
   - Similar implementations
   - Current approaches

4. **Academic/Industry** (general-purpose agent)
   - Research papers
   - Industry standards
   - Case studies

## Workflow

```javascript
// Launch all research streams in parallel
const results = await Promise.all([
  Task("Search official documentation for [topic]"),
  Task("Find community solutions on Stack Overflow"),
  Task("Analyze existing patterns in codebase", { subagent_type: "Explore" }),
  Task("Research industry best practices and case studies")
]);

// Aggregate and synthesize
const report = synthesizeFindings(results);
```

## Output Format

```markdown
# Research Report: [Topic]

## Executive Summary
[Key findings and recommendations]

## Official Documentation
[Findings from docs]

## Community Insights
[Findings from community]

## Existing Patterns
[Findings from codebase]

## Best Practices
[Industry standards and recommendations]

## Recommendation
[Final recommendation with rationale]
```
```

---

## Parallel Execution

### Pattern 3: Parallel Feature Development

**Use Case:** Multiple independent components

```markdown
---
name: parallel-dev
description: Develops multiple independent features simultaneously using parallel agents
tools: Task, Read, Write
---

# Parallel Development Coordinator

## Example: Building Dashboard

When building a dashboard with multiple widgets:

```javascript
// Launch parallel development
Task("Create user profile widget", { agent: "implementer" })
Task("Create analytics chart widget", { agent: "implementer" })
Task("Create notifications widget", { agent: "implementer" })
Task("Create activity feed widget", { agent: "implementer" })

// Each agent works independently
// Results combined at the end
```

## Benefits

- **Faster Development**: Multiple components developed simultaneously
- **Isolation**: Each agent has clean context
- **Specialization**: Can use different agents for different components

## Example Output

```
[parallel-dev] Launching 4 parallel implementations...

✓ [implementer-1] User profile widget complete
✓ [implementer-2] Analytics chart complete  
✓ [implementer-3] Notifications widget complete
✓ [implementer-4] Activity feed complete

Integration in progress...
```
```

### Pattern 4: Multi-Language Development

**Use Case:** Full-stack feature spanning multiple languages

```markdown
---
name: fullstack-dev
description: Coordinates frontend and backend development in parallel
tools: Task, Read, Write, Bash
---

# Full-Stack Development Coordinator

## Example: User Authentication Feature

### Phase 1: Parallel Development

```javascript
// Backend (Node.js)
Task("Create authentication API with JWT", {
  agent: "api-expert",
  language: "node",
  path: "backend/"
})

// Frontend (React)
Task("Create login/signup UI components", {
  agent: "implementer",
  language: "react",
  path: "frontend/"
})

// Database
Task("Create user schema and auth tables", {
  agent: "database-expert",
  path: "migrations/"
})
```

### Phase 2: Integration

After parallel development completes:
1. Test API endpoints
2. Connect frontend to backend
3. End-to-end testing

## File Organization

```
project/
├── backend/
│   ├── routes/auth.js       (api-expert)
│   ├── middleware/auth.js   (api-expert)
│   └── models/user.js       (database-expert)
├── frontend/
│   ├── components/Login.jsx (implementer)
│   └── services/auth.js     (implementer)
└── migrations/
    └── create-users.sql     (database-expert)
```
```

---

## Sequential Workflows

### Pattern 5: Build Pipeline

**Use Case:** Steps must happen in order

```markdown
---
name: build-pipeline
description: Executes build steps sequentially with validation at each stage
tools: Task, Bash, Read
---

# Build Pipeline Coordinator

## Pipeline Stages

### Stage 1: Code Quality
```bash
Task("Run linter and fix issues", { agent: "implementer" })
# Wait for completion
Task("Run code review", { agent: "code-reviewer" })
# Wait for approval
```

### Stage 2: Testing
```bash
Task("Write missing tests", { agent: "test-writer" })
# Wait for completion
Task("Run test suite", { agent: "implementer" })
# Wait for all tests passing
```

### Stage 3: Optimization
```bash
Task("Analyze and optimize performance", { agent: "performance-optimizer" })
# Wait for completion
Task("Verify improvements", { agent: "implementer" })
```

### Stage 4: Documentation
```bash
Task("Update documentation", { agent: "docs-writer" })
# Wait for completion
Task("Review documentation", { agent: "code-reviewer" })
```

### Stage 5: Deployment
```bash
Task("Prepare deployment", { agent: "devops" })
# Wait for completion
Task("Create deployment checklist", { agent: "devops" })
```

## Validation Gates

Between each stage:
- Verify success of previous stage
- Run automated checks
- Proceed only if all checks pass
```

### Pattern 6: Code Review Pipeline

```markdown
---
name: review-pipeline
description: Multi-stage code review process
tools: Task, Read, Grep
---

# Code Review Pipeline

## Review Stages

### 1. Automated Checks
```bash
# Static analysis
Task("Run ESLint", { agent: "implementer" })
Task("Run type checker", { agent: "implementer" })
Task("Check test coverage", { agent: "test-writer" })
```

### 2. Code Review
```bash
# Only if automated checks pass
Task("Perform code review", { agent: "code-reviewer" })
```

### 3. Security Audit
```bash
# Only if code review passes
Task("Security audit", { agent: "security-auditor" })
```

### 4. Performance Review
```bash
# Only if security passes
Task("Performance analysis", { agent: "performance-optimizer" })
```

### 5. Final Approval
```bash
# Aggregate all feedback
# Create consolidated report
# Request human approval if needed
```
```

---

## Conditional Routing

### Pattern 7: Intelligent Task Routing

```markdown
---
name: task-router
description: Routes tasks to appropriate specialists based on task type
tools: Task, Read
---

# Intelligent Task Router

## Routing Logic

```javascript
function routeTask(taskDescription) {
  // Analyze task description
  const keywords = extractKeywords(taskDescription.toLowerCase());
  
  // Route to appropriate agent
  if (keywords.includes('test')) {
    return Task(taskDescription, { agent: 'test-writer' });
  }
  
  if (keywords.includes('database') || keywords.includes('sql')) {
    return Task(taskDescription, { agent: 'database-expert' });
  }
  
  if (keywords.includes('api') || keywords.includes('endpoint')) {
    return Task(taskDescription, { agent: 'api-expert' });
  }
  
  if (keywords.includes('style') || keywords.includes('css')) {
    return Task(taskDescription, { agent: 'css-tailwind-expert' });
  }
  
  if (keywords.includes('optimize') || keywords.includes('performance')) {
    return Task(taskDescription, { agent: 'performance-optimizer' });
  }
  
  if (keywords.includes('document')) {
    return Task(taskDescription, { agent: 'docs-writer' });
  }
  
  // Default to general implementer
  return Task(taskDescription, { agent: 'implementer' });
}
```

## Example Usage

```
User: "Add database indexes for user queries"
[task-router] → database-expert

User: "Style the login form with Tailwind"
[task-router] → css-tailwind-expert

User: "Write tests for authentication"
[task-router] → test-writer

User: "Optimize the dashboard loading time"
[task-router] → performance-optimizer
```
```

### Pattern 8: Complexity-Based Routing

```markdown
---
name: complexity-router
description: Routes based on task complexity and requirements
tools: Task
---

# Complexity-Based Router

## Routing Strategy

### Simple Tasks → Sonnet
- Code changes < 100 lines
- Single file modifications
- Bug fixes
- Style updates

### Complex Tasks → Opus
- Architecture decisions
- Multi-file refactoring
- Complex algorithms
- System design

### Research Tasks → Opus + Web Search
- Technology evaluation
- Best practices research
- Competitive analysis

## Example

```javascript
function assessComplexity(task) {
  const complexity = {
    filesAffected: 0,
    linesOfCode: 0,
    requiresResearch: false,
    requiresDesign: false,
  };
  
  // Analyze task
  if (task.includes('refactor') || task.includes('redesign')) {
    complexity.requiresDesign = true;
  }
  
  if (task.includes('research') || task.includes('evaluate')) {
    complexity.requiresResearch = true;
  }
  
  // Route accordingly
  if (complexity.requiresDesign || complexity.requiresResearch) {
    return { agent: 'planner', model: 'opus' };
  }
  
  return { agent: 'implementer', model: 'sonnet' };
}
```
```

---

## Error Handling

### Pattern 9: Retry with Fallback

```markdown
---
name: error-handler
description: Handles agent failures with retry logic and fallbacks
tools: Task, Read
---

# Error Handling Coordinator

## Retry Strategy

```javascript
async function executeWithRetry(task, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await Task(task);
      return result;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  throw new Error(`Task failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

## Fallback Strategy

```javascript
async function executeWithFallback(task, primaryAgent, fallbackAgent) {
  try {
    // Try primary agent
    return await Task(task, { agent: primaryAgent });
  } catch (error) {
    console.log(`Primary agent failed, trying fallback...`);
    
    // Try fallback agent
    try {
      return await Task(task, { agent: fallbackAgent });
    } catch (fallbackError) {
      // Both failed - escalate to human
      throw new Error(`Both agents failed. Manual intervention required.`);
    }
  }
}
```

## Example Usage

```
User: "Implement complex algorithm"

[error-handler] Trying opus agent...
❌ Failed: Context limit exceeded

[error-handler] Falling back to chunked approach...
✓ Success: Algorithm implemented in smaller parts
```
```

### Pattern 10: Validation Pipeline

```markdown
---
name: validation-pipeline
description: Validates agent outputs before proceeding
tools: Task, Bash, Read
---

# Validation Pipeline

## Validation Steps

```javascript
async function executeWithValidation(task, validationFn) {
  // Execute task
  const result = await Task(task);
  
  // Validate result
  const isValid = await validationFn(result);
  
  if (!isValid) {
    // Retry with more specific instructions
    const improvedTask = `${task}

Previous attempt had issues. Please ensure:
${getValidationErrors(result)}`;
    
    return await Task(improvedTask);
  }
  
  return result;
}
```

## Example: Code Validation

```javascript
async function validateCode(code) {
  // Run linter
  const lintResult = await bash('eslint temp.js');
  if (lintResult.exitCode !== 0) return false;
  
  // Run tests
  const testResult = await bash('npm test');
  if (testResult.exitCode !== 0) return false;
  
  // Check type safety
  const typeResult = await bash('tsc --noEmit');
  if (typeResult.exitCode !== 0) return false;
  
  return true;
}

// Usage
const code = await executeWithValidation(
  "Implement user authentication",
  validateCode
);
```
```

---

## Context Management

### Pattern 11: Context Passing

```markdown
---
name: context-manager
description: Manages context sharing between agents
tools: Task, Read, Write
---

# Context Management

## Shared Context File

```javascript
// Create shared context
await write('.claude/shared-context.json', JSON.stringify({
  project: 'User Management System',
  currentPhase: 'implementation',
  decisions: {
    database: 'PostgreSQL',
    framework: 'Express',
    auth: 'JWT'
  },
  completedTasks: []
}));

// Agent 1: Update context
const context = JSON.parse(await read('.claude/shared-context.json'));
context.completedTasks.push('Database schema created');
await write('.claude/shared-context.json', JSON.stringify(context));

// Agent 2: Read context
const context = JSON.parse(await read('.claude/shared-context.json'));
// Use context for informed decisions
```

## Context Inheritance

```javascript
// Parent agent context
const parentContext = {
  architecture: 'microservices',
  apiVersion: 'v2',
  conventions: {
    naming: 'camelCase',
    errorHandling: 'try-catch'
  }
};

// Pass to child agents
Task("Implement user service", {
  context: parentContext,
  agent: 'api-expert'
});
```
```

### Pattern 12: Progressive Context Building

```markdown
---
name: progressive-context
description: Builds context progressively through agent chain
tools: Task, Read, Write
---

# Progressive Context Building

## Pattern

```javascript
// Phase 1: Discovery
const codebaseStructure = await Task(
  "Analyze codebase structure",
  { agent: "Explore" }
);

// Phase 2: Planning (uses discovery results)
const architecturePlan = await Task(
  `Design feature architecture

Context from discovery:
${codebaseStructure}`,
  { agent: "planner" }
);

// Phase 3: Implementation (uses both previous results)
const implementation = await Task(
  `Implement feature

Architecture plan:
${architecturePlan}

Codebase structure:
${codebaseStructure}`,
  { agent: "implementer" }
);
```

## Benefits

- Each agent builds on previous work
- Maintains consistency
- Reduces redundant discovery
- Improves decision quality
```

---

## Complete Example: Feature Implementation

Here's a complete example orchestrating multiple agents:

```markdown
---
name: complete-feature-flow
description: Complete feature implementation with all coordination patterns
tools: Task, Read, Write, Bash, Grep
model: sonnet
---

# Complete Feature Implementation Flow

## Example: User Profile Management

```javascript
async function implementFeature(featureDescription) {
  console.log('[coordinator] Starting feature implementation...');
  
  // Phase 1: Parallel Research & Planning
  console.log('[Phase 1] Research & Planning...');
  const [research, existingPatterns, plan] = await Promise.all([
    Task("Research user profile best practices", { agent: "researcher" }),
    Task("Find existing user patterns in codebase", { agent: "Explore" }),
    Task("Design profile management architecture", { agent: "planner" })
  ]);
  
  // Create context file
  await write('.claude/feature-context.json', JSON.stringify({
    feature: 'User Profile Management',
    research,
    existingPatterns,
    plan
  }));
  
  // Phase 2: Parallel Implementation
  console.log('[Phase 2] Implementation...');
  const [backend, frontend, database] = await Promise.all([
    Task(`Implement profile API endpoints

Context: ${plan.backendDetails}`, 
      { agent: "api-expert" }),
      
    Task(`Create profile UI components

Context: ${plan.frontendDetails}`, 
      { agent: "implementer" }),
      
    Task(`Create profile schema and migrations

Context: ${plan.databaseDetails}`, 
      { agent: "database-expert" })
  ]);
  
  // Phase 3: Sequential Quality Checks
  console.log('[Phase 3] Quality Assurance...');
  
  // Step 1: Tests
  const tests = await Task(
    "Write comprehensive test suite for profile feature",
    { agent: "test-writer" }
  );
  
  // Step 2: Review (only after tests)
  const review = await Task(
    "Review profile implementation",
    { agent: "code-reviewer" }
  );
  
  // Step 3: Optimize (only after review passes)
  if (review.approved) {
    await Task(
      "Optimize profile feature performance",
      { agent: "performance-optimizer" }
    );
  }
  
  // Phase 4: Documentation
  console.log('[Phase 4] Documentation...');
  await Task(
    "Document profile management feature",
    { agent: "docs-writer" }
  );
  
  // Phase 5: Prepare Deployment
  console.log('[Phase 5] Deployment Prep...');
  const deploymentPlan = await Task(
    "Create deployment plan for profile feature",
    { agent: "devops" }
  );
  
  console.log('[coordinator] Feature implementation complete!');
  
  return {
    status: 'complete',
    phases: {
      research,
      plan,
      implementation: { backend, frontend, database },
      tests,
      review,
      deploymentPlan
    }
  };
}
```

## Output

```
[coordinator] Starting feature implementation...

[Phase 1] Research & Planning...
✓ [researcher] Research complete
✓ [Explore] Patterns analyzed
✓ [planner] Architecture designed

[Phase 2] Implementation...
✓ [api-expert] Backend endpoints created
✓ [implementer] Frontend components created
✓ [database-expert] Schema migrations created

[Phase 3] Quality Assurance...
✓ [test-writer] Test suite created (85% coverage)
✓ [code-reviewer] Code review passed
✓ [performance-optimizer] Performance optimized

[Phase 4] Documentation...
✓ [docs-writer] Documentation complete

[Phase 5] Deployment Prep...
✓ [devops] Deployment plan ready

[coordinator] Feature implementation complete!
```
```

---

These patterns provide a complete toolkit for orchestrating complex multi-agent workflows!
