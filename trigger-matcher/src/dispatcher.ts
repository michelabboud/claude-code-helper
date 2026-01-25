/**
 * Event Dispatcher - integrates events with trigger matching
 *
 * Dispatches events to matching agents based on their trigger definitions.
 */

import type { AgentDefinition, TriggerMatch, TriggerIndex } from './types.js';
import type {
  EventContext,
  EventTrigger,
  EventAction,
  EventDispatchResult,
  EventType,
} from './events.js';
import { EventBus, matchEventTrigger } from './events.js';
import { buildTriggerIndex, matchFilePattern, matchKeywords } from './matcher.js';

/**
 * Extended agent definition with event triggers
 */
export interface AgentWithEvents extends AgentDefinition {
  triggers?: AgentDefinition['triggers'] & {
    events?: EventTrigger[];
  };
}

/**
 * Event index for fast event-based lookups
 */
export interface EventIndex {
  /** Event type to agent mappings */
  byEventType: Map<EventType, AgentWithEvents[]>;
  /** Tool to agent mappings (for tool events) */
  byTool: Map<string, AgentWithEvents[]>;
  /** All agents with event triggers */
  agents: AgentWithEvents[];
}

/**
 * Build an event index from agent definitions
 */
export function buildEventIndex(agents: AgentDefinition[]): EventIndex {
  const byEventType = new Map<EventType, AgentWithEvents[]>();
  const byTool = new Map<string, AgentWithEvents[]>();
  const agentsWithEvents: AgentWithEvents[] = [];

  for (const agent of agents) {
    const agentWithEvents = agent as AgentWithEvents;
    const eventTriggers = agentWithEvents.triggers?.events;

    if (!eventTriggers || eventTriggers.length === 0) {
      continue;
    }

    agentsWithEvents.push(agentWithEvents);

    for (const trigger of eventTriggers) {
      // Index by event type
      if (!byEventType.has(trigger.type)) {
        byEventType.set(trigger.type, []);
      }
      byEventType.get(trigger.type)!.push(agentWithEvents);

      // Index by tool (if specified)
      if (trigger.tool) {
        const tools = Array.isArray(trigger.tool)
          ? trigger.tool
          : [trigger.tool];
        for (const tool of tools) {
          if (!byTool.has(tool)) {
            byTool.set(tool, []);
          }
          if (!byTool.get(tool)!.includes(agentWithEvents)) {
            byTool.get(tool)!.push(agentWithEvents);
          }
        }
      }
    }
  }

  return {
    byEventType,
    byTool,
    agents: agentsWithEvents,
  };
}

/**
 * Match agents against an event
 */
export function matchEvent(
  event: EventContext,
  eventIndex: EventIndex
): TriggerMatch[] {
  const matches: TriggerMatch[] = [];
  const matchedAgents = new Set<string>();

  // Get candidate agents by event type
  const candidates = eventIndex.byEventType.get(event.type) || [];

  // Also check tool-specific candidates
  if (event.tool) {
    const toolCandidates = eventIndex.byTool.get(event.tool) || [];
    for (const agent of toolCandidates) {
      if (!candidates.includes(agent)) {
        candidates.push(agent);
      }
    }
  }

  // Check each candidate against the event
  for (const agent of candidates) {
    if (matchedAgents.has(agent.name)) continue;

    const eventTriggers = agent.triggers?.events || [];

    for (const trigger of eventTriggers) {
      if (matchEventTrigger(trigger, event)) {
        matchedAgents.add(agent.name);
        matches.push({
          agent,
          matchType: 'keyword', // Using 'keyword' as closest match type
          matchedPattern: `${trigger.type}${trigger.tool ? `:${trigger.tool}` : ''}`,
          matchedValue: event.type,
          priority: agent.triggers?.priority ?? 10,
          confidence: calculateEventConfidence(trigger, event),
        });
        break; // One match per agent
      }
    }
  }

  // Sort by priority (descending) then confidence (descending)
  matches.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.confidence - a.confidence;
  });

  return matches;
}

/**
 * Calculate confidence score for event match
 */
function calculateEventConfidence(
  trigger: EventTrigger,
  event: EventContext
): number {
  let confidence = 0.5;

  // More specific tool matching
  if (trigger.tool && event.tool) {
    confidence += 0.2;
  }

  // Has condition (more specific)
  if (trigger.condition) {
    confidence += 0.15;
  }

  // Has file pattern (more specific)
  if (trigger.files) {
    confidence += 0.15;
  }

  return Math.min(1, confidence);
}

/**
 * Event Dispatcher - main class for event-based trigger matching
 */
export class EventDispatcher {
  private eventBus: EventBus;
  private eventIndex: EventIndex | null = null;
  private triggerIndex: TriggerIndex | null = null;
  private agents: AgentDefinition[] = [];

  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || new EventBus();
  }

  /**
   * Load agents and build indexes
   */
  loadAgents(agents: AgentDefinition[]): void {
    this.agents = agents;
    this.eventIndex = buildEventIndex(agents);
    this.triggerIndex = buildTriggerIndex(agents);
  }

  /**
   * Get the event bus
   */
  getEventBus(): EventBus {
    return this.eventBus;
  }

  /**
   * Dispatch an event and get matching agents
   */
  async dispatch(event: EventContext): Promise<EventDispatchResult> {
    if (!this.eventIndex || !this.triggerIndex) {
      throw new Error('Agents not loaded. Call loadAgents() first.');
    }

    const matches: TriggerMatch[] = [];
    const actions: EventAction[] = [];
    let blocked = false;

    // Match event triggers
    const eventMatches = matchEvent(event, this.eventIndex);
    matches.push(...eventMatches);

    // For tool events, also match file patterns
    if (
      event.filePath &&
      event.fileEvent &&
      (event.type === 'PreToolUse' || event.type === 'PostToolUse')
    ) {
      const fileMatches = matchFilePattern(
        event.filePath,
        event.fileEvent,
        this.triggerIndex
      );

      // Add file matches that aren't already in event matches
      for (const match of fileMatches) {
        if (!matches.some((m) => m.agent.name === match.agent.name)) {
          matches.push(match);
        }
      }
    }

    // Generate actions for each match
    for (const match of matches) {
      const action = this.generateAction(match, event);
      if (action) {
        actions.push(action);
        if (action.blocking) {
          blocked = true;
        }
      }
    }

    // Sort matches by priority
    matches.sort((a, b) => b.priority - a.priority);

    // Emit to event bus
    await this.eventBus.emit(event, matches);

    return {
      event,
      matches,
      actions,
      blocked,
    };
  }

  /**
   * Generate action for a matched agent
   */
  private generateAction(
    match: TriggerMatch,
    event: EventContext
  ): EventAction | null {
    const agent = match.agent;

    // Default action: spawn the agent
    return {
      type: 'spawn_agent',
      agent: agent.name,
      prompt: this.generatePrompt(agent, event),
      blocking: false,
      runInBackground: false,
    };
  }

  /**
   * Generate a prompt for the agent based on event context
   */
  private generatePrompt(agent: AgentDefinition, event: EventContext): string {
    const parts: string[] = [];

    // Event type context
    parts.push(`[Event: ${event.type}]`);

    // Tool context
    if (event.tool) {
      parts.push(`Tool: ${event.tool}`);
    }

    // File context
    if (event.filePath) {
      parts.push(`File: ${event.filePath}`);
    }

    // Command context
    if (event.command) {
      parts.push(`Command: ${event.command}`);
    }

    // Git context
    if (event.git) {
      if (event.git.stagedFiles?.length) {
        parts.push(`Staged files: ${event.git.stagedFiles.join(', ')}`);
      }
      if (event.git.commitMessage) {
        parts.push(`Commit: ${event.git.commitMessage}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Check if any event triggers would match
   */
  hasEventTriggers(event: EventContext): boolean {
    if (!this.eventIndex) return false;
    return matchEvent(event, this.eventIndex).length > 0;
  }

  /**
   * Get all agents with event triggers
   */
  getAgentsWithEventTriggers(): AgentDefinition[] {
    return this.eventIndex?.agents || [];
  }

  /**
   * Get agents for a specific event type
   */
  getAgentsForEventType(type: EventType): AgentDefinition[] {
    return this.eventIndex?.byEventType.get(type) || [];
  }

  /**
   * Get agents for a specific tool
   */
  getAgentsForTool(tool: string): AgentDefinition[] {
    return this.eventIndex?.byTool.get(tool) || [];
  }

  /**
   * Get statistics about event triggers
   */
  getStats(): {
    totalAgents: number;
    agentsWithEventTriggers: number;
    eventTypes: string[];
    tools: string[];
  } {
    return {
      totalAgents: this.agents.length,
      agentsWithEventTriggers: this.eventIndex?.agents.length || 0,
      eventTypes: Array.from(this.eventIndex?.byEventType.keys() || []),
      tools: Array.from(this.eventIndex?.byTool.keys() || []),
    };
  }
}

/**
 * Create a default event dispatcher instance
 */
export function createDispatcher(): EventDispatcher {
  return new EventDispatcher();
}
