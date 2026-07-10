---
name: release-management
skill_name: Release Management
description: Semantic versioning, release planning, deployment strategies, and rollback procedures
category: DevOps & Deployment
priority: P1
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
agent: devops-infrastructure-expert
context: fork
version: 1.0.0
argument-hint: 'hello | hello ID'
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Release Management Skill

Comprehensive guide to planning, executing, and managing software releases with confidence and minimal risk.

## Table of Contents

1. [Semantic Versioning](#semantic-versioning)
2. [Release Types](#release-types)
3. [Release Planning](#release-planning)
4. [Deployment Strategies](#deployment-strategies)
5. [Release Automation](#release-automation)
6. [Rollback Procedures](#rollback-procedures)
7. [Feature Flags](#feature-flags)
8. [Release Notes & Changelog](#release-notes--changelog)
9. [Monitoring & Validation](#monitoring--validation)
10. [Best Practices](#best-practices)


## 📦 Installation

Copy this skill to your Claude Code skills directory:

```bash
# Global installation (available to all projects)
mkdir -p ~/.claude/skills/release-management
cp release-management.md ~/.claude/skills/release-management/SKILL.md

# Or project-specific installation
mkdir -p .claude/skills/release-management
cp release-management.md .claude/skills/release-management/SKILL.md
```

The skill will be automatically detected and hot-reloaded by Claude Code.

**Usage**: Once installed, Claude Code will use this skill automatically when relevant to your requests.

## Semantic Versioning

### Version Format: MAJOR.MINOR.PATCH

```
2.4.7
│ │ │
│ │ └─ PATCH: Bug fixes (backward compatible)
│ └─── MINOR: New features (backward compatible)
└───── MAJOR: Breaking changes (not backward compatible)
```

### Versioning Rules

**MAJOR** (1.0.0 → 2.0.0):
- Breaking API changes
- Removed features
- Changed behavior that breaks existing usage
- Database schema changes requiring migration

**MINOR** (1.0.0 → 1.1.0):
- New features added
- Functionality enhanced
- Deprecated features (but still working)
- Performance improvements

**PATCH** (1.0.0 → 1.0.1):
- Bug fixes
- Security patches
- Documentation updates
- Internal refactoring

### Pre-release Versions

```
1.0.0-alpha.1    # Early development
1.0.0-alpha.2
1.0.0-beta.1     # Feature complete, testing
1.0.0-beta.2
1.0.0-rc.1       # Release candidate
1.0.0-rc.2
1.0.0            # Stable release
```

### Build Metadata

```
1.0.0+20260110
1.0.0+build.123
1.0.0-beta.1+exp.sha.5114f85
```

### Versioning Examples

```bash
# Initial development
0.1.0  # First working version
0.2.0  # Add new features
0.3.1  # Bug fix

# First stable release
1.0.0  # Production ready!

# Bug fixes
1.0.1  # Fix critical bug
1.0.2  # Fix another bug

# New features
1.1.0  # Add user profiles
1.2.0  # Add notifications

# Breaking changes
2.0.0  # New API structure
```

## Release Types

### 1. Major Release

**Characteristics**:
- Breaking changes
- Significant new features
- Architecture changes
- Migration required

**Planning Time**: 3-6 months
**Testing**: Extensive (beta, RC)
**Communication**: Advance notice, migration guides

**Example**:
```
v2.0.0: Complete API Redesign

Breaking Changes:
- Changed authentication from sessions to JWT
- Renamed all API endpoints
- Updated database schema
- Removed deprecated features

Migration Guide:
- Update authentication: [link]
- API endpoint mapping: [link]
- Database migration: [link]
```

### 2. Minor Release

**Characteristics**:
- New features
- Enhancements
- No breaking changes
- Backward compatible

**Planning Time**: 2-4 weeks
**Testing**: Standard QA
**Communication**: Release notes

**Example**:
```
v1.5.0: Dark Mode & Export Features

New Features:
- Dark mode support
- Export data to CSV
- Advanced filtering
- Performance improvements

Enhancements:
- Faster loading times
- Better error messages
- Updated UI components
```

### 3. Patch Release

**Characteristics**:
- Bug fixes only
- Security patches
- No new features
- Urgent fixes

**Planning Time**: 1-3 days
**Testing**: Focused regression
**Communication**: Brief changelog

**Example**:
```
v1.4.3: Critical Bug Fixes

Bug Fixes:
- Fixed authentication timeout issue
- Resolved data export corruption
- Fixed memory leak in background sync

Security:
- Patched XSS vulnerability (CVE-2026-1234)
```

### 4. Hotfix Release

**Characteristics**:
- Emergency fix
- Production issue
- Skip normal process
- Immediate deployment

**Planning Time**: Hours
**Testing**: Minimal, focused
**Communication**: Incident report

**Example**:
```
v1.4.2: Emergency Hotfix

Critical Fix:
- Resolved payment processing failure
- Affected users: All premium subscriptions
- Downtime: 15 minutes
- Root cause: Database connection pool exhaustion
```

## Release Planning

### Release Checklist

#### Pre-Release (2 weeks before)

```markdown
- [ ] Feature freeze
- [ ] Code review completed
- [ ] All tests passing
- [ ] Performance testing done
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Release notes drafted
- [ ] Migration scripts tested
- [ ] Rollback plan prepared
- [ ] Stakeholders notified
```

#### Release Day

```markdown
- [ ] Final smoke tests
- [ ] Database backups verified
- [ ] Deployment runbook ready
- [ ] Team available (on-call)
- [ ] Monitoring dashboards prepared
- [ ] Communication channels ready
- [ ] Deploy to staging
- [ ] Validate staging
- [ ] Deploy to production
- [ ] Validate production
- [ ] Monitor metrics
- [ ] Announce release
```

#### Post-Release (1 week after)

```markdown
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Update documentation
- [ ] Retrospective meeting
- [ ] Address quick wins
- [ ] Plan next release
```

### Release Schedule Example

```
Sprint 1 (Week 1-2):
- Feature development
- Unit tests

Sprint 2 (Week 3-4):
- Feature completion
- Integration tests

Code Freeze (Week 5):
- Bug fixes only
- QA testing
- Security review

Beta Release (Week 5):
- Internal testing
- Selected customers

RC Release (Week 6):
- Final testing
- Performance validation

Production Release (Week 7):
- Monday 9 AM UTC
- All hands on deck
- Monitoring active

Post-Release (Week 8):
- Bug fixes
- Minor improvements
- Retrospective
```

## Deployment Strategies

### 1. Blue-Green Deployment

**Concept**: Two identical environments, switch traffic instantly

```
┌─────────────┐
│   Load      │
│  Balancer   │
└──────┬──────┘
       │
       ├─────────┐
       │         │
   ┌───▼───┐ ┌──▼────┐
   │ Blue  │ │ Green │
   │ (v1)  │ │ (v2)  │
   │ LIVE  │ │ IDLE  │
   └───────┘ └───────┘

Step 1: Deploy v2 to Green
Step 2: Test Green
Step 3: Switch traffic to Green
Step 4: Blue becomes idle (rollback ready)
```

**Pros**:
- Instant switch
- Easy rollback
- Zero downtime

**Cons**:
- Double infrastructure cost
- Database challenges
- State synchronization

**Implementation**:
```yaml
# Kubernetes example
apiVersion: v1
kind: Service
metadata:
  name: my-app
spec:
  selector:
    app: my-app
    version: v2  # Switch from v1 to v2
```

### 2. Canary Deployment

**Concept**: Gradually increase traffic to new version

```
Step 1: 5% traffic → v2
        95% traffic → v1
        (Monitor metrics)

Step 2: 25% traffic → v2
        75% traffic → v1
        (Monitor metrics)

Step 3: 50% traffic → v2
        50% traffic → v1
        (Monitor metrics)

Step 4: 100% traffic → v2
        (Success!)
```

**Pros**:
- Low risk
- Early issue detection
- Real user validation

**Cons**:
- Slower rollout
- Complex monitoring
- Mixed versions running

**Implementation**:
```yaml
# Istio example
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: my-app
spec:
  http:
  - match:
    - headers:
        cookie:
          regex: "^(.*?;)?(canary=true)(;.*)?$"
    route:
    - destination:
        host: my-app
        subset: v2
      weight: 100
  - route:
    - destination:
        host: my-app
        subset: v1
      weight: 95
    - destination:
        host: my-app
        subset: v2
      weight: 5
```

### 3. Rolling Deployment

**Concept**: Replace instances gradually

```
Initial: [v1] [v1] [v1] [v1]
Step 1:  [v2] [v1] [v1] [v1]
Step 2:  [v2] [v2] [v1] [v1]
Step 3:  [v2] [v2] [v2] [v1]
Final:   [v2] [v2] [v2] [v2]
```

**Pros**:
- No extra infrastructure
- Gradual rollout
- Built into Kubernetes

**Cons**:
- Mixed versions
- Slower deployment
- Harder rollback

**Implementation**:
```yaml
# Kubernetes rolling update
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Max 1 extra pod
      maxUnavailable: 1  # Max 1 unavailable
```

### 4. Recreate Deployment

**Concept**: Stop old, start new (downtime)

```
Step 1: Stop all v1 instances
        [DOWNTIME]
Step 2: Start all v2 instances
Step 3: Service restored
```

**Pros**:
- Simple
- No mixed versions
- Clean state

**Cons**:
- Downtime
- Risky
- Slow rollback

**When to Use**:
- Maintenance windows
- Dev/test environments
- Breaking schema changes

## Release Automation

### Release Pipeline

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT

      - name: Run tests
        run: npm run test:ci

      - name: Build artifacts
        run: npm run build

      - name: Create GitHub Release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ steps.version.outputs.VERSION }}
          body_path: CHANGELOG.md
          draft: false
          prerelease: false

      - name: Deploy to production
        if: "!contains(github.ref, '-')"  # Not pre-release
        run: ./deploy.sh production

  notify:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Release ${{ steps.version.outputs.VERSION }} deployed!"
            }
```

### Version Bumping

```bash
# Manual versioning
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0

# With message
npm version patch -m "Release %s: Bug fixes"

# Automated with Conventional Commits
npx standard-version  # Analyzes commits, bumps version
```

### Release Script

```bash
#!/bin/bash
# release.sh

set -e

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "Must be on main branch"
  exit 1
fi

# Ensure clean working directory
if [ -n "$(git status --porcelain)" ]; then
  echo "Working directory not clean"
  exit 1
fi

# Run tests
echo "Running tests..."
npm test

# Build
echo "Building..."
npm run build

# Get new version
echo "Current version: $(jq -r .version package.json)"
read -p "New version (MAJOR.MINOR.PATCH): " VERSION

# Update version
npm version $VERSION --no-git-tag-version

# Update changelog
npx conventional-changelog -p angular -i CHANGELOG.md -s

# Commit
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore: release v$VERSION"

# Tag
git tag -a "v$VERSION" -m "Release v$VERSION"

# Push
git push origin main
git push origin "v$VERSION"

echo "Release v$VERSION created!"
echo "GitHub Actions will handle deployment"
```

## Rollback Procedures

### When to Rollback

🚨 **Immediate Rollback Triggers**:
- Critical security vulnerability
- Data corruption
- Complete service outage
- Error rate > 5%
- Performance degradation > 50%

⚠️ **Consider Rollback**:
- Error rate > 1%
- User complaints increasing
- Key feature broken
- Performance issues

### Rollback Methods

#### 1. Blue-Green Rollback

```bash
# Instant rollback
kubectl patch service my-app -p '{"spec":{"selector":{"version":"v1"}}}'

# Verify
curl https://api.example.com/health
```

#### 2. Rolling Rollback

```bash
# Rollback deployment
kubectl rollout undo deployment/my-app

# Rollback to specific revision
kubectl rollout undo deployment/my-app --to-revision=2

# Monitor rollback
kubectl rollout status deployment/my-app
```

#### 3. Database Rollback

```sql
-- Backup before release
pg_dump mydb > backup_v1.4.0.sql

-- Rollback migration
npx prisma migrate rollback

-- Or restore backup
psql mydb < backup_v1.4.0.sql
```

### Rollback Checklist

```markdown
1. [ ] Identify issue severity
2. [ ] Notify team (incident channel)
3. [ ] Capture error logs/metrics
4. [ ] Rollback application
5. [ ] Rollback database (if needed)
6. [ ] Verify rollback successful
7. [ ] Monitor metrics
8. [ ] Communicate to users
9. [ ] Post-mortem scheduled
10. [ ] Root cause analysis
```

## Feature Flags

### Why Feature Flags?

- Deploy code without enabling features
- Test in production safely
- Gradual rollout to users
- A/B testing
- Emergency kill switch

### Implementation

```typescript
// Feature flag service
class FeatureFlagService {
  async isEnabled(
    flagName: string,
    userId?: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const flag = await this.getFlag(flagName)

    if (!flag.enabled) return false

    // Percentage rollout
    if (flag.percentage < 100) {
      if (!userId) return false

      const hash = this.hash(userId + flagName)
      if (hash > flag.percentage) return false
    }

    // User targeting
    if (flag.userWhitelist?.includes(userId)) return true
    if (flag.userBlacklist?.includes(userId)) return false

    // Environment targeting
    if (flag.environments && !flag.environments.includes(process.env.NODE_ENV)) {
      return false
    }

    return true
  }
}

// Usage
if (await featureFlags.isEnabled('dark-mode', user.id)) {
  // Show dark mode toggle
}
```

### Flag Configuration

```json
{
  "dark-mode": {
    "enabled": true,
    "percentage": 50,
    "environments": ["production"],
    "userWhitelist": ["admin@example.com"]
  },
  "new-checkout": {
    "enabled": true,
    "percentage": 10,
    "environments": ["production"],
    "startDate": "2026-01-15T00:00:00Z",
    "endDate": "2026-02-01T00:00:00Z"
  }
}
```

### Flag Lifecycle

```
1. Development:
   - Flag disabled everywhere
   - Develop feature behind flag

2. Testing:
   - Enable for QA environment
   - Internal testing

3. Canary:
   - Enable for 5% of users
   - Monitor metrics

4. Gradual Rollout:
   - 5% → 25% → 50% → 100%
   - Monitor at each step

5. Cleanup:
   - Remove flag after 30 days
   - Feature is now permanent
```

## Release Notes & Changelog

### Changelog Format (Keep a Changelog)

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- New feature in development

## [2.0.0] - 2026-01-10
### Added
- Dark mode support
- Export data to CSV
- Advanced search filters

### Changed
- **BREAKING**: Changed API authentication to JWT
- Updated UI design
- Improved performance by 50%

### Deprecated
- Old authentication method (will be removed in v3.0.0)

### Removed
- **BREAKING**: Removed XML export format
- Removed deprecated v1 API endpoints

### Fixed
- Fixed memory leak in background sync
- Resolved XSS vulnerability (CVE-2026-1234)

### Security
- Updated dependencies to patch vulnerabilities
- Implemented rate limiting

## [1.5.0] - 2026-01-03
### Added
- User profile avatars
- Email notifications

### Fixed
- Fixed date formatting in reports
- Resolved timezone issues

[Unreleased]: https://github.com/user/repo/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/user/repo/compare/v1.5.0...v2.0.0
[1.5.0]: https://github.com/user/repo/compare/v1.4.0...v1.5.0
```

### Release Notes Template

```markdown
# Release v2.0.0 - Major Update

**Release Date**: January 10, 2026
**Type**: Major Release

## 🎉 Highlights

- Complete redesign with dark mode
- 50% faster performance
- New export features

## ⚠️ Breaking Changes

**Authentication Changes**
- Migrated from sessions to JWT tokens
- Action Required: Update your API integration
- [Migration Guide](./docs/migration-v2.md)

**API Endpoint Changes**
- `/api/users` → `/api/v2/users`
- Action Required: Update API calls
- [API Documentation](./docs/api-v2.md)

## ✨ New Features

### Dark Mode
Switch between light and dark themes in user settings.

### CSV Export
Export all your data to CSV format for analysis.
```
Settings → Data → Export to CSV
```

### Advanced Filters
More powerful filtering with AND/OR operators.

## 🔧 Improvements

- **Performance**: 50% faster page loads
- **UI**: Modern, clean design
- **Accessibility**: WCAG 2.1 AA compliant

## 🐛 Bug Fixes

- Fixed memory leak in real-time sync
- Resolved timezone display issues
- Fixed export corrupted files issue

## 🔐 Security

- Patched XSS vulnerability (CVE-2026-1234)
- Updated all dependencies
- Implemented rate limiting

## 📊 Metrics

- Bundle size reduced by 30%
- API response time improved by 40%
- Test coverage increased to 85%

## 🚀 Migration Guide

Follow our [comprehensive migration guide](./docs/migration-v2.md) to upgrade from v1.x.

Estimated migration time: 1-2 hours

## 📚 Documentation

- [API Documentation](./docs/api-v2.md)
- [User Guide](./docs/user-guide.md)
- [FAQ](./docs/faq.md)

## 💬 Feedback

We'd love to hear your feedback! Please report issues on [GitHub](https://github.com/user/repo/issues).

## 🙏 Contributors

Thanks to all contributors who made this release possible!

- @alice (15 commits)
- @bob (12 commits)
- @charlie (8 commits)
```

## Monitoring & Validation

### Release Metrics

**Technical Metrics**:
```
- Error rate (should be < 1%)
- Response time (p95, p99)
- Throughput (requests/second)
- CPU/Memory usage
- Database query time
```

**Business Metrics**:
```
- Active users
- Conversion rate
- Revenue impact
- User satisfaction
- Support tickets
```

### Monitoring Dashboard

```
┌─────────────────────────────────────────┐
│ Release v2.0.0 Monitoring               │
├─────────────────────────────────────────┤
│                                         │
│ Status: ✅ Healthy                      │
│                                         │
│ Error Rate:     0.3% ✅ (< 1%)         │
│ Response Time:  145ms ✅ (< 200ms)     │
│ Throughput:     450 req/s ✅           │
│ CPU Usage:      45% ✅ (< 80%)         │
│ Memory:         60% ✅ (< 80%)         │
│                                         │
│ Active Users:   +15% ↑                 │
│ Conversion:     +3% ↑                  │
│ Support Tickets: -20% ↓                │
│                                         │
│ Deployed: 2 hours ago                   │
│ Next Check: Canary → 50%               │
└─────────────────────────────────────────┘
```

### Validation Tests

```typescript
// Post-deployment smoke tests
describe('Production Smoke Tests', () => {
  it('should respond to health check', async () => {
    const response = await fetch('https://api.example.com/health')
    expect(response.status).toBe(200)
  })

  it('should authenticate users', async () => {
    const response = await fetch('https://api.example.com/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'test' }),
    })
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })

  it('should return user data', async () => {
    const response = await fetch('https://api.example.com/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(response.status).toBe(200)
  })

  it('should handle payment processing', async () => {
    // Critical path test
  })
})
```

## Best Practices

### DO ✅

- **Version consistently**: Follow semantic versioning strictly
- **Automate releases**: Use CI/CD pipelines
- **Test thoroughly**: Comprehensive QA before release
- **Communicate clearly**: Release notes, migration guides
- **Monitor actively**: Watch metrics closely post-release
- **Have rollback plan**: Always ready to revert
- **Use feature flags**: Decouple deployment from release
- **Document everything**: Changelog, API docs, guides

### DON'T ❌

- **Release on Fridays**: Give yourself time to fix issues
- **Skip testing**: Never deploy untested code
- **Ignore metrics**: Monitor after every release
- **Forget rollback**: Always have a rollback plan
- **Rush releases**: Take time to do it right
- **Deploy at peak hours**: Choose low-traffic windows
- **Change too much**: Smaller releases are safer
- **Forget users**: Communicate changes clearly

### Release Cadence

**Recommended Schedule**:
- **Patch releases**: As needed (bugs, security)
- **Minor releases**: Every 2-4 weeks
- **Major releases**: Every 3-6 months

**Avoid**:
- Releasing before weekends/holidays
- Peak business hours
- During major events
- End of quarter (if possible)

**Best Times**:
- Tuesday-Thursday
- Morning hours (9-11 AM)
- Low traffic periods
- After thorough testing

## Conclusion

Effective release management combines careful planning, automated processes, gradual rollouts, and active monitoring. Start with small, frequent releases and gradually adopt more sophisticated strategies as your application scales.

**Remember**: The goal isn't to never have issues—it's to detect and resolve them quickly with minimal user impact.

**Last Updated**: January 10, 2026
**Status**: Production Ready ✅

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

## Handshake Protocol

If invoked with argument `hello`:
> 👋 Hello! I'm **Release Management** v1.0.0. Semantic versioning, release planning, deployment strategies, and rollback procedures. Use `/release-management hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: Release Management v1.0.0
- **What it covers**: Semantic versioning, release types, release planning, deployment strategies (blue-green, canary, rolling), release automation, rollback procedures, feature flags, release notes, and monitoring
- **How to invoke**: `/release-management` (Claude Code will load this skill as context)
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
