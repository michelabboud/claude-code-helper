# Codex LSP Findings

Generated: 2026-06-23

Scope: `/home/michel/projects/claude-code-helper`

This report preserves the findings from the Codex compatibility and LSP investigation. The repo began as a Claude Code helper repository, but several parts can be copied or converted into Codex-compatible skills. The specific question here was whether the repo's LSP-oriented programming agents are enough for Codex, and how they compare with community Codex LSP plugins.

## Executive Summary

- There is no official OpenAI Codex LSP skill/plugin installed or discovered in the official Codex docs during this check.
- Native or first-class LSP support in Codex is still an open feature request in `openai/codex` issue `#8745`.
- The repo has 17 LSP-oriented programming agents under `agents/domain-experts/`.
- Those 17 files are Claude-style agent instructions, not Codex-native skills or plugins as-is.
- They are compatible with Codex after a thin conversion into `~/.codex/skills/<name>/SKILL.md`.
- The repo does not currently include a Codex LSP runtime bridge: no `.codex-plugin/plugin.json`, `.mcp.json`, `hooks.json`, `lsp-client.json`, or `server.json` was found.
- `code-yeongyu/codex-lsp` is better than the repo agents for actual Codex LSP capability because it provides a Codex plugin, MCP tools, and a post-tool diagnostics hook.
- The repo agents are better for language-specific expertise because they encode deep domain guidance, model-routing hints, and language/framework best practices.
- Recommendation: use both layers. Treat `code-yeongyu/codex-lsp` or a similar LSP MCP plugin as the LSP engine, and keep the converted repo agents as the language-expert guidance layer.

## Codex Compatibility Rules Used

Official Codex docs establish the relevant shapes:

- A Codex skill is a directory containing `SKILL.md`; `SKILL.md` must include `name` and `description`.
- A Codex plugin can bundle skills, app integrations, MCP servers, hooks, and metadata.
- Codex supports MCP servers in the CLI and IDE extension.
- User-level Codex configuration lives in `~/.codex/config.toml`.

Sources:

- `https://developers.openai.com/codex/skills`
- `https://developers.openai.com/codex/plugins`
- `https://developers.openai.com/codex/mcp`
- `https://developers.openai.com/codex/config-basic`

## Local Repo Findings

### LSP-Oriented Programming Agents

The repo contains 17 programming/domain agents with LSP guidance:

- `android-dev`
- `android-expert`
- `angular-expert`
- `flutter-react-native-expert`
- `go-expert`
- `ios-development-expert`
- `java-spring-boot-expert`
- `laravel-expert`
- `nodejs-typescript-backend-expert`
- `php-expert`
- `python-backend-expert`
- `react-nextjs-expert`
- `ruby-rails-expert`
- `rust-expert`
- `svelte-expert`
- `vue-nuxt-expert`
- `wordpress-expert`

Local paths:

- `agents/domain-experts/android-dev.md`
- `agents/domain-experts/android-expert.md`
- `agents/domain-experts/angular-expert.md`
- `agents/domain-experts/flutter-react-native-expert.md`
- `agents/domain-experts/go-expert.md`
- `agents/domain-experts/ios-development-expert.md`
- `agents/domain-experts/java-spring-boot-expert.md`
- `agents/domain-experts/laravel-expert.md`
- `agents/domain-experts/nodejs-typescript-backend-expert.md`
- `agents/domain-experts/php-expert.md`
- `agents/domain-experts/python-backend-expert.md`
- `agents/domain-experts/react-nextjs-expert.md`
- `agents/domain-experts/ruby-rails-expert.md`
- `agents/domain-experts/rust-expert.md`
- `agents/domain-experts/svelte-expert.md`
- `agents/domain-experts/vue-nuxt-expert.md`
- `agents/domain-experts/wordpress-expert.md`

### Agent Metadata Consistency

- 16 of the 17 have a Claude agent `tools:` line that explicitly includes `LSP`.
- `ios-development-expert` uses `tools: ['*']`, but its body explicitly says it prefers SourceKit-LSP.
- Several files include dedicated "LSP-first development" sections.
- Examples:
  - `rust-expert` prefers `rust-analyzer` and has a detailed LSP-vs-grep decision table.
  - `go-expert` prefers `gopls` for symbol resolution.
  - `nodejs-typescript-backend-expert` and `react-nextjs-expert` prefer TypeScript LSP for references, rename, hover, and diagnostics.
  - `ios-development-expert` prefers SourceKit-LSP.

### What The Repo Does Not Have

The repo does not currently include a Codex-native LSP runtime or plugin manifest:

- No `.codex-plugin/plugin.json`
- No generic `plugin.json`
- No `.mcp.json`
- No `hooks.json`
- No `lsp-client.json`
- No `server.json`

That means the repo agents can teach Codex to prefer LSP, but they do not provide Codex with LSP tools by themselves.

### Existing Skill Context

The repo includes `skills/route-language-task/SKILL.md`, but that is a routing/rubric skill. It is not an LSP programming skill and does not expose language-server tools.

Previously copied Codex-compatible skills:

- `documentation`
- `testing`
- `project-scaffolding`
- `greeting`

Install location:

- `~/.codex/skills/`

Previous backup location:

- `~/.codex/skills/.backup-20260623-225326`

## Installed LSP Skill Status

Installed user skills under `~/.codex/skills` were checked. No LSP-specific installed skill was found.

Installed local skill names observed:

- `api-documentation`
- `documentation`
- `greeting`
- `model-mode`
- `pm-dashboard`
- `project-scaffolding`
- `rag`
- `refresh`
- `testing`
- `testing-standards`
- `update-check`

Conclusion: no official or local LSP-specific Codex skill was installed at the time of the check.

## Web Findings

### Official OpenAI / Codex

No official OpenAI LSP skill/plugin was found.

Relevant official or OpenAI-hosted findings:

- Codex skills are `SKILL.md` folders with required `name` and `description`.
- Codex plugins can bundle skills, apps, MCP servers, and hooks.
- Codex supports MCP servers in CLI and IDE.
- `openai/codex` issue `#8745` requests built-in LSP auto-detection, install, diagnostics, symbols, definitions, references, and rename.
- `openai/codex` issue `#14799` was closed as a duplicate of `#8745`.

Sources:

- `https://developers.openai.com/codex/skills`
- `https://developers.openai.com/codex/plugins`
- `https://developers.openai.com/codex/mcp`
- `https://github.com/openai/codex/issues/8745`
- `https://github.com/openai/codex/issues/14799`

### Community LSP Options

#### 1. `code-yeongyu/codex-lsp`

Best Codex-native match found.

What it provides:

- Codex plugin manifest: `.codex-plugin/plugin.json`
- MCP config: `.mcp.json`
- PostToolUse diagnostics hook
- `skills/lsp/SKILL.md`
- MCP tools:
  - `lsp.status`
  - `lsp.diagnostics`
  - `lsp.goto_definition`
  - `lsp.find_references`
  - `lsp.symbols`
  - `lsp.prepare_rename`
  - `lsp.rename`

Why it matters:

- It gives Codex an actual LSP-backed tool surface.
- It can run diagnostics after file edits through a hook.
- It complements, rather than replaces, language-expert instructions.

Risks / caveats:

- Community-maintained.
- Young/small project.
- Needs local review before broad install.
- Build/install involves Node packages and a bundled/submodule LSP MCP runtime.

Source:

- `https://github.com/code-yeongyu/codex-lsp`

#### 2. `code-yeongyu/lsp-tools-mcp`

Standalone Node/TypeScript LSP MCP server used by `codex-lsp`.

Provides LSP MCP tools such as diagnostics, go-to-definition, references, symbols, prepare-rename, rename, and status.

Source:

- `https://github.com/code-yeongyu/lsp-tools-mcp`

#### 3. `p1va/symbols`

MCP server plus skills for codebase symbol navigation through language servers.

Notable Codex install commands documented by the project:

```bash
codex mcp add language-servers -- npx -y @p1va/symbols@latest start
npx skills add p1va/symbols -a codex
```

Skills advertised:

- `install-language-server`
- `language-server-navigation`

Source:

- `https://github.com/p1va/symbols`

#### 4. `oraios/serena`

Broad semantic-code MCP toolkit. It supports language-server-backed symbol retrieval/editing across 40+ languages.

Strength:

- Broadest language coverage found.

Caveat:

- Not Codex-specific.
- The repo warns not to install Serena through MCP/plugin marketplaces because marketplace commands may be outdated.

Source:

- `https://github.com/oraios/serena`

#### 5. `BumpyClock/lsp-mcp`

Rust-based LSP MCP server with explicit Codex `~/.codex/config.toml` examples.

Advertised support includes:

- Rust
- TypeScript / JavaScript
- Go
- Python
- Ruby
- Java
- PHP
- C/C++

Source:

- `https://github.com/BumpyClock/lsp-mcp`

#### 6. `isaacphi/mcp-language-server`

Older and popular Go MCP bridge for language servers.

Tools:

- `definition`
- `references`
- `diagnostics`
- `hover`
- `rename_symbol`
- `edit_file`

Caveat:

- The repo describes the project as beta software.
- Not Codex-specific, but compatible through MCP configuration.

Source:

- `https://github.com/isaacphi/mcp-language-server`

#### 7. `antonbabenko/agent-plugins` / `code-intelligence`

Codex-compatible plugin/workflow guidance that teaches the agent to choose language-server, text, or fuzzy search correctly.

Strength:

- Good companion workflow discipline.

Caveat:

- Not an LSP runtime by itself.

Source:

- `https://github.com/antonbabenko/agent-plugins`

## Quality Comparison

### `code-yeongyu/codex-lsp` vs Repo Agents

`code-yeongyu/codex-lsp` is better for actual Codex LSP capability:

- It provides MCP tools that Codex can call.
- It provides diagnostics and navigation.
- It provides a post-edit diagnostics hook.
- It is packaged as a Codex plugin.

The repo agents are better for language expertise:

- They contain language-specific development guidance.
- They encode model-routing and escalation heuristics.
- They know framework-specific traps such as TypeScript barrel exports, Rust macro expansion, Go interfaces, Spring annotation processors, Laravel magic methods, Svelte runes, Vue macros, and SourceKit-LSP Swift behavior.
- They guide when semantic lookup is better than text search.

The repo agents are not enough by themselves because Codex cannot call an `LSP` tool unless the current environment exposes one. As converted Codex skills, they become guidance, not runtime tooling.

Best architecture:

1. Install or build one actual LSP MCP/plugin layer.
2. Keep the 17 repo language agents as converted Codex skills.
3. Update those converted skills to reference the installed LSP MCP tool names when available.
4. Fall back to `rg`, language-native checks, and tests when LSP is missing or incomplete.

## Recommendation

Recommended path:

1. Keep the 17 repo language agents and convert/copy them into `~/.codex/skills/<name>/SKILL.md`.
2. Add an actual Codex LSP runtime separately.
3. Prefer `code-yeongyu/codex-lsp` first if the goal is Codex-native plugin/hook behavior.
4. Prefer `p1va/symbols` if the goal is a simpler MCP plus skills setup.
5. Consider `serena` when broad symbol-level codebase tooling across many languages is more important than Codex-native packaging.

Do not treat community LSP plugins as drop-in replacements for the repo agents. They solve different layers:

- LSP plugin/MCP: tools and diagnostics.
- Repo language agents: expert judgment and task-specific workflow.

## Suggested Next Steps

1. Review `code-yeongyu/codex-lsp` locally before install:
   - Inspect `.codex-plugin/plugin.json`
   - Inspect `.mcp.json`
   - Inspect `hooks/hooks.json`
   - Inspect package scripts and dependencies
   - Run tests or typecheck if the repo provides them
2. If accepted, install it as a copied/pinned Codex plugin rather than linking to a mutable checkout.
3. Convert and copy the 17 LSP programming agents into `~/.codex/skills`.
4. Add a small local Codex skill named something like `lsp-navigation` only if the chosen LSP plugin does not already ship one.
5. After install, restart Codex and verify the new skills/plugin are visible in a fresh session.

## Bottom Line

Your repo has strong LSP-aware programming expertise, but it does not currently provide Codex with LSP tools. `code-yeongyu/codex-lsp` is stronger at the runtime/tooling layer. Your agents are stronger at the domain-expert layer. The best setup is to combine them.

## Installation Addendum

Installed on 2026-06-23:

- `codex-lsp@personal` plugin, version `0.2.0`
- Source inspected: `code-yeongyu/codex-lsp`
- Source commit inspected: `3aaa838f3d38ee13ba57a15ececb6859e1509aae`
- Submodule inspected: `code-yeongyu/lsp-tools-mcp`
- Submodule commit inspected: `e7c65b04d0cc549f0478d3b78b51714fc0f572b3`
- Copied source path: `/home/michel/.codex/plugins/local/codex-lsp`
- Installed cache path: `/home/michel/.codex/plugins/cache/personal/codex-lsp/0.2.0`
- Enabled in Codex config: `[plugins."codex-lsp@personal"] enabled = true`
- Personal marketplace entry: `/home/michel/.agents/plugins/marketplace.json`

Local verification:

- `npm test`: 2 test files passed, 8 tests passed.
- `npm run typecheck`: passed.
- `npm run check`: passed.
- Runtime audit: `npm audit --omit=dev` found 0 vulnerabilities.
- Full audit: dev-only Vite advisory remains in test tooling, not runtime dependencies.
- MCP tools list from the installed cache returned: `status`, `diagnostics`, `goto_definition`, `find_references`, `symbols`, `prepare_rename`, `rename`.
- Hook fixture after Python LSP install returned a real `basedpyright` type error, proving the hook can call LSP diagnostics.

Installed converted Codex skills from the repo:

- `android-dev`
- `android-expert`
- `angular-expert`
- `flutter-react-native-expert`
- `go-expert`
- `ios-development-expert`
- `java-spring-boot-expert`
- `laravel-expert`
- `nodejs-typescript-backend-expert`
- `php-expert`
- `python-backend-expert`
- `react-nextjs-expert`
- `ruby-rails-expert`
- `rust-expert`
- `svelte-expert`
- `vue-nuxt-expert`
- `wordpress-expert`

Each converted skill was copied to `/home/michel/.codex/skills/<skill-name>/SKILL.md`, not symlinked, and each contains a Codex LSP mapping section that maps Claude-style `LSP.definition`, `LSP.references`, `LSP.rename`, and `LSP.diagnostics` guidance to the installed `mcp__lsp__*` tools.

Language-server binary status after additional local installs:

- Installed and detected: `typescript`, `vue`, `eslint`, `biome`, `basedpyright`, `pyright`, `ruff`, `rust`, `svelte`, `bash`, `bash-ls`, `yaml-ls`, `php`, `prisma`, `dockerfile`.
- Still missing: `gopls`, `ruby-lsp`, `sourcekit-lsp`, `jdtls`, `dart`, `kotlin-ls`, and other less-used built-ins.

Ruby note: `ruby-lsp` and `rubocop` installs were blocked because this machine lacks Ruby development headers (`ruby.h`). Python note: direct `pip --user` is blocked by PEP 668 on this distro, so Python LSP tools were installed with `--user --break-system-packages`.

Restart Codex after install so the plugin MCP tools, hook, and converted skills are visible in a fresh session.
