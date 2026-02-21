#!/usr/bin/env node

/**
 * validate-references.mjs
 *
 * Validates that reference URLs in agent frontmatter are reachable.
 * Sends HEAD requests to each URL and reports dead links.
 *
 * Usage:
 *   node scripts/validate-references.mjs [--timeout <ms>] [--verbose]
 *
 * Exit code: 0 = all valid, 1 = dead links found
 *
 * NOTE: This script is intended for scheduled CI runs, not per-PR checks,
 * since URLs can be temporarily unavailable.
 */

import { readdir, readFile } from 'node:fs/promises';
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
let timeout = 10000;
let verbose = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--timeout' && args[i + 1]) {
    timeout = parseInt(args[i + 1], 10);
    i++;
  }
  if (args[i] === '--verbose') verbose = true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

function parseReferences(fm) {
  const refs = [];
  const lines = fm.split('\n');
  let inRefs = false;
  let currentRef = null;

  for (const line of lines) {
    if (/^references:\s*$/.test(line)) { inRefs = true; continue; }
    if (inRefs) {
      if (/^\S/.test(line) && !line.startsWith('  ')) break;
      const urlM = line.match(/^\s+-\s+url:\s*['"]?(.+?)['"]?\s*$/);
      if (urlM) {
        if (currentRef) refs.push(currentRef);
        currentRef = { url: urlM[1] };
        continue;
      }
      if (currentRef) {
        const labelM = line.match(/^\s+label:\s*['"]?(.+?)['"]?\s*$/);
        if (labelM) currentRef.label = labelM[1];
      }
    }
  }
  if (currentRef) refs.push(currentRef);
  return refs;
}

async function checkUrl(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try HEAD first, fall back to GET if HEAD returns 405
    let resp = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'claude-code-helper-link-check/1.0' },
      redirect: 'follow',
    });

    if (resp.status === 405) {
      resp = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'claude-code-helper-link-check/1.0' },
        redirect: 'follow',
      });
    }

    clearTimeout(timer);
    return { ok: resp.ok, status: resp.status };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: err.name === 'AbortError' ? 'TIMEOUT' : err.message };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const allRefs = [];

  // Scan domain experts
  const domainDir = join(REPO_ROOT, 'agents', 'domain-experts');
  try {
    const files = await readdir(domainDir);
    for (const file of files) {
      if (!file.endsWith('.md') || file === 'README.md') continue;
      const content = await readFile(join(domainDir, file), 'utf-8');
      const fm = extractFrontmatter(content);
      if (!fm) continue;
      const refs = parseReferences(fm);
      for (const ref of refs) {
        allRefs.push({ agent: basename(file, '.md'), file: `agents/domain-experts/${file}`, ...ref });
      }
    }
  } catch { /* dir missing */ }

  // Scan MCP agents
  const mcpDir = join(REPO_ROOT, 'agents', 'mcp-integrated');
  try {
    const files = await readdir(mcpDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const content = await readFile(join(mcpDir, file), 'utf-8');
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json.references)) {
          for (const ref of json.references) {
            allRefs.push({ agent: json.name || basename(file, '.json'), file: `agents/mcp-integrated/${file}`, ...ref });
          }
        }
      } catch { /* invalid JSON */ }
    }
  } catch { /* dir missing */ }

  console.log(`Validating ${allRefs.length} reference URLs across ${new Set(allRefs.map(r => r.agent)).size} agents...\n`);

  let deadLinks = 0;
  let checked = 0;

  for (const ref of allRefs) {
    const result = await checkUrl(ref.url, timeout);
    checked++;

    if (result.ok) {
      if (verbose) console.log(`  OK  ${ref.agent}: ${ref.url}`);
    } else {
      console.log(`  DEAD  ${ref.agent}: ${ref.url} (${result.status})`);
      deadLinks++;
    }

    // Rate limit: 1s between checks
    if (checked < allRefs.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\nChecked: ${checked}, Dead: ${deadLinks}`);

  if (deadLinks > 0) {
    console.log('\nDead links found — review and update agent reference URLs.');
    process.exit(1);
  } else {
    console.log('\nAll reference URLs are reachable.');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
