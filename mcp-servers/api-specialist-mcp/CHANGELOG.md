# Changelog

## 1.0.1 - 2026-07-10
### Fixed
- Added YAML spec support (`js-yaml`) via a shared `loadSpec()` routed through all
  spec-parsing sites — previously `JSON.parse` threw on YAML, the most common
  OpenAPI format. Removed the unimplemented `xss` security-check enum value.
- `load_test` no longer emits `NaN`/`Infinity` when all requests fail; returns an
  explicit no-data result.

## 1.0.0 (2026-02-20)
- Initial release
