#!/usr/bin/env node

/**
 * generate-version-index.mjs
 *
 * Walks the distributable directories of claude-code-helper and generates
 * component-versions.json at the repo root with version metadata for every
 * agent, skill, hook, plugin, integration, and MCP server.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, basename, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the YAML frontmatter block from a markdown file.
 * Returns the raw string between the opening and closing '---' fences,
 * or null if no frontmatter is found.
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : null;
}

/**
 * Extract a scalar value for `key` from a YAML frontmatter string.
 * Only matches top-level keys (no leading whitespace) to avoid picking up
 * values nested inside code blocks or sub-objects.
 */
function extractYamlValue(frontmatter, key) {
  const re = new RegExp(`^${key}:\\s*['"]?([^'"\n]+?)['"]?\\s*$`, 'm');
  const match = frontmatter.match(re);
  return match ? match[1].trim() : null;
}

/**
 * Extract the `references` array from a YAML frontmatter string.
 * Uses full YAML parsing since references is a nested array of objects.
 * Returns the array or null if not present.
 */
function extractReferences(frontmatter) {
  try {
    const parsed = YAML.parse(frontmatter);
    if (parsed && Array.isArray(parsed.references)) {
      return parsed.references;
    }
  } catch {
    // Fall through — YAML parse failed
  }
  return null;
}

/**
 * Extract the `webSearchEnabled` boolean from YAML frontmatter.
 * Returns true/false or null if not present.
 */
function extractWebSearchEnabled(frontmatter) {
  const match = frontmatter.match(/^webSearchEnabled:\s*(true|false)\s*$/m);
  return match ? match[1] === 'true' : null;
}

/**
 * List files in a directory matching an extension, excluding README.md.
 * Returns absolute paths.
 */
async function listFiles(dir, ext) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter(e => e.isFile() && e.name.endsWith(ext) && e.name !== 'README.md')
    .map(e => join(dir, e.name));
}

/**
 * List immediate subdirectories of a directory.
 */
async function listSubdirs(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries.filter(e => e.isDirectory()).map(e => join(dir, e.name));
}

/**
 * Derive the component key from a repo-relative file path.
 * Strips the file extension to produce a path prefix like
 * "agents/domain-experts/api-expert" or "skills/pm-dashboard".
 */
function componentKey(repoRelPath) {
  const ext = extname(repoRelPath);
  // For skills in subdirectories (e.g. skills/pm-dashboard/SKILL.md) the key
  // should be the directory: "skills/pm-dashboard"
  if (basename(repoRelPath) === 'SKILL.md') {
    return dirname(repoRelPath);
  }
  return repoRelPath.replace(ext, '');
}

// ---------------------------------------------------------------------------
// Scanners — one per component category
// ---------------------------------------------------------------------------

/** Scan agents/domain-experts/*.md */
async function scanDomainExperts() {
  const dir = join(REPO_ROOT, 'agents', 'domain-experts');
  const files = await listFiles(dir, '.md');
  const components = {};

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const fm = extractFrontmatter(content);
    const version = fm ? extractYamlValue(fm, 'version') : null;
    const references = fm ? extractReferences(fm) : null;
    const webSearchEnabled = fm ? extractWebSearchEnabled(fm) : null;
    const rel = relative(REPO_ROOT, filePath);
    const key = componentKey(rel);

    const entry = {
      type: 'agent',
      version: version || null,
      file: rel,
      installPath: `agents/${basename(filePath)}`,
      changelog: `${rel}#changelog`,
    };
    if (references) entry.references = references;
    if (webSearchEnabled) entry.webSearchEnabled = true;
    components[key] = entry;
  }
  return components;
}

/** Scan agents/mcp-integrated/*.json */
async function scanMcpAgents() {
  const dir = join(REPO_ROOT, 'agents', 'mcp-integrated');
  const files = await listFiles(dir, '.json');
  const components = {};

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    let json;
    try {
      json = JSON.parse(content);
    } catch {
      json = {};
    }
    const rel = relative(REPO_ROOT, filePath);
    const key = componentKey(rel);

    const entry = {
      type: 'agent',
      version: json.version || null,
      file: rel,
      installPath: `agents/${basename(filePath)}`,
      changelog: `${rel}#changelog`,
    };
    if (Array.isArray(json.references)) entry.references = json.references;
    components[key] = entry;
  }
  return components;
}

/** Scan skills — both flat .md files and subdirectory/SKILL.md */
async function scanSkills() {
  const dir = join(REPO_ROOT, 'skills');
  const components = {};

  // Flat .md skill files (e.g. skills/refactoring-strategy.md)
  const flatFiles = await listFiles(dir, '.md');
  for (const filePath of flatFiles) {
    const content = await readFile(filePath, 'utf-8');
    const fm = extractFrontmatter(content);
    const version = fm ? extractYamlValue(fm, 'version') : null;
    const rel = relative(REPO_ROOT, filePath);
    const key = componentKey(rel);

    components[key] = {
      type: 'skill',
      version: version || null,
      file: rel,
      installPath: `skills/${basename(filePath)}`,
      changelog: `${rel}#changelog`,
    };
  }

  // Subdirectory skills (e.g. skills/pm-dashboard/SKILL.md)
  const subdirs = await listSubdirs(dir);
  for (const subdir of subdirs) {
    const skillFile = join(subdir, 'SKILL.md');
    let content;
    try {
      content = await readFile(skillFile, 'utf-8');
    } catch {
      continue; // no SKILL.md in this subdirectory
    }
    const fm = extractFrontmatter(content);
    const version = fm ? extractYamlValue(fm, 'version') : null;
    const rel = relative(REPO_ROOT, skillFile);
    const key = componentKey(rel); // e.g. "skills/pm-dashboard"

    components[key] = {
      type: 'skill',
      version: version || null,
      file: rel,
      installPath: `skills/${basename(subdir)}/`,
      changelog: `${rel}#changelog`,
    };
  }

  return components;
}

/** Scan hooks/*.md (excluding README.md) */
async function scanHooks() {
  const dir = join(REPO_ROOT, 'hooks');
  const files = await listFiles(dir, '.md');
  const components = {};

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const fm = extractFrontmatter(content);
    const version = fm ? extractYamlValue(fm, 'version') : null;
    const rel = relative(REPO_ROOT, filePath);
    const key = componentKey(rel);

    components[key] = {
      type: 'hook',
      version: version || null,
      file: rel,
      installPath: `hooks/${basename(filePath)}`,
      changelog: `${rel}#changelog`,
    };
  }
  return components;
}

/** Scan plugins/*.md (excluding README.md) */
async function scanPlugins() {
  const dir = join(REPO_ROOT, 'plugins');
  const files = await listFiles(dir, '.md');
  const components = {};

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const fm = extractFrontmatter(content);
    const version = fm ? extractYamlValue(fm, 'version') : null;
    const rel = relative(REPO_ROOT, filePath);
    const key = componentKey(rel);

    components[key] = {
      type: 'plugin',
      version: version || null,
      file: rel,
      installPath: `plugins/${basename(filePath)}`,
      changelog: `${rel}#changelog`,
    };
  }
  return components;
}

/** Scan integrations/*.md (excluding README.md) */
async function scanIntegrations() {
  const dir = join(REPO_ROOT, 'integrations');
  const files = await listFiles(dir, '.md');
  const components = {};

  for (const filePath of files) {
    const content = await readFile(filePath, 'utf-8');
    const fm = extractFrontmatter(content);
    const version = fm ? extractYamlValue(fm, 'version') : null;
    const rel = relative(REPO_ROOT, filePath);
    const key = componentKey(rel);

    components[key] = {
      type: 'integration',
      version: version || null,
      file: rel,
      installPath: `integrations/${basename(filePath)}`,
      changelog: `${rel}#changelog`,
    };
  }
  return components;
}

/** Scan mcp-servers package.json files (excluding mcp-shared) */
async function scanMcpServers() {
  const dir = join(REPO_ROOT, 'mcp-servers');
  const subdirs = await listSubdirs(dir);
  const components = {};

  for (const subdir of subdirs) {
    const name = basename(subdir);
    if (name === 'mcp-shared') continue;

    const pkgPath = join(subdir, 'package.json');
    let content;
    try {
      content = await readFile(pkgPath, 'utf-8');
    } catch {
      continue; // no package.json
    }

    let pkg;
    try {
      pkg = JSON.parse(content);
    } catch {
      pkg = {};
    }

    const key = `mcp-servers/${name}`;
    components[key] = {
      type: 'mcp-server',
      version: pkg.version || null,
      file: `mcp-servers/${name}/package.json`,
      installPath: `mcp-servers/${name}/`,
      changelog: `mcp-servers/${name}/CHANGELOG.md`,
      buildRequired: true,
    };
  }
  return components;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Read repo version from root package.json
  const rootPkg = JSON.parse(
    await readFile(join(REPO_ROOT, 'package.json'), 'utf-8'),
  );
  const repoVersion = rootPkg.version || 'unknown';

  // Run all scanners
  const [
    domainExperts,
    mcpAgents,
    skills,
    hooks,
    plugins,
    integrations,
    mcpServers,
  ] = await Promise.all([
    scanDomainExperts(),
    scanMcpAgents(),
    scanSkills(),
    scanHooks(),
    scanPlugins(),
    scanIntegrations(),
    scanMcpServers(),
  ]);

  // Merge all components (keys are unique by construction)
  const components = {
    ...domainExperts,
    ...mcpAgents,
    ...skills,
    ...hooks,
    ...plugins,
    ...integrations,
    ...mcpServers,
  };

  // Sort keys alphabetically for stable output
  const sorted = {};
  for (const key of Object.keys(components).sort()) {
    sorted[key] = components[key];
  }

  const output = {
    schemaVersion: 2,
    repoVersion,
    generatedAt: new Date().toISOString(),
    components: sorted,
  };

  const outPath = join(REPO_ROOT, 'component-versions.json');
  await writeFile(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');

  // Print summary
  const counts = {};
  for (const entry of Object.values(sorted)) {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  }

  const total = Object.keys(sorted).length;
  const breakdown = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, count]) => `${count} ${type}${count !== 1 ? 's' : ''}`)
    .join(', ');

  console.log(
    `Generated component-versions.json: ${total} components (${breakdown})`,
  );
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
