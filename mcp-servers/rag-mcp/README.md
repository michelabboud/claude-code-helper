# RAG MCP Server

**Retrieval-Augmented Generation for Claude Code**

Eliminate AI hallucinations and ground code generation in your actual codebase using semantic search and vector embeddings.

---

## 🎯 What This Does

The RAG MCP server provides semantic codebase search capabilities through the Model Context Protocol, enabling Claude Code to:

- **Eliminate hallucinations** - Ground responses in actual code
- **Understand your codebase** - Semantic search finds relevant code
- **Context-aware coding** - Automatically retrieve relevant context
- **Find similar patterns** - Locate similar code implementations
- **Scale to any codebase** - No context window limits

---

## 🛠️ Tools Provided

### 1. `index_codebase`
Index an entire directory for semantic search

**Parameters:**
- `rootPath` (string, required) - Directory to index
- `collectionName` (string, default: "codebase") - Collection name
- `filePatterns` (string[], optional) - Patterns to include (e.g., `["*.ts", "*.js"]`)
- `excludePatterns` (string[], optional) - Patterns to exclude (e.g., `["node_modules/**"]`)
- `chunkSize` (number, default: 1000) - Max characters per chunk

**Example:**
```json
{
  "rootPath": "./src",
  "collectionName": "my-project",
  "filePatterns": ["*.ts", "*.tsx", "*.js", "*.jsx"],
  "excludePatterns": ["node_modules/**", "build/**", "dist/**"],
  "chunkSize": 1000
}
```

**Returns:**
```json
{
  "success": true,
  "collection": "my-project",
  "filesIndexed": 245,
  "totalChunks": 1823,
  "fileStats": {
    "src/auth.ts": 5,
    "src/user.ts": 8,
    ...
  },
  "message": "Successfully indexed 245 files with 1823 chunks"
}
```

---

### 2. `index_file`
Index a single file

**Parameters:**
- `filePath` (string, required) - File to index
- `collectionName` (string, default: "codebase") - Collection name
- `metadata` (object, optional) - Additional metadata

**Example:**
```json
{
  "filePath": "./src/auth.ts",
  "collectionName": "my-project",
  "metadata": {
    "category": "authentication",
    "importance": "high"
  }
}
```

---

### 3. `semantic_search`
Search using natural language

**Parameters:**
- `query` (string, required) - Natural language query
- `collectionName` (string, default: "codebase") - Collection to search
- `nResults` (number, default: 5) - Number of results
- `filter` (object, optional) - Metadata filters

**Example:**
```json
{
  "query": "how does user authentication work?",
  "collectionName": "my-project",
  "nResults": 5
}
```

**Returns:**
```json
{
  "success": true,
  "query": "how does user authentication work?",
  "results": [
    {
      "content": "export function authenticate(user, password) { ... }",
      "metadata": {
        "filePath": "src/auth.ts",
        "chunkIndex": 0
      },
      "distance": 0.234
    },
    ...
  ],
  "count": 5
}
```

---

### 4. `find_similar_code`
Find code similar to a snippet

**Parameters:**
- `codeSnippet` (string, required) - Code to find matches for
- `collectionName` (string, default: "codebase") - Collection to search
- `nResults` (number, default: 5) - Number of results
- `threshold` (number, optional) - Similarity threshold (0-1)

**Example:**
```json
{
  "codeSnippet": "async function getUser(id: string): Promise<User> { ... }",
  "collectionName": "my-project",
  "nResults": 3,
  "threshold": 0.7
}
```

---

### 5. `get_relevant_context`
Get context for a specific task

**Parameters:**
- `task` (string, required) - Task description
- `collectionName` (string, default: "codebase") - Collection to query
- `maxTokens` (number, default: 4000) - Max tokens of context

**Example:**
```json
{
  "task": "implement user logout functionality",
  "collectionName": "my-project",
  "maxTokens": 4000
}
```

**Returns:**
```json
{
  "success": true,
  "task": "implement user logout functionality",
  "context": [
    {
      "content": "...",
      "metadata": {...},
      "file": "src/auth.ts"
    },
    ...
  ],
  "byFile": {
    "src/auth.ts": ["chunk1", "chunk2"],
    "src/session.ts": ["chunk1"]
  },
  "totalChars": 12500,
  "estimatedTokens": 3125,
  "filesIncluded": ["src/auth.ts", "src/session.ts"]
}
```

---

### 6. `list_collections`
List all vector collections

**Example:**
```json
{}
```

**Returns:**
```json
{
  "success": true,
  "collections": [
    {
      "name": "my-project",
      "count": 1823
    },
    {
      "name": "other-project",
      "count": 542
    }
  ],
  "total": 2
}
```

---

### 7. `get_collection_stats`
Get statistics for a collection

**Parameters:**
- `collectionName` (string, required) - Collection name

**Example:**
```json
{
  "collectionName": "my-project"
}
```

**Returns:**
```json
{
  "success": true,
  "collection": "my-project",
  "totalChunks": 1823,
  "filesInSample": 45,
  "sampleSize": 100
}
```

---

### 8. `delete_collection`
Delete a collection

**Parameters:**
- `collectionName` (string, required) - Collection to delete

**Example:**
```json
{
  "collectionName": "old-project"
}
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mcp-servers/rag-mcp
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Test

```bash
npm test
```

### 4. Add to Claude Code

```bash
claude mcp add rag -- node "$(pwd)/build/index.js"
```

### 5. Verify

```bash
claude mcp list
```

---

## 📖 Usage Examples

### Example 1: Index Your Project

```bash
# Start Claude Code
claude

# Index your codebase
> Use rag MCP to index ./src excluding node_modules and build directories

# Response will show indexed files and chunks
```

### Example 2: Semantic Search

```bash
# Search for authentication code
> Use rag MCP semantic_search to find "how does authentication work?"

# Returns relevant code snippets
```

### Example 3: Context-Aware Coding

```bash
# Get context before implementing
> Use rag MCP get_relevant_context for task "implement user profile editing" with 4000 tokens

# Use returned context for implementation
> Now implement user profile editing following the patterns from the context
```

### Example 4: Find Similar Code

```bash
# Find similar implementations
> Use rag MCP find_similar_code for:
> async function getUser(id: string): Promise<User> { return db.users.findOne(id); }

# Returns similar patterns in your codebase
```

---

## 🤖 Use with Sub-Agent

See `examples/agents/rag-coder.md` for a complete sub-agent that uses these tools automatically.

**Usage:**
```bash
claude --agent rag-coder "Implement user logout following our patterns"
```

The agent will:
1. Query RAG for relevant context
2. Use context to guide implementation
3. Follow established patterns
4. Verify against codebase standards

---

## 🔧 Configuration

### ChromaDB Storage

By default, ChromaDB stores data in `./chroma_db` directory.

To change location, set environment variable:
```bash
export CHROMA_DB_PATH="/path/to/storage"
```

### Performance Tuning

**Chunk Size:**
- Smaller (500-1000) = More precise, more chunks
- Larger (2000-3000) = More context per chunk, fewer chunks

**Recommendation:** Start with 1000, adjust based on your codebase

---

## 📊 Benefits

### Elimination of Hallucinations

**Without RAG:**
```
User: "How do we handle authentication?"
AI: "You probably use JWT with Express middleware..." [GUESSING]
```

**With RAG:**
```
User: "How do we handle authentication?"
AI: [Searches codebase, finds auth.ts]
AI: "According to src/auth.ts, you use session-based authentication
     with Redis storage..." [FACTUAL]
```

### Consistent with Codebase Patterns

**Without RAG:**
```
AI: "Let's use a different pattern for this..." [INCONSISTENT]
```

**With RAG:**
```
AI: [Searches similar code]
AI: "Following the pattern from src/user.ts, I'll use..." [CONSISTENT]
```

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- ✅ Index codebase
- ✅ Index single file
- ✅ Semantic search
- ✅ Find similar code
- ✅ Get relevant context
- ✅ List collections
- ✅ Get collection stats

---

## 🎯 Use Cases

### 1. Onboarding New Developers
```bash
# New developer asks
> "How does our error handling work?"

# RAG finds actual implementations
# Returns: ErrorHandler class, error middleware, logging patterns
```

### 2. Maintaining Consistency
```bash
# Before implementing new feature
> Get context for "user management features"

# RAG returns: User model, UserService, user routes, tests
# Implement following same patterns
```

### 3. Refactoring
```bash
# Find all usages
> Find code similar to "getUserById(id)"

# RAG returns all similar patterns across codebase
# Refactor consistently
```

### 4. Documentation
```bash
# Generate docs from actual code
> Search for "API endpoints" and "route handlers"

# RAG returns actual implementations
# Document what actually exists, not assumptions
```

---

## 🔗 Related Resources

- **[Solving AI Coding Problems Guide](../../guides/advanced-patterns/solving-ai-coding-problems.md)** - Complete RAG implementation guide
- **[RAG Coder Agent](../../examples/agents/rag-coder.md)** - Ready-to-use sub-agent
- **[ChromaDB Documentation](https://docs.trychroma.com/)** - Vector database docs

---

## 📦 Technical Details

**Dependencies:**
- `chromadb` - Vector database for embeddings
- `@modelcontextprotocol/sdk` - MCP server framework
- `zod` - Schema validation

**Embedding Model:**
- Uses ChromaDB's default embedding function
- Supports custom embedding models
- GPU acceleration available (optional)

**Storage:**
- Persistent storage in `./chroma_db`
- SQLite backend by default
- Scales to millions of chunks

---

## 🙏 Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude Sonnet 4.5 (Anthropic)
**License:** MIT

---

**Eliminate AI hallucinations. Ground your code in reality.** 🎯
