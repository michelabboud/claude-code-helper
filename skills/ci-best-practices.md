---
skill_name: CI Best Practices
description: "CI pipeline design, parallel execution, caching strategies, and quality gates. Use when setting up CI/CD pipelines, configuring GitHub Actions, automating deployments, optimizing build times, or implementing quality gates. Triggers on 'CI/CD pipeline', 'GitHub Actions', 'deploy', 'build pipeline', 'continuous integration', 'automated deployment'."
category: DevOps
priority: P1
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
agent: devops-infrastructure-expert
version: 1.0.0
argument-hint: 'hello | hello ID'
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Continuous Integration Best Practices Skill

## Overview

A comprehensive skill for designing, implementing, and optimizing continuous integration (CI) pipelines. Covers pipeline architecture, parallel execution, caching strategies, automated testing, quality gates, and CI/CD best practices across different platforms.


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/ci-best-practices
cp ci-best-practices.md ~/.claude/skills/ci-best-practices/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/ci-best-practices
cp ci-best-practices.md .claude/skills/ci-best-practices/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Skill Configuration

```yaml
---
skill_name: CI Best Practices
description: Expert guidance on CI pipeline design, optimization, and automation best practices
version: 1.0.0
priority: high
tags: [ci-cd, devops, automation, testing, quality-gates]
---
```

## Core Concepts

### The CI Pipeline Philosophy

```
┌─────────────────────────────────────────────────────────┐
│                    CI Pipeline Stages                    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐ │
│  │ Lint │ → │ Test │ → │ Build│ → │ Scan │ → │Deploy│ │
│  └──────┘   └──────┘   └──────┘   └──────┘   └──────┘ │
│     ↓          ↓          ↓          ↓          ↓      │
│   Fast      Medium     Slower     Security   Staging   │
│  (< 1m)    (2-5m)     (5-10m)     Checks     Environment│
│                                                          │
└─────────────────────────────────────────────────────────┘

Key Principles:
- Fail Fast: Run quickest checks first
- Parallel Execution: Run independent stages concurrently
- Caching: Reuse dependencies and build artifacts
- Incremental: Only test/build what changed
- Idempotent: Same input = same output
```

## 1. Pipeline Architecture Patterns

### Sequential Pipeline (Simple Projects)

```yaml
# .github/workflows/ci-sequential.yml
name: CI Pipeline (Sequential)

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      # 1. Checkout
      - uses: actions/checkout@v4

      # 2. Setup
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      # 3. Install
      - name: Install dependencies
        run: npm ci

      # 4. Lint (Fast feedback)
      - name: Lint code
        run: npm run lint

      # 5. Type check
      - name: Type check
        run: npm run type-check

      # 6. Unit tests
      - name: Run unit tests
        run: npm test -- --coverage

      # 7. Build
      - name: Build application
        run: npm run build

      # 8. E2E tests (slowest)
      - name: Run E2E tests
        run: npm run test:e2e

      # 9. Security scan
      - name: Security scan
        run: npm audit --audit-level=moderate
```

### Parallel Pipeline (Optimized)

```yaml
# .github/workflows/ci-parallel.yml
name: CI Pipeline (Parallel)

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  # Job 1: Lint and Type Check (Fastest)
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

  # Job 2: Unit Tests (Fast)
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage --maxWorkers=4

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  # Job 3: Integration Tests
  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

  # Job 4: Build
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/
          retention-days: 7

  # Job 5: E2E Tests (Slowest)
  e2e-tests:
    runs-on: ubuntu-latest
    needs: build  # Wait for build to complete

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build
          path: dist/

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  # Job 6: Security Checks
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Dependency audit
        run: npm audit --audit-level=moderate

  # Job 7: Quality Gate
  quality-gate:
    runs-on: ubuntu-latest
    needs: [lint, unit-tests, integration-tests, build, e2e-tests, security]
    if: always()

    steps:
      - name: Check all jobs passed
        run: |
          if [ "${{ needs.lint.result }}" != "success" ] || \
             [ "${{ needs.unit-tests.result }}" != "success" ] || \
             [ "${{ needs.integration-tests.result }}" != "success" ] || \
             [ "${{ needs.build.result }}" != "success" ] || \
             [ "${{ needs.e2e-tests.result }}" != "success" ] || \
             [ "${{ needs.security.result }}" != "success" ]; then
            echo "❌ Quality gate failed"
            exit 1
          fi
          echo "✅ Quality gate passed"
```

## 2. Caching Strategies

### Dependency Caching

```yaml
# Node.js with npm
- name: Setup Node.js with cache
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'  # Automatically caches node_modules

# Python with pip
- name: Setup Python with cache
  uses: actions/setup-python@v4
  with:
    python-version: '3.11'
    cache: 'pip'

# Custom cache for monorepos
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.cache/pip
      node_modules
      */*/node_modules
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json', '**/requirements.txt') }}
    restore-keys: |
      ${{ runner.os }}-deps-
```

### Build Artifact Caching

```yaml
- name: Cache build output
  uses: actions/cache@v3
  with:
    path: |
      .next/cache
      dist/
      build/
    key: ${{ runner.os }}-build-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-build-

- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

### Test Result Caching

```yaml
# Jest cache
- name: Cache Jest
  uses: actions/cache@v3
  with:
    path: .jest-cache
    key: ${{ runner.os }}-jest-${{ hashFiles('**/package-lock.json') }}

# Playwright cache
- name: Cache Playwright browsers
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}
```

## 3. Matrix Testing (Multi-version Support)

```yaml
name: Matrix Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}

    strategy:
      # Continue even if one matrix job fails
      fail-fast: false

      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 22]
        # Exclude specific combinations
        exclude:
          - os: macos-latest
            node-version: 18

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }} on ${{ matrix.os }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - run: npm ci

      - run: npm test

  # Database matrix testing
  database-tests:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        database:
          - { type: postgres, version: '15', port: 5432 }
          - { type: postgres, version: '16', port: 5432 }
          - { type: mysql, version: '8.0', port: 3306 }

    services:
      database:
        image: ${{ matrix.database.type }}:${{ matrix.database.version }}
        env:
          POSTGRES_PASSWORD: postgres
          MYSQL_ROOT_PASSWORD: root
        ports:
          - ${{ matrix.database.port }}:${{ matrix.database.port }}

    steps:
      - uses: actions/checkout@v4

      - name: Test with ${{ matrix.database.type }}:${{ matrix.database.version }}
        run: npm run test:integration
        env:
          DATABASE_TYPE: ${{ matrix.database.type }}
          DATABASE_PORT: ${{ matrix.database.port }}
```

## 4. Monorepo CI Optimization

### Path-Based Triggering

```yaml
name: Monorepo CI

on:
  push:
    paths:
      - 'packages/**'
      - 'apps/**'
  pull_request:

jobs:
  # Detect changed packages
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.filter.outputs.frontend }}
      backend: ${{ steps.filter.outputs.backend }}
      shared: ${{ steps.filter.outputs.shared }}

    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            frontend:
              - 'apps/frontend/**'
              - 'packages/ui/**'
            backend:
              - 'apps/backend/**'
              - 'packages/api/**'
            shared:
              - 'packages/shared/**'
              - 'package.json'
              - 'tsconfig.json'

  # Only test changed packages
  test-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test --workspace=apps/frontend

  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test --workspace=apps/backend

  test-shared:
    needs: detect-changes
    if: needs.detect-changes.outputs.shared == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test --workspace=packages/shared
```

### Turborepo Integration

```yaml
name: Turborepo CI

on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2  # Needed for turbo to detect changes

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      # Turbo cache
      - name: Cache Turbo
        uses: actions/cache@v3
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-

      # Run tasks for changed packages only
      - name: Build
        run: npx turbo run build --filter="...[HEAD^]"

      - name: Test
        run: npx turbo run test --filter="...[HEAD^]" --coverage

      - name: Lint
        run: npx turbo run lint --filter="...[HEAD^]"
```

## 5. Quality Gates and Branch Protection

### Coverage Threshold Enforcement

```yaml
# Check coverage threshold
- name: Check coverage threshold
  run: |
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    THRESHOLD=80

    echo "Coverage: $COVERAGE%"
    echo "Threshold: $THRESHOLD%"

    if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
      echo "❌ Coverage $COVERAGE% is below threshold $THRESHOLD%"
      exit 1
    fi

    echo "✅ Coverage $COVERAGE% meets threshold"
```

### Code Quality Metrics

```yaml
# SonarCloud analysis
- name: SonarCloud Scan
  uses: SonarSource/sonarcloud-github-action@master
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  with:
    args: >
      -Dsonar.organization=my-org
      -Dsonar.projectKey=my-project
      -Dsonar.sources=src
      -Dsonar.tests=tests
      -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
      -Dsonar.qualitygate.wait=true

# CodeClimate
- name: Report to Code Climate
  uses: paambaati/codeclimate-action@v5
  env:
    CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
  with:
    coverageLocations: |
      ${{github.workspace}}/coverage/lcov.info:lcov
```

### Danger.js for PR Automation

```yaml
# .github/workflows/danger.yml
name: Danger

on: [pull_request]

jobs:
  danger:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: Run Danger
        run: npx danger ci
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

```typescript
// dangerfile.ts
import { danger, warn, fail, markdown } from 'danger'

// PR size check
const bigPRThreshold = 500
const additions = danger.github.pr.additions
const deletions = danger.github.pr.deletions

if (additions + deletions > bigPRThreshold) {
  warn(`:exclamation: This PR is quite large (${additions + deletions} lines). Consider breaking it into smaller PRs.`)
}

// Check for missing tests
const hasAppChanges = danger.git.modified_files.some(f => f.includes('src/'))
const hasTestChanges = danger.git.modified_files.some(f => f.includes('test') || f.includes('spec'))

if (hasAppChanges && !hasTestChanges) {
  warn('This PR modifies app code but does not include test changes.')
}

// Check for migration files without rollback
const hasMigrations = danger.git.created_files.some(f => f.includes('migrations/'))
if (hasMigrations) {
  const migrationFiles = danger.git.created_files.filter(f => f.includes('migrations/'))
  migrationFiles.forEach(file => {
    danger.git.structuredDiffForFile(file).then(diff => {
      const hasDown = diff?.chunks.some(chunk =>
        chunk.changes.some(change => change.content.includes('down'))
      )
      if (!hasDown) {
        fail(`Migration ${file} is missing a rollback (down) function`)
      }
    })
  })
}

// Enforce changelog update
const hasChangelog = danger.git.modified_files.includes('CHANGELOG.md')
const isFeature = danger.github.pr.title.toLowerCase().includes('feat')

if (isFeature && !hasChangelog) {
  fail('Feature PRs must update the CHANGELOG.md')
}

// Check for console.logs
const jsFiles = danger.git.modified_files.filter(f => f.endsWith('.ts') || f.endsWith('.js'))

jsFiles.forEach(async file => {
  const diff = await danger.git.diffForFile(file)
  if (diff && diff.added.includes('console.log')) {
    warn(`${file} contains console.log statements`)
  }
})

// Generate test coverage report
if (danger.git.modified_files.includes('coverage/coverage-summary.json')) {
  import('fs').then(fs => {
    const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf8'))
    const { lines, statements, functions, branches } = coverage.total

    markdown(`
## Test Coverage

| Metric | Coverage |
|--------|----------|
| Lines | ${lines.pct}% |
| Statements | ${statements.pct}% |
| Functions | ${functions.pct}% |
| Branches | ${branches.pct}% |
    `)

    if (lines.pct < 80) {
      warn(`Line coverage is ${lines.pct}%, below the 80% threshold`)
    }
  })
}
```

## 6. Security Scanning in CI

### Multi-Layer Security

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      # 1. Secret scanning
      - name: TruffleHog Secret Scan
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

      # 2. Dependency vulnerabilities
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci

      - name: npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      # 3. SAST (Static Application Security Testing)
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/owasp-top-ten

      # 4. License compliance
      - name: FOSSA License Scan
        uses: fossas/fossa-action@main
        with:
          api-key: ${{ secrets.FOSSA_API_KEY }}

      # 5. Container scanning (if using Docker)
      - name: Build Docker image
        run: docker build -t myapp:${{ github.sha }} .

      - name: Run Trivy container scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: myapp:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
```

## 7. Performance Monitoring in CI

### Bundle Size Tracking

```yaml
- name: Build application
  run: npm run build

- name: Analyze bundle size
  uses: andresz1/size-limit-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    skip_step: install
```

```javascript
// .size-limit.js
module.exports = [
  {
    name: 'Main bundle',
    path: 'dist/main.*.js',
    limit: '150 KB',
    webpack: false,
  },
  {
    name: 'Vendor bundle',
    path: 'dist/vendor.*.js',
    limit: '300 KB',
    webpack: false,
  },
]
```

### Lighthouse CI

```yaml
- name: Build and start server
  run: |
    npm run build
    npm run serve &
    sleep 5

- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      http://localhost:3000
      http://localhost:3000/dashboard
    uploadArtifacts: true
    temporaryPublicStorage: true
```

## 8. CI Pipeline Optimization Checklist

### Performance Optimization

```markdown
✅ Pipeline Optimization Checklist

**Parallel Execution**
- [ ] Independent jobs run in parallel
- [ ] Matrix strategy for multi-version testing
- [ ] Test suites split across multiple runners

**Caching**
- [ ] Dependencies cached (node_modules, pip packages)
- [ ] Build artifacts cached
- [ ] Docker layers cached
- [ ] Test results cached

**Fail Fast**
- [ ] Linting runs before tests
- [ ] Fast tests run before slow tests
- [ ] Unit tests before integration tests
- [ ] fail-fast: false only where needed

**Incremental Builds**
- [ ] Only build changed packages (monorepo)
- [ ] Affected tests only (Nx, Turbo)
- [ ] Skip unchanged artifacts

**Resource Optimization**
- [ ] Appropriate runner size
- [ ] Test concurrency configured
- [ ] Timeout limits set
- [ ] Artifact retention period optimized

**Conditional Execution**
- [ ] Path filters for monorepos
- [ ] Branch-specific workflows
- [ ] Skip CI for docs-only changes
```

## 9. Best Practices

### Do's ✅

```yaml
# 1. Use specific versions
- uses: actions/checkout@v4  # ✅ Specific version

# 2. Fail fast with linting
- name: Lint
  run: npm run lint

# 3. Cache dependencies
- uses: actions/setup-node@v4
  with:
    cache: 'npm'

# 4. Parallel independent jobs
jobs:
  lint: ...
  test: ...
  build: ...

# 5. Upload artifacts for debugging
- uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: debug-logs
    path: logs/

# 6. Set timeouts
jobs:
  test:
    timeout-minutes: 30

# 7. Use matrix for multi-version
strategy:
  matrix:
    node-version: [18, 20, 22]
```

### Don'ts ❌

```yaml
# 1. Don't use @latest or @master
- uses: actions/checkout@latest  # ❌ Unpredictable

# 2. Don't run everything sequentially
steps:
  - run: npm run lint
  - run: npm test
  - run: npm run build
  - run: npm run e2e  # ❌ Should be parallel jobs

# 3. Don't ignore failures silently
- run: npm test
  continue-on-error: true  # ❌ Hides problems

# 4. Don't reinstall dependencies in every job
# Use caching and artifacts instead

# 5. Don't hardcode secrets
- run: curl -H "Authorization: Bearer sk_live_..."  # ❌
# Use: ${{ secrets.API_KEY }}

# 6. Don't run CI on every path
on:
  push:  # ❌ Runs even for README changes
# Use path filters instead
```

## When to Use This Skill

Invoke the CI Best Practices skill when:

1. **Setting up new CI pipeline** for a project
2. **Optimizing slow CI** that takes too long to run
3. **Implementing quality gates** and branch protection
4. **Adding security scanning** to the pipeline
5. **Setting up monorepo CI** with selective testing
6. **Troubleshooting CI failures** and flaky tests
7. **Migrating CI** between platforms (Jenkins, GitLab, GitHub Actions)
8. **Implementing matrix testing** for multi-version support

## Example Workflows

### Complete CI Setup for Next.js App

```bash
# User request
"Set up CI for our Next.js + Postgres app with testing and deployment"

# Workflow steps
1. Create .github/workflows/ci.yml
2. Set up parallel jobs (lint, test, build, e2e)
3. Configure PostgreSQL service for integration tests
4. Add caching for npm and Next.js build
5. Implement quality gates (coverage > 80%)
6. Add security scanning (Snyk, npm audit)
7. Deploy to Vercel on main branch
8. Add PR comments with test results
```

### Monorepo CI Optimization

```bash
# User request
"Our monorepo CI takes 45 minutes. Help optimize it"

# Workflow steps
1. Analyze current pipeline bottlenecks
2. Implement path-based filtering
3. Add Turborepo for incremental builds
4. Parallelize all independent jobs
5. Add aggressive caching
6. Split large test suites
7. Result: 45min → 8min
```

## Related Resources

- **Release Management Skill**: `skills/release-management.md`
- **Testing Strategy Guide**: `guides/advanced-patterns/testing-strategy.md`
- **DevOps Expert Agent**: `agents/domain-experts/devops-infrastructure-expert.md`
- **QA/Testing Expert Agent**: `agents/domain-experts/qa-testing-expert.md`

**Last Updated**: 2026-01-10
**Maintained by**: Claude Code Helper Project

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

## Handshake Protocol

If invoked with argument `hello`:
> 👋 Hello! I'm **CI Best Practices** v1.0.0. Continuous integration best practices, GitHub Actions, testing pipelines. Use `/ci-best-practices hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: CI Best Practices v1.0.0
- **What it covers**: CI pipeline design, parallel execution, caching strategies, quality gates, GitHub Actions workflows, automated testing in CI, and DevOps best practices
- **How to invoke**: `/ci-best-practices` (Claude Code will load this skill as context)
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
