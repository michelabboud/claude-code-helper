# Architecture Documentation

Technical deep dive into the Multi-Agent MCP System architecture, design decisions, and implementation details.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [MCP Server Architecture](#mcp-server-architecture)
3. [Multi-Agent Coordination](#multi-agent-coordination)
4. [Data Flow](#data-flow)
5. [Design Decisions](#design-decisions)
6. [Extension Points](#extension-points)
7. [Performance Considerations](#performance-considerations)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Claude / Claude Code               │
│                    (Orchestrator)                    │
└────────────────┬────────────────┬───────────────────┘
                 │                │
        ┌────────┴────────┐  ┌───┴──────────┐
        │  Specialized    │  │  Specialized  │
        │   Agent 1       │  │   Agent 2     │
        └────────┬────────┘  └───┬───────────┘
                 │                │
    ┌────────────┴────────────────┴─────────────┐
    │                                            │
    │          MCP Protocol (stdio/HTTP)         │
    │                                            │
    ├──────────────┬──────────────┬─────────────┤
    │              │              │             │
┌───▼────┐   ┌────▼────┐   ┌─────▼──────┐
│ Code   │   │ Testing │   │  Design    │
│ Review │   │   MCP   │   │  System    │
│  MCP   │   │         │   │   MCP      │
└───┬────┘   └────┬────┘   └─────┬──────┘
    │             │              │
    │             │              │
┌───▼─────────────▼──────────────▼──────┐
│         External Tools                 │
│  ESLint, Pytest, Semgrep, etc.        │
└────────────────────────────────────────┘
```

### Components

1. **Orchestrator (Claude/Claude Code)**
   - Manages conversation state
   - Routes tasks to specialized agents
   - Synthesizes results from multiple sources
   - Handles user interaction

2. **Specialized Agents**
   - Focus on specific domains (security, testing, design)
   - Use subset of MCP tools
   - Maintain domain expertise
   - Report findings to orchestrator

3. **MCP Servers**
   - Code Review MCP: Linting, security, complexity
   - Testing MCP: Test execution, coverage, quality
   - Design System MCP: Token validation, accessibility

4. **External Tools**
   - Language-specific linters (ESLint, Pylint)
   - Security scanners (Semgrep, Bandit)
   - Test frameworks (Jest, Pytest)

---

## MCP Server Architecture

### Server Structure

Each MCP server follows this pattern:

```
mcp-server/
├── src/
│   └── index.ts          # Main server entry point
├── build/                # Compiled JavaScript
│   └── index.js
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config
└── README.md
```

### Core Components

#### 1. Server Initialization

```typescript
const server = new Server(
  {
    name: "code-review-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},  // Declares tool support
    },
  }
);
```

#### 2. Tool Registration

```typescript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "lint_file",
        description: "...",
        inputSchema: {
          type: "object",
          properties: { /* ... */ },
          required: ["filePath", "linter"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
      // ... more tools
    ],
  };
});
```

#### 3. Tool Execution

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "lint_file":
      const { filePath, linter } = LintFileSchema.parse(args);
      const result = await runLinter(filePath, linter);
      return {
        content: [{ type: "text", text: result }],
      };
    // ... other cases
  }
});
```

#### 4. Transport Layer

```typescript
// stdio transport for local communication
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Tool Design Principles

#### Input Validation

All inputs use Zod schemas for type safety:

```typescript
const LintFileSchema = z.object({
  filePath: z.string().describe("Path to the file"),
  linter: z.enum(["eslint", "pylint", "rubocop"]),
  fixable: z.boolean().optional(),
});
```

Benefits:
- Runtime type checking
- Clear error messages
- Automatic type inference
- Self-documenting schemas

#### Output Format

Tools return structured JSON or formatted text:

```typescript
return {
  content: [
    {
      type: "text",
      text: JSON.stringify(result, null, 2),
    },
  ],
};
```

For complex results, include both machine-readable and human-readable formats.

#### Error Handling

```typescript
try {
  const result = await operation();
  return { content: [{ type: "text", text: result }] };
} catch (error: any) {
  return {
    content: [{ type: "text", text: `Error: ${error.message}` }],
    isError: true,
  };
}
```

Always provide:
- Clear error messages
- Context about what failed
- Suggestions for resolution

#### Annotations

Tools declare their properties:

```typescript
annotations: {
  readOnlyHint: true,      // Doesn't modify state
  destructiveHint: false,   // Won't delete data
  idempotentHint: true,     // Same input = same output
}
```

This helps agents understand tool characteristics.

---

## Multi-Agent Coordination

### Coordination Patterns

#### 1. Sequential Coordination

```
Agent 1 → Complete → Agent 2 → Complete → Agent 3
```

**Use case:** Each step depends on previous results

**Example:**
```typescript
// Main Claude orchestrates:
1. Code Review Agent scans for issues
2. If issues found, Developer Agent fixes
3. Testing Agent verifies fixes
4. Design Agent validates UI
```

**Pros:**
- Clear dependencies
- Easier to debug
- Predictable flow

**Cons:**
- Slower (serial execution)
- One failure blocks pipeline

#### 2. Parallel Coordination

```
       ┌─ Agent 1 ─┐
Main ──┼─ Agent 2 ─┼── Synthesize
       └─ Agent 3 ─┘
```

**Use case:** Independent checks

**Example:**
```typescript
// All run simultaneously:
- Code Review Agent (linting)
- Testing Agent (coverage)
- Design Agent (tokens)
// Main Claude aggregates results
```

**Pros:**
- Fast (parallel execution)
- Comprehensive results

**Cons:**
- More complex coordination
- Results may conflict

#### 3. Conditional Coordination

```
Main → Check → if (condition) → Agent A
                              → else → Agent B
```

**Use case:** Dynamic workflow based on results

**Example:**
```typescript
Main Claude:
  if (changes include .tsx files):
    invoke Design Agent
  if (changes include tests):
    invoke Testing Agent
  if (API changes):
    invoke Security Agent
```

**Pros:**
- Efficient (only needed agents)
- Flexible workflow

**Cons:**
- Complex decision logic
- Requires smart orchestration

#### 4. Iterative Refinement

```
Agent 1 → Review → Feedback ┐
  ↑                         │
  └─── Fix ← Feedback ──────┘
  Repeat until all checks pass
```

**Use case:** Quality gates with feedback loops

**Example:**
```typescript
loop:
  Developer Agent builds feature
  Review Agent checks quality
  if (issues found):
    send feedback to Developer Agent
    continue loop
  else:
    break loop
```

**Pros:**
- High quality output
- Automated refinement

**Cons:**
- Can loop indefinitely
- Requires convergence logic

### Shared Context

Agents share context through:

1. **File System**
   - All agents read/write to same working directory
   - Use file paths to reference work

2. **Conversation History**
   - Main Claude maintains full conversation
   - Agents receive relevant context

3. **Tool Results**
   - Previous tool outputs included in context
   - Agents can reference prior findings

---

## Data Flow

### Request Flow

```
1. User → "Review my code"
         ↓
2. Main Claude decides workflow
         ↓
3. Call MCP tool: lint_file(path="src/app.ts")
         ↓
4. MCP Server receives request
         ↓
5. Server validates input (Zod schema)
         ↓
6. Server executes linter
         ↓
7. Linter runs (ESLint binary)
         ↓
8. Results returned to server
         ↓
9. Server formats output
         ↓
10. Response sent back to Claude
         ↓
11. Claude processes results
         ↓
12. Claude presents to user
```

### Data Transformation

#### Input Pipeline
```
User Message
  → Natural Language Processing
    → Tool Selection
      → Parameter Extraction
        → Schema Validation (Zod)
          → Type-Safe Execution
```

#### Output Pipeline
```
Raw Tool Output (JSON/text)
  → Format Standardization
    → Context Enrichment
      → Synthesis (if multiple tools)
        → Natural Language Generation
          → User-Friendly Response
```

### State Management

**Stateless Design:**
- MCP servers don't maintain state between calls
- Each request is independent
- State lives in:
  - File system (persisted data)
  - Conversation context (ephemeral)
  - Tool outputs (session-scoped)

**Benefits:**
- Simpler server implementation
- No state synchronization needed
- Easy to scale/restart

---

## Design Decisions

### 1. TypeScript over Python

**Rationale:**
- Better tooling (LSP, IntelliSense)
- Strong type system catches errors early
- Native async/await
- Excellent MCP SDK support
- Good for both server and agent code

**Trade-offs:**
- More verbose than Python
- Compilation step required
- Learning curve for Python devs

### 2. Zod for Validation

**Rationale:**
- Runtime type checking + TypeScript inference
- Clear error messages
- Composable schemas
- JSON Schema generation

**Alternative considered:** JSON Schema directly
- Rejected: Less type-safe, more verbose

### 3. stdio Transport

**Rationale:**
- Simple process communication
- No network configuration
- Works locally and remotely
- Standard input/output = universal

**Alternative considered:** HTTP transport
- Kept as option for remote servers

### 4. External Tools via Child Process

**Rationale:**
- Leverage existing, mature tools
- No need to reimplement linters/scanners
- Community-maintained tools
- Language-specific expertise

**Alternative considered:** Native implementations
- Rejected: Too much work, worse quality

### 5. JSON + Markdown Output

**Rationale:**
- JSON: Machine-readable, structured
- Markdown: Human-readable, formatted
- Both: Flexibility for different use cases

**Pattern:**
```typescript
return {
  content: [
    { type: "text", text: JSON.stringify(data) },
    // Claude can parse JSON or read formatted text
  ]
};
```

### 6. Comprehensive Tool Coverage

**Rationale:**
- Cover entire development lifecycle
- Code → Tests → Design
- Enables complete automation
- One system for all quality checks

**Alternative considered:** Specialized single-purpose servers
- Rejected: Too fragmented, harder to coordinate

---

## Extension Points

### Adding New Tools

#### In Existing Server

1. **Define schema:**
```typescript
const NewToolSchema = z.object({
  param1: z.string(),
  param2: z.number().optional(),
});
```

2. **Implement handler:**
```typescript
async function newToolHandler(params) {
  const validated = NewToolSchema.parse(params);
  const result = await performOperation(validated);
  return formatResult(result);
}
```

3. **Register tool:**
```typescript
// In ListToolsRequestSchema handler
{
  name: "new_tool",
  description: "What it does",
  inputSchema: zodToJsonSchema(NewToolSchema),
}

// In CallToolRequestSchema handler
case "new_tool":
  return newToolHandler(args);
```

#### New MCP Server

1. Copy template structure
2. Define your tools
3. Implement tool handlers
4. Add to configuration
5. Test with inspector

### Adding New Agents

Create agent config file:

```json
{
  "name": "performance-analyzer",
  "description": "Performance optimization expert",
  "instructions": "You analyze performance. Use code-review-mcp's complexity analysis and suggest optimizations for O(n²) or worse algorithms.",
  "mcp_servers": ["code-review"],
  "temperature": 0.7
}
```

### Custom Workflows

Create workflow templates:

```typescript
const workflows = {
  "pre-commit": [
    "lint_file",
    "run_tests",
    "check_component"
  ],
  "security-audit": [
    "security_scan",
    "find_duplicates",
    "analyze_complexity"
  ],
  "design-review": [
    "validate_tokens",
    "check_component",
    "validate_color_palette"
  ]
};
```

---

## Performance Considerations

### Tool Execution Time

| Tool Type | Typical Duration | Optimization |
|-----------|-----------------|--------------|
| Linting | 1-5 seconds | Cache results |
| Security scan | 10-30 seconds | Incremental scan |
| Test execution | 5-60 seconds | Parallel tests |
| Coverage | 10-120 seconds | Incremental coverage |
| Token validation | <1 second | Fast (pure JS) |

### Optimization Strategies

#### 1. Caching

```typescript
const cache = new Map<string, { result: any, timestamp: number }>();

async function cachedLint(file: string) {
  const cached = cache.get(file);
  if (cached && Date.now() - cached.timestamp < 60000) {
    return cached.result;
  }
  
  const result = await runLinter(file);
  cache.set(file, { result, timestamp: Date.now() });
  return result;
}
```

#### 2. Incremental Analysis

Only check changed files:

```typescript
async function incrementalScan(changedFiles: string[]) {
  // Only scan what changed
  const results = await Promise.all(
    changedFiles.map(file => scan(file))
  );
  return results;
}
```

#### 3. Parallel Execution

```typescript
// Run multiple tools simultaneously
const [lintResult, testResult, designResult] = await Promise.all([
  lint(files),
  runTests(testDir),
  validateTokens(tokensFile)
]);
```

#### 4. Early Termination

```typescript
// Stop on first critical issue
for (const file of files) {
  const result = await securityScan(file);
  if (result.severity === 'critical') {
    return result; // Stop immediately
  }
}
```

### Scalability

**Current limits:**
- Small projects (<1000 files): Excellent
- Medium projects (<10000 files): Good
- Large projects (>10000 files): May need optimization

**Scaling strategies:**
1. Implement file filtering
2. Add concurrency limits
3. Use incremental analysis
4. Consider distributed execution

---

## Security Considerations

### Input Validation

All user inputs are validated:
- Zod schemas enforce types
- Path traversal prevention
- Command injection protection

### External Tool Execution

```typescript
// Safe execution
const { stdout } = await execAsync(
  `eslint ${escapeShellArg(filePath)}`
);

// Avoid:
const { stdout } = await execAsync(`eslint ${filePath}`); // ❌ Injection risk
```

### File Access

Restrict file operations:
```typescript
// Check if path is within allowed directory
if (!filePath.startsWith(allowedDir)) {
  throw new Error("Access denied");
}
```

---

## Testing Strategy

### Unit Tests

Test individual functions:
```typescript
describe('runLinter', () => {
  it('returns valid JSON', async () => {
    const result = await runLinter('test.js', 'eslint');
    expect(JSON.parse(result)).toBeDefined();
  });
});
```

### Integration Tests

Test MCP protocol:
```typescript
describe('MCP Server', () => {
  it('responds to tools/list', async () => {
    const response = await server.handle({
      method: 'tools/list'
    });
    expect(response.tools.length).toBeGreaterThan(0);
  });
});
```

### End-to-End Tests

Test with real Claude/Claude Code interaction.

---

## Future Enhancements

### Planned Features

1. **Streaming Results**
   - Long-running operations stream progress
   - Better UX for slow tools

2. **Distributed Execution**
   - Run tools across multiple machines
   - Faster for large codebases

3. **ML-Based Prioritization**
   - Learn which issues users care about
   - Prioritize results intelligently

4. **Integration Hub**
   - Connect to GitHub, Jira, etc.
   - Automatic PR comments
   - Issue creation

5. **Custom Rule Engine**
   - Define project-specific rules
   - Extend validation logic

---

## References

- [MCP Specification](https://modelcontextprotocol.io/specification)
- [TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Zod Documentation](https://zod.dev)
- [Claude Documentation](https://docs.anthropic.com)

---

This architecture is designed to be:
- **Extensible:** Easy to add tools and agents
- **Maintainable:** Clear structure and patterns
- **Performant:** Optimized for common workflows
- **Reliable:** Strong typing and validation
- **Flexible:** Multiple coordination patterns

Ready to build amazing multi-agent workflows! 🚀
