/**
 * generate-version-index.test.mjs
 *
 * Tests for scripts/generate-version-index.mjs using Node.js built-in test runner.
 *
 * Strategy: run the script via child_process, then read and validate the output
 * JSON. This tests the real script end-to-end without needing Jest.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..');
const SCRIPT_PATH = join(REPO_ROOT, 'scripts', 'generate-version-index.mjs');
const OUTPUT_PATH = join(REPO_ROOT, 'component-versions.json');

// Shared state: run the script once before all tests
let outputData = null;
let scriptStdout = '';

before(async () => {
  const result = await execFileAsync(process.execPath, [SCRIPT_PATH], {
    cwd: REPO_ROOT,
    timeout: 30_000,
  });
  scriptStdout = result.stdout;
  const raw = await readFile(OUTPUT_PATH, 'utf-8');
  outputData = JSON.parse(raw);
});

// ---------------------------------------------------------------------------
// Script execution
// ---------------------------------------------------------------------------

describe('Script execution', () => {
  test('script exits without error', () => {
    // If we reach here, execFileAsync resolved successfully (exit code 0).
    assert.ok(true, 'script exited with code 0');
  });

  test('script prints a summary line to stdout', () => {
    assert.ok(
      scriptStdout.includes('Generated component-versions.json'),
      `stdout should mention output file, got: ${scriptStdout}`,
    );
  });

  test('component-versions.json exists on disk', async () => {
    await assert.doesNotReject(
      () => access(OUTPUT_PATH),
      'component-versions.json should exist',
    );
  });
});

// ---------------------------------------------------------------------------
// Top-level schema
// ---------------------------------------------------------------------------

describe('Output schema', () => {
  test('has schemaVersion field equal to 1', () => {
    assert.equal(outputData.schemaVersion, 1);
  });

  test('has repoVersion string', () => {
    assert.equal(typeof outputData.repoVersion, 'string');
    assert.ok(outputData.repoVersion.length > 0, 'repoVersion should not be empty');
  });

  test('repoVersion matches root package.json', async () => {
    const pkg = JSON.parse(await readFile(join(REPO_ROOT, 'package.json'), 'utf-8'));
    assert.equal(outputData.repoVersion, pkg.version);
  });

  test('has generatedAt ISO timestamp', () => {
    assert.equal(typeof outputData.generatedAt, 'string');
    const parsed = new Date(outputData.generatedAt);
    assert.ok(!isNaN(parsed.getTime()), 'generatedAt should parse as a valid date');
  });

  test('has components object', () => {
    assert.equal(typeof outputData.components, 'object');
    assert.ok(!Array.isArray(outputData.components), 'components should be a plain object');
  });
});

// ---------------------------------------------------------------------------
// Component count
// ---------------------------------------------------------------------------

describe('Component counts', () => {
  test('total components is at least 80', () => {
    const total = Object.keys(outputData.components).length;
    assert.ok(total >= 80, `expected >= 80 components, got ${total}`);
  });

  test('component keys are sorted alphabetically', () => {
    const keys = Object.keys(outputData.components);
    const sorted = [...keys].sort();
    assert.deepEqual(keys, sorted, 'component keys should be sorted alphabetically');
  });
});

// ---------------------------------------------------------------------------
// Per-component required fields
// ---------------------------------------------------------------------------

describe('Per-component fields', () => {
  test('every component has a type field', () => {
    const missing = Object.entries(outputData.components)
      .filter(([, v]) => !v.type)
      .map(([k]) => k);
    assert.deepEqual(missing, [], `components missing type: ${missing.join(', ')}`);
  });

  test('every component has a file field', () => {
    const missing = Object.entries(outputData.components)
      .filter(([, v]) => typeof v.file !== 'string')
      .map(([k]) => k);
    assert.deepEqual(missing, [], `components missing file: ${missing.join(', ')}`);
  });

  test('every component has an installPath field (string or null)', () => {
    const invalid = Object.entries(outputData.components)
      .filter(([, v]) => !('installPath' in v))
      .map(([k]) => k);
    assert.deepEqual(invalid, [], `components missing installPath key: ${invalid.join(', ')}`);
  });

  test('every component has a changelog field', () => {
    const missing = Object.entries(outputData.components)
      .filter(([, v]) => typeof v.changelog !== 'string')
      .map(([k]) => k);
    assert.deepEqual(missing, [], `components missing changelog: ${missing.join(', ')}`);
  });

  test('every component has a version field (string or null)', () => {
    const invalid = Object.entries(outputData.components)
      .filter(([, v]) => !('version' in v))
      .map(([k]) => k);
    assert.deepEqual(invalid, [], `components missing version key: ${invalid.join(', ')}`);
  });
});

// ---------------------------------------------------------------------------
// Version format
// ---------------------------------------------------------------------------

describe('Version format', () => {
  const SEMVER_RE = /^\d+\.\d+\.\d+/;

  test('all non-null versions match semver X.Y.Z pattern', () => {
    const badVersions = Object.entries(outputData.components)
      .filter(([, v]) => v.version !== null && !SEMVER_RE.test(v.version))
      .map(([k, v]) => `${k}: "${v.version}"`);
    assert.deepEqual(
      badVersions,
      [],
      `non-semver versions found:\n${badVersions.join('\n')}`,
    );
  });
});

// ---------------------------------------------------------------------------
// MCP server specifics
// ---------------------------------------------------------------------------

describe('MCP server components', () => {
  let mcpEntries;

  before(() => {
    mcpEntries = Object.entries(outputData.components).filter(
      ([, v]) => v.type === 'mcp-server',
    );
  });

  test('at least one mcp-server component is present', () => {
    assert.ok(mcpEntries.length >= 1, 'expected at least 1 mcp-server component');
  });

  test('all mcp-server components have buildRequired: true', () => {
    const notBuild = mcpEntries
      .filter(([, v]) => v.buildRequired !== true)
      .map(([k]) => k);
    assert.deepEqual(
      notBuild,
      [],
      `mcp-server entries without buildRequired:true: ${notBuild.join(', ')}`,
    );
  });

  test('mcp-server keys start with "mcp-servers/"', () => {
    const badKeys = mcpEntries.filter(([k]) => !k.startsWith('mcp-servers/')).map(([k]) => k);
    assert.deepEqual(badKeys, [], `unexpected mcp-server keys: ${badKeys.join(', ')}`);
  });

  test('mcp-server file points to package.json', () => {
    const wrong = mcpEntries
      .filter(([, v]) => !v.file.endsWith('package.json'))
      .map(([k, v]) => `${k}: ${v.file}`);
    assert.deepEqual(wrong, [], `mcp-server file should end with package.json: ${wrong.join(', ')}`);
  });

  test('mcp-shared is excluded from mcp-server components', () => {
    const hasMcpShared = mcpEntries.some(([k]) => k === 'mcp-servers/mcp-shared');
    assert.equal(hasMcpShared, false, 'mcp-shared should be excluded');
  });
});

// ---------------------------------------------------------------------------
// Skill subdirectory components
// ---------------------------------------------------------------------------

describe('Skill subdirectory components', () => {
  let skillSubdirEntries;

  before(() => {
    skillSubdirEntries = Object.entries(outputData.components).filter(
      ([, v]) => v.type === 'skill' && v.installPath && v.installPath.endsWith('/'),
    );
  });

  test('at least one skill with directory-style installPath exists', () => {
    assert.ok(
      skillSubdirEntries.length >= 1,
      'expected at least one subdirectory-based skill',
    );
  });

  test('skill subdirectory installPath ends with "/"', () => {
    const bad = skillSubdirEntries.filter(([, v]) => !v.installPath.endsWith('/'));
    assert.deepEqual(bad, [], 'all subdirectory skill installPaths should end with /');
  });

  test('skill subdirectory file points to SKILL.md', () => {
    const wrong = skillSubdirEntries
      .filter(([, v]) => !v.file.endsWith('SKILL.md'))
      .map(([k, v]) => `${k}: ${v.file}`);
    assert.deepEqual(wrong, [], `skill subdir file should point to SKILL.md: ${wrong.join(', ')}`);
  });
});

// ---------------------------------------------------------------------------
// All component types are represented
// ---------------------------------------------------------------------------

describe('Component type coverage', () => {
  const REQUIRED_TYPES = ['agent', 'skill', 'hook', 'plugin', 'integration', 'mcp-server'];

  for (const requiredType of REQUIRED_TYPES) {
    test(`at least one "${requiredType}" component is present`, () => {
      const count = Object.values(outputData.components).filter(
        (v) => v.type === requiredType,
      ).length;
      assert.ok(count >= 1, `expected at least 1 "${requiredType}", found ${count}`);
    });
  }
});

// ---------------------------------------------------------------------------
// Changelog field format
// ---------------------------------------------------------------------------

describe('Changelog field format', () => {
  test('agent changelog references the source file with #changelog anchor', () => {
    const agentEntries = Object.entries(outputData.components).filter(
      ([, v]) => v.type === 'agent',
    );
    const badChangelog = agentEntries
      .filter(([, v]) => !v.changelog.includes('#changelog'))
      .map(([k]) => k);
    assert.deepEqual(
      badChangelog,
      [],
      `agents with unexpected changelog format: ${badChangelog.join(', ')}`,
    );
  });
});
