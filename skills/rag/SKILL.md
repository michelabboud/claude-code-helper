---
name: RAG
version: 2.0.0
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
/rag init                  → First-time setup wizard (backend, install, configure, teach Claude Code)
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

## Auto-Discovery via CLAUDE.md (Two Layers)

RAG uses **two layers** of CLAUDE.md hints so Claude Code knows RAG is available:

### Layer 1: Global awareness (`~/.claude/CLAUDE.md`)

Written by `/rag init`. Tells **every** Claude Code session that RAG exists:

```markdown
## RAG MCP
The RAG MCP server is installed and provides semantic codebase search.
When a project's CLAUDE.md contains a `## RAG Index` section, use
mcp__rag__semantic_search with the specified collection name to find
relevant code before answering architecture questions or making changes.
Each project has its own collection. Use /rag to manage indexing and configuration.
```

### Layer 2: Per-project index (`<project>/.claude/CLAUDE.md`)

Written by `/rag index`. Tells sessions **in that specific project** which collection to use:

```markdown
## RAG Index
This project is indexed in the RAG vector database (collection: "<name>").
When exploring unfamiliar code, answering architecture questions, or making changes,
use mcp__rag__semantic_search with collection "<name>" to find relevant code context first.
Last indexed: <date>
```

### Rules
- **`/rag init`** writes the global `## RAG MCP` section to `~/.claude/CLAUDE.md`
- **`/rag index`** writes the per-project `## RAG Index` section to `<project>/.claude/CLAUDE.md`
- **Create `.claude/` directory** if it doesn't exist
- **Create `.claude/CLAUDE.md`** if it doesn't exist (with just the RAG section)
- **Update existing section** if the heading already exists (replace the block up to the next `##` or end of file)
- **Append** if CLAUDE.md exists but has no matching section
- On `/rag delete <collection>`, **remove the `## RAG Index` section** from that project's CLAUDE.md if the deleted collection matches
- On `/rag init` (reconfigure), **update** the global section — never duplicate it

---

## Instructions

---

### No argument (empty)

When the user types just `/rag` with no command, present an **interactive menu** using `AskUserQuestion` so they can choose what to do:

First, check if `~/.claude/rag-config.json` exists. If it does NOT exist (first time), **automatically redirect to `init`** instead of showing the menu.

If config exists, show the menu:

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

### `init`

First-time setup wizard. Guides the user through choosing a backend, installing it, configuring the MCP server, and teaching Claude Code that RAG is available.

**If `~/.claude/rag-config.json` already exists**, show the current config and ask if they want to reconfigure.

#### Step 1: Welcome

Display:

```
## RAG Setup Wizard

RAG (Retrieval-Augmented Generation) gives Claude Code semantic search
over your codebases. Instead of grepping files, Claude can find relevant
code by meaning — "how does authentication work?" returns the actual auth
code, not just files containing the word "auth".

How it works:
1. You index a project → code is chunked and embedded into vectors
2. Vectors are stored in a database that persists across sessions
3. Claude Code searches by meaning when you ask questions or make changes
4. Multiple projects can be indexed simultaneously — each gets its own collection

Let's set it up.
```

#### Step 2: Choose backend

Use `AskUserQuestion`:

```
question: "Which vector database backend would you like to use?"
header: "Backend"
options:
  - label: "Redis (Recommended)"
    description: "Fast, mature, great persistence. Best all-around choice."
    markdown: |
      ## Redis with RediSearch

      **Pros:**
      - Extremely fast — sub-millisecond vector search
      - Mature and battle-tested (millions of production deployments)
      - Excellent persistence options (AOF, RDB, or both)
      - Multi-repo: single Redis instance serves all your projects
      - Rich data structures beyond vectors (caching, queues, etc.)
      - Low memory overhead per vector

      **Cons:**
      - Requires the RediSearch module (comes with redis-stack)
      - Needs local embedding generation (included, ~90 MB model)

      **Best for:** Most users. Especially if you work on multiple projects.
  - label: "Qdrant"
    description: "Purpose-built vector DB. Best filtering and scalability."
    markdown: |
      ## Qdrant

      **Pros:**
      - Purpose-built for vector search — optimized from the ground up
      - Advanced filtering (combine vector search with metadata filters)
      - Excellent for very large codebases (100K+ files)
      - Built-in persistence to disk by default
      - Multi-repo: single instance serves all projects
      - REST API and gRPC support

      **Cons:**
      - Higher memory usage than Redis for small codebases
      - Needs local embedding generation (included, ~90 MB model)
      - Less ecosystem tooling compared to Redis

      **Best for:** Large codebases, advanced filtering needs, or dedicated vector search.
  - label: "ChromaDB"
    description: "Simplest setup. Built-in embeddings, no extras needed."
    markdown: |
      ## ChromaDB

      **Pros:**
      - Simplest to set up — just run the container
      - Built-in embedding generation (no separate model needed)
      - Good documentation and Python ecosystem
      - Multi-repo: single instance serves all projects

      **Cons:**
      - Slower than Redis/Qdrant for large codebases
      - Less mature persistence story
      - Limited filtering capabilities
      - Higher memory usage per embedding

      **Best for:** Quick experiments, small projects, or if you want zero config.
```

#### Step 3: Installation method

After backend choice, use `AskUserQuestion`:

```
question: "How would you like to install <backend>?"
header: "Install"
options:
  - label: "Docker (Recommended)"
    description: "Isolated container with persistent storage. One command."
  - label: "Local install"
    description: "Install natively on your system."
  - label: "Already running"
    description: "I already have <backend> running."
```

**If Docker:**

Run the appropriate Docker command via Bash. **Always use persistent volumes** and name the container for easy management:

- **Redis:**
  ```bash
  mkdir -p ~/.claude/rag-data
  docker run -d \
    --name claude-rag-redis \
    --restart unless-stopped \
    -p 6379:6379 \
    -v ~/.claude/rag-data:/data \
    redis/redis-stack-server \
    --appendonly yes
  ```

- **Qdrant:**
  ```bash
  mkdir -p ~/.claude/rag-data/qdrant
  docker run -d \
    --name claude-rag-qdrant \
    --restart unless-stopped \
    -p 6333:6333 \
    -v ~/.claude/rag-data/qdrant:/qdrant/storage \
    qdrant/qdrant
  ```

- **ChromaDB:**
  ```bash
  mkdir -p ~/.claude/rag-data/chroma
  docker run -d \
    --name claude-rag-chroma \
    --restart unless-stopped \
    -p 8000:8000 \
    -v ~/.claude/rag-data/chroma:/chroma/chroma \
    chromadb/chroma
  ```

Note: `--restart unless-stopped` ensures the container auto-starts on system boot.

**If Local install:**

Show install instructions and run them:

- **Redis:**
  ```
  ## Linux (Ubuntu/Debian)
  curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list
  sudo apt-get update
  sudo apt-get install redis-stack-server

  ## macOS
  brew tap redis-stack/redis-stack
  brew install redis-stack-server
  ```
  After install, show how to enable the service:
  ```bash
  # Linux: enable and start
  sudo systemctl enable redis-stack-server
  sudo systemctl start redis-stack-server

  # macOS: start with brew
  brew services start redis-stack-server
  ```

- **Qdrant:**
  ```
  ## Using pre-built binary
  curl -LO https://github.com/qdrant/qdrant/releases/latest/download/qdrant-x86_64-unknown-linux-gnu.tar.gz
  tar -xzf qdrant-x86_64-unknown-linux-gnu.tar.gz
  ./qdrant --storage-path ~/.claude/rag-data/qdrant

  ## macOS
  brew install qdrant/tap/qdrant
  qdrant --storage-path ~/.claude/rag-data/qdrant
  ```

- **ChromaDB:**
  ```bash
  pip install chromadb
  chroma run --path ~/.claude/rag-data/chroma
  ```

**If Already running:**

Skip installation, proceed to verification.

#### Step 4: Verify backend is reachable

Run a connectivity check via Bash:

- **Redis:** `redis-cli -h localhost -p 6379 ping` → expect `PONG`
- **Qdrant:** `curl -s http://localhost:6333/healthz` → expect `ok` or JSON
- **ChromaDB:** `curl -s http://localhost:8000/api/v1/heartbeat` → expect JSON

If the check fails:
- Show the error
- Suggest common fixes (wrong port, service not started, Docker not running)
- Ask if they want to retry or go back to installation step

If the check succeeds, show: `<backend> is running and reachable.`

#### Step 5: Choose embeddings

Use `AskUserQuestion`:

```
question: "Which embedding provider would you like to use?"
header: "Embeddings"
options:
  - label: "Local (Recommended)"
    description: "Free, private, no API key. Uses all-MiniLM-L6-v2 (~90 MB download on first use)."
  - label: "OpenAI"
    description: "Higher quality embeddings. Requires OPENAI_API_KEY and costs per request."
```

If **OpenAI**: check if `OPENAI_API_KEY` is set. If not, warn and ask the user to set it before proceeding.

#### Step 6: Register MCP server

Find the rag-mcp build path. Check in order:
1. `claude mcp list` — if rag already registered, extract the existing node path
2. Common install locations:
   - `~/.claude/mcp-servers/rag-mcp/build/index.js`
   - The repo's `mcp-servers/rag-mcp/build/index.js` (if cloned from claude-code-helper)
3. If not found, ask the user for the path

Then register:

```bash
# Remove old registration if it exists
claude mcp remove rag 2>/dev/null

# Add with new config
claude mcp add rag \
  -e VECTOR_DB_TYPE=<backend> \
  -e VECTOR_DB_HOST=<host> \
  -e VECTOR_DB_PORT=<port> \
  -e EMBEDDING_TYPE=<embedding_type> \
  -e MODEL_VARIANT=default \
  -- node <path-to-build/index.js>
```

#### Step 7: Write persistent config

Write `~/.claude/rag-config.json`:

```json
{
  "backend": "<backend>",
  "host": "localhost",
  "port": <port>,
  "embeddingType": "<local|openai>",
  "modelVariant": "default",
  "defaultCollection": "codebase",
  "collections": [],
  "persistence": {
    "enabled": true,
    "mode": "<aof for redis | disk for qdrant | disk for chromadb>",
    "dataDir": "~/.claude/rag-data"
  },
  "installedAt": "<ISO timestamp>",
  "installMethod": "<docker|local|existing>",
  "updatedAt": "<ISO timestamp>"
}
```

#### Step 8: Teach Claude Code that RAG exists

Append a `## RAG MCP` section to `~/.claude/CLAUDE.md` (global) — so **every** Claude Code session is aware RAG is available:

```markdown
## RAG MCP

The RAG MCP server is installed and provides semantic codebase search.

**How to use:**
- When a project's CLAUDE.md contains a `## RAG Index` section, use `mcp__rag__semantic_search` with the specified collection name to find relevant code before answering architecture questions or making changes.
- Each project has its own collection (named after the project directory).
- Use `/rag` to manage indexing, search, and configuration.
- The vector database runs as a persistent background service — indexed data survives across sessions.
```

Rules:
- If `## RAG MCP` already exists in `~/.claude/CLAUDE.md`, replace it
- Otherwise append it
- Be careful not to corrupt other content in the file — read it first, find the right insertion point

#### Step 9: Offer to index current project

Use `AskUserQuestion`:

```
question: "Would you like to index the current project now?"
header: "Index"
options:
  - label: "Yes, index now"
    description: "Index <current-directory-name> for semantic search"
  - label: "No, I'll do it later"
    description: "You can run /rag index anytime"
```

If **Yes**: follow the `index` instructions below (which will also write the per-project CLAUDE.md hint).

If **No**: show a summary and remind them they can run `/rag index` later.

#### Step 10: Summary

Display a completion summary:

```
## RAG Setup Complete

Backend:     <backend> (<docker|local|existing>)
Host:        localhost:<port>
Embeddings:  <local|openai>
Persistence: ~/.claude/rag-data/
Config:      ~/.claude/rag-config.json

Claude Code awareness:
  Global:  ~/.claude/CLAUDE.md → ## RAG MCP section added
  <if indexed: "Project: .claude/CLAUDE.md → ## RAG Index section added">

Next steps:
  /rag index          → Index a project for semantic search
  /rag search "query" → Search indexed code
  /rag collections    → View all indexed projects
  /rag config         → View or change configuration

Restart Claude Code for the MCP server registration to take effect.
```

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
> Hello! I'm **RAG** v2.0.0. I manage semantic codebase search — init, index, search, configure backends. Use `/rag hello ID` for the full guide.

### `hello ID`

Respond with complete skill information:
- **Name**: RAG v2.0.0
- **Description**: Manage the RAG MCP server — index codebases, search semantically, configure backends
- **How to invoke**: `/rag <command>`
- **Available commands**:
  - `init` — First-time setup wizard (choose backend, install, configure, teach Claude Code)
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
- **Multi-repo**: Single database instance serves all projects — each gets its own named collection
- **Persistence**: Data survives across sessions and restarts via Docker volumes or native disk
- **Auto-discovery**: After indexing, writes hints to project CLAUDE.md so Claude Code uses RAG automatically
- **Requires**: RAG MCP server (`rag-mcp`) must be configured via `claude mcp add` or `/rag init`
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0
