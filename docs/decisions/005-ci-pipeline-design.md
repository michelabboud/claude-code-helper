# ADR 005: CI Pipeline Architecture

- **Status**: Accepted
- **Date**: 2026-02-20
- **Author**: Michel Abboud

## Context

The repository initially had no continuous integration. All validation was manual: developers ran builds and tests locally before committing. As the codebase grew to 11 npm projects, 47 agents, 18 skills, and 5 hooks, manual validation became unreliable:

- TypeScript errors in MCP servers were committed and discovered only when users tried to build
- Agent frontmatter syntax errors were found only when Claude Code failed to load the agent
- Shell scripts with bugs passed review undetected
- Broken links in documentation accumulated silently
- No performance baseline existed; regressions went unnoticed

## Decision

Implement a GitHub Actions CI pipeline (`.github/workflows/ci.yml`) with 13 jobs organized into logical groups:

**Build and Test Group:**
- `build-matrix` - Builds each MCP server in parallel using a job matrix; fails fast if any server does not compile
- `test-matrix` - Runs each server's test suite in parallel; reports coverage per server
- `typecheck` - Runs `tsc --noEmit` across all TypeScript projects to catch type errors without producing output

**Quality Group:**
- `lint` - ESLint across all TypeScript source files; configured to fail on errors (warnings are tolerated for existing code)
- `shellcheck` - Static analysis of all `.sh` scripts using ShellCheck; catches common bash pitfalls
- `frontmatter-validation` - Custom script that parses YAML frontmatter in all agent `.md` files and validates required fields (`name`, `description`, `tools`)
- `version-index-validation` - Verifies that `component-versions.json` contains an entry for every distributable file; prevents missing version registrations

**Security and Compliance Group:**
- `security-scan` - Runs `npm audit` across all workspaces; fails on high or critical severity findings

**Documentation Group:**
- `link-validation` - Crawls all Markdown files and checks that internal links resolve to existing files

**Performance Group:**
- `benchmarks` - Runs tool invocation benchmarks against each MCP server; results are stored as artifacts and compared against the previous run baseline to detect regressions

## Consequences

**Positive:**
- Comprehensive quality gates prevent regressions across build, types, style, security, documentation, and performance dimensions
- Parallel job execution keeps total pipeline time reasonable despite the number of checks
- Frontmatter and version index validation catches class of errors that are invisible to TypeScript and linting tools
- Benchmark tracking over time provides an objective performance history; regressions are caught before merge

**Negative:**
- Before npm workspaces (ADR 004) are fully adopted, each build/test matrix job runs its own `npm install`, making the pipeline slow due to repeated dependency resolution
- 13 jobs consume significant GitHub Actions minutes for a public repository; free-tier limits may be reached under heavy development activity
- Benchmark jobs are flaky on shared CI runners due to variable load; results require a margin of tolerance to avoid false failures
- Maintaining 13 job definitions increases the operational burden when the project structure changes (e.g., adding a new MCP server requires updating the build and test matrix configurations)
