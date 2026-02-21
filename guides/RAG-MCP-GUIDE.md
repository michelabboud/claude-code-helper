# RAG MCP Guide — Semantic Codebase Search for Claude Code

**Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Architecture Overview](#2-architecture-overview)
3. [Quick Start](#3-quick-start)
4. [Setup with `/rag init`](#4-setup-with-rag-init)
5. [Backend Comparison](#5-backend-comparison)
6. [Installation Methods](#6-installation-methods)
7. [Embedding Options](#7-embedding-options)
8. [Using RAG — All Commands](#8-using-rag--all-commands)
9. [Multi-Repo Support](#9-multi-repo-support)
10. [Auto-Discovery (Two-Layer CLAUDE.md)](#10-auto-discovery-two-layer-claudemd)
11. [Persistence and Data Safety](#11-persistence-and-data-safety)
12. [Configuration Reference](#12-configuration-reference)
13. [The rag-coder Agent](#13-the-rag-coder-agent)
14. [MCP Server Tools Reference](#14-mcp-server-tools-reference)
15. [Troubleshooting](#15-troubleshooting)
16. [Advanced Topics](#16-advanced-topics)

---

## 1. Introduction

### What is RAG?

**Retrieval-Augmented Generation (RAG)** is a technique that gives an AI model access to a searchable knowledge base before generating a response. Instead of relying on its training data alone, Claude Code retrieves semantically relevant code snippets from your actual codebase and uses them as grounded context.

### Why RAG Matters for Coding

**Without RAG**, Claude Code knows general programming patterns but nothing about your specific project. It may hallucinate function names, assume non-existent APIs, or produce code that conflicts with your conventions.

**With RAG**, Claude Code retrieves real code from your project before answering:

- It knows your actual function signatures, not guessed ones
- It reuses your existing patterns instead of inventing new ones
- It avoids breaking changes by understanding your interfaces
- It generates code that fits your coding style

### Semantic Search vs Grep

Traditional `grep` finds exact text matches. Semantic search finds conceptually related code even when the words differ:

| Query | grep finds | RAG finds |
|-------|-----------|-----------|
| "user authentication" | files containing those exact words | login, session, JWT, OAuth, auth middleware |
| "database connection" | literal "database connection" text | pool setup, connect(), db.init(), ORM config |
| "error handling" | files with "error handling" in comments | try/catch blocks, error boundaries, middleware |

RAG understands meaning, not just text.

### The Zero-Hallucination Workflow

```
User: "Add rate limiting to the API"
  ↓
Claude Code retrieves: your existing middleware, route structure, error formats
  ↓
Claude Code generates: rate limiting code that matches YOUR patterns exactly
```

---

## 2. Architecture Overview

The RAG system is composed of four layers that work together seamlessly.

### Components

| Component | Location | Role |
|-----------|----------|------|
| RAG MCP Server | `mcp-servers/rag-mcp/` | Node.js server, exposes 9 tools to Claude Code |
| `/rag` skill | `skills/rag/` | Slash command interface (`/rag index`, `/rag search`, etc.) |
| `rag-coder` agent | `agents/domain-experts/rag-coder.md` | Pre-built agent that auto-uses RAG for coding tasks |
| Vector database | Docker / local | Stores embeddings; Redis, Qdrant, or ChromaDB |
| Embedding model | Local or OpenAI | Converts code into semantic vectors |

### Data Flow

```
User
  |
  | "Find authentication code"
  v
Claude Code
  |
  | invokes /rag skill
  v
RAG MCP Server  (Node.js, mcp-servers/rag-mcp/build/index.js)
  |
  | encodes query → vector
  v
Embedding Model  (local Transformers.js or OpenAI API)
  |
  | similarity search
  v
Vector Database  (Redis / Qdrant / ChromaDB)
  |
  | returns top-k matching code chunks
  v
RAG MCP Server  (formats results)
  |
  | returns context to Claude Code
  v
Claude Code  (generates code grounded in real codebase)
  |
  v
User  (gets accurate, project-specific answer)
```

### File Layout

```
claude-code-helper/
├── mcp-servers/
│   └── rag-mcp/              # MCP server source
│       ├── src/index.ts      # 9 tool definitions
│       ├── build/index.js    # compiled output
│       └── package.json
├── skills/
│   └── rag/                  # /rag slash command
│       ├── SKILL.md          # skill definition
│       └── init.sh           # setup wizard
└── agents/
    └── domain-experts/
        └── rag-coder.md      # RAG-enhanced coding agent
```

---

## 3. Quick Start

The fastest path from zero to working RAG search.

### Prerequisites

- Node.js 18+
- Docker (recommended) or a locally installed vector DB
- Claude Code with MCP support

### Three Steps

```bash
# Step 1: Build the MCP server
cd mcp-servers/rag-mcp
npm install
npm run build

# Step 2: Install the /rag skill
cp -r skills/rag ~/.claude/skills/

# Step 3: Run the interactive setup wizard
# In Claude Code:
/rag init
```

The `/rag init` wizard handles everything else: backend selection, Docker setup, MCP registration, and initial indexing.

### Verify It Works

```bash
# In Claude Code, after /rag init completes:
/rag collections          # should list your project
/rag search "main entry"  # should return matching code
```

---

## 4. Setup with `/rag init`

The `/rag init` command runs a 10-step interactive wizard that configures the complete RAG system. You only need to run it once per machine.

### Step-by-Step Walkthrough

**Step 1 — Backend Choice**
The wizard presents three options with performance and complexity tradeoffs. It recommends Redis for most users.

**Step 2 — Installation Method**
For each backend, you choose Docker (recommended, isolated) or local native install. Docker is preferred because it handles dependencies, versions, and restart policies automatically.

**Step 3 — Docker or Native Installation**
The wizard runs the appropriate installation command. For Docker, it pulls the image and starts the container with a persistent volume. For native, it provides the package manager command for your OS.

**Step 4 — Verification**
The wizard pings the backend to confirm it is running and reachable. If the ping fails, it offers troubleshooting suggestions.

**Step 5 — Embedding Model Selection**
Choose between local (Transformers.js, free, private) or OpenAI (higher quality, requires API key). Local is the default.

**Step 6 — MCP Server Registration**
The wizard writes the MCP server configuration to `~/.claude/mcp.json` (or the appropriate Claude Code config file), making the RAG tools available to Claude Code automatically.

**Step 7 — Configuration Persistence**
All settings are written to `~/.claude/rag-config.json`. This file is read by the MCP server at startup, so the same configuration is used in every session.

**Step 8 — Global CLAUDE.md Hint**
The wizard appends a `## RAG MCP` section to `~/.claude/CLAUDE.md`. This tells Claude Code that RAG tools are available and how to use them. Without this hint, Claude Code does not know the tools exist.

**Step 9 — Optional Initial Index**
Optionally index the current project immediately. The wizard runs `/rag index` on the current directory. Indexing a medium-sized project (10,000 files) takes 2-5 minutes on first run (embedding model downloads ~90 MB).

**Step 10 — Summary**
The wizard prints a summary of all configuration choices and the next steps. It shows the exact `/rag` commands to use.

### Re-Running Init

Running `/rag init` again is safe. It detects existing configuration and asks whether to overwrite or keep each setting.

---

## 5. Backend Comparison

Choose the backend that matches your use case. All three backends support the same RAG feature set; the differences are in performance, operational complexity, and memory usage.

### Comparison Table

| Criteria | Redis | Qdrant | ChromaDB |
|----------|-------|--------|----------|
| Query latency (p50) | ~4 ms | ~19 ms | ~20 ms |
| Purpose-built for vectors | No (module) | Yes | Yes |
| Advanced filtering | Limited | Yes | Basic |
| Docker image size | ~35 MB | ~90 MB | ~200 MB |
| Memory usage (idle) | ~50 MB | ~80 MB | ~120 MB |
| Persistence | AOF + RDB | Disk (WAL) | Disk |
| Recommended for | Most users | Large codebases | Experiments |
| Setup complexity | Low | Medium | Lowest |
| Multi-collection support | Yes | Yes | Yes |
| Production-ready | Yes (mature) | Yes | Limited |

### Redis

Redis with the RedisSearch module (Redis Stack) stores vectors in memory with optional AOF and RDB persistence. It offers the lowest query latency because all data is in RAM. Redis is the recommended choice for most users because it is mature, well-documented, and easy to operate.

**Best for**: Teams that want fast queries, already use Redis, or want maximum reliability.

**Limitation**: Memory usage grows linearly with codebase size. A large monorepo (500K+ vectors) may require significant RAM.

### Qdrant

Qdrant is purpose-built for vector search. It stores data on disk with a write-ahead log, so it uses less RAM than Redis. It supports advanced payload filtering, allowing queries like "find authentication code only in the `src/api/` directory."

**Best for**: Large codebases, projects that need filtered search, or when RAM is constrained.

**Limitation**: Higher query latency than Redis (~19 ms vs ~4 ms). The Docker image is larger.

### ChromaDB

ChromaDB is the simplest backend to set up. It includes built-in embedding models and requires minimal configuration. It is well-suited for evaluation and experimentation.

**Best for**: Trying out RAG for the first time, simple projects, single-user environments.

**Limitation**: Not recommended for production use. Performance degrades with large collections. Limited filtering support.

### Benchmark Results

These results were measured on a 2,000-file Python project (87,000 vectors) on an Intel Core i7 with 32 GB RAM:

```
Backend    Index time   Search (p50)   Search (p95)
Redis      142 s        4 ms           8 ms
Qdrant     167 s        19 ms          31 ms
ChromaDB   189 s        20 ms          38 ms
```

---

## 6. Installation Methods

### Redis

**Docker (recommended)**

```bash
docker run -d \
  --name redis-rag \
  --restart unless-stopped \
  -p 6379:6379 \
  -v ~/.claude/rag-data/redis:/data \
  redis/redis-stack:latest
```

Verify:

```bash
docker exec redis-rag redis-cli ping
# Expected output: PONG
```

**Linux (native)**

```bash
# Ubuntu / Debian
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
sudo apt update && sudo apt install -y redis-stack-server
sudo systemctl enable --now redis-stack-server
```

**macOS (native)**

```bash
brew install redis-stack
brew services start redis-stack
```

### Qdrant

**Docker (recommended)**

```bash
docker run -d \
  --name qdrant-rag \
  --restart unless-stopped \
  -p 6333:6333 \
  -v ~/.claude/rag-data/qdrant:/qdrant/storage \
  qdrant/qdrant:latest
```

Verify:

```bash
curl http://localhost:6333/health
# Expected: {"status":"ok"}
```

**Linux (native)**

```bash
curl -L https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz | tar xz
sudo mv qdrant /usr/local/bin/
qdrant --uri http://localhost:6333
```

**macOS (native)**

```bash
brew install qdrant
qdrant
```

### ChromaDB

**Docker (recommended)**

```bash
docker run -d \
  --name chromadb-rag \
  --restart unless-stopped \
  -p 8000:8000 \
  -v ~/.claude/rag-data/chroma:/chroma/chroma \
  chromadb/chroma:latest
```

Verify:

```bash
curl http://localhost:8000/api/v1/heartbeat
# Expected: {"nanosecond heartbeat": ...}
```

**Python (native)**

```bash
pip install chromadb
chroma run --path ~/.claude/rag-data/chroma --port 8000
```

---

## 7. Embedding Options

Embeddings are numerical representations of code that capture semantic meaning. The quality and speed of your embeddings directly affect RAG search quality.

### Local Embeddings (Transformers.js)

The default option. The MCP server runs the embedding model in-process using Transformers.js (a JavaScript port of HuggingFace Transformers).

| Property | Value |
|----------|-------|
| Model | all-MiniLM-L6-v2 |
| Dimensions | 384 |
| Model size | ~90 MB (standard) or ~23 MB (quantized) |
| Cost | Free |
| Privacy | All data stays local |
| First-run | Downloads model on first indexing (~90 MB) |
| Subsequent runs | Instant (model cached locally) |
| Quality | Good for code search |

**Configuration in `~/.claude/rag-config.json`:**

```json
{
  "embedding": {
    "provider": "local",
    "model": "Xenova/all-MiniLM-L6-v2"
  }
}
```

**Quantized model** (lower memory, slightly lower quality):

```json
{
  "embedding": {
    "provider": "local",
    "model": "Xenova/all-MiniLM-L6-v2",
    "quantized": true
  }
}
```

### OpenAI Embeddings

Higher quality embeddings, especially for natural language queries about code.

| Property | Value |
|----------|-------|
| Model | text-embedding-3-small |
| Dimensions | 1536 |
| Cost | $0.00002 per 1K tokens |
| Privacy | Code is sent to OpenAI |
| Indexing 10K files | ~$0.10-0.50 |
| Quality | Excellent |

**Configuration:**

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small",
    "apiKey": "sk-..."
  }
}
```

Set the API key via environment variable to avoid storing it in the config file:

```bash
export OPENAI_API_KEY=sk-...
```

Then in config:

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small"
  }
}
```

### Model Selection Guide

- **Free, private, good quality** → local (default)
- **Low-memory system** → local + quantized
- **Best search quality** → OpenAI
- **Air-gapped environment** → local only

---

## 8. Using RAG — All Commands

All RAG commands use the `/rag` prefix in Claude Code.

### `/rag index`

Index the current project into the vector database.

```bash
/rag index
```

Index a specific directory:

```bash
/rag index /path/to/project
```

Index with a custom collection name:

```bash
/rag index --collection my-api-service
```

What happens: The MCP server scans source files, splits them into chunks (~500 tokens each), generates embeddings, and stores them in the vector database. A per-project `.claude/CLAUDE.md` hint is written automatically.

**Supported file types by default**: `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.rs`, `.java`, `.rb`, `.php`, `.cs`, `.cpp`, `.c`, `.h`, `.md`, `.json`, `.yaml`, `.toml`

Re-indexing is incremental: unchanged files are skipped.

### `/rag search`

Semantic search across the indexed codebase.

```bash
/rag search "user authentication middleware"
/rag search "database connection pooling"
/rag search "error handling patterns"
```

Returns the top 5 most semantically similar code chunks with file paths and line numbers.

Adjust result count:

```bash
/rag search "rate limiting" --limit 10
```

### `/rag similar`

Find code similar to a given snippet. Useful for finding duplicates or related implementations.

```bash
/rag similar "async function fetchUser(id: string)"
/rag similar "SELECT * FROM users WHERE id = ?"
```

### `/rag context`

Get relevant context for a coding task. This is the primary command used by the `rag-coder` agent.

```bash
/rag context "add OAuth2 login to the API"
/rag context "implement retry logic for HTTP requests"
/rag context "refactor the payment service"
```

Returns a curated set of related files, functions, and patterns that provide grounding for the requested task.

### `/rag collections`

List all indexed collections (one per project).

```bash
/rag collections
```

Example output:

```
Collections:
  - claude-code-helper (87,432 vectors, indexed 2026-02-20)
  - my-api-service (23,100 vectors, indexed 2026-02-18)
  - frontend-app (44,200 vectors, indexed 2026-02-15)
```

### `/rag stats`

Show detailed statistics for a collection.

```bash
/rag stats claude-code-helper
```

Example output:

```
Collection: claude-code-helper
  Vectors: 87,432
  Files indexed: 1,247
  Embedding model: all-MiniLM-L6-v2
  Backend: Redis
  Last indexed: 2026-02-20 14:32:11
  Index size: 128 MB
```

### `/rag delete`

Delete a collection permanently.

```bash
/rag delete old-project-name
```

This removes all vectors for that collection. The source code is not affected.

### `/rag config`

View current RAG configuration.

```bash
/rag config
```

Switch to a different backend:

```bash
/rag config redis
/rag config qdrant
/rag config chromadb
```

Switching backends requires re-indexing your collections on the new backend.

### `/rag init`

Run the full setup wizard. See [Section 4](#4-setup-with-rag-init) for details.

```bash
/rag init
```

---

## 9. Multi-Repo Support

A single vector database instance serves all your projects simultaneously. Each project gets its own isolated collection.

### How Collections Work

When you run `/rag index` in a project directory, the MCP server:

1. Derives a collection name from the directory name (e.g., `my-api-service`)
2. Indexes all source files into that collection
3. Writes a `.claude/CLAUDE.md` hint in that project directory

Collections are fully isolated:

- Indexing project A never affects project B
- Searching in project A only returns results from project A
- You can delete one collection without affecting others

### Working Across Projects

```bash
# In project A
cd ~/projects/my-api-service
/rag index
/rag search "authentication"   # searches only my-api-service

# In project B
cd ~/projects/frontend-app
/rag index
/rag search "authentication"   # searches only frontend-app

# List all indexed projects
/rag collections
```

### Cross-Project Search

To search across multiple projects, specify the collection explicitly:

```bash
/rag search "rate limiting" --collection my-api-service
/rag search "rate limiting" --collection frontend-app
```

### Collection Naming

The default collection name is derived from the directory name with special characters replaced by hyphens. Override it:

```bash
/rag index --collection production-api-v2
```

---

## 10. Auto-Discovery (Two-Layer CLAUDE.md)

Claude Code does not automatically know that RAG tools exist. The two-layer CLAUDE.md system solves this by injecting awareness into every session.

### Layer 1 — Global Hint

`/rag init` appends a `## RAG MCP` section to `~/.claude/CLAUDE.md`:

```markdown
## RAG MCP

A semantic code search system is available via MCP tools. Use these tools
to retrieve relevant code context before generating code:

- `semantic_search` — search the indexed codebase by meaning
- `get_relevant_context` — get context for a specific coding task
- `find_similar_code` — find code similar to a snippet
- `list_collections` — show all indexed projects

Always use RAG context before writing code that touches existing functionality.
Backend: Redis | Embedding: local (all-MiniLM-L6-v2)
```

This hint is loaded in every Claude Code session on this machine, for every project.

### Layer 2 — Per-Project Hint

`/rag index` writes a `## RAG Index` section to `.claude/CLAUDE.md` in the project directory:

```markdown
## RAG Index

This project is indexed in the RAG system.
Collection name: my-api-service
Vectors: 23,100 | Files: 312 | Last indexed: 2026-02-20

Before generating code that touches existing functionality:
1. Run semantic_search to find related code
2. Run get_relevant_context to understand patterns
3. Use the retrieved context to ground your implementation
```

This hint is project-specific and tells Claude Code exactly which collection to query.

### Why Both Layers Are Needed

| Layer | Purpose |
|-------|---------|
| Global (`~/.claude/CLAUDE.md`) | Tells Claude Code the RAG system exists and how to use it |
| Per-project (`.claude/CLAUDE.md`) | Tells Claude Code which collection belongs to this project |

Without the global layer, Claude Code does not know to call the RAG MCP tools. Without the per-project layer, Claude Code does not know the collection name.

---

## 11. Persistence and Data Safety

### How Data is Stored

All vector data is stored on disk, not in memory (except Redis which stores in memory with disk backup).

**Default data directory**: `~/.claude/rag-data/`

```
~/.claude/rag-data/
├── redis/        # Redis AOF + RDB files
├── qdrant/       # Qdrant WAL + segment files
└── chroma/       # ChromaDB SQLite + HNSW index
```

### Redis Persistence

Redis Stack uses two persistence mechanisms:

- **AOF (Append-Only File)**: Every write is logged. Full recovery on restart.
- **RDB (Snapshot)**: Periodic full snapshots. Faster startup.

Both are enabled by default in the Docker configuration. Data survives container restarts.

### Docker Container Restart

If Docker is not set to start automatically, your vector database will not be running after a system reboot. Fix this with the `--restart unless-stopped` flag (included in all Docker commands in this guide).

Check that containers are running:

```bash
docker ps | grep rag
```

Restart a stopped container:

```bash
docker start redis-rag      # or qdrant-rag or chromadb-rag
```

### Moving to a New Machine

1. Copy the data directory:

```bash
rsync -av ~/.claude/rag-data/ new-machine:~/.claude/rag-data/
rsync -av ~/.claude/rag-config.json new-machine:~/.claude/
```

2. On the new machine, start the Docker container pointing to the copied data directory.

3. Run `/rag init` on the new machine to register the MCP server. Skip the indexing step since data was copied.

### Re-Indexing

If data is lost or corrupted, re-index from source:

```bash
cd ~/projects/my-project
/rag index
```

Re-indexing is the only recovery path if the vector data is unrecoverable. Source code is never modified by RAG.

---

## 12. Configuration Reference

All RAG configuration is stored in `~/.claude/rag-config.json`.

### Full Schema

```json
{
  "backend": "redis",
  "backends": {
    "redis": {
      "host": "localhost",
      "port": 6379,
      "password": null
    },
    "qdrant": {
      "host": "localhost",
      "port": 6333
    },
    "chromadb": {
      "host": "localhost",
      "port": 8000
    }
  },
  "embedding": {
    "provider": "local",
    "model": "Xenova/all-MiniLM-L6-v2",
    "quantized": false,
    "apiKey": null
  },
  "indexing": {
    "chunkSize": 500,
    "chunkOverlap": 50,
    "filePatterns": [
      "**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx",
      "**/*.py", "**/*.go", "**/*.rs", "**/*.java",
      "**/*.rb", "**/*.php", "**/*.cs", "**/*.cpp",
      "**/*.c", "**/*.h", "**/*.md", "**/*.json",
      "**/*.yaml", "**/*.toml"
    ],
    "excludePatterns": [
      "**/node_modules/**", "**/.git/**",
      "**/dist/**", "**/build/**", "**/__pycache__/**",
      "**/*.min.js", "**/*.lock"
    ]
  },
  "search": {
    "defaultLimit": 5,
    "minScore": 0.7
  }
}
```

### Field Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `backend` | string | `"redis"` | Active backend: `redis`, `qdrant`, or `chromadb` |
| `backends.redis.host` | string | `"localhost"` | Redis host |
| `backends.redis.port` | number | `6379` | Redis port |
| `backends.redis.password` | string/null | `null` | Redis password (if auth enabled) |
| `backends.qdrant.host` | string | `"localhost"` | Qdrant host |
| `backends.qdrant.port` | number | `6333` | Qdrant HTTP port |
| `backends.chromadb.host` | string | `"localhost"` | ChromaDB host |
| `backends.chromadb.port` | number | `8000` | ChromaDB port |
| `embedding.provider` | string | `"local"` | `local` or `openai` |
| `embedding.model` | string | see above | Model identifier |
| `embedding.quantized` | boolean | `false` | Use quantized model (smaller, faster) |
| `embedding.apiKey` | string/null | `null` | OpenAI API key (or use env var) |
| `indexing.chunkSize` | number | `500` | Tokens per chunk |
| `indexing.chunkOverlap` | number | `50` | Token overlap between chunks |
| `indexing.filePatterns` | string[] | see above | Glob patterns for files to index |
| `indexing.excludePatterns` | string[] | see above | Glob patterns for files to exclude |
| `search.defaultLimit` | number | `5` | Default number of results |
| `search.minScore` | number | `0.7` | Minimum similarity score (0-1) |

---

## 13. The rag-coder Agent

The `rag-coder` agent is a pre-built Claude Code agent that automatically retrieves RAG context before generating any code. It implements the zero-hallucination coding workflow.

### Location

```
agents/domain-experts/rag-coder.md
```

Install to `~/.claude/agents/`:

```bash
cp agents/domain-experts/rag-coder.md ~/.claude/agents/
```

### How It Works

When you ask `rag-coder` to implement something, it follows this workflow automatically:

1. **Context retrieval** — calls `get_relevant_context` with the task description
2. **Pattern analysis** — examines the retrieved code for conventions and patterns
3. **Similar code search** — calls `find_similar_code` to find existing implementations
4. **Grounded implementation** — generates code that matches your project's actual patterns
5. **Self-verification** — checks that generated code uses real function names from retrieved context

### Triggering the Agent

Claude Code auto-selects `rag-coder` when you describe a coding task:

```
"Implement a rate limiter for the API endpoints"
"Add password reset functionality to the auth service"
"Refactor the payment service to use the new SDK"
```

Or explicitly invoke it:

```
Use rag-coder to implement retry logic for the HTTP client
```

### What Makes It Different

A standard Claude Code session may generate plausible-looking but incorrect code. `rag-coder` always verifies against your actual codebase:

- Function names come from your code, not hallucinations
- Import paths match your project structure
- Error handling follows your existing patterns
- Variable naming conventions are consistent

---

## 14. MCP Server Tools Reference

The RAG MCP server exposes 9 tools to Claude Code.

| Tool | Description |
|------|-------------|
| `index_codebase` | Index an entire project directory into a named collection |
| `index_file` | Index a single file (useful for incremental updates) |
| `semantic_search` | Search the codebase by semantic meaning |
| `find_similar_code` | Find code similar to a given snippet |
| `get_relevant_context` | Get curated context for a specific coding task |
| `list_collections` | List all indexed collections with metadata |
| `get_collection_stats` | Get detailed stats for a specific collection |
| `delete_collection` | Permanently delete a collection and all its vectors |
| `hello` | Health check and capability discovery (Hello Protocol) |

### Hello Protocol

The RAG MCP server implements the Hello Protocol for tool discovery:

```
hello {}
```

Returns server status, available tools, current configuration, and backend health.

```
hello {"verbose": true}
```

Returns the full tool reference with parameter schemas.

---

## 15. Troubleshooting

### "Socket already opened" Error

**Symptom**: Claude Code reports "Socket already opened" when starting.

**Cause**: A race condition where the MCP server tries to connect to the vector database before it is ready.

**Fix**:
1. Ensure the vector database container is running: `docker ps | grep rag`
2. Restart Claude Code (the MCP server reconnects on startup)
3. If the problem persists, increase the connection timeout in `~/.claude/rag-config.json`:

```json
{
  "backends": {
    "redis": {
      "connectTimeout": 5000
    }
  }
}
```

### "No such tool available" Error

**Symptom**: Claude Code cannot find `semantic_search` or other RAG tools.

**Cause**: Either the backend is not running or the MCP server failed to start.

**Diagnosis**:
```bash
# Check if the backend is running
docker ps | grep rag

# Check MCP server can start manually
node ~/.claude/mcp-servers/rag-mcp/build/index.js
```

**Fix**:
1. Start the backend: `docker start redis-rag`
2. Verify MCP registration in Claude Code settings
3. Run `/rag init` again to re-register the MCP server

### ChromaDB Connection Error

**Symptom**: `semantic_search` returns "Connection refused" when using ChromaDB.

**Cause**: The configured backend does not match the running backend.

**Fix**:
```bash
# Check what is actually running
docker ps

# Update the config to match
/rag config chromadb   # or redis, or qdrant
```

### Slow First Indexing

**Symptom**: `/rag index` takes several minutes before producing any output.

**Cause**: The embedding model is downloading on first use. The `all-MiniLM-L6-v2` model is ~90 MB.

**Fix**: Wait for the download to complete. Progress is shown in the Claude Code terminal. Subsequent indexing runs start immediately because the model is cached locally (typically in `~/.cache/huggingface/`).

To use the quantized model (23 MB, faster download):

```json
{
  "embedding": {
    "quantized": true
  }
}
```

### Docker Volume Permissions

**Symptom**: Docker container starts but cannot write to the data directory.

**Fix**:
```bash
# Fix ownership of the data directory
sudo chown -R $USER:$USER ~/.claude/rag-data/

# Or run the container with your user's UID
docker run -d \
  --name redis-rag \
  --user $(id -u):$(id -g) \
  -v ~/.claude/rag-data/redis:/data \
  redis/redis-stack:latest
```

### Search Returns No Results

**Symptom**: `/rag search` returns 0 results even for known code.

**Cause**: Collection not indexed, wrong collection selected, or similarity threshold too high.

**Fix**:
```bash
# Verify the collection exists and has vectors
/rag collections
/rag stats my-project

# Lower the similarity threshold temporarily
# In ~/.claude/rag-config.json:
# "search": { "minScore": 0.5 }

# Re-index if the collection is empty
/rag index
```

---

## 16. Advanced Topics

### Switching Backends Without Losing Data

If you want to switch from ChromaDB to Redis, you must re-index because vector data is stored in the backend's native format and is not portable between backends.

**Migration procedure**:

1. Start the new backend (Redis in this example)
2. Switch the active backend: `/rag config redis`
3. Re-index all projects:

```bash
for dir in ~/projects/*/; do
  cd "$dir"
  /rag index 2>/dev/null && echo "Indexed $dir" || echo "Skipped $dir (not a RAG project)"
done
```

4. Verify all collections: `/rag collections`

### Custom File Patterns for Indexing

By default, RAG indexes common source file types. To add or remove patterns, edit `~/.claude/rag-config.json`:

```json
{
  "indexing": {
    "filePatterns": [
      "**/*.ts",
      "**/*.tsx",
      "**/*.graphql",
      "**/*.prisma",
      "**/Dockerfile",
      "**/*.sh"
    ],
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/*.test.ts",
      "**/*.spec.ts"
    ]
  }
}
```

Excluding test files can significantly reduce index size without affecting search quality for implementation code.

### OpenAI Embeddings Setup

For the best search quality, use OpenAI embeddings:

1. Obtain an API key from https://platform.openai.com
2. Update `~/.claude/rag-config.json`:

```json
{
  "embedding": {
    "provider": "openai",
    "model": "text-embedding-3-small"
  }
}
```

3. Set the environment variable:

```bash
export OPENAI_API_KEY=sk-...
# Add to ~/.bashrc or ~/.zshrc for persistence
```

4. Re-index your projects (required because the embedding dimensions change from 384 to 1536):

```bash
/rag delete my-project
/rag index
```

Note: Existing local embeddings are incompatible with OpenAI embeddings. You must delete and re-index when switching providers.

### Quantized Model for Low-Memory Systems

On systems with less than 8 GB RAM, or when running many Docker containers simultaneously, the quantized embedding model uses significantly less memory:

```json
{
  "embedding": {
    "provider": "local",
    "model": "Xenova/all-MiniLM-L6-v2",
    "quantized": true
  }
}
```

| Model variant | Download size | RAM usage | Quality |
|---------------|--------------|-----------|---------|
| Standard | ~90 MB | ~150 MB | Good |
| Quantized | ~23 MB | ~40 MB | Slightly lower |

Re-index after switching model variants because the vector representations change.

### Automating Index Updates

To keep the RAG index fresh as your codebase evolves, add a git post-commit hook:

```bash
# .git/hooks/post-commit
#!/bin/bash
# Re-index changed files after each commit
changed_files=$(git diff-tree --no-commit-id -r --name-only HEAD)
for file in $changed_files; do
  if [ -f "$file" ]; then
    # The MCP server handles incremental updates via index_file
    echo "RAG: queuing $file for re-indexing"
  fi
done
```

Full automation requires calling the MCP server directly via the Claude Code SDK. A simpler approach is to run `/rag index` at the start of each work session, which skips unchanged files automatically.

---

*Documentation maintained by Michel Abboud. For issues and discussions, see the [GitHub repository](https://github.com/michelabboud/claude-code-helper/issues).*
