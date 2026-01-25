/**
 * MCP Integration Module
 *
 * Connects triggers to MCP tool invocations with before/after hooks,
 * variable substitution, and execution management.
 */

import { minimatch } from 'minimatch';
import type {
  MCPTrigger,
  MCPExecutionContext,
  MCPExecutionResult,
  MCPExecutionOptions,
  MCPExecutionStatus,
  MCPHook,
  MCPHookResult,
  MCPHookTiming,
  MCPToolInvoker,
  MCPTriggerMatchResult,
  TriggerMatchCondition,
} from './types.js';

/** Default MCP tool timeout: 2 minutes */
const DEFAULT_MCP_TIMEOUT = 2 * 60 * 1000;

/** Default hook timeout: 30 seconds */
const DEFAULT_HOOK_TIMEOUT = 30 * 1000;

/**
 * Substitute variables in a string
 * Supports: ${files}, ${file}, ${server}, ${tool}, ${user_prompt}, ${previous_output}
 */
export function substituteVariables(
  template: string,
  context: MCPExecutionContext
): string {
  let result = template;

  // File variables
  if (context.files && context.files.length > 0) {
    result = result.replace(/\$\{files\}/g, context.files.join(', '));
    result = result.replace(/\$\{file\}/g, context.files[0]);
  } else {
    result = result.replace(/\$\{files?\}/g, '');
  }

  // Server and tool
  result = result.replace(/\$\{server\}/g, context.server);
  result = result.replace(/\$\{tool\}/g, context.tool);

  // User prompt
  if (context.userPrompt) {
    result = result.replace(/\$\{user_prompt\}/g, context.userPrompt);
  } else {
    result = result.replace(/\$\{user_prompt\}/g, '');
  }

  // Previous outputs
  if (context.previousOutputs && context.previousOutputs.length > 0) {
    const lastOutput = context.previousOutputs[context.previousOutputs.length - 1];
    result = result.replace(/\$\{previous_output\}/g, lastOutput);
    result = result.replace(/\$\{last_output\}/g, lastOutput);
  } else {
    result = result.replace(/\$\{(previous_output|last_output)\}/g, '');
  }

  // Event
  if (context.event) {
    result = result.replace(/\$\{event\}/g, context.event);
  } else {
    result = result.replace(/\$\{event\}/g, '');
  }

  // Custom variables
  if (context.variables) {
    for (const [key, value] of Object.entries(context.variables)) {
      const varPattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      result = result.replace(varPattern, String(value));
    }
  }

  return result;
}

/**
 * Resolve parameters with variable substitution
 */
export function resolveParams(
  params: Record<string, string> | undefined,
  context: MCPExecutionContext
): Record<string, unknown> {
  if (!params) {
    return {};
  }

  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      resolved[key] = substituteVariables(value, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Check if an MCP trigger matches the given context
 */
export function matchMCPTrigger(
  trigger: MCPTrigger,
  context: MCPExecutionContext
): MCPTriggerMatchResult | null {
  if (trigger.enabled === false) {
    return null;
  }

  const match = trigger.match;

  // Check keywords in user prompt
  if (match.keywords && match.keywords.length > 0 && context.userPrompt) {
    const prompt = context.userPrompt.toLowerCase();
    for (const keyword of match.keywords) {
      if (prompt.includes(keyword.toLowerCase())) {
        return {
          trigger,
          matchType: 'keyword',
          matchedPattern: keyword,
          matchedValue: context.userPrompt,
          priority: trigger.priority ?? 10,
        };
      }
    }
  }

  // Check file patterns
  if (match.files && match.files.length > 0 && context.files) {
    for (const pattern of match.files) {
      for (const file of context.files) {
        if (minimatch(file, pattern, { dot: true })) {
          return {
            trigger,
            matchType: 'file',
            matchedPattern: pattern,
            matchedValue: file,
            priority: trigger.priority ?? 10,
          };
        }
      }
    }
  }

  // Check events
  if (match.events && match.events.length > 0 && context.event) {
    for (const eventPattern of match.events) {
      if (eventPattern === context.event || minimatch(context.event, eventPattern)) {
        return {
          trigger,
          matchType: 'event',
          matchedPattern: eventPattern,
          matchedValue: context.event,
          priority: trigger.priority ?? 10,
        };
      }
    }
  }

  return null;
}

/**
 * Find all MCP triggers that match the given context
 */
export function findMatchingMCPTriggers(
  triggers: MCPTrigger[],
  context: MCPExecutionContext
): MCPTriggerMatchResult[] {
  const results: MCPTriggerMatchResult[] = [];

  for (const trigger of triggers) {
    const match = matchMCPTrigger(trigger, context);
    if (match) {
      results.push(match);
    }
  }

  // Sort by priority (higher first)
  return results.sort((a, b) => b.priority - a.priority);
}

/**
 * Check if a hook matches the given MCP context
 */
export function matchHook(
  hook: MCPHook,
  context: MCPExecutionContext
): boolean {
  // Check server pattern
  if (hook.server) {
    if (!minimatch(context.server, hook.server, { dot: true })) {
      return false;
    }
  }

  // Check tool pattern
  if (hook.tool) {
    if (!minimatch(context.tool, hook.tool, { dot: true })) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a hook condition
 */
export function evaluateHookCondition(
  condition: string,
  context: MCPExecutionContext
): boolean {
  try {
    // Sanitize the condition to prevent dangerous code execution
    const dangerous = [
      /\beval\b/,
      /\bFunction\b/,
      /\brequire\b/,
      /\bimport\b/,
      /\bprocess\b/,
      /\bglobal\b/,
      /\bwindow\b/,
      /\bdocument\b/,
      /\bfetch\b/,
      /\bXMLHttpRequest\b/,
      /\bchild_process\b/,
      /\bfs\b/,
      /\bexec\b/,
      /\bspawn\b/,
      /__proto__/,
      /\bconstructor\b/,
      /\bprototype\b/,
    ];

    for (const pattern of dangerous) {
      if (pattern.test(condition)) {
        console.error(`Unsafe pattern in hook condition: ${condition}`);
        return false;
      }
    }

    // Build evaluation context
    const files = context.files || [];
    const previousOutputs = context.previousOutputs || [];
    const variables = context.variables || {};

    const helpers = {
      hasFile: (pattern: string) => files.some((f) => minimatch(f, pattern, { dot: true })),
      hasFileWith: (substr: string) => files.some((f) => f.includes(substr)),
      hasFiles: () => files.length > 0,
      serverIs: (name: string) => context.server === name,
      toolIs: (name: string) => context.tool === name,
      serverMatches: (pattern: string) => minimatch(context.server, pattern),
      toolMatches: (pattern: string) => minimatch(context.tool, pattern),
      hasParam: (name: string) => name in context.params,
      getParam: (name: string) => context.params[name],
    };

    const evalContext = {
      server: context.server,
      tool: context.tool,
      params: context.params,
      files,
      userPrompt: context.userPrompt || '',
      event: context.event || '',
      previousOutputs,
      ...helpers,
      ...variables,
    };

    const contextKeys = Object.keys(evalContext);
    const contextValues = Object.values(evalContext);

    const fn = new Function(...contextKeys, `return (${condition});`);
    return Boolean(fn(...contextValues));
  } catch (error) {
    console.error(`Error evaluating hook condition "${condition}":`, error);
    return false;
  }
}

/**
 * Execute a single hook
 */
async function executeHook(
  hook: MCPHook,
  timing: MCPHookTiming,
  context: MCPExecutionContext,
  options: MCPExecutionOptions
): Promise<MCPHookResult> {
  const result: MCPHookResult = {
    hook,
    timing,
    success: false,
    startedAt: new Date(),
  };

  try {
    // Check condition
    if (hook.condition) {
      const conditionMet = evaluateHookCondition(hook.condition, context);
      if (!conditionMet) {
        result.success = true;
        result.output = 'Condition not met, hook skipped';
        result.completedAt = new Date();
        result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
        return result;
      }
    }

    // Execute hook agent
    if (hook.agent && hook.prompt && options.agentInvoker) {
      const resolvedPrompt = substituteVariables(hook.prompt, context);

      const hookTimeoutMs = options.hookTimeout || DEFAULT_HOOK_TIMEOUT;
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(
          () => reject(new Error(`Hook timeout after ${hookTimeoutMs}ms`)),
          hookTimeoutMs
        );
        if (typeof timer.unref === 'function') timer.unref();
      });

      const output = await Promise.race([
        options.agentInvoker(hook.agent, resolvedPrompt),
        timeoutPromise,
      ]);

      result.output = output;
      result.success = true;

      // Check if the hook wants to block execution
      if (hook.blocking && timing === 'before') {
        // Check for block signals in output
        const blockPatterns = [
          /\bBLOCK\b/i,
          /\bREJECT\b/i,
          /\bDENY\b/i,
          /\bFAIL\b/i,
          /\bERROR\b/i,
        ];
        for (const pattern of blockPatterns) {
          if (pattern.test(output)) {
            result.blocked = true;
            result.blockReason = output;
            break;
          }
        }
      }
    } else {
      result.success = true;
      result.output = 'No agent specified or agent invoker not provided';
    }
  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    result.completedAt = new Date();
    result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
  }

  return result;
}

/**
 * Execute hooks for a given timing
 */
async function executeHooks(
  hooks: MCPHook[],
  timing: MCPHookTiming,
  context: MCPExecutionContext,
  options: MCPExecutionOptions
): Promise<MCPHookResult[]> {
  const results: MCPHookResult[] = [];

  // Filter hooks that match the context
  const matchingHooks = hooks.filter((hook) => matchHook(hook, context));

  for (const hook of matchingHooks) {
    options.onHookExecute?.(hook, timing);
    const result = await executeHook(hook, timing, context, options);
    results.push(result);

    // Stop if a blocking hook blocked execution
    if (result.blocked && timing === 'before') {
      break;
    }

    // Stop if hook failed and we shouldn't continue on error
    if (!result.success && !options.continueOnHookError) {
      break;
    }
  }

  return results;
}

/**
 * Execute an MCP trigger
 */
export async function executeMCPTrigger(
  trigger: MCPTrigger,
  context: MCPExecutionContext,
  options: MCPExecutionOptions
): Promise<MCPExecutionResult> {
  const result: MCPExecutionResult = {
    trigger,
    status: 'pending',
    context,
    startedAt: new Date(),
  };

  // Resolve parameters
  context.resolvedParams = resolveParams(trigger.action.params, context);

  // Notify execution start
  options.onExecutionStart?.(trigger, context);

  try {
    // Execute before hooks
    if (options.beforeHooks && options.beforeHooks.length > 0) {
      result.beforeHookResults = await executeHooks(
        options.beforeHooks,
        'before',
        context,
        options
      );

      // Check if any before hook blocked execution
      const blockingResult = result.beforeHookResults.find((r) => r.blocked);
      if (blockingResult) {
        result.status = 'blocked';
        result.blockedBy = blockingResult.hook.agent || 'before hook';
        result.error = blockingResult.blockReason || 'Blocked by before hook';
        result.completedAt = new Date();
        result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
        options.onExecutionComplete?.(result);
        return result;
      }

      // Check if any before hook failed
      const failedHook = result.beforeHookResults.find((r) => !r.success);
      if (failedHook && !options.continueOnHookError) {
        result.status = 'failed';
        result.error = `Before hook failed: ${failedHook.error}`;
        result.completedAt = new Date();
        result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
        options.onExecutionComplete?.(result);
        return result;
      }
    }

    // Execute MCP tool
    result.status = 'running';

    const timeoutMs = options.timeout || DEFAULT_MCP_TIMEOUT;
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`MCP tool timeout after ${timeoutMs}ms`)),
        timeoutMs
      );
      if (typeof timer.unref === 'function') timer.unref();
    });

    const output = await Promise.race([
      options.mcpInvoker(
        trigger.action.server,
        trigger.action.tool,
        context.resolvedParams || {}
      ),
      timeoutPromise,
    ]);

    result.output = output;
    result.outputString = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    result.status = 'completed';

    // Execute after hooks
    if (options.afterHooks && options.afterHooks.length > 0) {
      // Add output to context for after hooks
      const afterContext: MCPExecutionContext = {
        ...context,
        variables: {
          ...context.variables,
          mcp_output: result.outputString,
          mcp_result: output,
        },
      };

      result.afterHookResults = await executeHooks(
        options.afterHooks,
        'after',
        afterContext,
        options
      );
    }
  } catch (error) {
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : String(error);
  } finally {
    result.completedAt = new Date();
    result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
    options.onExecutionComplete?.(result);
  }

  return result;
}

/**
 * MCPTriggerExecutor class for managing MCP trigger execution
 */
export class MCPTriggerExecutor {
  private triggers: MCPTrigger[] = [];
  private beforeHooks: MCPHook[] = [];
  private afterHooks: MCPHook[] = [];
  private mcpInvoker: MCPToolInvoker | null = null;
  private agentInvoker: ((name: string, prompt: string) => Promise<string>) | null = null;
  private defaultOptions: Partial<MCPExecutionOptions> = {};

  /**
   * Load MCP triggers
   */
  loadTriggers(triggers: MCPTrigger[]): void {
    this.triggers = triggers.filter((t) => t.enabled !== false);
  }

  /**
   * Load hooks
   */
  loadHooks(hooks: MCPHook[]): void {
    this.beforeHooks = hooks.filter((h) => h.timing === 'before');
    this.afterHooks = hooks.filter((h) => h.timing === 'after');
  }

  /**
   * Add a before hook
   */
  addBeforeHook(hook: MCPHook): void {
    this.beforeHooks.push({ ...hook, timing: 'before' });
  }

  /**
   * Add an after hook
   */
  addAfterHook(hook: MCPHook): void {
    this.afterHooks.push({ ...hook, timing: 'after' });
  }

  /**
   * Set the MCP tool invoker
   */
  setMCPInvoker(invoker: MCPToolInvoker): void {
    this.mcpInvoker = invoker;
  }

  /**
   * Set the agent invoker (for hooks)
   */
  setAgentInvoker(invoker: (name: string, prompt: string) => Promise<string>): void {
    this.agentInvoker = invoker;
  }

  /**
   * Set default execution options
   */
  setDefaultOptions(options: Partial<MCPExecutionOptions>): void {
    this.defaultOptions = options;
  }

  /**
   * Get all loaded triggers
   */
  getTriggers(): MCPTrigger[] {
    return [...this.triggers];
  }

  /**
   * Get a trigger by name
   */
  getTrigger(name: string): MCPTrigger | undefined {
    return this.triggers.find((t) => t.name === name);
  }

  /**
   * Get all before hooks
   */
  getBeforeHooks(): MCPHook[] {
    return [...this.beforeHooks];
  }

  /**
   * Get all after hooks
   */
  getAfterHooks(): MCPHook[] {
    return [...this.afterHooks];
  }

  /**
   * Find triggers that match the given context
   */
  findMatching(context: MCPExecutionContext): MCPTriggerMatchResult[] {
    return findMatchingMCPTriggers(this.triggers, context);
  }

  /**
   * Execute a trigger by name
   */
  async executeByName(
    name: string,
    context: MCPExecutionContext,
    options?: Partial<MCPExecutionOptions>
  ): Promise<MCPExecutionResult> {
    const trigger = this.getTrigger(name);
    if (!trigger) {
      return {
        trigger: {
          name,
          match: {},
          action: { type: 'mcp_tool', server: '', tool: '' },
        } as MCPTrigger,
        status: 'failed',
        error: `Trigger "${name}" not found`,
        context,
        startedAt: new Date(),
        completedAt: new Date(),
      };
    }

    return this.execute(trigger, context, options);
  }

  /**
   * Execute a trigger
   */
  async execute(
    trigger: MCPTrigger,
    context: MCPExecutionContext,
    options?: Partial<MCPExecutionOptions>
  ): Promise<MCPExecutionResult> {
    if (!this.mcpInvoker) {
      throw new Error('MCP invoker not set. Call setMCPInvoker() first.');
    }

    const mergedOptions: MCPExecutionOptions = {
      ...this.defaultOptions,
      ...options,
      mcpInvoker: options?.mcpInvoker || this.mcpInvoker,
      agentInvoker: options?.agentInvoker || this.agentInvoker || undefined,
      beforeHooks: options?.beforeHooks || this.beforeHooks,
      afterHooks: options?.afterHooks || this.afterHooks,
    };

    return executeMCPTrigger(trigger, context, mergedOptions);
  }

  /**
   * Execute all triggers that match the context
   */
  async executeMatching(
    context: MCPExecutionContext,
    options?: Partial<MCPExecutionOptions>
  ): Promise<MCPExecutionResult[]> {
    const matching = this.findMatching(context);
    const results: MCPExecutionResult[] = [];

    for (const { trigger } of matching) {
      const result = await this.execute(trigger, context, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute matching triggers in parallel
   */
  async executeMatchingParallel(
    context: MCPExecutionContext,
    options?: Partial<MCPExecutionOptions>
  ): Promise<MCPExecutionResult[]> {
    const matching = this.findMatching(context);
    return Promise.all(
      matching.map(({ trigger }) => this.execute(trigger, context, options))
    );
  }

  /**
   * Get statistics about loaded triggers and hooks
   */
  getStats(): {
    totalTriggers: number;
    beforeHooks: number;
    afterHooks: number;
    blockingHooks: number;
    triggersByServer: Record<string, number>;
  } {
    const byServer: Record<string, number> = {};
    for (const trigger of this.triggers) {
      const server = trigger.action.server;
      byServer[server] = (byServer[server] || 0) + 1;
    }

    return {
      totalTriggers: this.triggers.length,
      beforeHooks: this.beforeHooks.length,
      afterHooks: this.afterHooks.length,
      blockingHooks: this.beforeHooks.filter((h) => h.blocking).length,
      triggersByServer: byServer,
    };
  }
}

export default MCPTriggerExecutor;
