/**
 * Event Triggers System for Claude Code Agents
 *
 * Defines event types and provides an event bus for dispatching
 * events to matching agent triggers.
 */

import type { AgentDefinition, TriggerMatch, FileEvent, EventType } from './types.js';

// Re-export EventType for convenience
export type { EventType } from './types.js';

/**
 * Tool names that can trigger events
 */
export type ToolName =
  | 'Read'
  | 'Write'
  | 'Edit'
  | 'Bash'
  | 'Glob'
  | 'Grep'
  | 'Task'
  | 'WebFetch'
  | 'WebSearch'
  | string; // Allow custom tools

/**
 * Context provided with each event
 */
export interface EventContext {
  /** Event type */
  type: EventType;
  /** Timestamp of the event */
  timestamp: Date;
  /** Tool name (for tool events) */
  tool?: ToolName;
  /** File path (for file-related events) */
  filePath?: string;
  /** File event type (read, edit, write) */
  fileEvent?: FileEvent;
  /** Command (for Bash events) */
  command?: string;
  /** Git-related data (for commit events) */
  git?: {
    branch?: string;
    stagedFiles?: string[];
    commitMessage?: string;
    commitHash?: string;
  };
  /** Agent name (for agent events) */
  agent?: string;
  /** Error information (for error events) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  /** Tool parameters */
  params?: Record<string, unknown>;
  /** Tool result (for PostToolUse) */
  result?: unknown;
  /** Additional custom data */
  data?: Record<string, unknown>;
}

/**
 * Event trigger definition in agent frontmatter
 */
export interface EventTrigger {
  /** Event type to match */
  type: EventType;
  /** Tool to match (optional, for tool events) */
  tool?: ToolName | ToolName[];
  /** Condition expression (optional) */
  condition?: string;
  /** File patterns to match (optional) */
  files?: string | string[];
}

/**
 * Event listener callback
 */
export type EventListener = (
  event: EventContext,
  matches: TriggerMatch[]
) => void | Promise<void>;

/**
 * Action to take when event triggers
 */
export interface EventAction {
  /** Action type */
  type: 'spawn_agent' | 'run_command' | 'log' | 'notify';
  /** Agent to spawn */
  agent?: string;
  /** Prompt for agent */
  prompt?: string;
  /** Prompt prefix to prepend */
  promptPrefix?: string;
  /** Command to run */
  command?: string;
  /** Whether action blocks further processing */
  blocking?: boolean;
  /** Run in background */
  runInBackground?: boolean;
  /** Notification message */
  message?: string;
}

/**
 * Result of event dispatch
 */
export interface EventDispatchResult {
  /** Event that was dispatched */
  event: EventContext;
  /** Agents that matched */
  matches: TriggerMatch[];
  /** Actions to execute */
  actions: EventAction[];
  /** Whether to block further processing */
  blocked: boolean;
}

/**
 * Event Bus - manages event listeners and dispatching
 */
export class EventBus {
  private listeners: Map<EventType | '*', EventListener[]> = new Map();
  private eventHistory: EventContext[] = [];
  private maxHistorySize: number = 100;

  /**
   * Subscribe to an event type
   */
  on(type: EventType | '*', listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);

    // Return unsubscribe function
    return () => this.off(type, listener);
  }

  /**
   * Subscribe to an event type (once only)
   */
  once(type: EventType | '*', listener: EventListener): () => void {
    const wrapper: EventListener = async (event, matches) => {
      this.off(type, wrapper);
      await listener(event, matches);
    };
    return this.on(type, wrapper);
  }

  /**
   * Unsubscribe from an event type
   */
  off(type: EventType | '*', listener: EventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all listeners
   */
  async emit(event: EventContext, matches: TriggerMatch[] = []): Promise<void> {
    // Add to history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Get listeners for this event type and wildcard listeners
    const typeListeners = this.listeners.get(event.type) || [];
    const wildcardListeners = this.listeners.get('*') || [];
    const allListeners = [...typeListeners, ...wildcardListeners];

    // Call all listeners
    for (const listener of allListeners) {
      try {
        await listener(event, matches);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }
  }

  /**
   * Get event history
   */
  getHistory(type?: EventType): EventContext[] {
    if (type) {
      return this.eventHistory.filter((e) => e.type === type);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Get listener count
   */
  listenerCount(type?: EventType | '*'): number {
    if (type) {
      return this.listeners.get(type)?.length || 0;
    }
    let count = 0;
    for (const listeners of this.listeners.values()) {
      count += listeners.length;
    }
    return count;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(type?: EventType | '*'): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }
}

/**
 * Check if an event trigger matches an event context
 */
export function matchEventTrigger(
  trigger: EventTrigger,
  event: EventContext
): boolean {
  // Check event type
  if (trigger.type !== event.type) {
    return false;
  }

  // Check tool (if specified)
  if (trigger.tool) {
    const tools = Array.isArray(trigger.tool) ? trigger.tool : [trigger.tool];
    if (event.tool && !tools.includes(event.tool)) {
      return false;
    }
  }

  // Check file patterns (if specified)
  if (trigger.files && event.filePath) {
    const patterns = Array.isArray(trigger.files)
      ? trigger.files
      : [trigger.files];
    // Import minimatch dynamically would be cleaner, but for now
    // we do simple prefix/suffix matching
    const matched = patterns.some((pattern) => {
      if (pattern.includes('*')) {
        // Simple glob-like matching
        const regex = pattern
          .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
          .replace(/\*/g, '[^/]*')
          .replace(/<<<DOUBLESTAR>>>/g, '.*');
        return new RegExp(`^${regex}$`).test(event.filePath!);
      }
      return event.filePath!.includes(pattern);
    });
    if (!matched) {
      return false;
    }
  }

  // Check condition (if specified)
  if (trigger.condition) {
    try {
      const result = evaluateCondition(trigger.condition, event);
      if (!result) {
        return false;
      }
    } catch (error) {
      console.error(`Error evaluating condition: ${trigger.condition}`, error);
      return false;
    }
  }

  return true;
}

/**
 * Evaluate a condition expression against event context
 *
 * Supported expressions:
 * - file.path.includes('/api/')
 * - command.includes('curl')
 * - tool === 'Edit'
 * - git.branch === 'main'
 */
export function evaluateCondition(
  condition: string,
  context: EventContext
): boolean {
  // Create a safe evaluation context
  const evalContext: Record<string, unknown> = {
    // Event properties
    type: context.type,
    tool: context.tool,
    timestamp: context.timestamp,

    // File properties
    file: {
      path: context.filePath || '',
      event: context.fileEvent,
    },
    filePath: context.filePath || '',
    fileEvent: context.fileEvent,

    // Command
    command: context.command || '',

    // Git
    git: context.git || {
      branch: '',
      stagedFiles: [],
      commitMessage: '',
      commitHash: '',
    },

    // Agent
    agent: context.agent || '',

    // Params and result
    params: context.params || {},
    result: context.result,

    // Custom data
    data: context.data || {},
  };

  // Safe expression evaluation using Function constructor
  // This is safer than eval() but still allows basic expressions
  try {
    // Parse and validate the condition
    const sanitized = sanitizeCondition(condition);
    if (!sanitized) {
      return false;
    }

    // Create function with context variables
    const fn = new Function(
      ...Object.keys(evalContext),
      `"use strict"; return (${sanitized});`
    );

    // Execute with context values
    const result = fn(...Object.values(evalContext));
    return Boolean(result);
  } catch (error) {
    console.error(`Failed to evaluate condition: ${condition}`, error);
    return false;
  }
}

/**
 * Sanitize a condition expression for safe evaluation
 * Returns null if the expression contains unsafe patterns
 */
function sanitizeCondition(condition: string): string | null {
  // Remove comments
  let sanitized = condition.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Check for obviously dangerous patterns
  const dangerousPatterns = [
    /\beval\b/i,
    /\bFunction\b/i,
    /\bimport\b/i,
    /\brequire\b/i,
    /\bprocess\b/i,
    /\bglobal\b/i,
    /\bwindow\b/i,
    /\bdocument\b/i,
    /\b__proto__\b/i,
    /\bconstructor\b/i,
    /\bprototype\b/i,
    /\bthis\b/i,
    /\bnew\b/i,
    /\bdelete\b/i,
    /\bawait\b/i,
    /\basync\b/i,
    /\byield\b/i,
    /\bthrow\b/i,
    /\breturn\b(?!\s*\()/i, // return without immediate expression
    /[;\{\}]/, // statements
    /(?<![=!<>])=(?![=])/, // single = not preceded/followed by =, !, <, >
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sanitized)) {
      console.warn(`Unsafe pattern in condition: ${condition}`);
      return null;
    }
  }

  // Only allow safe operations
  const allowedPattern =
    /^[\w\s\.\[\]'"()\|\|&&!<>=\-\+\*\/\?\:,]+$/;
  if (!allowedPattern.test(sanitized)) {
    console.warn(`Invalid characters in condition: ${condition}`);
    return null;
  }

  return sanitized;
}

/**
 * Create an event context from common parameters
 */
export function createEventContext(
  type: EventType,
  options: Partial<Omit<EventContext, 'type' | 'timestamp'>> = {}
): EventContext {
  return {
    type,
    timestamp: new Date(),
    ...options,
  };
}

/**
 * Create a PreToolUse event context
 */
export function createPreToolUseEvent(
  tool: ToolName,
  params: Record<string, unknown> = {}
): EventContext {
  const context: EventContext = {
    type: 'PreToolUse',
    timestamp: new Date(),
    tool,
    params,
  };

  // Extract file path for file-related tools
  if (['Read', 'Write', 'Edit'].includes(tool)) {
    context.filePath = params.file_path as string || params.filePath as string;
    context.fileEvent =
      tool === 'Read' ? 'read' : tool === 'Write' ? 'write' : 'edit';
  }

  // Extract command for Bash
  if (tool === 'Bash') {
    context.command = params.command as string;
  }

  return context;
}

/**
 * Create a PostToolUse event context
 */
export function createPostToolUseEvent(
  tool: ToolName,
  params: Record<string, unknown> = {},
  result: unknown = null
): EventContext {
  const context = createPreToolUseEvent(tool, params);
  context.type = 'PostToolUse';
  context.result = result;
  return context;
}

/**
 * Create a PreCommit event context
 */
export function createPreCommitEvent(
  stagedFiles: string[],
  branch?: string
): EventContext {
  return {
    type: 'PreCommit',
    timestamp: new Date(),
    git: {
      stagedFiles,
      branch,
    },
  };
}

/**
 * Create a PostCommit event context
 */
export function createPostCommitEvent(
  commitHash: string,
  commitMessage: string,
  branch?: string
): EventContext {
  return {
    type: 'PostCommit',
    timestamp: new Date(),
    git: {
      commitHash,
      commitMessage,
      branch,
    },
  };
}
