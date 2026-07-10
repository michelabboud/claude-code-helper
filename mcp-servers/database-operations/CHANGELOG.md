# Changelog

## Unreleased
- Fix (NO-FAKES honesty): README no longer claims "Production Ready" live database execution; rewritten to describe the server accurately as an advisory SQL-generation/schema-planning/migration-linting tool with no database driver and no live connectivity. Removed the `.env` connection-string setup section, the connection test-script section, and the fabricated `error.code` (`TABLE_NOT_FOUND`/`CONNECTION_ERROR`) example, none of which reflect real behavior.
- Fix (NO-FAKES honesty): `run_query`, `inspect_schema`, and `backup_database` tool descriptions and `annotations` now explicitly state they are advisory-only and never touch a live database. Their responses were reworded to remove result-shaped fields that implied real execution (`success: true`, `rows_affected`, `execution_time_ms`, `status: "pending"`) and now include an explicit `note` disclosing that no query was run, no schema was read, and no backup was created.

## 1.0.0 (2026-02-20)
- Initial release
