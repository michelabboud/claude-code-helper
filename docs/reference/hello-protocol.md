# Hello Protocol — Universal Handshake for All Tools

The Hello Protocol is a universal handshake standard implemented across all tools in this repository. It lets you verify a tool is online, discover what it does, and get its full API reference — all with a simple `hello` call.

## Quick Reference

| Tool type | Hello call | Verbose call |
|-----------|-----------|--------------|
| MCP server | `hello {}` | `hello {"verbose": true}` |
| Skill | `/skill-name hello` | `/skill-name hello ID` |
| Agent | `hello agent-name` | `hello agent-name ID` |

---

## MCP Servers

Every MCP server exposes a `hello` tool alongside its regular tools.

### Usage

```json
// Quick ping — is this server online?
{ "tool": "hello", "arguments": {} }

// Full info — tool catalog, usage guide, version
{ "tool": "hello", "arguments": { "verbose": true } }
```

### Quick response example
```
👋 Hello! I'm **code-review-mcp** v1.0.0.

I'm online and ready to help!

Call `hello` with `{"verbose": true}` for my full tool catalog and usage guide.
```

### Verbose response example
```
# code-review-mcp v1.0.0

**Code quality analysis** — linting, security scanning, complexity analysis, and duplicate detection.

## Available Tools

| Tool | Description |
|------|-------------|
| `lint_file` | Run ESLint, Pylint, or Rubocop on a file |
| `security_scan` | Scan for vulnerabilities using Bandit, Semgrep, or Snyk |
| `analyze_complexity` | Cyclomatic complexity and maintainability metrics |
| `find_duplicates` | Detect duplicate code blocks across a directory |
| `hello` | Handshake check — verify server is online |

## Usage

```
hello {}                          → Quick greeting + status check
hello {"verbose": true}           → Full server info and tool catalog
lint_file {filePath, linter}      → Lint a source file
security_scan {targetPath, scanner} → Run security analysis
```

## Author
Michel Abboud — https://github.com/michelabboud/claude-code-helper
License: MIT
```

### How to add to a new MCP server

Add these 3 pieces to `src/index.ts`:

**1. Constants** (after imports):
```typescript
const SERVER_NAME = "your-server-name";
const SERVER_VERSION = "1.0.0";
```

**2. `buildHelloVerbose()` function** (before `runServer(...)`):
```typescript
function buildHelloVerbose(): string {
  return [
    `# ${SERVER_NAME} v${SERVER_VERSION}`,
    ``,
    `**Short description** — what this server does.`,
    ``,
    `## Available Tools`,
    ``,
    `| Tool | Description |`,
    `|------|-------------|`,
    `| \`your_tool\` | What it does |`,
    `| \`hello\` | Handshake check — verify server is online |`,
    ``,
    `## Usage`,
    ``,
    `\`\`\``,
    `hello {}                     → Quick greeting + status check`,
    `hello {"verbose": true}      → Full server info and tool catalog`,
    `your_tool {required_param}   → Brief description`,
    `\`\`\``,
    ``,
    `## Author`,
    `Michel Abboud — https://github.com/michelabboud/claude-code-helper`,
    `License: MIT`,
  ].join("\n");
}
```

**3. Tool definition** (last entry in the `tools: [...]` array):
```typescript
{
  name: "hello",
  description: "Handshake check — verify this server is online. Returns a greeting. Pass verbose=true for the full tool catalog, usage guide, and server info.",
  inputSchema: {
    type: "object",
    properties: {
      verbose: { type: "boolean", description: "If true, return full server info, all tools with descriptions, and usage guide" },
    },
    required: [],
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
},
```

**4. Tool handler** (in `registerTrackedToolHandler` switch, before `default:`):
```typescript
case "hello": {
  const verbose = (args as { verbose?: boolean })?.verbose ?? false;
  if (!verbose) {
    response = {
      content: [{
        type: "text",
        text: `👋 Hello! I'm **${SERVER_NAME}** v${SERVER_VERSION}.\n\nI'm online and ready to help!\n\nCall \`hello\` with \`{"verbose": true}\` for my full tool catalog and usage guide.`,
      }],
    };
  } else {
    response = {
      content: [{
        type: "text",
        text: buildHelloVerbose(),
      }],
    };
  }
  break;
}
```

---

## Skills

Every skill handles `hello` and `hello ID` as arguments.

### Usage

```
/skill-name hello        → Brief greeting + availability check
/skill-name hello ID     → Full skill profile: name, version, all arguments, usage
```

### Quick response example
```
👋 Hello! I'm **Model Mode** v1.0.0. Switch MODEL_MODE in ~/.claude/CLAUDE.md without manual file editing. Use `/model-mode hello ID` for the full guide.
```

### Verbose response example
```
**Name**: Model Mode v1.0.0
**Description**: Switch MODEL_MODE in ~/.claude/CLAUDE.md without manual file editing
**How to invoke**: `/model-mode [mode]`
**Available arguments**:
  - `status` — Show current MODEL_MODE and custom model settings
  - `default` — Auto-switch: opus for planning, sonnet for coding, haiku for quick
  - `opus-only` — Always use Claude Opus (MAX plan)
  - `sonnet-only` — Always use Claude Sonnet
  - `haiku-only` — Always use Claude Haiku (fastest)
  - `custom` — Use PLAN_MODEL / CODE_MODEL / QUICK_MODEL from CLAUDE.md
  - `hello` — Quick greeting + availability check
  - `hello ID` — This full profile
**Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
**License**: Apache-2.0
```

### `/refresh` skill example

**Quick hello:**
```
/refresh hello
```
Response: `👋 Hello! I'm **refresh** v1.0.0. Refresh agent knowledge from official reference URLs. Use `/refresh hello ID` for the full guide.`

**Verbose hello:**
```
/refresh hello ID
```
Response includes: name, description, available commands (status, <agent-name>, all), author info.

### How to add to a new SKILL.md

**1. Update frontmatter** — append to `argument-hint`:
```yaml
argument-hint: '[your-args] | hello | hello ID'
```

**2. Add to `## Instructions` section** (after the last existing `###` case):
```markdown
### `hello`
Respond with:
> 👋 Hello! I'm **[Skill Name]** v[version]. [One-line description]. Use `/[skill-name] hello ID` for the full guide.

### `hello ID`
Respond with complete skill information:
- **Name**: [Skill Name] v[version]
- **Description**: [full description]
- **How to invoke**: `/[skill-name] [argument]`
- **Available arguments**: [list all arguments]
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0
```

### How to add to a flat skill .md file

**1. Add to frontmatter** (after `version:` line):
```yaml
argument-hint: 'hello | hello ID'
```

**2. Add before the `---` footer**:
```markdown
## Handshake Protocol

If invoked with argument `hello`:
> 👋 Hello! I'm **[Skill Name]** v[version]. [Brief description]. Use `/[skill-slug] hello ID` for the full guide.

If invoked with argument `hello ID`, respond with full skill information:
- **Name**: [Skill Name] v[version]
- **What it covers**: [summary of what the skill teaches/does]
- **How to invoke**: `/[skill-slug]` (Claude Code loads this skill as context)
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0

```

---

## Agents

Every agent handles natural-language `hello` greetings.

### Usage

```
hello                        → Agent greets you back
hello [agent-name]           → Directed greeting to a specific agent
hello [agent-name] ID        → Full agent profile: specialty, tools, model, author
```

### Quick response example
```
👋 Hello! I'm **Security Expert**. Application security, OWASP Top 10, secure coding, and penetration testing. Say `hello security-expert ID` for full capabilities.
```

### Verbose response example
```
**Name**: Security Expert v1.0.0
**Specialty**: Application security, OWASP Top 10, secure coding practices, and security testing
**When to use me**: Security audits, code reviews for vulnerabilities, threat modeling, pentest guidance
**Tools/Models**: Model: sonnet | Tools: Read, Grep, Glob, Bash
**Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
**License**: Apache-2.0
```

### How to add to a new markdown agent (.md)

Add this section at the end of the file (before any `## Changelog` or footer):

```markdown

## Hello Protocol

If the user's first message is `hello`, `hello [your-name]`, or any greeting directed at you:
Respond: "👋 Hello! I'm **[Agent Display Name]**. [One-line specialty]. Say `hello [agent-name] ID` for full capabilities."

If the user's message is `hello [your-name] ID`:
Respond with your full profile:
- **Name**: [agent name] v[version if available]
- **Specialty**: [what you specialize in]
- **When to use me**: [trigger scenarios]
- **Tools/Models**: [model preference if set, key capabilities]
- **Author**: Michel Abboud — https://github.com/michelabboud/claude-code-helper
- **License**: Apache-2.0
```

### How to add to a new JSON agent (.json)

Append to the end of the `"instructions"` field value:

```
\n\n## Hello Protocol\n\nIf the user's first message is `hello`, `hello [your-name]`, or any greeting:\nRespond: "👋 Hello! I'm **[Agent Display Name]**. [One-line specialty]. Say `hello [agent-name] ID` for full capabilities."\n\nIf the user's message is `hello [agent-name] ID`:\nRespond with: name, version, specialty, when to use, available MCP tools, and author info (Michel Abboud — https://github.com/michelabboud/claude-code-helper | Apache-2.0).
```

---

## Checklist for new tools

When creating any new tool, skill, or agent in this repository:

- [ ] **MCP server**: Add `SERVER_NAME`, `SERVER_VERSION`, `buildHelloVerbose()`, `hello` tool definition, `hello` case handler
- [ ] **SKILL.md skill**: Add `hello | hello ID` to `argument-hint`, add `### hello` and `### hello ID` cases to Instructions
- [ ] **Flat .md skill**: Add `argument-hint: 'hello | hello ID'` to frontmatter, add `## Handshake Protocol` section before footer
- [ ] **Markdown agent**: Add `## Hello Protocol` section at end of file
- [ ] **JSON agent**: Append hello protocol block to `"instructions"` field

---

## Author
Michel Abboud — https://github.com/michelabboud/claude-code-helper
License: Apache-2.0
