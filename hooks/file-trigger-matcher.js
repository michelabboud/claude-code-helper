#!/usr/bin/env node
/**
 * File Trigger Matcher Hook Script
 *
 * This script is called by Claude Code hooks to match file operations
 * against agent triggers and provide context to the AI.
 *
 * Usage: node file-trigger-matcher.js <event> <file_path>
 * Events: read, edit, write
 *
 * Output: JSON with additionalContext for Claude Code hooks
 */

const fs = require('fs');
const path = require('path');
const { minimatch } = require('minimatch');

// Agent directories to scan
const AGENT_DIRS = [
  path.join(process.env.HOME || '', '.claude', 'agents'),
  path.join(process.cwd(), '.claude', 'agents'),
  path.join(process.cwd(), 'agents', 'domain-experts'),
  path.join(process.cwd(), 'agents', 'mcp-integrated'),
];

/**
 * Parse YAML frontmatter from markdown file
 */
function parseYamlFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  // Simple YAML parser for our use case
  let currentKey = null;
  let inArray = false;
  let arrayKey = null;
  let indent = 0;

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const lineIndent = line.search(/\S/);

    // Key-value pair
    const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;

      if (lineIndent === 0) {
        currentKey = key;
        if (value === '' || value === '|') {
          result[key] = value === '|' ? '' : {};
          inArray = false;
        } else if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          result[key] = value.replace(/^["']|["']$/g, '');
          inArray = false;
        }
      } else if (currentKey && typeof result[currentKey] === 'object') {
        if (Array.isArray(result[currentKey])) {
          // Skip
        } else {
          result[currentKey][key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }

    // Array item
    if (trimmed.startsWith('- ')) {
      const itemValue = trimmed.slice(2).trim();
      if (currentKey) {
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }

        // Check if it's an object item
        const objMatch = itemValue.match(/^(\w+):\s*(.*)$/);
        if (objMatch) {
          const obj = { [objMatch[1]]: objMatch[2].replace(/^["']|["']$/g, '') };
          result[currentKey].push(obj);
        } else if (itemValue.startsWith('{')) {
          // Inline object
          try {
            const parsed = JSON.parse(itemValue.replace(/(\w+):/g, '"$1":'));
            result[currentKey].push(parsed);
          } catch {
            result[currentKey].push(itemValue);
          }
        } else {
          result[currentKey].push(itemValue.replace(/^["']|["']$/g, ''));
        }
      }
    }
  }

  return result;
}

/**
 * Parse agent file (markdown or JSON)
 */
function parseAgentFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, ext);

    if (ext === '.md') {
      const data = parseYamlFrontmatter(content);
      if (!data) return null;
      return {
        name: data.name || fileName,
        description: data.description || '',
        triggers: data.triggers,
        visual: data.visual,
        filePath,
        type: 'domain-expert',
      };
    } else if (ext === '.json') {
      const data = JSON.parse(content);
      return {
        name: data.name || fileName,
        description: data.description || '',
        triggers: data.triggers,
        visual: data.visual,
        mcp_servers: data.mcp_servers,
        filePath,
        type: 'mcp-integrated',
      };
    }
  } catch (error) {
    // Silently skip invalid files
  }
  return null;
}

/**
 * Scan directory for agent files
 */
function scanAgentDirectory(dirPath) {
  const agents = [];

  try {
    if (!fs.existsSync(dirPath)) return agents;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        agents.push(...scanAgentDirectory(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.md' || ext === '.json') {
          const agent = parseAgentFile(fullPath);
          if (agent && agent.triggers) {
            agents.push(agent);
          }
        }
      }
    }
  } catch (error) {
    // Silently skip inaccessible directories
  }

  return agents;
}

/**
 * Load all agents with triggers
 */
function loadAgents() {
  const agents = [];
  const seen = new Set();

  for (const dir of AGENT_DIRS) {
    for (const agent of scanAgentDirectory(dir)) {
      if (!seen.has(agent.name)) {
        seen.add(agent.name);
        agents.push(agent);
      }
    }
  }

  return agents;
}

/**
 * Normalize file path for matching
 */
function normalizePath(filePath) {
  return filePath
    .replace(/^\.\//, '')
    .replace(/\\/g, '/')
    .replace(/^\//, '');
}

/**
 * Match file against agent triggers
 */
function matchFile(filePath, event, agents) {
  const matches = [];
  const normalizedPath = normalizePath(filePath);

  for (const agent of agents) {
    if (!agent.triggers?.files) continue;

    for (const filePattern of agent.triggers.files) {
      const pattern = filePattern.pattern;
      const events = filePattern.on || ['read', 'edit', 'write'];

      // Check event type
      if (!events.includes(event)) continue;

      // Check pattern match
      if (minimatch(normalizedPath, pattern, { dot: true, matchBase: true })) {
        const priority = agent.triggers.priority || 10;
        matches.push({
          agent,
          pattern,
          priority,
        });
        break; // One match per agent is enough
      }
    }
  }

  // Sort by priority descending
  matches.sort((a, b) => b.priority - a.priority);

  return matches;
}

/**
 * Format output for Claude Code hook additionalContext
 */
function formatOutput(matches, filePath, event) {
  if (matches.length === 0) {
    return JSON.stringify({ additionalContext: null });
  }

  const agentList = matches
    .map((m) => {
      const emoji = m.agent.visual?.emoji || '🤖';
      const label = m.agent.visual?.label || m.agent.name;
      return `  ${emoji} ${label} (priority: ${m.priority}, pattern: ${m.pattern})`;
    })
    .join('\n');

  const bestMatch = matches[0];
  const suggestion =
    matches.length === 1
      ? `Consider using the ${bestMatch.agent.visual?.emoji || '🤖'} ${bestMatch.agent.name} agent for this ${event} operation.`
      : `${matches.length} agents match this file pattern. The highest priority is ${bestMatch.agent.visual?.emoji || '🤖'} ${bestMatch.agent.name}.`;

  const context = `
[Agent File Trigger Match]
File: ${filePath}
Event: ${event}
Matching agents:
${agentList}

${suggestion}
`.trim();

  // Output for Claude Code PreToolUse hook additionalContext
  return JSON.stringify({
    additionalContext: context,
    matchedAgents: matches.map((m) => ({
      name: m.agent.name,
      priority: m.priority,
      pattern: m.pattern,
      emoji: m.agent.visual?.emoji,
      label: m.agent.visual?.label,
    })),
  });
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: file-trigger-matcher.js <event> <file_path>');
    console.error('Events: read, edit, write');
    process.exit(1);
  }

  const [event, filePath] = args;

  if (!['read', 'edit', 'write'].includes(event)) {
    console.error(`Invalid event: ${event}. Must be read, edit, or write.`);
    process.exit(1);
  }

  // Load agents and match
  const agents = loadAgents();
  const matches = matchFile(filePath, event, agents);

  // Output result
  console.log(formatOutput(matches, filePath, event));
}

main();
