# Installation Guide

Complete installation instructions for the Multi-Agent MCP System.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

**Node.js 18+ (Recommended: 20 or 22)**
```bash
# Check your Node.js version
node --version

# If you need to install/update Node.js:
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or download from https://nodejs.org
```

**npm or pnpm**
```bash
# Check npm version
npm --version

# Or use pnpm (faster)
npm install -g pnpm
```

### Optional Tools (for specific features)

**For Code Review MCP:**
- **ESLint** (JavaScript/TypeScript linting)
  ```bash
  npm install -g eslint
  ```
- **Pylint** (Python linting)
  ```bash
  pip install pylint
  ```
- **Semgrep** (Security scanning)
  ```bash
  pip install semgrep
  ```
- **Bandit** (Python security)
  ```bash
  pip install bandit
  ```

**For Testing MCP:**
- **Jest** (JavaScript testing)
  ```bash
  npm install -g jest
  ```
- **Pytest** (Python testing)
  ```bash
  pip install pytest pytest-cov
  ```

**For Design System MCP:**
- No additional tools required (pure Node.js)

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.0.0 | 20.x or 22.x |
| RAM | 2 GB | 4 GB+ |
| Disk Space | 500 MB | 1 GB |
| OS | macOS, Linux, WSL2 | Any |

---

## Installation Steps

### Step 1: Extract the Package

```bash
# Unzip the package
unzip mcp-multi-agent-system.zip
cd mcp-multi-agent-system
```

### Step 2: Install Code Review MCP

```bash
cd code-review-mcp
npm install
npm run build
npm run inspector  # Optional: Test the server
cd ..
```

**Verify build:**
```bash
ls code-review-mcp/build/index.js
# Should exist and show the compiled file
```

### Step 3: Install Testing MCP

```bash
cd testing-mcp
npm install
npm run build
npm run inspector  # Optional: Test the server
cd ..
```

**Verify build:**
```bash
ls testing-mcp/build/index.js
```

### Step 4: Install Design System MCP

```bash
cd design-system-mcp
npm install
npm run build
npm run inspector  # Optional: Test the server
cd ..
```

**Verify build:**
```bash
ls design-system-mcp/build/index.js
```

### Step 5: Quick Install Script (Alternative)

Use the provided install script for all three servers:

```bash
chmod +x install-all.sh
./install-all.sh
```

---

## Configuration

### For Claude Desktop

**Location:** 
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "code-review": {
      "command": "node",
      "args": ["/absolute/path/to/code-review-mcp/build/index.js"]
    },
    "testing": {
      "command": "node",
      "args": ["/absolute/path/to/testing-mcp/build/index.js"]
    },
    "design-system": {
      "command": "node",
      "args": ["/absolute/path/to/design-system-mcp/build/index.js"]
    }
  }
}
```

**⚠️ Important:** Use **absolute paths**, not relative ones!

```bash
# Get absolute paths
pwd  # Shows current directory
realpath code-review-mcp/build/index.js
realpath testing-mcp/build/index.js
realpath design-system-mcp/build/index.js
```

### For Claude Code CLI

Claude Code (v2.1+) uses the `claude mcp add` command to configure MCP servers:

```bash
# Navigate to the mcp-servers directory
cd /path/to/mcp-servers

# Add each server using the CLI
claude mcp add api-specialist -- node "$(pwd)/api-specialist-mcp/build/index.js"
claude mcp add code-review -- node "$(pwd)/code-review-mcp/build/index.js"
claude mcp add design-system -- node "$(pwd)/design-system-mcp/build/index.js"
claude mcp add testing -- node "$(pwd)/testing-mcp/build/index.js"
claude mcp add uiux-review -- node "$(pwd)/uiux-review-mcp/build/index.js"

# Verify servers are registered
claude mcp list
```

**Configuration is stored in:** `~/.claude.json` (managed automatically)

### For Custom MCP Clients

If using another MCP client, use the stdio transport:

```bash
# Run server directly
node /path/to/code-review-mcp/build/index.js

# The server communicates via stdin/stdout
```

---

## Verification

### Test Each Server

#### 1. Code Review MCP

```bash
cd code-review-mcp
npm run inspector
```

In the inspector, try:
```json
{
  "method": "tools/list"
}
```

Expected response: List of 4 tools (lint_file, security_scan, analyze_complexity, find_duplicates)

#### 2. Testing MCP

```bash
cd testing-mcp
npm run inspector
```

Test with:
```json
{
  "method": "tools/list"
}
```

Expected: 4 tools (run_tests, get_coverage, analyze_test_quality, generate_test_report)

#### 3. Design System MCP

```bash
cd design-system-mcp
npm run inspector
```

Expected: 5 tools (validate_tokens, check_component, validate_color_palette, analyze_spacing, generate_report)

### Test in Claude Desktop

1. Restart Claude Desktop
2. Start a new conversation
3. Try: "What MCP tools do you have available?"
4. Claude should list all 13 tools from the three servers

### Test in Claude Code

```bash
claude-code --list-tools
```

Should show all tools from configured MCP servers.

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
# Rebuild all servers
cd code-review-mcp && npm install && npm run build
cd ../testing-mcp && npm install && npm run build
cd ../design-system-mcp && npm install && npm run build
```

### Issue: "Command not found: node"

**Solution:**
```bash
# Install Node.js
nvm install 20
nvm use 20

# Or use full path in config
"command": "/usr/local/bin/node"
```

### Issue: MCP servers not showing in Claude

**Check:**
1. Restart Claude Desktop completely
2. Verify absolute paths in config
3. Check server builds exist:
   ```bash
   ls code-review-mcp/build/index.js
   ls testing-mcp/build/index.js
   ls design-system-mcp/build/index.js
   ```
4. Test server manually:
   ```bash
   node code-review-mcp/build/index.js
   # Should output: "Code Review MCP Server running on stdio"
   ```

### Issue: "Cannot find module 'zod'"

**Solution:**
```bash
# Dependencies not installed
cd code-review-mcp && npm install
cd ../testing-mcp && npm install
cd ../design-system-mcp && npm install
```

### Issue: Permission denied

**Solution:**
```bash
# Make scripts executable
chmod +x install-all.sh
chmod +x */build/index.js
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Update TypeScript
npm install -g typescript

# Clean and rebuild
rm -rf build node_modules
npm install
npm run build
```

### Issue: Port already in use (Inspector)

**Solution:**
The MCP Inspector might conflict with other services. Try a different port:
```bash
npx @modelcontextprotocol/inspector --port 8080 build/index.js
```

---

## Advanced Configuration

### Environment Variables

Set environment variables for tool paths:

```bash
# In your ~/.bashrc or ~/.zshrc
export ESLINT_PATH="/usr/local/bin/eslint"
export PYTEST_PATH="/usr/local/bin/pytest"
export SEMGREP_PATH="/usr/local/bin/semgrep"
```

### Custom Tool Paths

Modify the server source if tools are in non-standard locations:

```typescript
// In code-review-mcp/src/index.ts
const LINTER_PATHS = {
  eslint: process.env.ESLINT_PATH || 'eslint',
  pylint: process.env.PYLINT_PATH || 'pylint',
};
```

### Logging Configuration

Enable debug logging:

```bash
# Set environment variable
export MCP_DEBUG=true

# Run server with logging
node code-review-mcp/build/index.js 2> mcp-debug.log
```

---

## Upgrading

### Update Dependencies

```bash
# Update each server
cd code-review-mcp && npm update && npm run build
cd ../testing-mcp && npm update && npm run build
cd ../design-system-mcp && npm update && npm run build
```

### Update MCP SDK

```bash
# In each server directory
npm install @modelcontextprotocol/sdk@latest
npm run build
```

---

## Uninstallation

To remove the MCP servers:

1. **Remove from Claude config:**
   - Delete entries from `claude_desktop_config.json`
   - Restart Claude Desktop

2. **Delete server files:**
   ```bash
   rm -rf code-review-mcp testing-mcp design-system-mcp
   ```

3. **Remove global tools (optional):**
   ```bash
   npm uninstall -g eslint jest
   pip uninstall pylint pytest semgrep bandit
   ```

---

## Next Steps

✅ Installation complete!

Now proceed to:
- **[QUICKGUIDE.md](./QUICKGUIDE.md)** - Start using the servers
- **[README.md](./README.md)** - Learn about multi-agent workflows
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the system design

---

## Support

**Common issues:** Check [Troubleshooting](#troubleshooting) above

**MCP Documentation:** https://modelcontextprotocol.io

**Claude Documentation:** https://docs.anthropic.com

**Report issues:** Create detailed bug reports with:
- Error messages
- Your config file (sanitized)
- Node.js version (`node --version`)
- OS and version
