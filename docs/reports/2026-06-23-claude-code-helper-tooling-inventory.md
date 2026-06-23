# Claude Code Helper Tooling Inventory

Generated: 2026-06-23

Scope: `/home/michel/projects/claude-code-helper`

This report saves the focused inventory of skills, plugin docs, MCP packages/configs, and agent definitions in `claude-code-helper`. The repository started as a Claude Code toolkit, but the `SKILL.md`-based skills are useful to Codex too when copied or exposed through Codex skill roots.

The scan pruned generated/runtime folders such as `node_modules`, `build`, and `coverage`. It intentionally includes primary distribution files, config-bundle copies, examples, and templates because this repo is both a distribution source and a teaching/reference repo.

## Summary

- Skills: 14 `SKILL.md` artifacts total
  - 9 primary distributable skills under `skills/`
  - 1 config-bundle skill
  - 2 complete-guide example skills
  - 2 skill templates
- Plugins: 6 plugin specification docs, plus `plugins/README.md` and 1 template
  - No `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, or `plugin.json` manifest was found in this repo.
- MCP: 12 package directories under `mcp-servers/`
  - 11 MCP server packages
  - 1 shared utility package, `mcp-shared`
  - Additional MCP config/reference files under `docs/mcp-configs/`, `mcp-servers/`, and `hooks/`
- Agents: 66 non-README agent artifacts total
  - 60 primary distributable agents under `agents/`
  - 2 config-bundle agents
  - 2 complete-guide example agents
  - 2 agent templates

## Skills

Primary distributable skills:

- `documentation`: `skills/documentation/SKILL.md`
- `greeting`: `skills/greeting/SKILL.md`
- `model-mode`: `skills/model-mode/SKILL.md`
- `project-scaffolding`: `skills/project-scaffolding/SKILL.md`
- `rag`: `skills/rag/SKILL.md`
- `refresh`: `skills/refresh/SKILL.md`
- `route-language-task`: `skills/route-language-task/SKILL.md`
- `testing`: `skills/testing/SKILL.md`
- `update-check`: `skills/update-check/SKILL.md`

Bundled, example, and template skills:

- `auto-plan`: `config-bundle/skills/auto-plan/SKILL.md`
- `api-documentation`: `guides/complete-guide/examples/skills/api-documentation/SKILL.md`
- `testing-standards`: `guides/complete-guide/examples/skills/testing-standards/SKILL.md`
- `your-skill-name`: `guides/complete-guide/templates/skill/SKILL.md`
- `your-skill-name`: `templates/skill/SKILL.md`

## Plugins

Plugin docs:

- `plugins/cicd-automation-plugin.md`
- `plugins/cloud-native-plugin.md`
- `plugins/code-quality-suite-plugin.md`
- `plugins/modern-web-stack-plugin.md`
- `plugins/python-data-stack-plugin.md`
- `plugins/security-hardening-plugin.md`

Plugin index and template:

- `plugins/README.md`
- `templates/plugin/plugin-template.md`

Manifest scan result:

- No `.claude-plugin/plugin.json` file found.
- No `.codex-plugin/plugin.json` file found.
- No generic `plugin.json` file found outside generated dependencies.

## MCP

MCP server packages:

- `api-specialist-mcp` v1.0.0: `mcp-servers/api-specialist-mcp`
- `cicd-pipeline-mcp` v1.0.0: `mcp-servers/cicd-pipeline`
- `code-review-mcp` v1.0.0: `mcp-servers/code-review-mcp`
- `database-operations-mcp` v1.0.0: `mcp-servers/database-operations`
- `dependency-management-mcp` v1.0.0: `mcp-servers/dependency-management`
- `design-system-mcp` v1.0.0: `mcp-servers/design-system-mcp`
- `n8n-automation-mcp` v1.0.0: `mcp-servers/n8n-automation`
- `project-oversight-mcp` v1.2.0: `mcp-servers/project-oversight-mcp`
- `rag-mcp` v1.0.0: `mcp-servers/rag-mcp`
- `testing-mcp` v1.0.0: `mcp-servers/testing-mcp`
- `uiux-review-mcp` v1.0.0: `mcp-servers/uiux-review-mcp`

Shared MCP package:

- `mcp-shared` v1.1.0: `mcp-servers/mcp-shared`

MCP config/reference files:

- `mcp-servers/claude_desktop_config.json`
- `docs/mcp-configs/brave-search-config.json`
- `docs/mcp-configs/filesystem-config.json`
- `docs/mcp-configs/github-config.json`
- `hooks/mcp-trigger-hook.json`

MCP-integrated agents are listed in the agent inventory below.

## Agents

Primary root agents:

- `code-reviewer`: `agents/code-reviewer.md`
- `rag-coder`: `agents/rag-coder.md`
- `test-writer`: `agents/test-writer.md`

Primary domain-expert agents:

- `accessibility-expert`: `agents/domain-experts/accessibility-expert.md`
- `android-dev`: `agents/domain-experts/android-dev.md`
- `android-expert`: `agents/domain-experts/android-expert.md`
- `angular-expert`: `agents/domain-experts/angular-expert.md`
- `api-expert`: `agents/domain-experts/api-expert.md`
- `aws-architect-expert`: `agents/domain-experts/aws-architect-expert.md`
- `azure-architect-expert`: `agents/domain-experts/azure-architect-expert.md`
- `css-tailwind-expert`: `agents/domain-experts/css-tailwind-expert.md`
- `data-engineering-expert`: `agents/domain-experts/data-engineering-expert.md`
- `database-expert`: `agents/domain-experts/database-expert.md`
- `devops-infrastructure-expert`: `agents/domain-experts/devops-infrastructure-expert.md`
- `documentation-expert`: `agents/domain-experts/documentation-expert.md`
- `flutter-react-native-expert`: `agents/domain-experts/flutter-react-native-expert.md`
- `game-design-expert`: `agents/domain-experts/game-design-expert.md`
- `gcp-architect-expert`: `agents/domain-experts/gcp-architect-expert.md`
- `git-expert`: `agents/domain-experts/git-expert.md`
- `go-expert`: `agents/domain-experts/go-expert.md`
- `graphql-expert`: `agents/domain-experts/graphql-expert.md`
- `huggingface-expert`: `agents/domain-experts/huggingface-expert.md`
- `ios-development-expert`: `agents/domain-experts/ios-development-expert.md`
- `iot-embedded-expert`: `agents/domain-experts/iot-embedded-expert.md`
- `java-spring-boot-expert`: `agents/domain-experts/java-spring-boot-expert.md`
- `laravel-expert`: `agents/domain-experts/laravel-expert.md`
- `ml-ai-expert`: `agents/domain-experts/ml-ai-expert.md`
- `mongodb-expert`: `agents/domain-experts/mongodb-expert.md`
- `nodejs-typescript-backend-expert`: `agents/domain-experts/nodejs-typescript-backend-expert.md`
- `observability-expert`: `agents/domain-experts/observability-expert.md`
- `performance-optimizer`: `agents/domain-experts/performance-optimizer.md`
- `php-expert`: `agents/domain-experts/php-expert.md`
- `postgresql-expert`: `agents/domain-experts/postgresql-expert.md`
- `project-manager`: `agents/domain-experts/project-manager.md`
- `python-backend-expert`: `agents/domain-experts/python-backend-expert.md`
- `qa-testing-expert`: `agents/domain-experts/qa-testing-expert.md`
- `react-nextjs-expert`: `agents/domain-experts/react-nextjs-expert.md`
- `redis-expert`: `agents/domain-experts/redis-expert.md`
- `ruby-rails-expert`: `agents/domain-experts/ruby-rails-expert.md`
- `rust-expert`: `agents/domain-experts/rust-expert.md`
- `security-expert`: `agents/domain-experts/security-expert.md`
- `supabase-expert`: `agents/domain-experts/supabase-expert.md`
- `svelte-expert`: `agents/domain-experts/svelte-expert.md`
- `terraform-iac-expert`: `agents/domain-experts/terraform-iac-expert.md`
- `vue-nuxt-expert`: `agents/domain-experts/vue-nuxt-expert.md`
- `wordpress-expert`: `agents/domain-experts/wordpress-expert.md`

Primary MCP-integrated agents:

- `api-specialist`: `agents/mcp-integrated/api-specialist.json`
- `automation-architect`: `agents/mcp-integrated/automation-architect.json`
- `cicd-engineer`: `agents/mcp-integrated/cicd-engineer.json`
- `database-engineer`: `agents/mcp-integrated/database-engineer.json`
- `dependency-manager`: `agents/mcp-integrated/dependency-manager.json`
- `design-system-guardian`: `agents/mcp-integrated/design-system-guardian.json`
- `full-stack-reviewer`: `agents/mcp-integrated/full-stack-reviewer.json`
- `performance-optimizer-mcp`: `agents/mcp-integrated/performance-optimizer.json`
- `project-oversight-agent`: `agents/mcp-integrated/project-oversight-agent.json`
- `rag-agent`: `agents/mcp-integrated/rag-agent.json`
- `security-reviewer`: `agents/mcp-integrated/security-reviewer.json`
- `test-quality-enforcer`: `agents/mcp-integrated/test-quality-enforcer.json`
- `uiux-design-critic`: `agents/mcp-integrated/uiux-design-critic.json`
- `uiux-reviewer`: `agents/mcp-integrated/uiux-reviewer.json`

Bundled, example, and template agents:

- `implementer`: `config-bundle/agents/implementer.json`
- `planner`: `config-bundle/agents/planner.json`
- `code-reviewer`: `guides/complete-guide/examples/agents/code-reviewer.md`
- `test-writer`: `guides/complete-guide/examples/agents/test-writer.md`
- `agent-template`: `guides/complete-guide/templates/agent/agent-template.md`
- `agent-template`: `templates/agent/agent-template.md`

## Codex Compatibility Notes

- The `skills/**/SKILL.md` files use a skill-document format that maps cleanly to Codex skills when placed under a Codex skill root.
- The repo still uses Claude-oriented install paths and docs such as `~/.claude/skills/`, `~/.claude/agents/`, and Claude Desktop MCP config examples.
- MCP servers are standard Node/TypeScript MCP packages; they can be reused outside Claude-specific docs when wired into a compatible MCP client.
- Agent markdown/JSON formats are Claude-oriented. Some concepts transfer to Codex prompts or plugin skills, but they are not automatically Codex-native agents without adaptation.
