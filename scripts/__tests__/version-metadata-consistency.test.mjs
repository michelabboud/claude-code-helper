/**
 * Ensures checked-in repository version metadata does not drift.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '..', '..');

async function readJson(repoRelativePath) {
  const raw = await readFile(join(REPO_ROOT, repoRelativePath), 'utf-8');
  return JSON.parse(raw);
}

describe('repository version metadata', () => {
  test('root package.json matches component-versions.json', async () => {
    const [pkg, components] = await Promise.all([
      readJson('package.json'),
      readJson('component-versions.json'),
    ]);

    assert.equal(pkg.version, components.repoVersion);
  });
});
