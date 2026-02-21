---
name: RAG
version: 1.1.0
description: Manage the RAG MCP server — index codebases, search semantically, configure backends (ChromaDB/Redis/Qdrant)
author: Michel Abboud
repository: https://github.com/michelabboud/claude-code-helper
license: Apache-2.0
tags: [rag, search, indexing, semantic, codebase, redis, qdrant, chromadb, vector]
allowed-tools: ["mcp__rag__index_codebase", "mcp__rag__index_file", "mcp__rag__list_collections", "mcp__rag__get_collection_stats", "mcp__rag__semantic_search", "mcp__rag__find_similar_code", "mcp__rag__get_relevant_context", "mcp__rag__delete_collection", "mcp__rag__hello", "Bash", "Read", "Write", "Edit"]
---

# RAG — Semantic Codebase Search & Configuration

Unified interface for the RAG MCP server. Index codebases, search semantically, find similar code, and configure the vector database backend.

## Usage

```
/rag index [path]          → Index the current directory (or a specific path)
/rag search <query>        → Semantic search across indexed code
/rag similar <snippet>     → Find code similar to a snippet
/rag context <task>        → Get relevant context for a task
/rag collections           → List all indexed collections
/rag stats <collection>    → Show stats for a collection
/rag delete <collection>   → Delete a collection
/rag config                → Show current RAG configuration
/rag config <backend>      → Configure backend (chromadb|redis|qdrant)
/rag hello                 → Quick greeting
/rag hello ID              → Full profile
```

## Persistent Configuration

**Config file**: `~/.claude/rag-config.json`

This file is the **single source of truth** for RAG settings. It persists across sessions.

**On every invocation of `/rag`**, read `~/.claude/rag-config.json` first. If it exists, use its values as the current configuration context. If it does not exist, assume defaults:

```json
{
  "backend": "chromadb",
  "host": "localhost",
  "port": 8000,
  "embeddingType": "local",
  "modelVariant": "default",
  "defaultCollection": "codebase",
  "persistence": {
    "enabled": false,
    "mode": "none",
    "dataDir": null
  },
  "updatedAt": null
}
```

When any config-changing action occurs (`config <backend>`, `index`, `delete`), update `~/.claude/rag-config.json` to reflect the new state. For example:
- After `index /path/to/foo` → set `"defaultCollection": "foo"` and add `"foo"` to a `"collections"` array
- After `config redis` → set `"backend": "redis"`, `"port": 6379`, `"updatedAt": "<now>"`
- After `delete <name>` → remove from `"collections"` array

The config file schema:
```json
{
  "backend": "chromadb | redis | qdrant",
  "host": "localhost",
  "port": 8000,
  "embeddingType": "local | openai",
  "modelVariant": "default | quantized",
  "defaultCollection": "codebase",
  "collections": ["codebase", "my-project"],
  "persistence": {
    "enabled": true,
    "mode": "aof | rdb | both | none",
    "dataDir": "~/.claude/rag-data"
  },
  "updatedAt": "2026-02-21T10:30:00Z"
}
```

## Data Persistence

**Indexed data persists across Claude Code sessions.** When using Redis or Qdrant, the vector database runs as a separate process and retains all indexed collections between sessions. You don't need to re-index every time.

**Persistence directory**: `~/.claude/rag-data/`

This directory stores persistent vector data. When using Docker, mount it as a volume so data survives container restarts.

### Persistence by backend:

**Redis** (recommended for persistence):
- Data persists as long as the Redis server is running
- For durable persistence across Redis restarts, use AOF or RDB:
  - `aof` — Append-Only File, every write is logged, most durable
  - `rdb` — Periodic snapshots, good balance of performance and safety
  - `both` — AOF + RDB combined (safest)
- Docker with persistent volume:
  ```bash
  docker run -d -p 6379:6379 \
    -v ~/.claude/rag-data:/data \
    redis/redis-stack-server \
    --appendonly yes
  ```

**Qdrant**:
- Persists to disk by default in its storage directory
- Docker with persistent volume:
  ```bash
  docker run -d -p 6333:6333 \
    -v ~/.claude/rag-data/qdrant:/qdrant/storage \
    qdrant/qdrant
  ```

**ChromaDB**:
- Persists to disk by default in its data directory
- Docker with persistent volume:
  ```bash
  docker run -d -p 8000:8000 \
    -v ~/.claude/rag-data/chroma:/chroma/chroma \
    chromadb/chroma
  ```

### What this means in practice:
1. **First time**: Run `/rag index` — takes time to index the full codebase
2. **Next sessions**: Data is already there — just `/rag search` immediately
3. **After code changes**: Run `/rag index` again to re-index (overwrites existing collection)
4. **If Docker restarts**: Data survives if you used the `-v` volume mount above

## Auto-Discovery via CLAUDE.md

After a successful `/rag index`, the skill **automatically injects a hint** into the project's `.claude/CLAUDE.md` so that future Claude Code sessions know RAG data exists and can use it without the user asking.

### What gets written

A `## RAG Index` section is appended to (or updated in) `<project-root>/.claude/CLAUDE.md`:

```markdown
## RAG Index
This project is indexed in the RAG vector database (collection: "<name>").
When exploring unfamiliar code, answering architecture questions, or making changes,
use mcp__rag__semantic_search with collection "<name>" to find relevant code context first.
Last indexed: <date>
```

### Rules
- **Create `.claude/` directory** if it doesn't exist
- **Create `.claude/CLAUDE.md`** if it doesn't exist (with just the RAG section)
- **Update existing section** if `## RAG Index` already exists (replace the block)
- **Append** if CLAUDE.md exists but has no RAG section
- On `/rag delete <collection>`, **remove the `## RAG Index` section** from that project's CLAUDE.md if the deleted collection matches
- Never touch `~/.claude/CLAUDE.md` (global) — only the project-local `.claude/CLAUDE.md`

---

## Instructions

---

### No argument (empty)

When the user types just `/rag` with no command, present an **interactive menu** using `AskUserQuestion` so they can choose what to do:

```
question: "What would you like to do with RAG?"
header: "RAG Action"
options:
  - label: "Index codebase"
    description: "Index the current project for semantic search"
  - label: "Search code"
    description: "Search indexed code with natural language"
  - label: "View collections"
    description: "List all indexed collections and stats"
  - label: "Configure backend"
    description: "Switch between ChromaDB, Redis, or Qdrant"
```

After the user selects an option:
- **Index codebase** → Follow the `index` instructions below
- **Search code** → Ask "What do you want to search for?" then follow `search` instructions
- **View collections** → Follow `collections` instructions
- **Configure backend** → Follow `config` instructions

---

### `index` or `index [path]`

Index a codebase for semantic search.

1. Determine the target path:
   - No argument: use the current working directory
   - With argument: use the provided path
2. Derive a collection name from the last directory segment (e.g., `/home/user/my-project` → `my-project`)
3. Call `mcp__rag__index_codebase` with:
   - `rootPath`: the target path
   - `collectionName`: derived name
   - `excludePatterns`: `["node_modules/**", "build/**", "dist/**", ".git/**", "*.lock", "coverage/**", ".next/**", "__pycache__/**", "venv/**", ".venv/**"]`
4. After indexing, call `mcp__rag__get_collection_stats` to show the collection size
5. **Inject RAG hint into the project's CLAUDE.md** (see "Auto-Discovery via CLAUDE.md" above):
   - Determine the project root (same as `rootPath`, or its parent if `rootPath` is a subdirectory)
   - Read `<project-root>/.claude/CLAUDE.md` (create `.claude/` dir and file if needed)
   - If a `## RAG Index` section exists, replace it; otherwise append it
   - Write the updated file
   - The section content:
     ```
     ## RAG Index
     This project is indexed in the RAG vector database (collection: "<name>").
     When exploring unfamiliar code, answering architecture questions, or making changes,
     use mcp__rag__semantic_search with collection "<name>" to find relevant code context first.
     Last indexed: <YYYY-MM-DD>
     ```
6. Update `~/.claude/rag-config.json` — set `defaultCollection` to the new collection name, add to `collections` array
7. Output:
   ```
   Indexed [X] files into collection "[name]"
   Collection stats: [X] chunks
   RAG hint added to .claude/CLAUDE.md

   You can now search with: /rag search "your query"
   ```

---

### `search <query>`

Search the codebase using natural language.

1. Call `mcp__rag__semantic_search` with:
   - `query`: the user's query
   - `collectionName`: use `"codebase"` as default, or ask if multiple collections exist
   - `nResults`: 10
2. Format results showing:
   - File path and chunk index
   - Relevant code snippet (truncated if long)
   - Distance/score

---

### `similar <snippet>`

Find code similar to a provided snippet.

1. Call `mcp__rag__find_similar_code` with:
   - `codeSnippet`: the user's snippet
   - `nResults`: 5
2. Format results showing file paths, similarity scores, and matching code

---

### `context <task>`

Get relevant code context for a specific task.

1. Call `mcp__rag__get_relevant_context` with:
   - `task`: the user's task description
   - `maxTokens`: 4000
2. Format results grouped by file, showing:
   - Files included
   - Total estimated tokens
   - Code context per file

---

### `collections`

List all indexed collections.

1. Call `mcp__rag__list_collections`
2. For each collection, call `mcp__rag__get_collection_stats`
3. Output a formatted table:
   ```
   ## RAG Collections

   | Collection | Chunks |
   |------------|--------|
   | my-project | 1,200  |
   | other-repo | 640    |
   ```
4. If none exist: "No collections found. Run `/rag index` to index a project."

---

### `stats <collection>`

Show detailed stats for a specific collection.

1. Call `mcp__rag__get_collection_stats` with the collection name
2. Show chunk count and any available metadata

---

### `delete <collection>`

Delete an indexed collection.

1. Confirm with the user before deleting
2. Call `mcp__rag__delete_collection` with the collection name
3. Update `~/.claude/rag-config.json` — remove from `collections` array
4. If the current working directory has `.claude/CLAUDE.md` with a `## RAG Index` section referencing this collection, **remove that section**
5. Confirm deletion

---

### `config` (no argument)

Show current RAG MCP configuration from `~/.claude/rag-config.json`.

1. Read `~/.claude/rag-config.json` using the Read tool
   - If it doesn't exist, show defaults and note that no custom config has been set
2. Display the current configuration:
   ```
   ## RAG Configuration

   Backend:       redis
   Host:          localhost:6379
   Embeddings:    local (all-MiniLM-L6-v2, 384 dim)
   Model variant: default (90.4 MB full precision)
   Persistence:   aof (data dir: ~/.claude/rag-data)
   Default collection: codebase
   Known collections:  codebase, my-project
   Last updated:  2026-02-21T10:30:00Z

   Supported backends: chromadb, redis, qdrant
   Run: /rag config <backend>  → switch backend
   ```

---

### `config <backend>`

Switch the RAG MCP server to a different vector database backend.

**Supported backends:**
- `chromadb` — Default. ChromaDB with built-in embeddings. Port 8000.
- `redis` — Redis with RediSearch module. Requires local embeddings. Port 6379.
- `qdrant` — Qdrant vector database. Requires local embeddings. Port 6333.

**Additional config options (can be appended):**
- `config redis --host <host> --port <port>` — Custom host/port
- `config <backend> --embeddings openai` — Use OpenAI embeddings (requires OPENAI_API_KEY)
- `config <backend> --model quantized` — Use quantized local model (23 MB vs 90.4 MB)

**Steps:**

1. Read current config from `~/.claude/rag-config.json` (or use defaults if missing)
2. Determine the new backend and options from the user's input
3. Map backend to defaults:
   - `chromadb`: port 8000
   - `redis`: port 6379
   - `qdrant`: port 6333
4. Merge user-provided overrides (--host, --port, --embeddings, --model) with defaults
5. If embeddings = openai, remind user to set `OPENAI_API_KEY`

6. **Write config to `~/.claude/rag-config.json`** (this is the persistent store):
   ```json
   {
     "backend": "redis",
     "host": "localhost",
     "port": 6379,
     "embeddingType": "local",
     "modelVariant": "default",
     "defaultCollection": "codebase",
     "collections": [],
     "updatedAt": "2026-02-21T10:30:00Z"
   }
   ```
   Preserve existing `collections` and `defaultCollection` from the old config.

7. **Update the MCP server registration** so it picks up the new env vars:
   ```bash
   claude mcp remove rag
   claude mcp add rag \
     -e VECTOR_DB_TYPE=<backend> \
     -e VECTOR_DB_HOST=<host> \
     -e VECTOR_DB_PORT=<port> \
     -e EMBEDDING_TYPE=<type> \
     -e MODEL_VARIANT=<variant> \
     -- node /path/to/rag-mcp/build/index.js
   ```
   To find the node path, run `claude mcp list` first to extract the existing path.

8. Output:
   ```
   RAG backend switched to: redis
   Host: localhost:6379
   Embeddings: local (all-MiniLM-L6-v2)
   Config saved to: ~/.claude/rag-config.json

   Restart Claude Code for changes to take effect.
   Make sure Redis is running with the RediSearch module:
       docker run -p 6379:6379 redis/redis-stack-server
   ```

9. Show backend-specific setup instructions **with persistent storage**:
   - **chromadb**:
     ```bash
     docker run -d -p 8000:8000 -v ~/.claude/rag-data/chroma:/chroma/chroma chromadb/chroma
     ```
   - **redis**:
     ```bash
     docker run -d -p 6379:6379 -v ~/.claude/rag-data:/data redis/redis-stack-server --appendonly yes
     ```
   - **qdrant**:
     ```bash
     docker run -d -p 6333:6333 -v ~/.claude/rag-data/qdrant:/qdrant/storage qdrant/qdrant
     ```
   Always include the `-v` volume mount so indexed data survives container restarts.

---

### `hello`

Respond with:
> Hello! I'm **RAG** v1.1.0. I manage semantic codebase search — index, search, configure backends. Use `/rag hello ID` for the full guide.

### `hello ID`

Respond with complete skill information:
- **Name**: RAG v1.0.0
- **Description**: Manage the RAG MCP server — index codebases, search semantically, configure backends
- **How to invoke**: `/rag <command>`
- **Available commands**:
  - `index [path]` — Index the current directory or a specific path
  - `search <query>` — Semantic natural language search
  - `similar <snippet>` — Find similar code
  - `context <task>` — Get relevant context for a task
  - `collections` — List all indexed collections
  - `stats <name>` — Show collection statistics
  - `delete <name>` — Delete a collection
  - `config` — Show current configuration
  - `config <backend>` — Switch backend (chromadb/redis/qdrant)
  - `hello` — Quick greeting
  - `hello ID` — This full profile
- **Backends**: ChromaDB (default), Redis (with RediSearch), Qdrant
- **Embeddings**: Local (Transformers.js, all-MiniLM-L6-v2) or OpenAI (text-embedding-3-small)
- **Requires**: RAG MCP server (`rag-mcp`) must be configured via `claude mcp add`
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0
