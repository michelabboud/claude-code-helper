# Changelog

## 1.0.1 - 2026-07-10
### Fixed
- `calculate_contrast` computed WCAG contrast by parsing the whole hex as one integer (e.g. #ffffff -> 16777215), yielding ratios in the hundreds of millions instead of the [1,21] WCAG range. Reimplemented with real sRGB linearization + relative luminance (testable color.ts); non-hex token values return null and are skipped rather than fabricated.
- Removed the advertised-but-unimplemented `component_api` check from the enum, schema, README, and tests (it was a silent no-op).

## 1.0.0 (2026-02-20)
- Initial release
