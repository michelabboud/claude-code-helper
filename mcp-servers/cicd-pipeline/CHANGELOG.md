# Changelog

## Unreleased
- Fix (honesty): README no longer claims GitLab CI, Jenkins, and CircleCI are "Production Ready" — `generate_pipeline` only has full templates for GitHub Actions; the other three platforms now return an explicit "not yet implemented, minimal scaffold" note instead of anything resembling a finished pipeline.
- Fix: `generate_pipeline` now honors the `features` selection for GitHub Actions instead of ignoring it — lint/test/build jobs are included only when the matching feature (`linting`/`testing`/`build`) is requested. For `go`/`rust`/`java`/`docker` project types, the single combined build+test job is kept if either `build` or `testing` is requested.
- Fix: `security_scan_pipeline`'s SAST scan now genuinely emits a Semgrep step (and labels it `semgrep`) when `tools` includes `"semgrep"`, instead of labeling the result "semgrep" while always emitting a CodeQL config. Dependency/container/secret scan labels (`snyk`/`trivy`/`trufflehog`) now always match the step that is actually generated; alternate tool names in `tools` for those scan types are documented as not yet wired up rather than silently mislabeled.

## 1.0.0 (2026-02-20)
- Initial release
