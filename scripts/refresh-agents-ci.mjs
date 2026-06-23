#!/usr/bin/env node

/**
 * refresh-agents-ci.mjs
 *
 * Conservative automated refresh for CI use. Fetches reference URLs for all
 * agents that have them, and updates only the `lastRefreshed` timestamp and
 * `## Latest Updates` section with timestamped entries.
 *
 * Does NOT rewrite major agent sections — that's for interactive `/refresh`.
 *
 * Usage:
 *   node scripts/refresh-agents-ci.mjs [--dry-run] [--max-agents <n>]
 *
 * Options:
 *   --dry-run           Report findings only, do not modify files
 *   --max-agents <n>    Maximum agents to process (default: all)
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
let dryRun = false;
let maxAgents = Infinity;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--dry-run') dryRun = true;
  if (args[i] === '--max-agents' && args[i + 1]) {
    maxAgents = parseInt(args[i + 1], 10);
    i++;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

function extractYamlValue(fm, key) {
  const re = new RegExp(`^${key}:\\s*['"]?([^'"\n]+?)['"]?\\s*$`, 'm');
  const match = fm.match(re);
  return match ? match[1].trim() : null;
}

function hasReferences(fm) {
  return /^references:\s*$/m.test(fm);
}

async function fetchUrl(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'claude-code-helper-ci-refresh/1.0' },
    });
    clearTimeout(timer);
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.slice(0, 30000); // Cap at 30KB
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function extractVersions(text) {
  const versions = new Set();
  const re = /\bv?(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?)\b/g;
  let m;
  while ((m = re.exec(text)) !== null) versions.add(m[1]);
  return [...versions].slice(0, 10);
}

function bumpPatch(version) {
  if (!version) return '1.0.1';
  const parts = version.split('.');
  if (parts.length < 3) return version;
  parts[2] = String(parseInt(parts[2], 10) + 1);
  return parts.join('.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const domainDir = join(REPO_ROOT, 'agents', 'domain-experts');
  const mcpDir = join(REPO_ROOT, 'agents', 'mcp-integrated');

  // Collect agents with references
  const agents = [];

  // Domain experts (.md)
  try {
    const files = await readdir(domainDir);
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'README.md') continue;
      const filePath = join(domainDir, file);
      const content = await readFile(filePath, 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm && hasReferences(fm)) {
        agents.push({ path: filePath, type: 'md', name: basename(file, '.md') });
      }
    }
  } catch { /* dir missing */ }

  // MCP agents (.json)
  try {
    const files = await readdir(mcpDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const filePath = join(mcpDir, file);
      const content = await readFile(filePath, 'utf-8');
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json.references) && json.references.length > 0) {
          agents.push({ path: filePath, type: 'json', name: json.name || basename(file, '.json') });
        }
      } catch { /* invalid JSON */ }
    }
  } catch { /* dir missing */ }

  console.log(`Found ${agents.length} agents with references`);
  const toProcess = agents.slice(0, maxAgents);
  console.log(`Processing ${toProcess.length} agents${dryRun ? ' (dry-run)' : ''}...\n`);

  let updated = 0;
  let failed = 0;

  for (const agent of toProcess) {
    console.log(`--- ${agent.name} ---`);
    const content = await readFile(agent.path, 'utf-8');
    let references = [];

    if (agent.type === 'json') {
      const json = JSON.parse(content);
      references = json.references || [];
    } else {
      // Simple line-based reference extraction
      const fm = extractFrontmatter(content);
      const lines = fm.split('\n');
      let inRefs = false;
      let currentRef = null;
      for (const line of lines) {
        if (/^references:\s*$/.test(line)) { inRefs = true; continue; }
        if (inRefs) {
          if (/^\S/.test(line) && !line.startsWith('  ')) break;
          const urlM = line.match(/^\s+-\s+url:\s*['"]?(.+?)['"]?\s*$/);
          if (urlM) {
            if (currentRef) references.push(currentRef);
            currentRef = { url: urlM[1] };
            continue;
          }
          if (currentRef) {
            const labelM = line.match(/^\s+label:\s*['"]?(.+?)['"]?\s*$/);
            if (labelM) { currentRef.label = labelM[1]; continue; }
            const typeM = line.match(/^\s+type:\s*['"]?(.+?)['"]?\s*$/);
            if (typeM) { currentRef.type = typeM[1]; continue; }
          }
        }
      }
      if (currentRef) references.push(currentRef);
    }

    // Fetch references (max 3 per agent for CI)
    const refsToFetch = references.slice(0, 3);
    const highlights = [];

    for (const ref of refsToFetch) {
      console.log(`  Fetching: ${ref.label || ref.url}`);
      const text = await fetchUrl(ref.url);
      if (text) {
        const versions = extractVersions(text);
        if (versions.length > 0) {
          highlights.push(`Latest versions from ${ref.label || ref.url}: ${versions.slice(0, 5).join(', ')}`);
        }
      } else {
        console.log(`  Failed to fetch: ${ref.url}`);
      }
      // Rate limit: 3s between fetches
      await new Promise(r => setTimeout(r, 3000));
    }

    if (highlights.length === 0) {
      console.log(`  No notable findings\n`);
      continue;
    }

    const today = new Date().toISOString().split('T')[0];
    const updateEntry = `- **${today}**: ${highlights.join('; ')}`;

    if (dryRun) {
      console.log(`  Would add to ## Latest Updates: ${updateEntry}`);
      console.log('');
      continue;
    }

    // Apply conservative update
    try {
      let newContent = content;

      if (agent.type === 'md') {
        // Update lastRefreshed in frontmatter
        const fm = extractFrontmatter(newContent);
        if (fm && /^lastRefreshed:/m.test(fm)) {
          newContent = newContent.replace(
            /^lastRefreshed:\s*.+$/m,
            `lastRefreshed: "${new Date().toISOString()}"`,
          );
        } else if (fm) {
          // Add lastRefreshed before the closing ---
          newContent = newContent.replace(
            /\n---\n/,
            `\nlastRefreshed: "${new Date().toISOString()}"\n---\n`,
          );
        }

        // Bump patch version
        const version = extractYamlValue(fm, 'version');
        if (version) {
          const bumped = bumpPatch(version);
          newContent = newContent.replace(
            new RegExp(`^version:\\s*['"]?${version.replace(/\./g, '\\.')}['"]?\\s*$`, 'm'),
            `version: ${bumped}`,
          );
        }

        // Add or update ## Latest Updates section
        if (newContent.includes('## Latest Updates')) {
          newContent = newContent.replace(
            /## Latest Updates\n/,
            `## Latest Updates\n${updateEntry}\n`,
          );
        } else if (newContent.includes('## Changelog')) {
          newContent = newContent.replace(
            '## Changelog',
            `## Latest Updates\n${updateEntry}\n\n## Changelog`,
          );
        } else {
          newContent += `\n\n## Latest Updates\n${updateEntry}\n`;
        }
      } else {
        // JSON agent — less to update
        const json = JSON.parse(newContent);
        json.lastRefreshed = new Date().toISOString();
        if (json.version) json.version = bumpPatch(json.version);
        if (!json.latestUpdates) json.latestUpdates = [];
        json.latestUpdates.unshift({ date: today, findings: highlights });
        newContent = JSON.stringify(json, null, 2) + '\n';
      }

      await writeFile(agent.path, newContent, 'utf-8');
      console.log(`  Updated: ${relative(REPO_ROOT, agent.path)}`);
      updated++;
    } catch (err) {
      console.log(`  Error updating: ${err.message}`);
      failed++;
    }

    console.log('');
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}, Skipped: ${toProcess.length - updated - failed}`);
  if (dryRun) console.log('(dry-run mode — no files were modified)');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
