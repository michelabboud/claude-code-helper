# Changelog

## 1.1.1 - 2026-07-10
### Fixed
- `index_codebase` / `index_file` restricted the target path to the current working
  directory (`sanitizePath(path, process.cwd())`), which rejected the absolute paths
  the README documents (e.g. `/path/to/project`). Indexing is meant to target any
  project the user names, so the cwd restriction was removed; the null-byte and
  empty-path guards remain.

## 1.1.0 — Multi-Database Support
Pluggable vector-database architecture. **ChromaDB remains the default** (no changes
for existing users), with opt-in support for additional backends via `VECTOR_DB_TYPE`:

| Database | Best for | Setup |
|----------|----------|-------|
| ChromaDB (default) | Development, <100M vectors | Easy |
| Redis Stack | Real-time, <50M vectors | Medium |
| Qdrant | Production, scalability | Medium |

Select a backend with `VECTOR_DB_TYPE=redis` / `VECTOR_DB_TYPE=qdrant` (defaults to
ChromaDB when unset). See `CHANGELOG-v1.1.0.md` for the full release notes.

## 1.0.0 (2026-02-20)
- Initial release
