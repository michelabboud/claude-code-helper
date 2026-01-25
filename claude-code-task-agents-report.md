# Claude Code Task Agents - Comprehensive Test Report

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Agents Tested** | 39 |
| **Successful** | 39 (100%) |
| **Failed** | 0 |
| **Test Date** | 2026-01-25 |

## Results by Model

| Model | Count | Agents |
|-------|-------|--------|
| **opus** | 4 | Bash, general-purpose, Plan, performance-optimizer |
| **sonnet** | 33 | Most domain-specific experts |
| **haiku** | 1 | Explore |
| **unknown** | 1 | claude-code-guide (no model prefix returned) |

## Complete Agent Inventory

### Core/Utility Agents (4)

| Agent | Model | Tools | Status |
|-------|-------|-------|--------|
| `Bash` | opus | Bash | ✅ |
| `Explore` | haiku | All except Task, Edit, Write, NotebookEdit | ✅ |
| `Plan` | opus | All except Task, Edit, Write, NotebookEdit | ✅ |
| `general-purpose` | opus | All tools (*) | ✅ |

### Configuration Agents (2)

| Agent | Model | Tools | Status |
|-------|-------|-------|--------|
| `statusline-setup` | sonnet | Read, Edit | ✅ |
| `claude-code-guide` | - | Glob, Grep, Read, WebFetch, WebSearch | ✅ |

### Frontend/Web Experts (5)

| Agent | Model | Status |
|-------|-------|--------|
| `react-nextjs-expert` | sonnet | ✅ |
| `vue-nuxt-expert` | sonnet | ✅ |
| `angular-expert` | sonnet | ✅ |
| `css-tailwind-expert` | sonnet | ✅ |
| `wordpress-expert` | sonnet | ✅ |

### Backend/Language Experts (9)

| Agent | Model | Status |
|-------|-------|--------|
| `nodejs-typescript-backend-expert` | sonnet | ✅ |
| `python-backend-expert` | sonnet | ✅ |
| `go-expert` | sonnet | ✅ |
| `rust-expert` | sonnet | ✅ |
| `php-expert` | sonnet | ✅ |
| `laravel-expert` | sonnet | ✅ |
| `ruby-rails-expert` | sonnet | ✅ |
| `database-expert` | sonnet | ✅ |
| `redis-expert` | sonnet | ✅ |

### Cloud/Infrastructure Experts (6)

| Agent | Model | Status |
|-------|-------|--------|
| `aws-architect-expert` | sonnet | ✅ |
| `gcp-architect-expert` | sonnet | ✅ |
| `azure-architect-expert` | sonnet | ✅ |
| `devops-infrastructure-expert` | sonnet | ✅ |
| `iot-embedded-expert` | sonnet | ✅ |
| `Observability Expert` | sonnet | ✅ |

### Mobile Development Experts (3)

| Agent | Model | Status |
|-------|-------|--------|
| `android-dev` | sonnet | ✅ |
| `android-expert` | sonnet | ✅ |
| `iOS Development Expert` | sonnet | ✅ |

### AI/ML Experts (3)

| Agent | Model | Status |
|-------|-------|--------|
| `ML/AI Expert` | sonnet | ✅ |
| `huggingface-expert` | sonnet | ✅ |
| `Data Engineering Expert` | sonnet | ✅ |

### Quality/Security Experts (4)

| Agent | Model | Status |
|-------|-------|--------|
| `qa-testing-expert` | sonnet | ✅ |
| `Security Expert` | sonnet | ✅ |
| `performance-optimizer` | opus | ✅ |
| `api-expert` | sonnet | ✅ |

### Other Specialists (3)

| Agent | Model | Status |
|-------|-------|--------|
| `git-expert` | sonnet | ✅ |
| `game-design-expert` | sonnet | ✅ |
| `Documentation Expert` | sonnet | ✅ |

## Triggering Mechanisms

All agents are triggered via the **Task tool** with:

```javascript
Task(subagent_type="agent-name", prompt="...", description="...")
```

**No hooks or alternative triggers exist** - agents are only invocable through:

1. Direct Task tool invocation
2. The parent agent spawning them based on user requests

### Key Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `subagent_type` | Yes | Agent name (exact match) |
| `prompt` | Yes | Task description for the agent |
| `description` | Yes | Short 3-5 word summary |
| `run_in_background` | No | Run async, returns output_file |
| `resume` | No | Agent ID to resume previous work |
| `model` | No | Override model (sonnet/opus/haiku) |
| `allowed_tools` | No | Additional tool permissions |
| `max_turns` | No | Limit API round-trips |

## Observations

1. **Model Distribution**: Most experts use Sonnet for cost-efficiency; Opus reserved for complex tasks (Plan, Bash, general-purpose, performance-optimizer)

2. **Duplicate Coverage**: Two Android agents exist (`android-dev` and `android-expert`) with slightly different tool scopes

3. **No Custom Agents**: All agents are built-in; no mechanism for user-defined agents

4. **Resumable**: All agents return an `agentId` for later resumption

5. **Tool Access**: Varies by agent - some have full access (*), others are restricted (e.g., Explore can't write/edit)

## Agent Tools Summary

| Agent Type | Available Tools |
|------------|-----------------|
| `Bash` | Bash only |
| `Explore` | All except Task, ExitPlanMode, Edit, Write, NotebookEdit |
| `Plan` | All except Task, ExitPlanMode, Edit, Write, NotebookEdit |
| `general-purpose` | All tools (*) |
| `statusline-setup` | Read, Edit |
| `claude-code-guide` | Glob, Grep, Read, WebFetch, WebSearch |
| `git-expert` | Read, Bash, Grep, Glob |
| `css-tailwind-expert` | Read, Write, Edit, Grep, Glob, WebSearch |
| `react-nextjs-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `vue-nuxt-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `angular-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `nodejs-typescript-backend-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `python-backend-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `api-expert` | Read, Write, Edit, Bash, Grep, Glob, WebSearch |
| `database-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `devops-infrastructure-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `qa-testing-expert` | Read, Write, Edit, Bash, Grep, Glob |
| `performance-optimizer` | Read, Write, Edit, Bash, Grep, Glob, WebSearch |
| `android-dev` | Read, Write, Edit, Bash, Grep, Glob |
| Most other experts | All tools |

## Usage Examples

### Basic Agent Invocation

```javascript
Task({
  subagent_type: "react-nextjs-expert",
  prompt: "Create a responsive navbar component with dark mode toggle",
  description: "Create navbar component"
})
```

### Background Execution

```javascript
Task({
  subagent_type: "qa-testing-expert",
  prompt: "Write comprehensive tests for the auth module",
  description: "Write auth tests",
  run_in_background: true
})
// Returns output_file path to check later
```

### Resuming an Agent

```javascript
Task({
  subagent_type: "Plan",
  prompt: "Continue with phase 2 of the implementation",
  description: "Continue planning",
  resume: "a5e4ce1"  // agentId from previous invocation
})
```

### Model Override

```javascript
Task({
  subagent_type: "database-expert",
  prompt: "Design a complex sharding strategy for our distributed database",
  description: "Design sharding strategy",
  model: "opus"  // Use opus instead of default sonnet
})
```
