/**
 * Global Configuration Loader
 *
 * Loads and merges trigger configurations from:
 * 1. Global config: ~/.claude/triggers.json
 * 2. Project config: .claude/triggers.json
 * 3. Agent definitions: agents with triggers field
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  GlobalTriggersConfig,
  GlobalTrigger,
  MergedTrigger,
  MergedConfig,
  AgentChain,
  MCPTrigger,
  AgentDefinition,
  ConfigSource,
  TriggerConflict,
} from './types.js';

/** Default global config path */
const GLOBAL_CONFIG_PATH = path.join(
  process.env.HOME || process.env.USERPROFILE || '',
  '.claude',
  'triggers.json'
);

/** Default project config filename */
const PROJECT_CONFIG_FILENAME = '.claude/triggers.json';

/** Current schema version */
export const SCHEMA_VERSION = '1.0';

/**
 * Validate a triggers configuration file
 */
export function validateConfig(
  config: unknown,
  sourcePath: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Configuration must be an object'] };
  }

  const cfg = config as Record<string, unknown>;

  // Check version
  if (!cfg.version) {
    errors.push(`Missing 'version' field in ${sourcePath}`);
  } else if (typeof cfg.version !== 'string') {
    errors.push(`'version' must be a string in ${sourcePath}`);
  }

  // Validate triggers
  if (cfg.triggers !== undefined) {
    if (!Array.isArray(cfg.triggers)) {
      errors.push(`'triggers' must be an array in ${sourcePath}`);
    } else {
      cfg.triggers.forEach((t, i) => {
        const triggerErrors = validateTrigger(t, i, sourcePath);
        errors.push(...triggerErrors);
      });
    }
  }

  // Validate chains
  if (cfg.chains !== undefined) {
    if (!Array.isArray(cfg.chains)) {
      errors.push(`'chains' must be an array in ${sourcePath}`);
    } else {
      cfg.chains.forEach((c, i) => {
        const chainErrors = validateChain(c, i, sourcePath);
        errors.push(...chainErrors);
      });
    }
  }

  // Validate MCP triggers
  if (cfg.mcp_triggers !== undefined) {
    if (!Array.isArray(cfg.mcp_triggers)) {
      errors.push(`'mcp_triggers' must be an array in ${sourcePath}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a single trigger definition
 */
function validateTrigger(
  trigger: unknown,
  index: number,
  sourcePath: string
): string[] {
  const errors: string[] = [];
  const prefix = `triggers[${index}] in ${sourcePath}`;

  if (!trigger || typeof trigger !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const t = trigger as Record<string, unknown>;

  if (!t.name || typeof t.name !== 'string') {
    errors.push(`${prefix}: missing or invalid 'name'`);
  }

  if (!t.match || typeof t.match !== 'object') {
    errors.push(`${prefix}: missing or invalid 'match'`);
  } else {
    const match = t.match as Record<string, unknown>;
    if (!match.keywords && !match.files && !match.events) {
      errors.push(`${prefix}: 'match' must have at least one of: keywords, files, events`);
    }
  }

  if (!t.action || typeof t.action !== 'object') {
    errors.push(`${prefix}: missing or invalid 'action'`);
  } else {
    const action = t.action as Record<string, unknown>;
    if (!['spawn_agent', 'mcp_tool', 'shell_command'].includes(String(action.type))) {
      errors.push(`${prefix}: 'action.type' must be one of: spawn_agent, mcp_tool, shell_command`);
    }
  }

  return errors;
}

/**
 * Validate a single chain definition
 */
function validateChain(
  chain: unknown,
  index: number,
  sourcePath: string
): string[] {
  const errors: string[] = [];
  const prefix = `chains[${index}] in ${sourcePath}`;

  if (!chain || typeof chain !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const c = chain as Record<string, unknown>;

  if (!c.name || typeof c.name !== 'string') {
    errors.push(`${prefix}: missing or invalid 'name'`);
  }

  if (!c.trigger || typeof c.trigger !== 'object') {
    errors.push(`${prefix}: missing or invalid 'trigger'`);
  }

  if (!Array.isArray(c.agents) || c.agents.length === 0) {
    errors.push(`${prefix}: 'agents' must be a non-empty array`);
  }

  if (c.execution && !['sequential', 'parallel'].includes(String(c.execution))) {
    errors.push(`${prefix}: 'execution' must be 'sequential' or 'parallel'`);
  }

  return errors;
}

/**
 * Load a triggers configuration file
 */
export function loadConfigFile(
  filePath: string
): GlobalTriggersConfig | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const config = JSON.parse(content) as GlobalTriggersConfig;

    const { valid, errors } = validateConfig(config, filePath);
    if (!valid) {
      console.error(`Invalid config at ${filePath}:`, errors);
      return null;
    }

    return config;
  } catch {
    // Silently skip invalid files
    return null;
  }
}

/**
 * Load global triggers configuration
 */
export function loadGlobalConfig(
  customPath?: string
): GlobalTriggersConfig | null {
  return loadConfigFile(customPath || GLOBAL_CONFIG_PATH);
}

/**
 * Load project triggers configuration
 */
export function loadProjectConfig(
  projectRoot?: string
): GlobalTriggersConfig | null {
  const root = projectRoot || process.cwd();
  const configPath = path.join(root, PROJECT_CONFIG_FILENAME);
  return loadConfigFile(configPath);
}

/**
 * Convert agent triggers to global triggers format
 */
export function agentTriggersToGlobalTriggers(
  agent: AgentDefinition
): GlobalTrigger[] {
  if (!agent.triggers) return [];

  const triggers: GlobalTrigger[] = [];

  // Convert keyword triggers
  if (agent.triggers.keywords && agent.triggers.keywords.length > 0) {
    const keywords = agent.triggers.keywords.map((k) =>
      typeof k === 'string' ? k : k.pattern
    );

    triggers.push({
      name: `${agent.name}:keywords`,
      description: `Keyword trigger for ${agent.name}`,
      match: { keywords },
      action: {
        type: 'spawn_agent',
        agent: agent.name,
      },
      priority: agent.triggers.priority ?? 10,
    });
  }

  // Convert file triggers
  if (agent.triggers.files && agent.triggers.files.length > 0) {
    const files = agent.triggers.files.map((f) => f.pattern);

    triggers.push({
      name: `${agent.name}:files`,
      description: `File trigger for ${agent.name}`,
      match: { files },
      action: {
        type: 'spawn_agent',
        agent: agent.name,
      },
      priority: agent.triggers.priority ?? 10,
    });
  }

  // Convert event triggers
  if (agent.triggers.events && agent.triggers.events.length > 0) {
    const events = agent.triggers.events.map((e) => {
      if (e.tool) {
        const tools = Array.isArray(e.tool) ? e.tool : [e.tool];
        return tools.map((t) => `${e.type}:${t}`);
      }
      return [e.type];
    }).flat();

    triggers.push({
      name: `${agent.name}:events`,
      description: `Event trigger for ${agent.name}`,
      match: { events },
      action: {
        type: 'spawn_agent',
        agent: agent.name,
      },
      priority: agent.triggers.priority ?? 10,
    });
  }

  return triggers;
}

/**
 * Merge triggers from multiple sources with source tracking
 */
export function mergeConfigs(
  global: GlobalTriggersConfig | null,
  project: GlobalTriggersConfig | null,
  agents: AgentDefinition[],
  options?: {
    globalPath?: string;
    projectPath?: string;
  }
): MergedConfig {
  const triggers: MergedTrigger[] = [];
  const chains: AgentChain[] = [];
  const mcp_triggers: MCPTrigger[] = [];
  const sources: MergedConfig['sources'] = [];

  // Load global triggers
  if (global) {
    const sourcePath = options?.globalPath || GLOBAL_CONFIG_PATH;
    sources.push({ path: sourcePath, source: 'global', loadedAt: new Date() });

    if (global.triggers) {
      triggers.push(
        ...global.triggers
          .filter((t) => t.enabled !== false)
          .map((t) => ({ ...t, source: 'global' as ConfigSource, sourcePath }))
      );
    }
    if (global.chains) {
      chains.push(...global.chains.filter((c) => c.enabled !== false));
    }
    if (global.mcp_triggers) {
      mcp_triggers.push(...global.mcp_triggers.filter((m) => m.enabled !== false));
    }
  }

  // Load project triggers (higher priority than global)
  if (project) {
    const sourcePath = options?.projectPath || path.join(process.cwd(), PROJECT_CONFIG_FILENAME);
    sources.push({ path: sourcePath, source: 'project', loadedAt: new Date() });

    if (project.triggers) {
      triggers.push(
        ...project.triggers
          .filter((t) => t.enabled !== false)
          .map((t) => ({ ...t, source: 'project' as ConfigSource, sourcePath }))
      );
    }
    if (project.chains) {
      chains.push(...project.chains.filter((c) => c.enabled !== false));
    }
    if (project.mcp_triggers) {
      mcp_triggers.push(...project.mcp_triggers.filter((m) => m.enabled !== false));
    }
  }

  // Convert agent triggers
  for (const agent of agents) {
    if (!agent.triggers) continue;

    const agentTriggers = agentTriggersToGlobalTriggers(agent);
    triggers.push(
      ...agentTriggers.map((t) => ({
        ...t,
        source: 'agent' as ConfigSource,
        sourcePath: agent.filePath,
      }))
    );

    if (agent.filePath && !sources.some((s) => s.path === agent.filePath)) {
      sources.push({ path: agent.filePath, source: 'agent', loadedAt: new Date() });
    }
  }

  return {
    triggers,
    chains,
    mcp_triggers,
    agents,
    sources,
  };
}

/**
 * Detect conflicts between triggers
 */
export function detectConflicts(config: MergedConfig): TriggerConflict[] {
  const conflicts: TriggerConflict[] = [];

  // Group triggers by their match patterns
  const byKeyword = new Map<string, MergedTrigger[]>();
  const byFile = new Map<string, MergedTrigger[]>();
  const byEvent = new Map<string, MergedTrigger[]>();

  for (const trigger of config.triggers) {
    // Index by keywords
    if (trigger.match.keywords) {
      for (const kw of trigger.match.keywords) {
        const list = byKeyword.get(kw.toLowerCase()) || [];
        list.push(trigger);
        byKeyword.set(kw.toLowerCase(), list);
      }
    }

    // Index by files
    if (trigger.match.files) {
      for (const file of trigger.match.files) {
        const list = byFile.get(file) || [];
        list.push(trigger);
        byFile.set(file, list);
      }
    }

    // Index by events
    if (trigger.match.events) {
      for (const event of trigger.match.events) {
        const list = byEvent.get(event) || [];
        list.push(trigger);
        byEvent.set(event, list);
      }
    }
  }

  // Find conflicts (same pattern, different actions)
  const checkConflicts = (
    grouped: Map<string, MergedTrigger[]>,
    type: string
  ) => {
    for (const [pattern, triggers] of grouped) {
      if (triggers.length < 2) continue;

      // Check if triggers have different agents
      for (let i = 0; i < triggers.length - 1; i++) {
        for (let j = i + 1; j < triggers.length; j++) {
          const t1 = triggers[i];
          const t2 = triggers[j];

          // Different agents for same pattern
          if (
            t1.action.type === 'spawn_agent' &&
            t2.action.type === 'spawn_agent' &&
            t1.action.agent !== t2.action.agent
          ) {
            // Resolve by priority
            const p1 = t1.priority ?? 10;
            const p2 = t2.priority ?? 10;

            conflicts.push({
              trigger1: t1,
              trigger2: t2,
              reason: `Both match ${type} pattern "${pattern}" but spawn different agents: ${t1.action.agent} vs ${t2.action.agent}`,
              resolution: p1 > p2 ? 'trigger1' : p2 > p1 ? 'trigger2' : 'both',
            });
          }
        }
      }
    }
  };

  checkConflicts(byKeyword, 'keyword');
  checkConflicts(byFile, 'file');
  checkConflicts(byEvent, 'event');

  return conflicts;
}

/**
 * Resolve conflicts by priority
 */
export function resolveConflicts(
  triggers: MergedTrigger[],
  conflicts: TriggerConflict[]
): MergedTrigger[] {
  // Build a set of triggers to remove
  const toRemove = new Set<string>();

  for (const conflict of conflicts) {
    if (conflict.resolution === 'trigger1') {
      toRemove.add(conflict.trigger2.name);
    } else if (conflict.resolution === 'trigger2') {
      toRemove.add(conflict.trigger1.name);
    }
    // 'both' means keep both (let runtime handle it)
    // 'none' would remove both (not currently used)
  }

  return triggers.filter((t) => !toRemove.has(t.name));
}

/**
 * Create a default triggers.json template
 */
export function createDefaultConfig(): GlobalTriggersConfig {
  return {
    version: SCHEMA_VERSION,
    triggers: [
      {
        name: 'security-on-commit',
        description: 'Security review before commits',
        match: {
          events: ['PreCommit'],
        },
        action: {
          type: 'spawn_agent',
          agent: 'security-expert',
          prompt: 'Review staged changes for security vulnerabilities',
          blocking: true,
        },
      },
    ],
    chains: [
      {
        name: 'full-review-pipeline',
        description: 'Complete code review workflow',
        trigger: {
          keywords: ['full review', 'complete review'],
        },
        agents: [
          { agent: 'security-expert', prompt: 'Security audit' },
          { agent: 'performance-optimizer', prompt: 'Performance review' },
          { agent: 'qa-testing-expert', prompt: 'Test coverage analysis' },
        ],
        execution: 'sequential',
        output: 'consolidated_report',
      },
    ],
    mcp_triggers: [],
  };
}

/**
 * Save a triggers configuration file
 */
export function saveConfigFile(
  config: GlobalTriggersConfig,
  filePath: string
): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n');
    return true;
  } catch {
    return false;
  }
}

/**
 * ConfigLoader class for managing trigger configurations
 */
export class ConfigLoader {
  private globalConfig: GlobalTriggersConfig | null = null;
  private projectConfig: GlobalTriggersConfig | null = null;
  private agents: AgentDefinition[] = [];
  private mergedConfig: MergedConfig | null = null;
  private conflicts: TriggerConflict[] = [];

  constructor(
    private options?: {
      globalPath?: string;
      projectRoot?: string;
    }
  ) {}

  /**
   * Load configurations from all sources
   */
  load(): void {
    this.globalConfig = loadGlobalConfig(this.options?.globalPath);
    this.projectConfig = loadProjectConfig(this.options?.projectRoot);
    this.mergedConfig = null;
    this.conflicts = [];
  }

  /**
   * Set agents for trigger extraction
   */
  setAgents(agents: AgentDefinition[]): void {
    this.agents = agents;
    this.mergedConfig = null;
    this.conflicts = [];
  }

  /**
   * Get merged configuration
   */
  getMergedConfig(): MergedConfig {
    if (!this.mergedConfig) {
      this.mergedConfig = mergeConfigs(
        this.globalConfig,
        this.projectConfig,
        this.agents,
        {
          globalPath: this.options?.globalPath,
          projectPath: this.options?.projectRoot
            ? path.join(this.options.projectRoot, PROJECT_CONFIG_FILENAME)
            : undefined,
        }
      );
      this.conflicts = detectConflicts(this.mergedConfig);
    }
    return this.mergedConfig;
  }

  /**
   * Get detected conflicts
   */
  getConflicts(): TriggerConflict[] {
    this.getMergedConfig(); // Ensure config is loaded
    return this.conflicts;
  }

  /**
   * Get resolved triggers (conflicts resolved by priority)
   */
  getResolvedTriggers(): MergedTrigger[] {
    const config = this.getMergedConfig();
    return resolveConflicts(config.triggers, this.conflicts);
  }

  /**
   * Check if any configuration is loaded
   */
  hasConfig(): boolean {
    return this.globalConfig !== null || this.projectConfig !== null || this.agents.length > 0;
  }

  /**
   * Get global config
   */
  getGlobalConfig(): GlobalTriggersConfig | null {
    return this.globalConfig;
  }

  /**
   * Get project config
   */
  getProjectConfig(): GlobalTriggersConfig | null {
    return this.projectConfig;
  }

  /**
   * Get statistics about loaded configuration
   */
  getStats(): {
    globalTriggers: number;
    projectTriggers: number;
    agentTriggers: number;
    totalTriggers: number;
    chains: number;
    mcpTriggers: number;
    conflicts: number;
  } {
    const config = this.getMergedConfig();
    const globalCount = config.triggers.filter((t) => t.source === 'global').length;
    const projectCount = config.triggers.filter((t) => t.source === 'project').length;
    const agentCount = config.triggers.filter((t) => t.source === 'agent').length;

    return {
      globalTriggers: globalCount,
      projectTriggers: projectCount,
      agentTriggers: agentCount,
      totalTriggers: config.triggers.length,
      chains: config.chains.length,
      mcpTriggers: config.mcp_triggers.length,
      conflicts: this.conflicts.length,
    };
  }
}

export default ConfigLoader;
