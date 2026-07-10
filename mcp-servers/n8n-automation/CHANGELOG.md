# Changelog

## Unreleased
### Fixed
- `generate_workflow` ignored `workflow_type`: only `trigger === "webhook"|"cron"|"schedule"`
  produced a trigger node, so an `event-driven` workflow_type (or any other trigger string)
  emitted an invalid **trigger-less** workflow. `workflow_type` is now authoritative and a
  trigger node is always emitted (`event-driven` → webhook entry point).

## 1.0.0 (2026-02-20)
- Initial release
