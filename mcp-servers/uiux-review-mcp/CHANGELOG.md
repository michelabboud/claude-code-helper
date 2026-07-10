# Changelog

## 1.0.1 - 2026-07-10
### Fixed (NO-FAKES)
- Analysis tools read the image only to confirm it existed, then returned hardcoded
  scores and fabricated findings; `compare_designs` picked an A/B winner with
  `Math.random()`. Redesigned so the 6 analysis tools + `compare_designs` return the
  real image as an MCP image content block plus an evaluation rubric for the calling
  vision model — no server-computed scores (see `docs/adr/0001`). Dead fabrication
  code removed; a static regression guard prevents the fabrication from returning.

## 1.0.0 (2026-02-20)
- Initial release
