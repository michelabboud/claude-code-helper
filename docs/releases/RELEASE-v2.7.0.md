# Release v2.7.0 - /rag Skill

**Date:** 2026-02-21

---

## New Skill: `/rag`

Unified interface for the RAG MCP server with persistent configuration.

### Subcommands

| Command | Description |
|---------|-------------|
| `/rag index [path]` | Index the current project or a specific directory |
| `/rag search <query>` | Semantic natural language search across indexed code |
| `/rag similar <snippet>` | Find code similar to a given snippet |
| `/rag context <task>` | Get relevant code context within a token budget |
| `/rag collections` | List all indexed collections with stats |
| `/rag stats <name>` | Show detailed collection statistics |
| `/rag delete <name>` | Delete an indexed collection |
| `/rag config` | Show current RAG configuration |
| `/rag config <backend>` | Switch backend (ChromaDB, Redis, Qdrant) |

### Key Features

- **Interactive menu** when invoked with no arguments
- **Multiple backends**: ChromaDB, Redis (with RediSearch), Qdrant
- **Persistent configuration** in `~/.claude/rag-config.json` — survives across sessions
- **Persistent vector data** in `~/.claude/rag-data/` with Docker volume mount instructions
- Implements Hello Protocol (`hello` / `hello ID` arguments)
- Installed to `~/.claude/skills/rag/`

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
