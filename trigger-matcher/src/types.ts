/**
 * Types for Claude Code Agent Trigger System
 */

/** Event types that can trigger agents */
export type FileEvent = 'read' | 'edit' | 'write';

/** Keyword pattern with optional regex support */
export interface KeywordPattern {
  pattern: string;
  case_insensitive?: boolean;
}

/** File pattern with event filtering */
export interface FilePattern {
  pattern: string;
  on: FileEvent[];
}

/** Event types that can trigger agents */
export type EventType =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PreCommit'
  | 'PostCommit'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Error'
  | 'AgentStart'
  | 'AgentEnd';

/** Event trigger definition */
export interface EventTriggerDef {
  /** Event type to match */
  type: EventType;
  /** Tool to match (optional, for tool events) */
  tool?: string | string[];
  /** Condition expression (optional) */
  condition?: string;
  /** File patterns to match (optional) */
  files?: string | string[];
}

/** Agent trigger configuration */
export interface AgentTriggers {
  keywords?: (string | KeywordPattern)[];
  files?: FilePattern[];
  events?: EventTriggerDef[];
  priority?: number;
  tags?: string[];
}

/** Visual indicator configuration */
export interface AgentVisual {
  emoji?: string;
  color?: string;
  label?: string;
  spinner?: string;
}

/** Parsed agent definition */
export interface AgentDefinition {
  name: string;
  description: string;
  model?: string;
  tools?: string[];
  triggers?: AgentTriggers;
  visual?: AgentVisual;
  mcp_servers?: string[];
  /** Source file path */
  filePath: string;
  /** Agent type: domain-expert or mcp-integrated */
  type: 'domain-expert' | 'mcp-integrated';
}

/** Match result for a triggered agent */
export interface TriggerMatch {
  agent: AgentDefinition;
  matchType: 'keyword' | 'file' | 'event';
  matchedPattern: string;
  matchedValue: string;
  priority: number;
  confidence: number;
}

/** Options for trigger matching */
export interface MatchOptions {
  /** File event type (read, edit, write) */
  event?: FileEvent;
  /** Minimum priority to include */
  minPriority?: number;
  /** Maximum results to return */
  limit?: number;
  /** Filter by tags */
  tags?: string[];
}

/** Trigger index for fast lookups */
export interface TriggerIndex {
  /** Keyword to agent mappings */
  keywords: Map<string, AgentDefinition[]>;
  /** File pattern to agent mappings */
  filePatterns: Map<string, { agent: AgentDefinition; events: FileEvent[] }[]>;
  /** All indexed agents */
  agents: AgentDefinition[];
  /** Index creation timestamp */
  indexedAt: Date;
}

/** Environment variables for active agent */
export interface AgentEnvironment {
  CLAUDE_ACTIVE_AGENT?: string;
  CLAUDE_ACTIVE_AGENT_EMOJI?: string;
  CLAUDE_ACTIVE_AGENT_LABEL?: string;
  CLAUDE_ACTIVE_AGENT_COLOR?: string;
}

// ============================================================================
// Global Configuration Types (Phase 4)
// ============================================================================

/** Action type for global triggers */
export type TriggerActionType = 'spawn_agent' | 'mcp_tool' | 'shell_command';

/** Execution mode for agent chains */
export type ChainExecutionMode = 'sequential' | 'parallel';

/** Output mode for agent chains */
export type ChainOutputMode = 'consolidated_report' | 'last_only';

/** Action to take when a trigger matches */
export interface TriggerAction {
  /** Type of action */
  type: TriggerActionType;
  /** Agent name to spawn (for spawn_agent) */
  agent?: string;
  /** Prompt to send to the agent */
  prompt?: string;
  /** Prefix to add to user's prompt */
  prompt_prefix?: string;
  /** Whether this action blocks the current operation */
  blocking?: boolean;
  /** Whether to run in background */
  run_in_background?: boolean;
  /** MCP server name (for mcp_tool) */
  server?: string;
  /** MCP tool name (for mcp_tool) */
  tool?: string;
  /** Parameters for MCP tool */
  params?: Record<string, string>;
  /** Shell command (for shell_command) */
  command?: string;
}

/** Match conditions for a global trigger */
export interface TriggerMatchCondition {
  /** Keyword patterns to match in prompt */
  keywords?: string[];
  /** File glob patterns to match */
  files?: string[];
  /** Event types to match (e.g., "Edit", "PreCommit", "PostToolUse:Bash") */
  events?: string[];
}

/** Global trigger definition */
export interface GlobalTrigger {
  /** Unique name for this trigger */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Match conditions (any of keywords/files/events) */
  match: TriggerMatchCondition;
  /** Action to take when matched */
  action: TriggerAction;
  /** Whether this trigger is enabled (default: true) */
  enabled?: boolean;
  /** Priority (higher = preferred when conflicts) */
  priority?: number;
}

/** Step in an agent chain */
export interface ChainStep {
  /** Agent name to invoke */
  agent: string;
  /** Prompt to send to the agent */
  prompt: string;
  /** Condition expression (if falsy, step is skipped) */
  condition?: string;
  /** Whether this step is optional */
  optional?: boolean;
}

/** Agent chain definition */
export interface AgentChain {
  /** Unique name for this chain */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Trigger conditions to start the chain */
  trigger: {
    keywords?: string[];
    files?: string[];
    events?: string[];
  };
  /** Ordered list of agent steps */
  agents: ChainStep[];
  /** Execution mode: sequential or parallel */
  execution: ChainExecutionMode;
  /** Output handling mode */
  output?: ChainOutputMode;
  /** Whether this chain is enabled (default: true) */
  enabled?: boolean;
}

/** MCP trigger definition */
export interface MCPTrigger {
  /** Unique name for this trigger */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Match conditions */
  match: TriggerMatchCondition;
  /** Action to take */
  action: {
    type: 'mcp_tool';
    server: string;
    tool: string;
    params?: Record<string, string>;
  };
  /** Whether this trigger is enabled (default: true) */
  enabled?: boolean;
  /** Priority (higher = preferred when conflicts) */
  priority?: number;
}

/** Global triggers configuration file schema */
export interface GlobalTriggersConfig {
  /** Schema version */
  version: string;
  /** Global triggers */
  triggers?: GlobalTrigger[];
  /** Agent chains */
  chains?: AgentChain[];
  /** MCP triggers */
  mcp_triggers?: MCPTrigger[];
}

/** Source of trigger configuration */
export type ConfigSource = 'global' | 'project' | 'agent';

/** Merged trigger with source tracking */
export interface MergedTrigger extends GlobalTrigger {
  /** Where this trigger came from */
  source: ConfigSource;
  /** Original file path */
  sourcePath: string;
}

/** Merged configuration from all sources */
export interface MergedConfig {
  /** All triggers from all sources */
  triggers: MergedTrigger[];
  /** All chains from all sources */
  chains: AgentChain[];
  /** All MCP triggers from all sources */
  mcp_triggers: MCPTrigger[];
  /** Agents that contributed triggers */
  agents: AgentDefinition[];
  /** Configuration sources that were loaded */
  sources: { path: string; source: ConfigSource; loadedAt: Date }[];
}

/** Result of trigger matching with source info */
export interface TriggerMatchResult {
  agent: AgentDefinition;
  matchType: 'keyword' | 'file' | 'event';
  matchedPattern: string;
  matchedValue: string;
  priority: number;
  confidence: number;
}

/** Conflict between triggers */
export interface TriggerConflict {
  /** First conflicting trigger */
  trigger1: MergedTrigger;
  /** Second conflicting trigger */
  trigger2: MergedTrigger;
  /** Reason for conflict */
  reason: string;
  /** Resolution: which trigger wins */
  resolution: 'trigger1' | 'trigger2' | 'both' | 'none';
}

// ============================================================================
// Chain Execution Types (Phase 5)
// ============================================================================

/** Status of a chain step execution */
export type ChainStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/** Result of executing a single chain step */
export interface ChainStepResult {
  /** The step that was executed */
  step: ChainStep;
  /** Step index in the chain */
  index: number;
  /** Execution status */
  status: ChainStepStatus;
  /** Output from the agent (if completed) */
  output?: string;
  /** Error message (if failed) */
  error?: string;
  /** Why the step was skipped (if skipped) */
  skipReason?: string;
  /** Execution start time */
  startedAt?: Date;
  /** Execution end time */
  completedAt?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
}

/** Status of a chain execution */
export type ChainStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Result of executing an agent chain */
export interface ChainExecutionResult {
  /** The chain that was executed */
  chain: AgentChain;
  /** Overall execution status */
  status: ChainStatus;
  /** Results from each step */
  stepResults: ChainStepResult[];
  /** Consolidated output (based on chain.output mode) */
  output: string;
  /** Error message (if failed) */
  error?: string;
  /** Execution start time */
  startedAt: Date;
  /** Execution end time */
  completedAt?: Date;
  /** Total duration in milliseconds */
  durationMs?: number;
}

/** Context passed to chain execution */
export interface ChainExecutionContext {
  /** Original user prompt that triggered the chain */
  userPrompt?: string;
  /** Files involved in the triggering event */
  files?: string[];
  /** Event that triggered the chain */
  event?: string;
  /** Previous step outputs (for sequential execution) */
  previousOutputs?: string[];
  /** Custom variables for condition evaluation */
  variables?: Record<string, unknown>;
}

/** Agent invoker function type - provided by the runtime */
export type AgentInvoker = (
  agentName: string,
  prompt: string,
  context?: ChainExecutionContext
) => Promise<string>;

/** Options for chain execution */
export interface ChainExecutionOptions {
  /** Function to invoke agents */
  invoker: AgentInvoker;
  /** Timeout per step in milliseconds */
  stepTimeout?: number;
  /** Total chain timeout in milliseconds */
  chainTimeout?: number;
  /** Whether to continue on step failure */
  continueOnError?: boolean;
  /** Callback for step completion */
  onStepComplete?: (result: ChainStepResult) => void;
  /** Callback for step start */
  onStepStart?: (step: ChainStep, index: number) => void;
}

// ============================================================================
// MCP Integration Types (Phase 6)
// ============================================================================

/** MCP hook execution timing */
export type MCPHookTiming = 'before' | 'after';

/** MCP hook definition */
export interface MCPHook {
  /** Hook timing: before or after MCP tool execution */
  timing: MCPHookTiming;
  /** MCP server pattern to match (glob) */
  server?: string;
  /** MCP tool pattern to match (glob) */
  tool?: string;
  /** Condition expression */
  condition?: string;
  /** Agent to invoke */
  agent?: string;
  /** Prompt for the agent */
  prompt?: string;
  /** Whether the hook can block execution (before hooks only) */
  blocking?: boolean;
  /** Whether to inject hook output into tool context */
  inject_context?: boolean;
}

/** Context for MCP tool execution */
export interface MCPExecutionContext {
  /** MCP server name */
  server: string;
  /** MCP tool name */
  tool: string;
  /** Tool parameters (original) */
  params: Record<string, unknown>;
  /** Resolved parameters after variable substitution */
  resolvedParams?: Record<string, unknown>;
  /** Files involved (from trigger context) */
  files?: string[];
  /** User prompt that triggered the execution */
  userPrompt?: string;
  /** Event that triggered the execution */
  event?: string;
  /** Previous outputs in a chain */
  previousOutputs?: string[];
  /** Custom variables */
  variables?: Record<string, unknown>;
}

/** Status of MCP execution */
export type MCPExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'blocked';

/** Result of executing an MCP tool */
export interface MCPExecutionResult {
  /** The trigger that was executed */
  trigger: MCPTrigger;
  /** Execution status */
  status: MCPExecutionStatus;
  /** Output from the MCP tool */
  output?: unknown;
  /** Formatted output as string */
  outputString?: string;
  /** Error message (if failed) */
  error?: string;
  /** Whether execution was blocked by a before hook */
  blockedBy?: string;
  /** Results from before hooks */
  beforeHookResults?: MCPHookResult[];
  /** Results from after hooks */
  afterHookResults?: MCPHookResult[];
  /** Execution context */
  context: MCPExecutionContext;
  /** Execution start time */
  startedAt: Date;
  /** Execution end time */
  completedAt?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
}

/** Result of executing an MCP hook */
export interface MCPHookResult {
  /** The hook that was executed */
  hook: MCPHook;
  /** Hook timing */
  timing: MCPHookTiming;
  /** Whether the hook succeeded */
  success: boolean;
  /** Output from the hook agent */
  output?: string;
  /** Error message (if failed) */
  error?: string;
  /** Whether the hook blocked execution */
  blocked?: boolean;
  /** Block reason */
  blockReason?: string;
  /** Execution start time */
  startedAt: Date;
  /** Execution end time */
  completedAt?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
}

/** MCP tool invoker function type - provided by the runtime */
export type MCPToolInvoker = (
  server: string,
  tool: string,
  params: Record<string, unknown>
) => Promise<unknown>;

/** Options for MCP trigger execution */
export interface MCPExecutionOptions {
  /** Function to invoke MCP tools */
  mcpInvoker: MCPToolInvoker;
  /** Function to invoke agents (for hooks) */
  agentInvoker?: AgentInvoker;
  /** Before hooks to run */
  beforeHooks?: MCPHook[];
  /** After hooks to run */
  afterHooks?: MCPHook[];
  /** Timeout for MCP tool execution in milliseconds */
  timeout?: number;
  /** Timeout for hook execution in milliseconds */
  hookTimeout?: number;
  /** Whether to continue if before hooks fail */
  continueOnHookError?: boolean;
  /** Callback for execution start */
  onExecutionStart?: (trigger: MCPTrigger, context: MCPExecutionContext) => void;
  /** Callback for execution complete */
  onExecutionComplete?: (result: MCPExecutionResult) => void;
  /** Callback for hook execution */
  onHookExecute?: (hook: MCPHook, timing: MCPHookTiming) => void;
}

/** MCP trigger match result */
export interface MCPTriggerMatchResult {
  /** The matched trigger */
  trigger: MCPTrigger;
  /** Match type */
  matchType: 'keyword' | 'file' | 'event';
  /** The pattern that matched */
  matchedPattern: string;
  /** The value that was matched */
  matchedValue: string;
  /** Priority of the trigger */
  priority: number;
}
