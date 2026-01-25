#!/usr/bin/env node
/**
 * MCP Trigger Dispatcher Hook
 *
 * This script is called by Claude Code hooks to dispatch MCP tool events
 * to the trigger system. It handles before/after hook execution and
 * can optionally block tool execution based on hook results.
 *
 * Usage:
 *   node mcp-trigger-dispatcher.js <timing> <tool_name> [tool_input_or_output]
 *
 * Arguments:
 *   timing: "before" or "after"
 *   tool_name: The MCP tool name (e.g., "mcp__api-specialist__validate_openapi")
 *   tool_input_or_output: JSON string of tool input (before) or output (after)
 *
 * Environment Variables:
 *   CLAUDE_TRIGGERS_CONFIG: Path to triggers.json config file
 *   CLAUDE_MCP_HOOKS_ENABLED: Set to "false" to disable MCP hooks
 *
 * Exit Codes:
 *   0: Success (allow tool execution)
 *   1: Error or blocked (prevent tool execution for before hooks)
 */

const fs = require('fs');
const path = require('path');

// Parse MCP tool name into server and tool components
function parseMCPToolName(toolName) {
  // Format: mcp__<server>__<tool>
  const match = toolName.match(/^mcp__([^_]+(?:__[^_]+)?)__(.+)$/);
  if (!match) {
    // Try simpler format: mcp__<server>__<tool>
    const parts = toolName.split('__');
    if (parts.length >= 3 && parts[0] === 'mcp') {
      return {
        server: parts[1],
        tool: parts.slice(2).join('__'),
      };
    }
    return null;
  }
  return {
    server: match[1],
    tool: match[2],
  };
}

// Load configuration
function loadConfig() {
  const configPaths = [
    process.env.CLAUDE_TRIGGERS_CONFIG,
    path.join(process.cwd(), '.claude', 'triggers.json'),
    path.join(process.env.HOME || '', '.claude', 'triggers.json'),
    path.join(__dirname, '..', 'config-bundle', 'triggers.json'),
  ].filter(Boolean);

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      // Continue to next path
    }
  }

  return null;
}

// Find matching MCP hooks for the given context
function findMatchingHooks(config, timing, server, tool) {
  if (!config || !config.mcp_triggers) {
    return [];
  }

  const hooks = [];

  for (const trigger of config.mcp_triggers) {
    if (trigger.enabled === false) {
      continue;
    }

    // Check if trigger has hooks for this timing
    const triggerHooks = trigger.hooks || [];
    for (const hook of triggerHooks) {
      if (hook.timing !== timing) {
        continue;
      }

      // Check server pattern match
      if (hook.server) {
        const serverPattern = hook.server.replace(/\*/g, '.*');
        if (!new RegExp(`^${serverPattern}$`).test(server)) {
          continue;
        }
      }

      // Check tool pattern match
      if (hook.tool) {
        const toolPattern = hook.tool.replace(/\*/g, '.*');
        if (!new RegExp(`^${toolPattern}$`).test(tool)) {
          continue;
        }
      }

      hooks.push({
        ...hook,
        triggerName: trigger.name,
      });
    }
  }

  return hooks;
}

// Execute a hook
async function executeHook(hook, context) {
  const result = {
    hook,
    success: false,
    output: null,
    blocked: false,
  };

  try {
    // For now, just log the hook execution
    // In a full implementation, this would invoke an agent
    console.error(`[MCP Hook] Executing ${hook.timing} hook from ${hook.triggerName}`);

    if (hook.agent && hook.prompt) {
      // Substitute variables in prompt
      let prompt = hook.prompt;
      prompt = prompt.replace(/\$\{server\}/g, context.server);
      prompt = prompt.replace(/\$\{tool\}/g, context.tool);
      prompt = prompt.replace(/\$\{params\}/g, JSON.stringify(context.params || {}));

      console.error(`[MCP Hook] Would invoke agent "${hook.agent}" with prompt: ${prompt}`);
    }

    result.success = true;

    // Check for blocking conditions
    if (hook.blocking && hook.timing === 'before') {
      // In a full implementation, check hook output for block signals
      // For now, just allow execution
      result.blocked = false;
    }
  } catch (err) {
    result.error = err.message;
  }

  return result;
}

// Main function
async function main() {
  const [,, timing, toolName, toolData] = process.argv;

  // Validate arguments
  if (!timing || !toolName) {
    console.error('Usage: mcp-trigger-dispatcher.js <before|after> <tool_name> [tool_data]');
    process.exit(1);
  }

  if (timing !== 'before' && timing !== 'after') {
    console.error('Timing must be "before" or "after"');
    process.exit(1);
  }

  // Check if MCP hooks are disabled
  if (process.env.CLAUDE_MCP_HOOKS_ENABLED === 'false') {
    process.exit(0);
  }

  // Parse tool name
  const parsed = parseMCPToolName(toolName);
  if (!parsed) {
    // Not an MCP tool, skip
    process.exit(0);
  }

  const { server, tool } = parsed;

  // Parse tool data
  let params = {};
  if (toolData) {
    try {
      params = JSON.parse(toolData);
    } catch (err) {
      // Ignore parse errors
    }
  }

  // Load configuration
  const config = loadConfig();

  // Find matching hooks
  const hooks = findMatchingHooks(config, timing, server, tool);

  if (hooks.length === 0) {
    // No matching hooks
    process.exit(0);
  }

  // Build context
  const context = {
    server,
    tool,
    params,
    timing,
  };

  // Execute hooks
  let blocked = false;
  for (const hook of hooks) {
    const result = await executeHook(hook, context);

    if (result.blocked) {
      blocked = true;
      console.error(`[MCP Hook] Execution blocked by hook from ${hook.triggerName}`);
      break;
    }

    if (!result.success && !hook.optional) {
      console.error(`[MCP Hook] Hook failed: ${result.error}`);
    }
  }

  // Exit with appropriate code
  if (blocked && timing === 'before') {
    // Return error to block execution
    console.error('[MCP Hook] Tool execution blocked');
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('[MCP Hook] Error:', err.message);
  process.exit(1);
});
