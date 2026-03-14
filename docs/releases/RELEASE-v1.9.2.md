# Release v1.9.2 - Standardized Credits & Attribution

**Consistent credits system across all 48 resources with AI co-authorship transparency.**

---

## What's New

### Standardized Credits Format

Introduced a consistent credits and attribution format across the entire repository. Every resource now includes clear authorship, AI assistance disclosure, licensing, and discovery links.

Standard credits block format:

```markdown
## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0
**Discover:** https://github.com/michelabboud/claude-code-helper
```

### Credits Coverage

Credits were added or standardized across all resource types:

| Resource Type | Count | Directory |
|---------------|-------|-----------|
| Skills | 15 | `skills/` |
| Agents | 22 | `agents/` |
| MCP Servers | 9 | `mcp-servers/` |
| **Total** | **46** | — |

### Credits Template

New `templates/CREDITS-TEMPLATE.md` (200+ lines) provides:

- Standard format for all resource types (agents, skills, MCP servers)
- Guidelines for AI co-authorship transparency
- Examples for different licensing scenarios
- Branding and attribution best practices
- Copy-paste ready blocks for new resources

### Contributing Guidelines Updated

Updated `mcp-servers/CONTRIBUTING.md` with credits requirements:

- All new MCP servers must include a credits section
- AI assistance must be explicitly acknowledged
- License must be specified in both `package.json` and README
- Discovery link to the main repository is required

---

## Why This Matters

- **Transparency** - Clear disclosure of AI-assisted development
- **Professionalism** - Consistent branding across all components
- **Discoverability** - Every resource links back to the main repository
- **Compliance** - License information readily accessible in every resource
- **Community standards** - Sets expectations for contributors

---

## Files Changed

### Added
| File | Description |
|------|-------------|
| `templates/CREDITS-TEMPLATE.md` | Credits format template (200+ lines) |
| `docs/releases/RELEASE-v1.9.2.md` | This release notes file |

### Modified
| File | Change |
|------|--------|
| 15 skill files | Added standardized credits sections |
| 22 agent files | Added standardized credits sections |
| 9 MCP server READMEs | Added standardized credits sections |
| `mcp-servers/CONTRIBUTING.md` | Added credits requirements for contributors |

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
| v1.9.2 | — | **Standardized credits & attribution** |

---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Claude (Anthropic)
**License:** Apache-2.0

---

**"Professional attribution and transparency across every resource"**
