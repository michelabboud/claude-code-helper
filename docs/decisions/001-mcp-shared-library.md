# ADR 001: MCP Shared Library Extraction

- **Status**: Accepted
- **Date**: 2026-02-20
- **Author**: Michel Abboud

## Context

The repository contains 10 MCP (Model Context Protocol) servers, each implemented as a standalone TypeScript/Node.js project. As the server count grew, a pattern of duplicated boilerplate emerged across every server:

- Server initialization and lifecycle management (`new Server(...)`, `server.connect(...)`)
- Structured logging setup with consistent formatting
- Path sanitization to prevent directory traversal attacks
- Health check endpoint registration
- Metrics collection for tool invocations and errors

Each server duplicated 80-120 lines of this infrastructure code. Bugs fixed in one server were not propagated to others. Security improvements (e.g., tighter path sanitization) had to be applied 10 times.

## Decision

Extract a shared library (`mcp-servers/mcp-shared`) that all MCP servers depend on. The library exposes:

- **`runServer(config, tools)`** - Factory function that handles server creation, transport setup, stdin/stdout connection, and graceful shutdown. Servers call this once and focus only on tool definitions.
- **Structured logger** - A `createLogger(name)` function returning a logger with `info`, `warn`, `error`, and `debug` methods. Output is JSON-structured for easy parsing.
- **`sanitizePath(userInput, allowedBase)`** - Validates and normalizes file paths, throwing on traversal attempts (`../`), absolute paths outside allowed roots, and null bytes.
- **Health check framework** - Registers a standard `health_check` tool across all servers with uptime, version, and tool-count reporting.
- **Metrics collector** - Tracks per-tool invocation counts and error rates, exposed via the health check response.

The library is a local npm package referenced via `workspace:*` protocol (or relative path before workspaces are adopted).

## Consequences

**Positive:**
- Zero duplicated boilerplate across all 10 servers; each server file focuses entirely on its domain tools
- Security fixes (path sanitization, input validation) apply to all servers by updating one location
- Consistent structured logging format across all servers simplifies log aggregation
- Health checks are uniform, enabling monitoring tooling to work against any server without customization
- New servers can be bootstrapped in minutes by calling `runServer()` with tool definitions

**Negative:**
- `mcp-shared` must be built before any dependent server can be built; CI must respect this ordering
- Introduces a coupling between server release cycles and the shared library version
- Local `workspace:*` references are not resolvable without npm workspaces or explicit `npm link`; developers must follow setup instructions
