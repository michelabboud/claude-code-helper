/**
 * Claude Code Trigger Matcher
 *
 * A library for matching file paths and prompts against agent trigger definitions.
 * Supports glob patterns, keyword matching, and priority-based selection.
 *
 * @example
 * ```typescript
 * import { TriggerMatcher } from 'claude-trigger-matcher';
 *
 * const matcher = new TriggerMatcher();
 * await matcher.loadAgents();
 *
 * // Match file operations
 * const matches = matcher.matchFile('src/api/users.ts', 'edit');
 * if (matches.length > 0) {
 *   console.log(`Best agent: ${matches[0].agent.name}`);
 * }
 *
 * // Match prompts
 * const keywordMatches = matcher.matchPrompt('Create a REST API endpoint');
 * ```
 */

export * from './types.js';
export * from './parser.js';
export * from './matcher.js';
export * from './events.js';
export * from './dispatcher.js';
export * from './config.js';
export * from './chain.js';
export * from './mcp.js';

import {
  loadAllAgents,
  scanAgentDirectory,
  parseAgentFile,
} from './parser.js';
import {
  buildTriggerIndex,
  matchFilePattern,
  matchKeywords,
  matchAll,
  getBestMatch,
  hasTriggers,
} from './matcher.js';
import type {
  AgentDefinition,
  TriggerIndex,
  TriggerMatch,
  FileEvent,
  MatchOptions,
  AgentEnvironment,
} from './types.js';

/**
 * Main class for trigger matching operations
 */
export class TriggerMatcher {
  private index: TriggerIndex | null = null;
  private agents: AgentDefinition[] = [];

  /**
   * Load agents from standard Claude Code locations
   */
  async loadAgents(): Promise<void> {
    this.agents = loadAllAgents();
    this.index = buildTriggerIndex(this.agents);
  }

  /**
   * Load agents from specific directories
   */
  async loadFromDirectories(directories: string[]): Promise<void> {
    this.agents = [];
    for (const dir of directories) {
      this.agents.push(...scanAgentDirectory(dir));
    }
    this.index = buildTriggerIndex(this.agents);
  }

  /**
   * Add agents from a specific file
   */
  addAgentFile(filePath: string): AgentDefinition | null {
    const agent = parseAgentFile(filePath);
    if (agent) {
      this.agents.push(agent);
      this.index = buildTriggerIndex(this.agents);
    }
    return agent;
  }

  /**
   * Get all loaded agents
   */
  getAgents(): AgentDefinition[] {
    return [...this.agents];
  }

  /**
   * Get the trigger index
   */
  getIndex(): TriggerIndex | null {
    return this.index;
  }

  /**
   * Ensure index is loaded
   */
  private ensureIndex(): TriggerIndex {
    if (!this.index) {
      throw new Error('Trigger index not loaded. Call loadAgents() first.');
    }
    return this.index;
  }

  /**
   * Match a file path against agent triggers
   */
  matchFile(
    filePath: string,
    event: FileEvent,
    options?: MatchOptions
  ): TriggerMatch[] {
    return matchFilePattern(filePath, event, this.ensureIndex(), options);
  }

  /**
   * Match a prompt against keyword triggers
   */
  matchPrompt(prompt: string, options?: MatchOptions): TriggerMatch[] {
    return matchKeywords(prompt, this.ensureIndex(), options);
  }

  /**
   * Match both file and prompt triggers
   */
  match(
    filePath: string | null,
    event: FileEvent | null,
    prompt: string | null,
    options?: MatchOptions
  ): TriggerMatch[] {
    return matchAll(filePath, event, prompt, this.ensureIndex(), options);
  }

  /**
   * Get the best matching agent for a file operation
   */
  getBestFileMatch(filePath: string, event: FileEvent): TriggerMatch | null {
    return getBestMatch(filePath, event, this.ensureIndex());
  }

  /**
   * Check if any triggers would match for a given file
   */
  hasFileTriggers(filePath: string, event: FileEvent): boolean {
    return hasTriggers(filePath, event, this.ensureIndex());
  }

  /**
   * Get environment variables for an active agent
   */
  getAgentEnvironment(agent: AgentDefinition): AgentEnvironment {
    return {
      CLAUDE_ACTIVE_AGENT: agent.name,
      CLAUDE_ACTIVE_AGENT_EMOJI: agent.visual?.emoji,
      CLAUDE_ACTIVE_AGENT_LABEL: agent.visual?.label,
      CLAUDE_ACTIVE_AGENT_COLOR: agent.visual?.color,
    };
  }

  /**
   * Format match result for logging
   */
  formatMatch(match: TriggerMatch): string {
    const emoji = match.agent.visual?.emoji || '🤖';
    const priority = match.priority;
    const confidence = Math.round(match.confidence * 100);

    return `${emoji} ${match.agent.name} (priority: ${priority}, confidence: ${confidence}%, matched: "${match.matchedPattern}")`;
  }

  /**
   * Get agents with file triggers for a specific event type
   */
  getAgentsForEvent(event: FileEvent): AgentDefinition[] {
    return this.agents.filter((agent) =>
      agent.triggers?.files?.some((f) => f.on.includes(event))
    );
  }

  /**
   * Get all unique file patterns in the index
   */
  getFilePatterns(): string[] {
    if (!this.index) return [];
    return Array.from(this.index.filePatterns.keys());
  }

  /**
   * Get all unique keywords in the index
   */
  getKeywords(): string[] {
    if (!this.index) return [];
    return Array.from(this.index.keywords.keys());
  }

  /**
   * Get statistics about the loaded triggers
   */
  getStats(): {
    totalAgents: number;
    agentsWithTriggers: number;
    filePatterns: number;
    keywords: number;
    byType: { 'domain-expert': number; 'mcp-integrated': number };
  } {
    const agentsWithTriggers = this.agents.filter((a) => a.triggers).length;
    const domainExperts = this.agents.filter(
      (a) => a.type === 'domain-expert'
    ).length;
    const mcpIntegrated = this.agents.filter(
      (a) => a.type === 'mcp-integrated'
    ).length;

    return {
      totalAgents: this.agents.length,
      agentsWithTriggers,
      filePatterns: this.index?.filePatterns.size ?? 0,
      keywords: this.index?.keywords.size ?? 0,
      byType: {
        'domain-expert': domainExperts,
        'mcp-integrated': mcpIntegrated,
      },
    };
  }
}

// Default export for convenience
export default TriggerMatcher;
