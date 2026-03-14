# Release v2.2.0 - Versioning & Self-Update

**Installation manifest, self-update checking, and Claude Code v2.1.49 feature adoption.**

---

## Installation Manifest

- Install scripts now write `~/.claude/claude-code-helper.json` tracking installed version, components, and timestamps
- `scripts/manifest-helper.sh` provides shared functions (`get_repo_version()`, `update_manifest()`) for all install scripts
- Manifest is additive -- running one install script does not erase another's data

## Self-Update Check (`/update-check`)

- New skill that reads the local manifest and checks GitHub API for the latest release
- Purely informational -- never auto-updates, shows commands the user can copy-paste
- Reports: up-to-date, update available (with release notes), or no manifest found

## Version Sync

- `package.json` version bumped from 1.9.0 to 2.2.0 to match CHANGELOG
- `scripts/sync-version.sh` maintainer utility for creating git tags and GitHub releases

## v2.1.49 Agent Feature Adoption

New Claude Code v2.1.49 agent frontmatter fields applied to existing agents:

| Feature | Agents |
|---------|--------|
| `background: true` | project-manager, qa-testing-expert, performance-optimizer |
| `memory: project` | project-manager, git-expert, database-expert |
| `isolation: worktree` | devops-infrastructure-expert, security-expert |

## Commands Merged into Skills

Since Claude Code v2.1.3 unified skills and commands, the separate `commands/` directory has been merged into `skills/`. All 5 commands converted to proper skills with enhanced content:

| Command | Destination |
|---------|-------------|
| `document.md` | `skills/documentation/SKILL.md` |
| `scaffold.md` | `skills/project-scaffolding/SKILL.md` |
| `refactor.md` | `skills/refactoring-strategy.md` |
| `review.md` | `skills/code-review-workflow.md` |
| `test-generate.md` | `skills/testing-standards/SKILL.md` |

- Frontmatter fixes: `name` corrected to `skill_name` in multiple skills
- Added `argument-hint`, `allowed-tools`, and `agent` fields where appropriate
- Total skills: 15 to 18

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v1.9.0 | 2026-02-20 | CLI v2.1.47 compatibility update |
| v2.1.0 | 2026-02-20 | PM Expert Expansion & Monitoring Dashboard |
| v2.2.0 | 2026-02-20 | **Versioning & Self-Update** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"Track what you install, know when to update"**
