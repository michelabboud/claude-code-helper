# Release v2.7.1 - /rag init Setup Wizard

**Date:** 2026-02-21

---

## `/rag init` Setup Wizard

10-step interactive onboarding for first-time RAG setup:

1. Backend selection with detailed pros/cons comparison (Redis recommended, Qdrant, ChromaDB)
2. Installation assistance: Docker (with persistent volumes, auto-restart), local native, or existing
3. Backend connectivity verification with retry and troubleshooting
4. Embedding provider choice (local free vs OpenAI)
5. Automatic MCP server registration (`claude mcp add rag`)
6. Persistent config written to `~/.claude/rag-config.json`
7. Global CLAUDE.md awareness — writes `## RAG MCP` section to `~/.claude/CLAUDE.md`
8. Optional immediate project indexing
9. Auto-redirects from `/rag` when no config exists (first run)
10. Comprehensive RAG guide added at `guides/RAG-MCP-GUIDE.md`

## Two-Layer CLAUDE.md Auto-Discovery

- **Layer 1 (global):** `/rag init` writes `## RAG MCP` to `~/.claude/CLAUDE.md`
- **Layer 2 (per-project):** `/rag index` writes `## RAG Index` to `<project>/.claude/CLAUDE.md`
- Claude Code automatically uses RAG when these hints are present

## Bug Fix

- **Redis socket race condition** — `RedisAdapter.ensureConnected()` now checks `client.isOpen` to prevent "Socket already opened" error from concurrent calls

---

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
