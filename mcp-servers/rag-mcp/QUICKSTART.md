# RAG MCP Server - Quick Start Guide

Get up and running with semantic codebase search in 5 minutes.

---

## ⚡ 5-Minute Setup

### Step 1: Install (30 seconds)

```bash
cd mcp-servers/rag-mcp
npm install
npm run build
```

### Step 2: Add to Claude Code (30 seconds)

```bash
claude mcp add rag -- node "$(pwd)/build/index.js"
```

### Step 3: Verify (15 seconds)

```bash
claude mcp list
```

You should see:
```
rag: node /path/to/rag-mcp/build/index.js
```

### Step 4: Index Your Codebase (2 minutes)

```bash
# Start Claude
claude

# Index your project
> Index my codebase at ./src using the rag MCP server,
> exclude node_modules and build directories
```

### Step 5: Test Search (1 minute)

```bash
> Search for "authentication" using rag MCP semantic_search
```

**Done! You're now using RAG for context-aware coding.** 🎉

---

## 🎯 Common Use Cases

### Use Case 1: Understanding Code

**Question:** "How does our authentication work?"

```bash
claude

> Use rag to search for authentication code and explain how it works
```

**Result:** AI finds actual auth code and explains YOUR implementation, not generic patterns.

---

### Use Case 2: Implementing Features

**Task:** Add user profile editing

```bash
claude

> Get relevant context for "user profile features" using rag,
> then implement profile editing following our patterns
```

**Result:** AI retrieves similar features (user creation, user viewing) and implements consistently.

---

### Use Case 3: Finding Patterns

**Question:** "Show me all API endpoints"

```bash
claude

> Find code similar to "app.get('/api/" using rag
```

**Result:** All API route definitions found semantically.

---

## 🚀 Production Setup

### 1. Index Multiple Projects

```bash
# Project 1
> Use rag to index ./frontend as collection "frontend"

# Project 2
> Use rag to index ./backend as collection "backend"

# Project 3
> Use rag to index ./shared as collection "shared"
```

### 2. Query Specific Projects

```bash
# Search only frontend
> Semantic search "button components" in collection "frontend"

# Search only backend
> Semantic search "database queries" in collection "backend"
```

### 3. Maintain Indices

```bash
# Update after major changes
> Delete collection "backend" and re-index ./backend

# Add new files
> Index file ./src/new-feature.ts to collection "backend"
```

---

## 🤖 Use with Sub-Agent

### Create RAG Coder Agent

```bash
cat > ~/.claude/agents/rag-coder.md << 'EOF'
---
name: rag-coder
description: Context-aware coder that grounds all code generation in actual codebase using RAG
tools:
  - mcp__rag__index_codebase
  - mcp__rag__semantic_search
  - mcp__rag__get_relevant_context
  - mcp__rag__find_similar_code
  - Read
  - Write
  - Edit
  - Bash
model: sonnet
---

# RAG-Enhanced Coder

You are a context-aware coding assistant that ALWAYS grounds responses in the actual codebase.

## Workflow

1. **Before ANY coding task:**
   - Use `get_relevant_context` to retrieve relevant code
   - Understand existing patterns
   - Never assume or guess

2. **When implementing:**
   - Follow patterns from retrieved context
   - Maintain consistency with codebase
   - Reference actual files

3. **When explaining:**
   - Search for actual implementations
   - Explain WHAT EXISTS, not what might exist
   - Provide file paths and line references

4. **Never hallucinate:**
   - If RAG returns no results, say "I don't see..."
   - Don't invent APIs, functions, or patterns
   - Ground every statement in retrieved context

## Example Usage

**User:** "Add logout functionality"

**You do:**
1. `get_relevant_context("authentication and session management")`
2. Review returned context
3. Implement logout following the SAME patterns
4. Verify against codebase standards

**Never do:**
- Assume logout API exists
- Invent session handling
- Use generic patterns that don't match the codebase
EOF
```

### Use the Agent

```bash
claude --agent rag-coder "Implement user profile editing"
```

Agent will:
1. ✅ Retrieve relevant context automatically
2. ✅ Follow your codebase patterns
3. ✅ Never hallucinate
4. ✅ Maintain consistency

---

## 📊 Performance Tips

### Optimize Indexing

```bash
# Index only specific file types
> Index ./src with patterns ["*.ts", "*.tsx"] excluding ["**/*.test.ts", "node_modules/**"]

# Use appropriate chunk size
# Small files (configs): chunkSize 500
# Large files (implementations): chunkSize 1500
```

### Optimize Search

```bash
# Request only what you need
> Semantic search with nResults 3  # Fast, focused

# Use filters for large codebases
> Search with filter { "category": "api" }
```

### Manage Storage

```bash
# Check collection sizes
> Get stats for collection "backend"

# Clean up old collections
> Delete collection "old-project"

# List all collections
> List all rag collections
```

---

## 🐛 Troubleshooting

### Issue: "Collection not found"

**Solution:** Index your codebase first

```bash
> Index codebase at ./src as collection "codebase"
```

---

### Issue: "No results found"

**Possible causes:**
1. Query too specific - broaden it
2. Code not indexed - verify with `get_collection_stats`
3. Wrong collection - use `list_collections` to check

**Solution:**
```bash
# Check what's indexed
> List all rag collections

# Verify specific collection
> Get stats for collection "codebase"

# Try broader query
> Search for "user" instead of "UserProfileEditingService"
```

---

### Issue: Results not relevant

**Solution:** Adjust query or chunk size

```bash
# Be more specific
> Search for "user authentication" not just "user"

# Or re-index with different chunk size
> Delete collection "codebase"
> Index with chunkSize 1500
```

---

## 📈 Measuring Success

### Before RAG (Typical AI Coding)
- ❌ AI invents APIs that don't exist
- ❌ Code doesn't match your patterns
- ❌ Debugging reveals hallucinations
- ❌ Manual correction needed

### After RAG (Grounded Coding)
- ✅ AI uses ACTUAL APIs from your code
- ✅ Perfect pattern consistency
- ✅ No hallucinations
- ✅ Code works first try

---

## 🎓 Next Steps

1. **Read the full guide:**
   ```bash
   cat guides/advanced-patterns/solving-ai-coding-problems.md
   ```

2. **Set up automation:**
   - Create hook to auto-index on git commits
   - Schedule nightly re-indexing
   - Monitor collection sizes

3. **Advanced patterns:**
   - Multi-collection strategies
   - Custom embedding models
   - Integration with CI/CD

---

## 💡 Pro Tips

### Tip 1: Index After Major Changes

```bash
# Before a coding session
> Re-index ./src to refresh the index with latest changes
```

### Tip 2: Use Specific Collections

```bash
# Separate concerns
frontend/  → collection "frontend"
backend/   → collection "backend"
shared/    → collection "shared"
```

### Tip 3: Combine with Other Tools

```bash
# RAG + Quality Gates
> Get context for "user API", implement following patterns,
> then use code-review MCP to validate
```

### Tip 4: Document with RAG

```bash
# Generate accurate docs
> Search for all "export function" and "export class",
> then generate API documentation
```

---

## 🔗 Resources

- **[Full README](./README.md)** - Complete documentation
- **[Solving AI Coding Problems](../../guides/advanced-patterns/solving-ai-coding-problems.md)** - Complete guide
- **[ChromaDB Docs](https://docs.trychroma.com/)** - Vector database

---

**Start grounding your AI in reality today!** 🚀

**Questions?** Check the [full README](./README.md) or [troubleshooting guide](../../guides/advanced-patterns/solving-ai-coding-problems.md#troubleshooting).
