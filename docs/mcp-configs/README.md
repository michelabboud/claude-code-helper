# MCP Configuration Examples

Model Context Protocol (MCP) server configurations for extending Claude Code with external tools and services.

## What Is MCP?

MCP (Model Context Protocol) is a standard for connecting Claude to external tools, services, and data sources. MCP servers provide specialized capabilities that Claude can use during conversations.

**Key characteristics:**
- External tool servers (Node.js, Python, etc.)
- Configured via JSON
- Provide specialized tools to Claude
- Run alongside Claude Code

## Available Configurations

| Config | Description | Tools Provided |
|--------|-------------|----------------|
| **github-config.json** | GitHub integration | Issue management, PR operations |
| **brave-search-config.json** | Web search | Search queries, result fetching |
| **filesystem-config.json** | File system access | Extended file operations |

## Installation

### Step 1: Configure MCP Server

Add MCP configuration to your Claude Desktop config:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### Step 2: Add Server Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    }
  }
}
```

### Step 3: Restart Claude

Restart Claude Desktop or Claude Code to load MCP servers.

## Configuration Reference

### github-config.json

**Purpose**: GitHub repository operations

**Setup**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>"
      }
    }
  }
}
```

**Tools Provided**:
- `create_issue` - Create GitHub issues
- `list_issues` - List repository issues
- `create_pull_request` - Create PRs
- `get_file_contents` - Read repo files
- `search_repositories` - Search GitHub

**Token Permissions**:
- `repo` - Full repository access
- `read:org` - Read organization data

---

### brave-search-config.json

**Purpose**: Web search capabilities

**Setup**:
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@anthropics/mcp-server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

**Tools Provided**:
- `search` - Web search queries
- `news_search` - News-specific search

**Get API Key**:
1. Visit https://brave.com/search/api/
2. Create an account
3. Generate API key

---

### filesystem-config.json

**Purpose**: Extended file system operations

**Setup**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/directory"]
    }
  }
}
```

**Tools Provided**:
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents
- `create_directory` - Create directories
- `move_file` - Move/rename files

**Security Note**: Specify allowed directories to limit access.

## Using with Claude Code CLI

For Claude Code CLI, use the `claude mcp` commands:

```bash
# Add MCP server
claude mcp add github

# Or add from JSON
claude mcp add-json '{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "token"
    }
  }
}'

# List configured servers
claude mcp list

# Remove server
claude mcp remove github
```

## Project-Specific MCP

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "project-tools": {
      "command": "node",
      "args": ["./tools/mcp-server.js"]
    }
  }
}
```

This loads only when working in that project.

## Creating Custom MCP Servers

See the [mcp-servers/](../../mcp-servers/) directory for full MCP server implementations:

- **api-specialist-mcp** - API testing and validation
- **code-review-mcp** - Code quality tools
- **design-system-mcp** - Design system validation
- **testing-mcp** - Test execution tools
- **uiux-review-mcp** - UI/UX analysis

## Configuration Best Practices

### Security
1. **Use environment variables** for secrets
2. **Limit file access** to specific directories
3. **Review tool permissions** before enabling

### Performance
1. **Only enable needed servers** - Each server uses resources
2. **Use project-specific configs** - Don't load everything globally
3. **Monitor server health** - Restart if unresponsive

### Organization
1. **Document your config** - Comment what each server does
2. **Version control safely** - Don't commit secrets
3. **Use templates** - Standardize across team

## Troubleshooting

### Server Not Loading

1. Check JSON syntax is valid
2. Verify command path exists
3. Ensure required env vars are set
4. Restart Claude after config changes

### Tools Not Appearing

1. Wait for server to initialize
2. Check server logs for errors
3. Verify server is running: `ps aux | grep mcp`

### Authentication Errors

1. Verify tokens/keys are correct
2. Check token permissions
3. Regenerate expired tokens

## Environment Variables

Store secrets in environment:

```bash
# ~/.zshrc or ~/.bashrc
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."
export BRAVE_API_KEY="BSA..."
```

Then reference in config:

```json
{
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
  }
}
```

## Related Resources

- [MCP Servers](../../mcp-servers/) - Full MCP server implementations
- [MCP Agents](../../agents/mcp-integrated/) - Agents using MCP tools
- [MCP Protocol Docs](https://modelcontextprotocol.io) - Official documentation

---

## Credits

**Author**: [Michel Abboud](https://github.com/michelabboud)

**AI Assistance**: Created with the help of Claude Code (Anthropic)

**License**: Apache-2.0 - Free to use for personal and commercial projects.

---

**Version**: 1.0.0
