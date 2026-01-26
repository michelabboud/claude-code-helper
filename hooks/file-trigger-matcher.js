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
const yaml = require('js-yaml');

// Debug configuration - set to true to enable debug logging
const DEBUG_ENABLED = process.env.CLAUDE_HOOKS_DEBUG === 'true' || false;

// Debug log file
const DEBUG_LOG = path.join(process.env.HOME || '', '.claude', 'hooks', 'debug.log');

// Trigger log file (for user visibility via tail -f)
const TRIGGER_LOG = path.join(process.env.HOME || '', '.claude', 'logs', 'agent-triggers.log');

// State file for status line (contains last trigger info)
const TRIGGER_STATE = path.join(process.env.HOME || '', '.claude', 'state', 'last-trigger.json');

/**
 * Ensure directory exists
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Log trigger event to file (for tail -f visibility)
 */
function logTrigger(event, filePath, matches) {
  try {
    ensureDir(TRIGGER_LOG);
    const timestamp = new Date().toISOString();
    const fileName = path.basename(filePath);

    let logLine;
    if (matches.length === 0) {
      // Don't log non-matches to keep log clean
      return;
    } else if (matches.length === 1) {
      const m = matches[0];
      const emoji = m.agent.visual?.emoji || '🤖';
      logLine = `[${timestamp}] ${emoji} ${m.agent.name} ← ${event.toUpperCase()} ${fileName}`;
    } else {
      const primary = matches[0];
      const emoji = primary.agent.visual?.emoji || '🤖';
      logLine = `[${timestamp}] ${emoji} ${primary.agent.name} (+${matches.length - 1} more) ← ${event.toUpperCase()} ${fileName}`;
    }

    fs.appendFileSync(TRIGGER_LOG, logLine + '\n');

    // Also write to stderr for immediate visibility in terminal
    console.error(logLine);
  } catch (error) {
    // Silently fail if can't write log
  }
}

/**
 * Update state file for status line
 */
function updateTriggerState(event, filePath, matches) {
  try {
    ensureDir(TRIGGER_STATE);

    const state = {
      timestamp: new Date().toISOString(),
      event,
      file: filePath,
      fileName: path.basename(filePath),
      matchCount: matches.length,
      primaryAgent: matches.length > 0 ? {
        name: matches[0].agent.name,
        emoji: matches[0].agent.visual?.emoji || '🤖',
        label: matches[0].agent.visual?.label || matches[0].agent.name,
        priority: matches[0].priority,
      } : null,
      allAgents: matches.map(m => ({
        name: m.agent.name,
        emoji: m.agent.visual?.emoji || '🤖',
        priority: m.priority,
      })),
    };

    fs.writeFileSync(TRIGGER_STATE, JSON.stringify(state, null, 2));
  } catch (error) {
    // Silently fail if can't write state
  }
}

// Debug logging function
function debug(message, data = null) {
  if (!DEBUG_ENABLED) return;

  const timestamp = new Date().toISOString();
  const logEntry = data
    ? `[${timestamp}] ${message}\n${JSON.stringify(data, null, 2)}\n`
    : `[${timestamp}] ${message}\n`;

  try {
    fs.appendFileSync(DEBUG_LOG, logEntry);
  } catch (error) {
    // Silently fail if can't write debug log
  }
}

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

  try {
    return yaml.load(match[1]);
  } catch (error) {
    console.error('YAML parse error:', error.message);
    return null;
  }
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
 * Extract file path from tool input JSON
 * Reads from stdin and extracts file_path from tool_input
 */
function extractFilePath(stdinData) {
  debug('Raw stdin data', stdinData);

  if (!stdinData || !stdinData.tool_input) {
    debug('No tool_input in stdin data');
    return null;
  }

  const toolInput = stdinData.tool_input;
  debug('tool_input', toolInput);

  // Read/Edit/Write tools use 'file_path' parameter
  if (toolInput.file_path) {
    debug('Extracted file_path', toolInput.file_path);
    return toolInput.file_path;
  }

  // NotebookEdit uses 'notebook_path' parameter
  if (toolInput.notebook_path) {
    debug('Extracted notebook_path', toolInput.notebook_path);
    return toolInput.notebook_path;
  }

  debug('No file path found in tool_input');
  return null;
}

/**
 * Read JSON data from stdin
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error(`Failed to parse stdin JSON: ${error.message}`));
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Main entry point
 */
async function main() {
  debug('=== Hook script invoked ===');
  debug('process.argv', process.argv);
  debug('process.cwd()', process.cwd());
  debug('process.env.HOME', process.env.HOME);

  // Debug all environment variables (not just keys)
  const envVars = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes('CLAUDE') || key.includes('HOOK') || key.includes('TOOL')) {
      envVars[key] = value;
    }
  }
  debug('CLAUDE/HOOK/TOOL ENVIRONMENT VARS', envVars);

  // Read hook input from stdin
  let stdinData;
  try {
    stdinData = await readStdin();
    debug('Stdin data received', stdinData);
  } catch (error) {
    debug('ERROR reading stdin', error.message);
    console.log(JSON.stringify({ additionalContext: null }));
    return;
  }

  // Extract event from tool_name or stdin
  const toolName = stdinData.tool_name || '';
  const eventMap = {
    'Read': 'read',
    'Edit': 'edit',
    'Write': 'write',
    'NotebookEdit': 'write'
  };
  const event = eventMap[toolName];

  debug('Tool name', toolName);
  debug('Mapped event', event);

  if (!event) {
    debug('No matching event for tool, returning null context');
    console.log(JSON.stringify({ additionalContext: null }));
    debug('=== Hook script completed (no event mapping) ===\n');
    return;
  }

  // Extract file path from stdin tool_input
  const filePath = extractFilePath(stdinData);
  debug('Extracted filePath', filePath);

  // If no file path, return null context
  if (!filePath) {
    debug('No file path found, returning null context');
    console.log(JSON.stringify({ additionalContext: null }));
    debug('=== Hook script completed (no file path) ===\n');
    return;
  }

  // Load agents and match
  debug('Loading agents from directories', AGENT_DIRS);
  const agents = loadAgents();
  debug('Loaded agents count', agents.length);
  debug('Loaded agent names', agents.map(a => a.name));

  const matches = matchFile(filePath, event, agents);
  debug('Matches found', matches.length);
  debug('Match details', matches.map(m => ({
    agent: m.agent.name,
    pattern: m.pattern,
    priority: m.priority
  })));

  // Log trigger for user visibility (Option 2 & 3)
  logTrigger(event, filePath, matches);
  updateTriggerState(event, filePath, matches);

  // Output result
  const output = formatOutput(matches, filePath, event);
  debug('Output to stdout', output);
  console.log(output);
  debug('=== Hook script completed ===\n');
}

main().catch(error => {
  debug('FATAL ERROR', error);
  console.log(JSON.stringify({ additionalContext: null }));
  process.exit(1);
});
