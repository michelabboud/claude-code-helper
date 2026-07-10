# CI/CD Pipeline MCP Server

A Model Context Protocol (MCP) server for CI/CD pipeline generation, optimization, and management. **Full pipeline generation currently targets GitHub Actions only.** GitLab CI, Jenkins, and CircleCI generation is scaffold-only (not yet implemented) — see [Platform Support](#platform-support) below. Optimization, validation, cost estimation, and troubleshooting tools accept all four platform values and run their (platform-agnostic) heuristics regardless.

## Overview

This MCP server enables Claude to design, generate, optimize, and troubleshoot CI/CD pipelines with best practices for testing, security scanning, deployment strategies, and performance optimization.

## Features

- **Pipeline Generation**: Full CI/CD configs for GitHub Actions; GitLab CI, Jenkins, and CircleCI currently return a minimal scaffold only (not yet implemented)
- **Pipeline Optimization**: Analyze and improve pipeline performance
- **Troubleshooting**: Diagnose pipeline failures and suggest fixes
- **Security Scanning**: Integrate security tools into pipelines
- **Deployment Strategies**: Implement blue-green, canary, rolling updates
- **Cost Estimation**: Calculate CI/CD runner costs
- **Caching Strategies**: Optimize build times with intelligent caching
- **Matrix Testing**: `optimize_pipeline` can *suggest* matrix builds as an optimization; `generate_pipeline` does not emit matrix configuration

## Installation

```bash
npm install @modelcontextprotocol/sdk
npm install js-yaml
npm install @octokit/rest
```

## Tools Provided

### 1. `generate_pipeline`

Generate CI/CD pipeline configuration for specified platform.

**Parameters**:
- `platform` (string): Target platform (github-actions, gitlab-ci, jenkins, circleci). **Only `github-actions` has full template generation.** `gitlab-ci`, `jenkins`, and `circleci` return a minimal JSON scaffold with an explicit "not yet implemented" note instead of a working pipeline.
- `project_type` (string): Project type (nodejs, python, go, rust, java, docker)
- `features` (array): Jobs to include (github-actions only). `linting` → lint job, `testing` → test job, `build` → build job, `deploy` → adds a deployment job (needs `deployment_target`), `security-scan` → adds a Snyk security job. For `go`/`rust`/`java`/`docker` project types, build and test are combined into a single job, which is included if either `build` or `testing` is requested.
- `deployment_target` (string): Where to deploy (vercel, aws, gcp, azure, kubernetes, docker-hub) — `vercel`, `aws`, and `kubernetes` produce a real deployment job; `gcp`, `azure`, and `docker-hub` are accepted by the schema but have no job template yet, so `generate_pipeline` emits an explicit placeholder deploy step for them instead.

**Example**:
```javascript
await mcp.call('generate_pipeline', {
  platform: 'github-actions',
  project_type: 'nodejs',
  features: ['linting', 'testing', 'build', 'deploy', 'security-scan'],
  deployment_target: 'vercel',
  options: {
    node_version: '20',
    test_framework: 'jest',
    parallel_jobs: true,
    caching: true
  }
})
```

**Returns**:
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 2. `optimize_pipeline`

Analyze existing pipeline and suggest optimizations.

**Parameters**:
- `pipeline_file` (string): Path to pipeline configuration file
- `platform` (string): CI/CD platform
- `focus_areas` (array): Areas to optimize (speed, cost, reliability, security)

**Example**:
```javascript
await mcp.call('optimize_pipeline', {
  pipeline_file: '.github/workflows/ci.yml',
  platform: 'github-actions',
  focus_areas: ['speed', 'cost']
})
```

**Returns**:
```json
{
  "current_stats": {
    "average_duration": "15m 30s",
    "monthly_cost_estimate": "$120",
    "jobs": 6,
    "parallel_jobs": 2
  },
  "optimizations": [
    {
      "type": "parallelization",
      "impact": "high",
      "time_saved": "5-7 minutes",
      "description": "Run lint, test, and security scans in parallel",
      "implementation": "Remove 'needs' dependencies between independent jobs"
    },
    {
      "type": "caching",
      "impact": "medium",
      "time_saved": "2-3 minutes",
      "cost_saved": "$20/month",
      "description": "Add dependency caching for npm install",
      "implementation": "Add cache: 'npm' to setup-node action"
    },
    {
      "type": "conditional_execution",
      "impact": "medium",
      "cost_saved": "$30/month",
      "description": "Skip CI for documentation-only changes",
      "implementation": "Add path filters to trigger conditions"
    }
  ],
  "projected_stats": {
    "average_duration": "8m 15s",
    "monthly_cost_estimate": "$70",
    "improvement": "47% faster, 42% cheaper"
  }
}
```

### 3. `troubleshoot_failure`

Analyze pipeline failure logs and suggest fixes.

**Parameters**:
- `pipeline_file` (string): Pipeline configuration
- `failure_logs` (string): Error logs from failed run
- `platform` (string): CI/CD platform

**Example**:
```javascript
await mcp.call('troubleshoot_failure', {
  pipeline_file: '.github/workflows/ci.yml',
  failure_logs: `
    Error: Cannot find module 'typescript'
    at Function.Module._resolveFilename
    ...
  `,
  platform: 'github-actions'
})
```

**Returns**:
```json
{
  "diagnosis": {
    "error_type": "missing_dependency",
    "severity": "high",
    "affected_job": "build",
    "root_cause": "TypeScript not installed - likely using npm ci which requires package-lock.json"
  },
  "solutions": [
    {
      "priority": "high",
      "fix": "Ensure package-lock.json is committed",
      "explanation": "npm ci requires package-lock.json to be present",
      "command": "git add package-lock.json && git commit"
    },
    {
      "priority": "medium",
      "fix": "Switch to npm install if package-lock.json should not be used",
      "explanation": "npm install will generate package-lock.json if missing",
      "diff": "- run: npm ci\n+ run: npm install"
    },
    {
      "priority": "low",
      "fix": "Add typescript as explicit dependency",
      "explanation": "Ensures TypeScript is always installed",
      "command": "npm install --save-dev typescript"
    }
  ]
}
```

### 4. `estimate_cost`

Calculate CI/CD runner costs based on pipeline configuration.

**Parameters**:
- `pipeline_file` (string): Pipeline configuration
- `platform` (string): CI/CD platform
- `monthly_runs` (number): Expected monthly executions
- `runner_types` (object): Runner specifications

**Example**:
```javascript
await mcp.call('estimate_cost', {
  pipeline_file: '.github/workflows/ci.yml',
  platform: 'github-actions',
  monthly_runs: 500,
  runner_types: {
    'ubuntu-latest': { cpu: 2, ram: 7, cost_per_minute: 0.008 }
  }
})
```

**Returns**:
```json
{
  "breakdown": {
    "lint": {
      "avg_duration": "2m",
      "runs_per_month": 500,
      "cost_per_run": "$0.016",
      "monthly_cost": "$8.00"
    },
    "test": {
      "avg_duration": "5m",
      "runs_per_month": 500,
      "cost_per_run": "$0.04",
      "monthly_cost": "$20.00"
    },
    "build": {
      "avg_duration": "3m",
      "runs_per_month": 400,
      "cost_per_run": "$0.024",
      "monthly_cost": "$9.60"
    }
  },
  "total_monthly_cost": "$37.60",
  "optimization_potential": "$12.00",
  "recommendations": [
    "Use smaller runner for lint job (save $3/month)",
    "Cache dependencies (save $6/month)",
    "Skip CI for docs changes (save $3/month)"
  ]
}
```

### 5. `validate_pipeline`

Check pipeline syntax and best practices.

**Parameters**:
- `pipeline_file` (string): Pipeline configuration
- `platform` (string): CI/CD platform
- `strict` (boolean): Enable strict validation

**Example**:
```javascript
await mcp.call('validate_pipeline', {
  pipeline_file: '.github/workflows/ci.yml',
  platform: 'github-actions',
  strict: true
})
```

**Returns**:
```json
{
  "valid": false,
  "syntax_errors": [],
  "warnings": [
    {
      "line": 15,
      "message": "Using actions/checkout@v2 - upgrade to v4",
      "severity": "medium",
      "category": "outdated_action"
    },
    {
      "line": 25,
      "message": "Secret 'API_KEY' hardcoded in workflow",
      "severity": "critical",
      "category": "security"
    }
  ],
  "best_practice_violations": [
    {
      "rule": "cache_dependencies",
      "message": "No dependency caching configured",
      "impact": "performance"
    },
    {
      "rule": "timeout_limits",
      "message": "No timeout set for jobs",
      "impact": "cost"
    }
  ]
}
```

### 6. `generate_deployment`

Create deployment workflow with specified strategy.

**Parameters**:
- `strategy` (string): Deployment strategy (blue-green, canary, rolling, recreate)
- `platform` (string): Target platform (kubernetes, ecs, lambda, vercel)
- `health_checks` (boolean): Include health check steps
- `rollback` (boolean): Include rollback procedures

**Example**:
```javascript
await mcp.call('generate_deployment', {
  strategy: 'blue-green',
  platform: 'kubernetes',
  health_checks: true,
  rollback: true
})
```

**Returns**: Complete deployment workflow with blue-green strategy implementation.

### 7. `security_scan_pipeline`

Add security scanning tools to existing pipeline.

**Parameters**:
- `pipeline_file` (string): Existing pipeline configuration
- `scan_types` (array): Types of scans (sast, dependency, container, secret)
- `tools` (array): Tool hint — **only `sast` honors this**: include `"semgrep"` to generate a Semgrep CLI step (labeled `semgrep`); otherwise SAST defaults to GitHub CodeQL (labeled `codeql`). `dependency`, `container`, and `secret` scans always use Snyk, Trivy, and TruffleHog respectively — other names in `tools` (e.g. `dependabot`, `grype`, `gitleaks`) are accepted but do not change the generated step.

**Example**:
```javascript
await mcp.call('security_scan_pipeline', {
  pipeline_file: '.github/workflows/ci.yml',
  scan_types: ['sast', 'dependency', 'secret'],
  tools: ['semgrep', 'snyk', 'trufflehog']
})
// -> sast uses Semgrep (tools included "semgrep"); dependency uses Snyk; secret uses TruffleHog
```

### 8. `generate_rollback`

Create rollback procedures for deployment.

**Parameters**:
- `deployment_platform` (string): Deployment target
- `rollback_strategy` (string): How to rollback (previous-version, specific-version, snapshot)
- `automated` (boolean): Enable automated rollback

## Installation

```bash
cd mcp-servers/cicd-pipeline
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cicd-pipeline": {
      "command": "node",
      "args": ["/path/to/cicd-pipeline/build/index.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token",
        "GITLAB_TOKEN": "your_gitlab_token"
      }
    }
  }
}
```

## Usage Patterns

### Complete CI Setup

```javascript
// 1. Generate pipeline
const pipeline = await mcp.call('generate_pipeline', {
  platform: 'github-actions',
  project_type: 'nodejs',
  features: ['linting', 'testing', 'build', 'security-scan', 'deploy']
})

// 2. Validate pipeline
const validation = await mcp.call('validate_pipeline', {
  pipeline_file: '.github/workflows/ci.yml',
  platform: 'github-actions'
})

// 3. Estimate costs
const costs = await mcp.call('estimate_cost', {
  pipeline_file: '.github/workflows/ci.yml',
  platform: 'github-actions',
  monthly_runs: 500
})

// 4. Optimize if needed
if (costs.total_monthly_cost > 50) {
  const optimizations = await mcp.call('optimize_pipeline', {
    pipeline_file: '.github/workflows/ci.yml',
    focus_areas: ['cost', 'speed']
  })
}
```

### Troubleshooting Workflow

```javascript
// When CI fails
const diagnosis = await mcp.call('troubleshoot_failure', {
  pipeline_file: '.github/workflows/ci.yml',
  failure_logs: errorLogs,
  platform: 'github-actions'
})

// Apply suggested fixes
for (const solution of diagnosis.solutions) {
  console.log(`${solution.priority}: ${solution.fix}`)
  console.log(`Command: ${solution.command}`)
}
```

## Platform Support

### GitHub Actions — implemented

`generate_pipeline` produces real workflow YAML:
- Project templates for `nodejs` (lint/test/build jobs), `python` (lint/test jobs), and `go`/`rust`/`java`/`docker` (single combined build+test job)
- Job selection driven by the `features` input (see `generate_pipeline` above)
- Optional Snyk-based security job (`security-scan` feature)
- Optional deployment job for `vercel`, `aws`, or `kubernetes` targets (`deploy` feature); other targets get an explicit placeholder step

**Not implemented** by the generator: matrix builds, reusable workflows, composite actions, environment protection rules. (`optimize_pipeline` can *suggest* matrix testing as an optimization, but `generate_pipeline` does not emit it.)

### GitLab CI, Jenkins, CircleCI — not implemented

`generate_pipeline` has no templates for these platforms yet. Calling it with `platform: "gitlab-ci"`, `"jenkins"`, or `"circleci"` returns a minimal JSON scaffold (platform, project type, features, and an explicit "not yet implemented" note) instead of a working pipeline — use it as a placeholder and write the real configuration by hand.

The other tools — `optimize_pipeline`, `validate_pipeline`, `estimate_cost`, `troubleshoot_failure` — accept these platform values and run their platform-agnostic heuristics against pipeline content you provide (e.g. cost-per-minute lookup, generic keyword checks), but they do not parse GitLab CI/Jenkins/CircleCI syntax specifically.

## Best Practices

### Pipeline Structure
```yaml
# ✅ Good: Parallel independent jobs
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]
  test:
    runs-on: ubuntu-latest
    steps: [...]
  build:
    needs: [lint, test]
    steps: [...]
```

### Caching Strategy
```yaml
# ✅ Good: Multi-layer caching
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.cache
      node_modules
    key: ${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
```

### Security
```yaml
# ✅ Good: Use secrets, not hardcoded values
env:
  API_KEY: ${{ secrets.API_KEY }}

# ❌ Bad: Hardcoded secrets
env:
  API_KEY: "sk_live_abc123..."
```

## Related Resources

- **CI Best Practices Skill**: `skills/ci-best-practices.md`
- **Release Management Skill**: `skills/release-management.md`
- **DevOps Expert Agent**: `agents/domain-experts/devops-infrastructure-expert.md`

---

**Version**: 1.0.0
**Last Updated**: 2026-07-10
**Platforms**: GitHub Actions (full pipeline generation) — GitLab CI, Jenkins, CircleCI (analysis tools only; pipeline generation is scaffold-only, not yet implemented)
**Status**: GitHub Actions generation, optimization, validation, cost estimation, and troubleshooting are functional. GitLab CI/Jenkins/CircleCI *generation* is not implemented — see [Platform Support](#platform-support).

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 11 MCP servers, and comprehensive guides.
