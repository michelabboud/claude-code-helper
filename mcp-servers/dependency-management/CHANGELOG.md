# Changelog

## Unreleased
### Fixed (NO-FAKES)
- Removed all `Math.random()`-fabricated output that was presented as real analysis:
  package `size_estimate`/`last_updated` in `analyze_dependencies`, the random patch
  bump in `suggest_updates`, the coin-flip `find_duplicates`/`unused_dependencies`
  detectors, and the random bundle size for unknown packages.
- `check_licenses` no longer defaults unknown packages to `MIT` (a compliance
  false-negative) — unknown licenses now report `UNKNOWN` and are flagged for
  manual verification.
- Honest results where real data is unavailable: `find_duplicates` reports it needs
  a lockfile, `unused_dependencies` reports it needs a source scan, unknown bundle
  sizes / transitive deps are reported as unknown/omitted rather than invented.
- README: removed "Production Ready" badge and "Real-time vulnerability checking" claim;
  added a Scope & limitations section describing what is heuristic vs authoritative.
- Removed dead code (`_licenseCompatibility`, `_readRequirementsTxt`).

## 1.0.0 (2026-02-20)
- Initial release
