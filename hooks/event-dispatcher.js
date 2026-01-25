#!/usr/bin/env node
/**
 * Event Dispatcher Hook Script
 *
 * Dispatches Claude Code events to matching agent triggers.
 * Called by event-trigger-hook.json for PreToolUse and PostToolUse events.
 *
 * Usage: node event-dispatcher.js <event_type> <tool_name> [file_path] [command]
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

// Valid event types
const VALID_EVENT_TYPES = [
  'PreToolUse',
  'PostToolUse',
  'PreCommit',
  'PostCommit',
  'SessionStart',
  'SessionEnd',
];

/**
 * Parse YAML frontmatter from markdown file (simplified)
 */
function parseYamlFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = { triggers: {} };

  let currentSection = null;
  let currentKey = null;

  for (const line of yaml.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.search(/\S/);

    // Top-level key
    if (indent === 0) {
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        currentSection = key;
        if (value && !value.startsWith('{') && !value.startsWith('[')) {
          result[key] = value.replace(/^["']|["']$/g, '');
        } else if (value.startsWith('[') && value.endsWith(']')) {
          result[key] = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''));
        } else {
          result[key] = {};
        }
      }
    }
    // Nested content
    else if (currentSection === 'triggers') {
      const kvMatch = trimmed.match(/^(\w+):\s*(.*)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        currentKey = key;
        if (value && value.startsWith('[') && value.endsWith(']')) {
          result.triggers[key] = value
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''));
        } else if (value) {
          result.triggers[key] = value.replace(/^["']|["']$/g, '');
        } else {
          result.triggers[key] = [];
        }
      }
      // Array item
      else if (trimmed.startsWith('- ')) {
        const itemValue = trimmed.slice(2).trim();
        if (currentKey && Array.isArray(result.triggers[currentKey])) {
          // Try to parse as object
          if (itemValue.startsWith('{')) {
            try {
              const obj = JSON.parse(
                itemValue.replace(/(\w+):/g, '"$1":').replace(/'/g, '"')
              );
              result.triggers[currentKey].push(obj);
            } catch {
              result.triggers[currentKey].push(itemValue);
            }
          } else {
            result.triggers[currentKey].push(
              itemValue.replace(/^["']|["']$/g, '')
            );
          }
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
 * Evaluate a condition expression safely
 */
function evaluateCondition(condition, context) {
  try {
    // Simple string-based evaluation for common patterns
    const patterns = [
      {
        regex: /file\.path\.includes\(["'](.+?)["']\)/,
        eval: (match) => context.filePath && context.filePath.includes(match[1]),
      },
      {
        regex: /command\.includes\(["'](.+?)["']\)/,
        eval: (match) => context.command && context.command.includes(match[1]),
      },
      {
        regex: /tool\s*===\s*["'](.+?)["']/,
        eval: (match) => context.tool === match[1],
      },
    ];

    for (const { regex, eval: evalFn } of patterns) {
      const match = condition.match(regex);
      if (match) {
        return evalFn(match);
      }
    }

    // Default to false for unknown patterns
    return false;
  } catch {
    return false;
  }
}

/**
 * Match event trigger against event context
 */
function matchEventTrigger(trigger, eventType, context) {
  // Check event type
  if (trigger.type !== eventType) {
    return false;
  }

  // Check tool (if specified)
  if (trigger.tool) {
    const tools = Array.isArray(trigger.tool) ? trigger.tool : [trigger.tool];
    if (context.tool && !tools.includes(context.tool)) {
      return false;
    }
  }

  // Check file patterns (if specified)
  if (trigger.files && context.filePath) {
    const patterns = Array.isArray(trigger.files)
      ? trigger.files
      : [trigger.files];
    const matched = patterns.some((pattern) => {
      if (pattern.includes('*')) {
        return minimatch(context.filePath, pattern, { dot: true, matchBase: true });
      }
      return context.filePath.includes(pattern);
    });
    if (!matched) {
      return false;
    }
  }

  // Check condition (if specified)
  if (trigger.condition) {
    if (!evaluateCondition(trigger.condition, context)) {
      return false;
    }
  }

  return true;
}

/**
 * Match agents against an event
 */
function matchEvent(eventType, context, agents) {
  const matches = [];

  for (const agent of agents) {
    const eventTriggers = agent.triggers?.events;
    if (!Array.isArray(eventTriggers)) continue;

    for (const trigger of eventTriggers) {
      if (matchEventTrigger(trigger, eventType, context)) {
        const priority = agent.triggers?.priority || 10;
        matches.push({
          agent,
          trigger,
          priority,
        });
        break; // One match per agent
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
function formatOutput(matches, eventType, context) {
  if (matches.length === 0) {
    return JSON.stringify({ additionalContext: null });
  }

  const agentList = matches
    .map((m) => {
      const emoji = m.agent.visual?.emoji || '🤖';
      const label = m.agent.visual?.label || m.agent.name;
      const triggerDesc = `${m.trigger.type}${m.trigger.tool ? ':' + m.trigger.tool : ''}`;
      return `  ${emoji} ${label} (priority: ${m.priority}, trigger: ${triggerDesc})`;
    })
    .join('\n');

  const bestMatch = matches[0];
  const suggestion =
    matches.length === 1
      ? `Consider using the ${bestMatch.agent.visual?.emoji || '🤖'} ${bestMatch.agent.name} agent for this ${eventType} event.`
      : `${matches.length} agents match this event. The highest priority is ${bestMatch.agent.visual?.emoji || '🤖'} ${bestMatch.agent.name}.`;

  const contextInfo = [];
  if (context.tool) contextInfo.push(`Tool: ${context.tool}`);
  if (context.filePath) contextInfo.push(`File: ${context.filePath}`);
  if (context.command) contextInfo.push(`Command: ${context.command.substring(0, 50)}...`);

  const additionalContext = `
[Agent Event Trigger Match]
Event: ${eventType}
${contextInfo.join('\n')}
Matching agents:
${agentList}

${suggestion}
`.trim();

  return JSON.stringify({
    additionalContext,
    matchedAgents: matches.map((m) => ({
      name: m.agent.name,
      priority: m.priority,
      trigger: `${m.trigger.type}${m.trigger.tool ? ':' + m.trigger.tool : ''}`,
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
    console.error('Usage: event-dispatcher.js <event_type> <tool_name> [file_path] [command]');
    process.exit(1);
  }

  const [eventType, toolName, filePath, command] = args;

  if (!VALID_EVENT_TYPES.includes(eventType)) {
    console.error(`Invalid event type: ${eventType}`);
    process.exit(1);
  }

  // Build event context
  const context = {
    type: eventType,
    tool: toolName,
    filePath: filePath || undefined,
    command: command || undefined,
  };

  // Load agents and match
  const agents = loadAgents();
  const matches = matchEvent(eventType, context, agents);

  // Output result
  console.log(formatOutput(matches, eventType, context));
}

main();
