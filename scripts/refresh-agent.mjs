#!/usr/bin/env node

/**
 * refresh-agent.mjs
 *
 * Fetches reference URLs for an agent and outputs structured findings as JSON.
 * Used by the /refresh skill and the CI refresh workflow.
 *
 * Usage:
 *   node scripts/refresh-agent.mjs <agent-file> [--dry-run] [--json] [--timeout <ms>]
 *
 * Arguments:
 *   <agent-file>     Path to agent file (.md or .json), relative to repo root or absolute
 *   --dry-run        Report findings only, do not suggest modifications
 *   --json           Output as JSON (default: human-readable)
 *   --timeout <ms>   Fetch timeout per URL in milliseconds (default: 10000)
 *
 * Output (JSON mode):
 *   {
 *     "agent": "redis-expert",
 *     "file": "agents/domain-experts/redis-expert.md",
 *     "version": "1.0.0",
 *     "references": [...],
 *     "findings": [
 *       {
 *         "url": "https://redis.io/docs/latest/",
 *         "label": "Redis Documentation",
 *         "type": "docs",
 *         "status": "ok" | "error",
 *         "error": null | "Timeout after 10000ms",
 *         "summary": "Extracted content summary...",
 *         "versions": ["7.4.2"],
 *         "highlights": ["New feature X", "Deprecated Y"]
 *       }
 *     ],
 *     "fetchedAt": "2026-02-21T12:00:00.000Z"
 *   }
 */

import { readFile } from 'node:fs/promises';
import { basename, extname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let agentFile = null;
let dryRun = false;
let jsonOutput = false;
let timeout = 10000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') {
    dryRun = true;
  } else if (args[i] === '--json') {
    jsonOutput = true;
  } else if (args[i] === '--timeout' && args[i + 1]) {
    timeout = parseInt(args[i + 1], 10);
    i++;
  } else if (!agentFile) {
    agentFile = args[i];
  }
}

if (!agentFile) {
  console.error('Usage: node scripts/refresh-agent.mjs <agent-file> [--dry-run] [--json] [--timeout <ms>]');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

function extractYamlValue(frontmatter, key) {
  const re = new RegExp(`^${key}:\\s*['"]?([^'"\n]+?)['"]?\\s*$`, 'm');
  const match = frontmatter.match(re);
  return match ? match[1].trim() : null;
}

/**
 * Parse references from YAML frontmatter.
 * Uses a simple line-by-line parser to avoid requiring the yaml npm package.
 */
function parseReferences(frontmatter) {
  const lines = frontmatter.split('\n');
  const refs = [];
  let inRefs = false;
  let currentRef = null;

  for (const line of lines) {
    if (/^references:\s*$/.test(line)) {
      inRefs = true;
      continue;
    }
    if (inRefs) {
      // New top-level key ends the references block
      if (/^\S/.test(line) && !line.startsWith('  ')) {
        break;
      }
      const itemMatch = line.match(/^\s+-\s+url:\s*['"]?(.+?)['"]?\s*$/);
      if (itemMatch) {
        if (currentRef) refs.push(currentRef);
        currentRef = { url: itemMatch[1] };
        continue;
      }
      if (currentRef) {
        const labelMatch = line.match(/^\s+label:\s*['"]?(.+?)['"]?\s*$/);
        if (labelMatch) {
          currentRef.label = labelMatch[1];
          continue;
        }
        const typeMatch = line.match(/^\s+type:\s*['"]?(.+?)['"]?\s*$/);
        if (typeMatch) {
          currentRef.type = typeMatch[1];
          continue;
        }
      }
    }
  }
  if (currentRef) refs.push(currentRef);
  return refs;
}

async function fetchUrl(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'claude-code-helper-refresh/1.0',
        'Accept': 'text/html,application/xhtml+xml,text/plain,application/json',
      },
    });
    clearTimeout(timer);

    if (!response.ok) {
      return { status: 'error', error: `HTTP ${response.status} ${response.statusText}` };
    }

    const text = await response.text();
    // Truncate to first 50KB to avoid memory issues
    const truncated = text.length > 50000 ? text.slice(0, 50000) : text;
    return { status: 'ok', content: truncated };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return { status: 'error', error: `Timeout after ${timeoutMs}ms` };
    }
    return { status: 'error', error: err.message };
  }
}

/**
 * Extract version numbers from content using common patterns.
 */
function extractVersions(content) {
  const versionPattern = /\bv?(\d+\.\d+(?:\.\d+)?(?:-[a-zA-Z0-9.]+)?)\b/g;
  const versions = new Set();
  let match;
  while ((match = versionPattern.exec(content)) !== null) {
    // Filter out noise — only keep likely software versions
    const v = match[1];
    if (/^\d+\.\d+\.\d+/.test(v) || /^\d+\.\d+$/.test(v)) {
      versions.add(v);
    }
  }
  return [...versions].slice(0, 20); // Cap at 20 to avoid noise
}

/**
 * Extract highlights — look for headings, list items about new features, changes, etc.
 */
function extractHighlights(content, type) {
  const highlights = [];
  const lines = content.split('\n');

  const keywords = type === 'release-notes' || type === 'changelog'
    ? /\b(breaking|deprecated?|removed|new|added|changed|fixed|security|upgrade|migration)\b/i
    : /\b(new|feature|update|deprecated?|breaking|important)\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    // Look for list items or headings with relevant keywords
    if ((trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('#')) && keywords.test(trimmed)) {
      // Clean up markdown
      const clean = trimmed.replace(/^[#*-]+\s*/, '').trim();
      if (clean.length > 10 && clean.length < 200) {
        highlights.push(clean);
      }
    }
  }

  return highlights.slice(0, 15); // Cap at 15
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Resolve agent file path
  const filePath = resolve(REPO_ROOT, agentFile);
  const relPath = relative(REPO_ROOT, filePath);

  let content;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading ${agentFile}: ${err.message}`);
    process.exit(1);
  }

  // Extract agent metadata and references
  const ext = extname(filePath);
  let agentName, version, references, webSearchEnabled;

  if (ext === '.json') {
    const json = JSON.parse(content);
    agentName = json.name || basename(filePath, '.json');
    version = json.version || null;
    references = json.references || [];
    webSearchEnabled = json.webSearchEnabled === true;
  } else {
    const fm = extractFrontmatter(content);
    if (!fm) {
      console.error(`No frontmatter found in ${agentFile}`);
      process.exit(1);
    }
    agentName = extractYamlValue(fm, 'name') || basename(filePath, '.md');
    version = extractYamlValue(fm, 'version') || null;
    references = parseReferences(fm);
    webSearchEnabled = /^webSearchEnabled:\s*true\s*$/m.test(fm);
  }

  if (references.length === 0) {
    const result = {
      agent: agentName,
      file: relPath,
      version,
      references: [],
      findings: [],
      fetchedAt: new Date().toISOString(),
      message: 'No references found for this agent',
    };
    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`No references found for ${agentName}`);
    }
    return;
  }

  // Fetch each reference URL
  const findings = [];
  for (let i = 0; i < references.length; i++) {
    const ref = references[i];
    if (!jsonOutput) {
      console.log(`Fetching [${i + 1}/${references.length}] ${ref.label || ref.url}...`);
    }

    const result = await fetchUrl(ref.url, timeout);

    const finding = {
      url: ref.url,
      label: ref.label || ref.url,
      type: ref.type || 'docs',
      status: result.status,
      error: result.error || null,
      summary: null,
      versions: [],
      highlights: [],
    };

    if (result.status === 'ok') {
      // Strip HTML tags for analysis
      const text = result.content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      finding.versions = extractVersions(text);
      finding.highlights = extractHighlights(text, ref.type);
      finding.summary = text.slice(0, 500) + (text.length > 500 ? '...' : '');
    }

    findings.push(finding);

    // Rate limit: 3s between fetches
    if (i < references.length - 1) {
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  const output = {
    agent: agentName,
    file: relPath,
    version,
    webSearchEnabled,
    references,
    findings,
    fetchedAt: new Date().toISOString(),
  };

  if (jsonOutput) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Refresh findings for ${agentName} (v${version || 'unknown'})`);
    if (webSearchEnabled) {
      console.log(`Web search: ENABLED — use /refresh skill for multi-source validated web search`);
    }
    console.log(`${'='.repeat(60)}\n`);

    for (const f of findings) {
      console.log(`### ${f.label} (${f.type})`);
      if (f.status === 'error') {
        console.log(`  Error: ${f.error}`);
      } else {
        if (f.versions.length > 0) {
          console.log(`  Versions found: ${f.versions.join(', ')}`);
        }
        if (f.highlights.length > 0) {
          console.log(`  Highlights:`);
          f.highlights.forEach(h => console.log(`    - ${h}`));
        }
        if (f.highlights.length === 0 && f.versions.length === 0) {
          console.log(`  No notable changes extracted (content may require manual review)`);
        }
      }
      console.log('');
    }

    console.log(`Fetched at: ${output.fetchedAt}`);
    if (dryRun) {
      console.log('(dry-run mode — no modifications made)');
    }
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
