# Dependency Management MCP Server

Production-ready MCP server for dependency analysis, vulnerability scanning, and update recommendations.

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

## Security Features

- **CVE Database**: Real-time vulnerability checking
- **License Scanning**: Automated compliance verification
- **Audit Logging**: Track all dependency changes
- **Update Safety**: Test compatibility before suggesting updates
- **Supply Chain Security**: Verify package integrity

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
**Status**: Production Ready ✅
**Ecosystems**: npm, pip, maven, gradle, cargo, go modules

---


---

## Credits

**Author:** [Michel Abboud](https://github.com/michelabboud)
**AI Assistance:** Created with the help of Claude Code (Anthropic)
**License:** Apache-2.0

💡 **Want more?** Explore [claude-code-helper](https://github.com/michelabboud/claude-code-helper) for 30+ agents, 13+ skills, 9 MCP servers, and comprehensive guides.
