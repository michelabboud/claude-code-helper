# Contributing & Customization Guide

How to extend, customize, and contribute to the Multi-Agent MCP System.

---

## Table of Contents

1. [Quick Customization](#quick-customization)
2. [Adding New Tools](#adding-new-tools)
3. [Creating New Servers](#creating-new-servers)
4. [Custom Agent Configurations](#custom-agent-configurations)
5. [Modifying Existing Tools](#modifying-existing-tools)
6. [Testing Your Changes](#testing-your-changes)
7. [Best Practices](#best-practices)
8. [Contributing Back](#contributing-back)

---

## Quick Customization

### Change Tool Behavior

Edit the server source files:

```typescript
// code-review-mcp/src/index.ts

// Customize lint command
const commands: Record<string, string> = {
  eslint: `eslint ${fix ? "--fix" : ""} ${filePath} --format json`,
  // Add your custom linter:
  mylinter: `mylinter ${filePath} --output json`,
};
```

Rebuild:
```bash
cd code-review-mcp
npm run build
```

### Add Project-Specific Rules

Create configuration files:

```json
// .mcp-config.json
{
  "linters": {
    "eslint": {
      "config": ".eslintrc.custom.json",
      "ignore": [".eslintignore"]
    }
  },
  "testing": {
    "coverage_threshold": 90,
    "required_frameworks": ["jest"]
  },
  "design_system": {
    "tokens_file": "./design/tokens.json",
    "base_spacing": 4
  }
}
```

### Custom Agent Prompts

Create specialized agents:

```json
// my-agents/strict-reviewer.json
{
  "name": "strict-reviewer",
  "instructions": "You are an extremely strict code reviewer. No warnings allowed, only errors. Coverage must be 95%+. All functions must have JSDoc comments.",
  "mcp_servers": ["code-review", "testing"]
}
```

---

## Adding New Tools

### Step-by-Step Guide

#### 1. Define the Tool Schema

```typescript
// code-review-mcp/src/index.ts

import { z } from "zod";

const CheckDocumentationSchema = z.object({
  directory: z.string().describe("Directory to check"),
  minCoverage: z.number().min(0).max(100).optional()
    .describe("Minimum documentation coverage %"),
  style: z.enum(["jsdoc", "tsdoc", "pydoc"]).optional()
    .describe("Documentation style to enforce"),
});
```

#### 2. Implement the Tool Logic

```typescript
async function checkDocumentation(
  directory: string,
  minCoverage: number = 80,
  style: string = "jsdoc"
): Promise<string> {
  try {
    // Your implementation
    const files = await getSourceFiles(directory);
    let documented = 0;
    let total = 0;
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const functions = extractFunctions(content);
      total += functions.length;
      documented += functions.filter(fn => hasDocumentation(fn, style)).length;
    }
    
    const coverage = (documented / total) * 100;
    
    return JSON.stringify({
      directory,
      style,
      total,
      documented,
      coverage: coverage.toFixed(2),
      meetsThreshold: coverage >= minCoverage,
      undocumented: total - documented,
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({ 
      error: error.message 
    }, null, 2);
  }
}

// Helper functions
async function getSourceFiles(dir: string): Promise<string[]> {
  // Implementation
}

function extractFunctions(content: string): any[] {
  // Parse and extract functions
}

function hasDocumentation(fn: any, style: string): boolean {
  // Check if function has proper docs
}
```

#### 3. Register the Tool

```typescript
// In ListToolsRequestSchema handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools
      {
        name: "check_documentation",
        description: "Check documentation coverage for source files. Validates JSDoc, TSDoc, or PyDoc comments on functions and classes.",
        inputSchema: {
          type: "object",
          properties: {
            directory: { 
              type: "string", 
              description: "Directory to check" 
            },
            minCoverage: { 
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Minimum documentation coverage %" 
            },
            style: { 
              type: "string",
              enum: ["jsdoc", "tsdoc", "pydoc"],
              description: "Documentation style to enforce" 
            },
          },
          required: ["directory"],
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
        },
      },
    ],
  };
});
```

#### 4. Add Tool Handler

```typescript
// In CallToolRequestSchema handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ... existing cases
      
      case "check_documentation": {
        const { directory, minCoverage, style } = 
          CheckDocumentationSchema.parse(args);
        const result = await checkDocumentation(
          directory, 
          minCoverage, 
          style
        );
        return {
          content: [
            {
              type: "text",
              text: `Documentation coverage for ${directory}:\n\n${result}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});
```

#### 5. Test and Build

```bash
cd code-review-mcp

# Rebuild
npm run build

# Test with inspector
npm run inspector

# In inspector, try:
{
  "method": "tools/call",
  "params": {
    "name": "check_documentation",
    "arguments": {
      "directory": "./src",
      "minCoverage": 80,
      "style": "jsdoc"
    }
  }
}
```

---

## Creating New Servers

### When to Create a New Server

Create a new MCP server when:
- Your tools form a cohesive domain (e.g., "database-mcp")
- The server would have 3+ related tools
- It requires specific dependencies
- It targets a specific technology stack

### Server Template

```typescript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// Define your schemas
const YourToolSchema = z.object({
  param: z.string(),
});

// Create server
const server = new Server(
  {
    name: "your-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool implementation
async function yourTool(param: string): Promise<string> {
  // Your logic here
  return JSON.stringify({ result: "success" });
}

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "your_tool",
        description: "What your tool does",
        inputSchema: {
          type: "object",
          properties: {
            param: { type: "string", description: "Parameter description" },
          },
          required: ["param"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "your_tool") {
      const { param } = YourToolSchema.parse(args);
      const result = await yourTool(param);
      return {
        content: [{ type: "text", text: result }],
      };
    }
    throw new Error(`Unknown tool: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Your MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### Example: Database MCP Server

```typescript
// database-mcp/src/index.ts

const QuerySchema = z.object({
  connection: z.string(),
  query: z.string(),
  params: z.array(z.any()).optional(),
});

const tools = [
  {
    name: "execute_query",
    description: "Execute SQL query safely",
  },
  {
    name: "analyze_schema",
    description: "Analyze database schema",
  },
  {
    name: "check_indexes",
    description: "Check index usage and recommendations",
  },
  {
    name: "query_performance",
    description: "Analyze query performance with EXPLAIN",
  },
];
```

---

## Custom Agent Configurations

### Agent Configuration Schema

```json
{
  "name": "agent-name",
  "description": "Brief description",
  "instructions": "Detailed instructions for the agent",
  "mcp_servers": ["server1", "server2"],
  "temperature": 0.7,
  "max_tokens": 4000,
  "tools_allowed": ["tool1", "tool2"],
  "tools_denied": ["tool3"]
}
```

### Example Agents

#### Performance Optimizer

```json
{
  "name": "performance-optimizer",
  "description": "Identifies and fixes performance issues",
  "instructions": "You are a performance optimization expert. Use code-review-mcp to analyze complexity, testing-mcp to benchmark, and suggest optimizations. Focus on O(n) improvements and caching opportunities.",
  "mcp_servers": ["code-review", "testing"],
  "temperature": 0.5
}
```

#### Accessibility Auditor

```json
{
  "name": "accessibility-auditor",
  "description": "Ensures WCAG 2.1 AA compliance",
  "instructions": "You are an accessibility expert. Use design-system-mcp to check color contrast, validate semantic HTML, and ensure keyboard navigation. Flag any WCAG violations as errors.",
  "mcp_servers": ["design-system"],
  "temperature": 0.3
}
```

#### API Security Specialist

```json
{
  "name": "api-security",
  "description": "Reviews API endpoints for security issues",
  "instructions": "You focus exclusively on API security. Check for: SQL injection, XSS, CSRF, authentication bypass, rate limiting, and proper error handling. Use semgrep for scanning.",
  "mcp_servers": ["code-review"],
  "tools_allowed": ["security_scan"],
  "temperature": 0.2
}
```

---

## Modifying Existing Tools

### Customization Points

#### 1. Change Default Parameters

```typescript
// testing-mcp/src/index.ts

async function getCoverage(
  testPath: string,
  framework: string,
  threshold: number = 90,  // Changed from 80
  format: string = "json"
): Promise<string> {
  // ... rest of implementation
}
```

#### 2. Add New Output Formats

```typescript
function formatResult(result: any, format: string): string {
  switch (format) {
    case "json":
      return JSON.stringify(result, null, 2);
    case "markdown":
      return generateMarkdown(result);
    case "csv":  // New format
      return generateCSV(result);
    case "slack":  // New format
      return generateSlackMessage(result);
    default:
      return JSON.stringify(result);
  }
}
```

#### 3. Integrate with External Services

```typescript
async function reportToSlack(result: any): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) return;
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Test Results: ${result.passed}/${result.total} passed`,
    }),
  });
}
```

#### 4. Add Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 min cache

async function cachedLint(file: string): Promise<string> {
  const cacheKey = `lint:${file}:${await getFileHash(file)}`;
  
  const cached = cache.get<string>(cacheKey);
  if (cached) return cached;
  
  const result = await runLinter(file);
  cache.set(cacheKey, result);
  return result;
}
```

---

## Testing Your Changes

### Unit Tests

```typescript
// code-review-mcp/tests/lint.test.ts

import { describe, it, expect } from 'vitest';
import { runLinter } from '../src/index';

describe('runLinter', () => {
  it('detects unused variables', async () => {
    const result = await runLinter('test-files/unused-var.js', 'eslint');
    const parsed = JSON.parse(result);
    expect(parsed.issues).toContainEqual(
      expect.objectContaining({ rule: 'no-unused-vars' })
    );
  });

  it('handles invalid files gracefully', async () => {
    const result = await runLinter('nonexistent.js', 'eslint');
    const parsed = JSON.parse(result);
    expect(parsed.error).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// code-review-mcp/tests/integration.test.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js";

describe('MCP Server Integration', () => {
  let server: Server;

  beforeEach(() => {
    server = createServer(); // Your server factory
  });

  it('lists all tools', async () => {
    const response = await server.request({
      method: 'tools/list'
    });
    
    expect(response.tools).toHaveLength(4);
    expect(response.tools[0].name).toBe('lint_file');
  });

  it('executes lint_file tool', async () => {
    const response = await server.request({
      method: 'tools/call',
      params: {
        name: 'lint_file',
        arguments: {
          filePath: 'test.js',
          linter: 'eslint'
        }
      }
    });
    
    expect(response.content).toBeDefined();
  });
});
```

### Manual Testing

```bash
# Test with MCP Inspector
cd your-mcp-server
npm run inspector

# Test with Claude Code
claude-code --mcp-server ./build/index.js
# Then interact naturally

# Test with curl (if using HTTP transport)
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'
```

---

## Best Practices

### Code Quality

1. **Type Everything**
   ```typescript
   // Good
   async function lint(file: string, linter: Linter): Promise<LintResult>
   
   // Bad
   async function lint(file, linter)
   ```

2. **Validate All Inputs**
   ```typescript
   const schema = z.object({
     file: z.string().min(1),
     options: z.object({}).optional()
   });
   const validated = schema.parse(input);
   ```

3. **Handle Errors Gracefully**
   ```typescript
   try {
     return await operation();
   } catch (error) {
     return {
       error: error.message,
       suggestion: "Try checking your file path"
     };
   }
   ```

### Tool Design

1. **Clear, Action-Oriented Names**
   - Good: `check_documentation`, `run_tests`, `validate_tokens`
   - Bad: `docs`, `test`, `check`

2. **Descriptive Schemas**
   ```typescript
   filePath: z.string().describe("Absolute path to the file to lint")
   ```

3. **Provide Examples**
   ```typescript
   description: "Check code coverage. Example: {testPath: './src', threshold: 80}"
   ```

4. **Return Structured Data**
   ```typescript
   return {
     summary: { passed: 10, failed: 2 },
     details: [...],
     recommendations: [...]
   };
   ```

### Performance

1. **Async Operations**
   ```typescript
   // Parallel execution
   const results = await Promise.all([
     lint(file1),
     lint(file2),
     lint(file3)
   ]);
   ```

2. **Stream Large Results**
   ```typescript
   // For large outputs, stream instead of buffering
   const stream = createReadStream(largeFile);
   for await (const chunk of stream) {
     yield chunk;
   }
   ```

3. **Implement Timeouts**
   ```typescript
   const result = await Promise.race([
     operation(),
     timeout(30000) // 30 second timeout
   ]);
   ```

---

## Contributing Back

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/awesome-new-tool
   ```

3. **Make your changes**
   - Add tool implementation
   - Write tests
   - Update documentation

4. **Test thoroughly**
   ```bash
   npm test
   npm run build
   npm run inspector
   ```

5. **Submit a pull request**
   - Clear description
   - Examples of usage
   - Test results

### What to Contribute

**High Priority:**
- Additional linters/scanners
- More test frameworks
- New design system validators
- Performance improvements
- Bug fixes

**Welcome Contributions:**
- Documentation improvements
- Example workflows
- Agent configurations
- Integration guides

**Need Discussion:**
- New MCP servers
- Breaking changes
- Architecture modifications

### Code Style

```typescript
// Use Prettier
npm run format

// Follow conventions:
- camelCase for functions
- PascalCase for types
- UPPER_SNAKE_CASE for constants
- Descriptive variable names
- JSDoc comments on public functions
```

---

## Advanced Customization

### Custom Protocols

Add WebSocket support:

```typescript
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/websocket.js";

const transport = new WebSocketServerTransport({
  port: 8080
});
await server.connect(transport);
```

### Plugin System

Create a plugin architecture:

```typescript
interface ToolPlugin {
  name: string;
  schema: z.ZodSchema;
  handler: (args: any) => Promise<string>;
}

const plugins: ToolPlugin[] = [];

function registerPlugin(plugin: ToolPlugin) {
  plugins.push(plugin);
}

// Tools are loaded from plugins
for (const plugin of plugins) {
  registerTool(plugin);
}
```

### Multi-Language Support

```typescript
const TOOL_DESCRIPTIONS = {
  en: "Check documentation coverage",
  es: "Verificar cobertura de documentación",
  fr: "Vérifier la couverture de la documentation"
};

function getDescription(tool: string, lang: string = 'en'): string {
  return TOOL_DESCRIPTIONS[lang] || TOOL_DESCRIPTIONS.en;
}
```

---

## Resources

- **MCP Specification:** https://modelcontextprotocol.io
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Zod Documentation:** https://zod.dev
- **Testing Library:** https://vitest.dev

---

Happy hacking! Build amazing tools and agents! 🚀

For questions or help, check the documentation or create an issue.
