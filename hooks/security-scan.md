---
hook_name: Security Scan Hook
event: PreToolUse
description: Scan for secrets, vulnerabilities, and security issues before code operations
priority: P1
version: 1.0.0
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Security Scan Hook

Automatic security scanning to prevent secrets, vulnerabilities, and insecure code from being committed.

## Trigger Event

`PreToolUse` - Runs before Write, Edit, or Bash tool operations

## Hook Timeout

Hooks have a **10-minute timeout** (extended from 60 seconds in earlier versions), allowing sufficient time for comprehensive security scanning, dependency checks, and vulnerability analysis.

## Deployment Options

### Option 1: Standalone Hook File
Place in `~/.claude/hooks/security-scan.md` or `.claude/hooks/security-scan.md`

### Option 2: Frontmatter Hook (Inline)
Define directly in agent, skill, or command frontmatter:

```yaml
---
name: secure-deployment
hooks:
  PreToolUse: |
    # Run security scan before any tool use
    if [[ "$TOOL_NAME" == "Write" ]] || [[ "$TOOL_NAME" == "Edit" ]]; then
      # Check for secrets
      if grep -rE "(api[_-]?key|password|secret)" "$FILE_PATH" 2>/dev/null; then
        echo "❌ Security scan failed: Potential secret detected"
        exit 1
      fi
    fi
---
```

This inline approach is useful for lightweight security checks specific to a particular skill or command.

## What It Scans

### Secret Detection
- API keys (AWS, Google Cloud, Azure, etc.)
- Private keys and certificates
- Database credentials
- OAuth tokens
- JWT secrets
- Encryption keys
- Password patterns

### Code Vulnerabilities
- SQL injection patterns
- XSS vulnerabilities
- Command injection
- Path traversal
- Insecure deserialization
- Weak cryptography

### Dependency Issues
- Known CVEs in dependencies
- Outdated packages with security fixes
- License violations
- Supply chain risks

## Configuration

Create `.claude/hooks/security-scan.json`:

```json
{
  "enabled": true,
  "severity_threshold": "medium",
  "block_on": ["critical", "high"],
  "patterns": {
    "secrets": [
      "AWS_ACCESS_KEY_ID",
      "PRIVATE_KEY",
      "api[_-]?key",
      "password\\s*=",
      "secret\\s*="
    ],
    "vulnerabilities": [
      "eval\\(",
      "exec\\(",
      "innerHTML\\s*=",
      "__import__\\("
    ]
  },
  "whitelist": [
    "test/**",
    "*.example.*"
  ]
}
```

## Behavior

### Detection
```
⚠️ Security Warning Detected!

Type: Secret Exposure
Severity: HIGH
Location: src/config/database.ts:12

Found: AWS_ACCESS_KEY_ID = "AKIA..."

Recommendation:
- Use environment variables instead
- Add to .env file
- Never commit secrets to version control

Action: BLOCKED
```

### Remediation Suggestions
```
✅ Suggested Fix:

// Before (INSECURE)
const apiKey = "sk_live_abc123"

// After (SECURE)
const apiKey = process.env.API_KEY

Add to .env:
API_KEY=sk_live_abc123

Add to .gitignore:
.env
.env.local
```

## Integration

### With Git Hooks
Automatically runs on:
- `git commit`
- `git push`
- Pre-pull request

### With CI/CD
Integrated into:
- GitHub Actions
- GitLab CI
- Jenkins
- CircleCI

## Scanning Tools Used

- **TruffleHog**: Secret detection
- **Gitleaks**: Credential scanning
- **Snyk**: Dependency vulnerabilities
- **Semgrep**: Code pattern matching
- **npm audit**: npm vulnerabilities
- **pip-audit**: Python vulnerabilities

## Exclusions

Exclude files/patterns:
```json
{
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.test.ts",
    "*.spec.ts",
    "test-fixtures/**"
  ]
}
```

## Performance

- **Fast**: Scans complete in < 1 second for most changes
- **Incremental**: Only scans changed files
- **Parallel**: Multiple checks run concurrently
- **Cached**: Results cached for unchanged files

## Override

For false positives:
```javascript
// nosemgrep: insecure-eval
eval(trustedSource)  // Intentional, input is validated

// nosec: B608
subprocess.call(command, shell=True)  # Justified use case
```

## Reporting

Daily security summary:
```
Security Scan Summary - January 10, 2026

🔒 Secrets Blocked: 3
⚠️  Vulnerabilities Found: 12
📦 Outdated Dependencies: 5
✅ Issues Resolved: 8

Top Issues:
1. HIGH: API key in config file (blocked)
2. HIGH: SQL injection in user query (blocked)
3. MEDIUM: Outdated axios with CVE (warning)
```

**Status**: Production Ready ✅

## Changelog

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
