#!/usr/bin/env node
/**
 * Validates YAML frontmatter in agent, skill, and command markdown files.
 * Checks required fields, valid values, and trigger pattern syntax.
 *
 * Usage: node scripts/validate-frontmatter.mjs
 * Exit code: 0 = all valid, 1 = errors found
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import YAML from 'yaml';

const ROOT = process.cwd();
const VALID_MODELS = ['sonnet', 'opus', 'haiku', 'opusplan'];
const ERRORS = [];
const WARNINGS = [];
let filesChecked = 0;

function collectMdFiles(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const stat = statSync(full);
        if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules' && entry !== 'build' && entry !== 'venv') {
          files.push(...collectMdFiles(full));
        } else if (stat.isFile() && (entry.endsWith('.md') && entry !== 'README.md' && entry !== 'CHANGELOG.md')) {
          files.push(full);
        }
      } catch { /* skip unreadable */ }
    }
  } catch { /* skip unreadable dirs */ }
  return files;
}

function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return YAML.parse(match[1]);
  } catch (e) {
    return { _parseError: e.message };
  }
}

function validateAgent(filePath, fm) {
  const rel = relative(ROOT, filePath);

  if (fm._parseError) {
    ERRORS.push(`${rel}: YAML parse error: ${fm._parseError}`);
    return;
  }

  // Required fields
  if (!fm.name) {
    ERRORS.push(`${rel}: Missing required field 'name'`);
  } else if (typeof fm.name !== 'string') {
    ERRORS.push(`${rel}: 'name' must be a string, got ${typeof fm.name}`);
  }

  if (!fm.description) {
    ERRORS.push(`${rel}: Missing required field 'description'`);
  } else if (typeof fm.description !== 'string') {
    ERRORS.push(`${rel}: 'description' must be a string, got ${typeof fm.description}`);
  }

  // Model validation
  if (fm.model && !VALID_MODELS.includes(fm.model)) {
    ERRORS.push(`${rel}: Invalid model '${fm.model}'. Must be one of: ${VALID_MODELS.join(', ')}`);
  }

  // Trigger validation
  if (fm.triggers) {
    // Keywords
    if (fm.triggers.keywords) {
      if (!Array.isArray(fm.triggers.keywords)) {
        ERRORS.push(`${rel}: triggers.keywords must be an array`);
      } else {
        fm.triggers.keywords.forEach((kw, i) => {
          if (typeof kw === 'object' && kw.pattern) {
            try {
              const flags = kw.case_insensitive ? 'i' : '';
              new RegExp(kw.pattern, flags);
            } catch (e) {
              ERRORS.push(`${rel}: triggers.keywords[${i}].pattern is invalid regex: ${e.message}`);
            }
          }
        });
      }
    }

    // Files
    if (fm.triggers.files) {
      if (!Array.isArray(fm.triggers.files)) {
        ERRORS.push(`${rel}: triggers.files must be an array`);
      } else {
        fm.triggers.files.forEach((f, i) => {
          if (!f.pattern) {
            ERRORS.push(`${rel}: triggers.files[${i}] missing 'pattern' field`);
          }
          if (f.on && !Array.isArray(f.on)) {
            ERRORS.push(`${rel}: triggers.files[${i}].on must be an array`);
          }
        });
      }
    }

    // Priority
    if (fm.triggers.priority !== undefined) {
      if (typeof fm.triggers.priority !== 'number' || fm.triggers.priority < 0) {
        WARNINGS.push(`${rel}: triggers.priority should be a positive number`);
      }
    }
  }

  // Visual validation
  if (fm.visual) {
    if (fm.visual.color && !/^#[0-9A-Fa-f]{6}$/.test(fm.visual.color)) {
      WARNINGS.push(`${rel}: visual.color '${fm.visual.color}' is not a valid hex color`);
    }
  }
}

function validateSkill(filePath, fm) {
  const rel = relative(ROOT, filePath);

  if (fm._parseError) {
    WARNINGS.push(`${rel}: YAML parse error: ${fm._parseError}`);
    return;
  }

  // Skills/commands may use 'name', 'skill_name', or 'command' as their identifier
  // If none present, the filename is used as the name (valid Claude Code behavior)
  const hasName = fm.name || fm.skill_name || fm.command;
  if (!hasName) {
    WARNINGS.push(`${rel}: No explicit identifier field - will use filename as name`);
  } else if (typeof hasName !== 'string') {
    ERRORS.push(`${rel}: Identifier field must be a string, got ${typeof hasName}`);
  }

  if (!fm.description) {
    WARNINGS.push(`${rel}: Missing 'description' field (recommended)`);
  }

  if (fm.model && !VALID_MODELS.includes(fm.model)) {
    ERRORS.push(`${rel}: Invalid model '${fm.model}'. Must be one of: ${VALID_MODELS.join(', ')}`);
  }
}

// ── Main ──

console.log('Validating frontmatter...\n');

// Agents
const agentDirs = [
  join(ROOT, 'agents', 'domain-experts'),
  join(ROOT, 'agents', 'mcp-integrated'),
  join(ROOT, 'config-bundle', 'agents'),
];

for (const dir of agentDirs) {
  try {
    for (const file of collectMdFiles(dir)) {
      const content = readFileSync(file, 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm) {
        validateAgent(file, fm);
        filesChecked++;
      }
    }
  } catch { /* dir doesn't exist */ }
}

// Skills
const skillDirs = [join(ROOT, 'skills')];
for (const dir of skillDirs) {
  try {
    for (const file of collectMdFiles(dir)) {
      const content = readFileSync(file, 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm) {
        validateSkill(file, fm);
        filesChecked++;
      }
    }
  } catch { /* dir doesn't exist */ }
}

// Commands
const cmdDirs = [join(ROOT, 'commands')];
for (const dir of cmdDirs) {
  try {
    for (const file of collectMdFiles(dir)) {
      const content = readFileSync(file, 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm) {
        validateSkill(file, fm); // commands use same schema as skills
        filesChecked++;
      }
    }
  } catch { /* dir doesn't exist */ }
}

// ── Report ──

console.log(`Files checked: ${filesChecked}`);
console.log(`Errors: ${ERRORS.length}`);
console.log(`Warnings: ${WARNINGS.length}`);
console.log('');

if (WARNINGS.length > 0) {
  console.log('WARNINGS:');
  WARNINGS.forEach(w => console.log(`  ⚠  ${w}`));
  console.log('');
}

if (ERRORS.length > 0) {
  console.log('ERRORS:');
  ERRORS.forEach(e => console.log(`  ✗  ${e}`));
  console.log('');
  process.exit(1);
}

console.log('✓ All frontmatter valid');
