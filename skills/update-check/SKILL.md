---
skill_name: update-check
description: Check if your claude-code-helper installation is up to date. Reads the local manifest and compares against the latest GitHub release. Never auto-updates - always shows what's available and lets you decide.
---

# Update Check

Check whether your claude-code-helper installation is current.

## Instructions

You are an update checker for the claude-code-helper toolkit. Follow these steps exactly:

### Step 1: Read the Installation Manifest

Read the file `~/.claude/claude-code-helper.json`. If it doesn't exist, report:

> **No installation manifest found.**
> This means either claude-code-helper was never installed via an install script,
> or it was installed before manifest tracking was added (v2.2.0+).
>
> To fix this, re-run the install scripts from your clone:
> ```bash
> cd /path/to/claude-code-helper
> config-bundle/scripts/install-all.sh
> ```

If the manifest exists, extract the `version` and `updatedAt` fields, plus the `components` section.

### Step 2: Check the Latest Release on GitHub

Run this command to fetch the latest release version:

```bash
curl -s https://api.github.com/repos/michelabboud/claude-code-helper/releases/latest | node -e "
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
    try {
        const release = JSON.parse(data);
        if (release.tag_name) {
            console.log(JSON.stringify({
                version: release.tag_name.replace(/^v/, ''),
                published: release.published_at,
                name: release.name,
                url: release.html_url,
                body: (release.body || '').substring(0, 500)
            }));
        } else {
            console.log(JSON.stringify({ error: 'no_releases', message: release.message || 'No releases found' }));
        }
    } catch (e) {
        console.log(JSON.stringify({ error: 'parse_error', message: e.message }));
    }
});
"
```

If the API call fails (rate limit, network error), report the error gracefully and show what's known from the local manifest.

### Step 3: Compare and Report

Use semver comparison (split on `.`, compare major/minor/patch as integers).

**If up to date** (installed >= latest):

> **claude-code-helper is up to date!**
>
> | | |
> |---|---|
> | Installed version | `X.Y.Z` |
> | Latest release | `X.Y.Z` |
> | Last updated | `YYYY-MM-DD` |
> | Components | config-bundle, mcp-servers, ... |

**If update available** (installed < latest):

> **Update available!**
>
> | | |
> |---|---|
> | Installed version | `X.Y.Z` |
> | Latest release | **`A.B.C`** |
> | Published | `YYYY-MM-DD` |
>
> ### What's new
> [Summary from release notes body]
>
> ### How to update
>
> **This will NOT happen automatically.** To update, run these commands:
>
> ```bash
> cd /path/to/claude-code-helper
> git pull origin main
>
> # Re-install whichever components you use:
> config-bundle/scripts/install-all.sh    # agents, skills, hooks, config
> mcp-servers/install-all.sh              # MCP servers (rebuild required)
> trigger-matcher/install.sh              # trigger matcher hooks
> ```
>
> **Review the changelog before updating:** See `CHANGELOG.md` or the release page.

### Important Rules

1. **NEVER auto-update.** This skill is informational only. Always show the user what's available and let them decide.
2. **NEVER run git pull, install scripts, or any destructive commands.** Only read data and report.
3. If the user asks to update after seeing the report, remind them to review the changelog first, then provide the exact commands they can copy-paste and run themselves.
4. The GitHub API has a 60 req/hour rate limit for unauthenticated requests. If rate-limited, say so and show the local manifest data.
