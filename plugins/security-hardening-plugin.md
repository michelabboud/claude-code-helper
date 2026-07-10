---
plugin_name: Security Hardening Plugin
description: Comprehensive security scanning and hardening
priority: P1
version: 1.0.1
author: Michel Abboud
license: Apache-2.0
repository: https://github.com/michelabboud/claude-code-helper
issues: https://github.com/michelabboud/claude-code-helper/issues
---

# Security Hardening Plugin

Complete security solution for scanning, hardening, and compliance.

## Components

- **Security Expert Agent** — `agents/domain-experts/security-expert.md`
- **Security Reviewer Agent** (MCP-integrated) — `agents/mcp-integrated/security-reviewer.json`
- **Code Review MCP Server** (security scanning tools) — `mcp-servers/code-review-mcp`
- **Security Scan Hook** — `hooks/security-scan.md`

## Installation

```bash
# Agents
cp agents/domain-experts/security-expert.md ~/.claude/agents/
cp agents/mcp-integrated/security-reviewer.json ~/.claude/agents/

# Hook
cp hooks/security-scan.md ~/.claude/hooks/

# MCP server (build required)
cd mcp-servers/code-review-mcp && npm install && npm run build
```

Register the MCP server with Claude Code by adding it to your MCP config (Claude Desktop's `claude_desktop_config.json` or Claude Code's `.claude-code/config.json`) pointing at the built `build/index.js`:

```json
{
  "mcpServers": {
    "code-review": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/code-review-mcp/build/index.js"]
    }
  }
}
```

## Features

- ✅ Automated security scanning (via the `security_scan` tool in Code Review MCP — Bandit, Semgrep, Snyk)
- ✅ Secret detection and prevention (via the Security Scan Hook, on `PreToolUse`)
- ✅ Security code review and audit guidance (via Security Expert / Security Reviewer agents)
- ✅ Security best practices enforcement

## Usage

```bash
# Run a security audit (via the Security Expert agent)
Ask: "Audit this codebase for security vulnerabilities and OWASP Top 10 issues"

# Run the Code Review MCP security scan tool directly
Ask: "Run the security_scan tool on this project and summarize the findings"

# Fix vulnerabilities
Ask: "Fix the security vulnerabilities in my dependencies"

# Scan for secrets
Ask: "Check for exposed secrets in my code"
```

## Changelog

### 1.0.1 (2026-07-10)
- Removed fictional "Vulnerability Remediation Skill" (no such skill exists in this repo) from Components
- Removed fictional `/security-audit` slash-command (no `commands/` directory exists in this repo) — replaced with an `Ask:` prompt to the Security Expert agent
- Reconciled Components to real, verified files only: added Security Reviewer Agent (MCP-integrated) and Code Review MCP Server; dropped the unrelated Dependency Management MCP
- Added install paths (`cp` / `cp -r` / build) and MCP registration guidance for every bundled component

### 1.0.0 (2026-02-20)
- Initial versioned release

---

**Author**: [Michel Abboud](https://github.com/michelabboud)
**License**: Apache-2.0
**Repository**: [claude-code-helper](https://github.com/michelabboud/claude-code-helper)
**Issues & Discussions**: [GitHub Issues](https://github.com/michelabboud/claude-code-helper/issues)
