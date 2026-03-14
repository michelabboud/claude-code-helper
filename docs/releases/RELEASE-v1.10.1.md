# Release v1.10.1 - Repository Reorganization & Claude Code v2.1.9 Support

**Major repository cleanup with primary content at root level, skill enhancements, and Claude Code v2.1.9 feature documentation.**

---

## What's New

### Repository Reorganization

Primary distributable content moved from nested directories to the repository root for easier access and installation:

- **`agents/`** - All agent files (domain-experts + MCP-integrated)
- **`skills/`** - All skill files
- **`commands/`** - All command files
- **`hooks/`** - All hook files
- **`plugins/`** - All plugin files

Additional cleanup:
- `TESTING-GUIDE.md` moved to repository root
- Archive folder with deprecated content removed
- Third-party MCP server configs relocated to `docs/mcp-configs/`

### Skills Enhanced with Agent Field

Added `agent:` field to 11 skills, enabling Claude Code v2.1.9 auto-invocation where the appropriate agent is automatically selected when a skill runs:

| Skill | Agent |
|-------|-------|
| `api-design-patterns` | `api-expert` |
| `tdd-workflow` | `qa-testing-expert` |
| `release-management` | `devops-infrastructure-expert` |
| `database-design-patterns` | `database-expert` |
| `advanced-e2e-testing` | `qa-testing-expert` |
| `bdd-framework-examples` | `qa-testing-expert` |
| `ci-best-practices` | `devops-infrastructure-expert` |
| `caching-expert` | `redis-expert` |
| `contract-testing` | `qa-testing-expert` |
| `mutation-testing` | `qa-testing-expert` |
| `visual-regression-testing` | `qa-testing-expert` |

### Claude Code v2.1.9 Features Documented

Updated CLAUDE.md with support for the latest Claude Code CLI features:

- **Customizable keyboard shortcuts** - Configure via `~/.claude/keybindings.json`, invoke with `/keybindings`
- **Plans directory customization** - `plansDirectory` setting for controlling where plan files are stored
- **Session ID in skills** - `${CLAUDE_SESSION_ID}` string substitution for session-aware behavior
- **PreToolUse `additionalContext`** - Hooks can now inject context into tool execution
- **MCP tool search auto mode** - Auto-enabled when MCP tool descriptions exceed 10% of context window
- **Skill auto-discovery** - Skills automatically discovered from nested `.claude/skills/` directories

### Agent Preservation Policy

Added a policy to CLAUDE.md preventing removal of agents that overlap with Claude Code built-in agents. Documents why 33 agents intentionally duplicate built-ins (customization, backward compatibility, documentation value, offline reference).

### Repository Validation Script

New `validate-repo.sh` script for quick health checks:
- Validates directory structure and key files
- Checks agents, skills, and MCP server builds
- Reports pass/fail/warning counts

---

## Files Changed

### Moved / Reorganized
| Change | Description |
|--------|-------------|
| `agents/` | Primary agent directory at root level |
| `skills/` | Primary skills directory at root level |
| `commands/` | Primary commands directory at root level |
| `hooks/` | Primary hooks directory at root level |
| `plugins/` | Primary plugins directory at root level |
| `TESTING-GUIDE.md` | Moved from `docs/reference/` to root |
| `docs/mcp-configs/` | Third-party MCP configs relocated here |

### Modified
| File | Change |
|------|--------|
| `CLAUDE.md` | v2.1.9 features, agent preservation policy, updated structure |
| `README.md` | Updated directory structure |
| 11 skill files | Added `agent:` field for auto-invocation |
| `.gitignore` | Explicit `**/` patterns, Python venv patterns |

### Added
| File | Description |
|------|-------------|
| `validate-repo.sh` | Repository health check script |
| `docs/releases/RELEASE-v1.10.1.md` | This release notes file |

### Fixed
- All broken references to `docs/reference/TESTING-GUIDE.md` updated
- Test-automation paths corrected for TESTING-GUIDE.md and TOOLS-CHEATSHEET.md

---

## Version History

| Version | Date | Focus |
|---------|------|-------|
| v1.3.0 | 2026-01-10 | Complete MCP ecosystem |
| v1.3.1 | 2026-01-11 | Documentation suite |
| v1.3.2 | 2026-01-11 | Test automation |
| v1.4.0 | 2026-01-11 | MCP configuration modernization |
| v1.5.0 | 2026-01-11 | Agent loop prevention |
| v1.6.0 | 2026-01-11 | Solving AI coding problems |
| v1.7.0 | 2026-01-11 | RAG MCP Server |
| v1.8.0 | 2026-01-30 | CLI v2.1.22 compatibility update |
| v1.9.0 | 2026-02-20 | CLI v2.1.47 compatibility update |
| v1.10.1 | 2026-01-16 | **Repository reorganization & v2.1.9 support** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"Cleaner structure, smarter skills, latest CLI support"**
