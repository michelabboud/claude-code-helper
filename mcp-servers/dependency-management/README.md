# Dependency Management MCP Server

MCP server for dependency analysis, license checks, and update suggestions driven from `package.json`. Results are heuristic/advisory — see **Scope & limitations** below.

## Overview

Comprehensive dependency management for npm, pip, maven, gradle, cargo, and go modules with security scanning and license compliance.

## Tools Provided

### 1. `analyze_dependencies`
Analyze dependency tree with size, version, and relationship information.

**Parameters**:
- `project_path` (string): Path to project
- `package_manager` (string): npm, pip, maven, gradle, cargo, go
- `include_transitive` (boolean): Include transitive dependencies

**Returns**: Complete dependency tree with metadata

### 2. `find_vulnerabilities`
Scan dependencies for known security vulnerabilities.

**Parameters**:
- `project_path` (string): Path to project
- `package_manager` (string): Package manager type
- `severity_threshold` (string): low, medium, high, critical

**Returns**: List of vulnerabilities with severity and fixes

### 3. `suggest_updates`
Recommend safe dependency updates.

**Parameters**:
- `project_path` (string): Path to project
- `package_manager` (string): Package manager
- `update_type` (string): patch, minor, major

**Returns**: Update recommendations with changelog links

### 4. `check_licenses`
Verify license compatibility and compliance.

**Parameters**:
- `project_path` (string): Path to project
- `allowed_licenses` (array): Permitted licenses
- `package_manager` (string): Package manager

**Returns**: License compatibility report

### 5. `find_duplicates`
Identify duplicate dependencies in the project.

**Parameters**:
- `project_path` (string): Path to project
- `package_manager` (string): Package manager

**Returns**: Duplicate dependencies with resolution suggestions

### 6. `bundle_size_impact`
Estimate bundle size impact of dependencies.

**Parameters**:
- `package_name` (string): Package to analyze
- `version` (string): Package version
- `package_manager` (string): npm, yarn, pnpm

**Returns**: Size impact and alternatives

### 7. `unused_dependencies`
Find unused packages in the project.

**Parameters**:
- `project_path` (string): Path to project
- `package_manager` (string): Package manager

**Returns**: List of unused dependencies

### 8. `generate_sbom`
Create Software Bill of Materials.

**Parameters**:
- `project_path` (string): Path to project
- `format` (string): cyclonedx, spdx
- `package_manager` (string): Package manager

**Returns**: SBOM in specified format

## Features

- ✅ Multi-ecosystem support (npm, pip, maven, gradle, cargo, go)
- ✅ Vulnerability scanning with CVE database
- ✅ License compliance checking
- ✅ Automated update recommendations
- ✅ Duplicate detection and resolution
- ✅ Bundle size analysis
- ✅ SBOM generation
- ✅ Dependency graph visualization

## Usage Examples

```javascript
// Find vulnerabilities
await mcp.call('find_vulnerabilities', {
  project_path: './my-project',
  package_manager: 'npm',
  severity_threshold: 'high'
})

// Suggest safe updates
await mcp.call('suggest_updates', {
  project_path: './my-project',
  package_manager: 'npm',
  update_type: 'minor'
})

// Check license compliance
await mcp.call('check_licenses', {
  project_path: './my-project',
  allowed_licenses: ['MIT', 'Apache-2.0', 'BSD-3-Clause'],
  package_manager: 'npm'
})

// Generate SBOM
await mcp.call('generate_sbom', {
  project_path: './my-project',
  format: 'cyclonedx',
  package_manager: 'npm'
})
```

## Scope & limitations (read this)

This server reads `package.json` and applies built-in heuristics. It does **not**
query package registries, read lockfiles, or scan your source, so several results
are advisory rather than authoritative:

- **Vulnerabilities**: matched against a small **curated** list of well-known
  advisories (real CVE IDs), **not** a live feed. Run `npm audit` or query the
  OSV / GitHub Advisory database for comprehensive coverage.
- **License checks**: cover a built-in table of common packages; packages not in
  the table are reported as `UNKNOWN` (never silently assumed to be MIT) and
  flagged for manual verification.
- **Bundle sizes**: reported only for packages with known published figures;
  everything else is `unknown` (measure with a bundler or bundlephobia).
- **Duplicate / unused detection**: requires a lockfile (`npm ls --all`) or a
  source-import scan (`npx depcheck`) respectively — this server reports the
  limitation rather than guessing.
- **Update suggestions**: deterministic next-increment targets, not guaranteed
  to be the latest published version (confirm with `npm outdated`).

## Installation

```bash
cd mcp-servers/dependency-management
npm install
npm run build
```

## Configuration

Add to `~/.claude/config/mcp.json`:

```json
{
  "mcpServers": {
    "dependency-management": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/dependency-management/build/index.js"]
    }
  }
}
```

---

**Version**: 1.0.0
**Status**: Advisory / heuristic — reads `package.json`, no registry/lockfile/source access
**Ecosystems**: npm (full heuristics); pip, maven, gradle, cargo, go (guidance only)

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 11 MCP servers, and comprehensive guides.
