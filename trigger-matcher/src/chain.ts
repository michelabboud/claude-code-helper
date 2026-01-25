/**
 * Agent Chain Executor
 *
 * Executes chains of agents in sequential or parallel mode,
 * handling condition evaluation, output passing, and error handling.
 */

import { minimatch } from 'minimatch';
import type {
  AgentChain,
  ChainStep,
  ChainExecutionResult,
  ChainStepResult,
  ChainExecutionContext,
  ChainExecutionOptions,
  ChainStatus,
  ChainStepStatus,
  AgentInvoker,
  TriggerMatchCondition,
} from './types.js';

/** Default step timeout: 5 minutes */
const DEFAULT_STEP_TIMEOUT = 5 * 60 * 1000;

/** Default chain timeout: 30 minutes */
const DEFAULT_CHAIN_TIMEOUT = 30 * 60 * 1000;

/**
 * Evaluate a condition expression against execution context
 */
export function evaluateChainCondition(
  condition: string,
  context: ChainExecutionContext
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
        console.error(`Unsafe pattern in chain condition: ${condition}`);
        return false;
      }
    }

    // Build the evaluation context
    const files = context.files || [];
    const previousOutputs = context.previousOutputs || [];
    const variables = context.variables || {};

    // Common helper functions
    const helpers = {
      // Check if any file matches a pattern
      hasFile: (pattern: string) => files.some((f) => minimatch(f, pattern, { dot: true })),
      // Check if any file contains a substring
      hasFileWith: (substr: string) => files.some((f) => f.includes(substr)),
      // Check if previous output contains text
      previousContains: (text: string) => previousOutputs.some((o) => o.includes(text)),
      // Get last output
      lastOutput: () => previousOutputs[previousOutputs.length - 1] || '',
      // Check if files array has items
      hasFiles: () => files.length > 0,
      // Check variable
      hasVar: (name: string) => name in variables,
      getVar: (name: string) => variables[name],
    };

    // Create safe evaluation context
    const evalContext = {
      files,
      previousOutputs,
      userPrompt: context.userPrompt || '',
      event: context.event || '',
      ...helpers,
      ...variables,
    };

    // Build function body
    const contextKeys = Object.keys(evalContext);
    const contextValues = Object.values(evalContext);

    // Create function with context variables as parameters
    const fn = new Function(...contextKeys, `return (${condition});`);
    return Boolean(fn(...contextValues));
  } catch (error) {
    // Log but don't fail - treat as false
    console.error(`Error evaluating chain condition "${condition}":`, error);
    return false;
  }
}

/**
 * Match a chain's trigger against context
 */
export function matchChainTrigger(
  trigger: TriggerMatchCondition,
  context: ChainExecutionContext
): boolean {
  // Check keywords in user prompt
  if (trigger.keywords && trigger.keywords.length > 0 && context.userPrompt) {
    const prompt = context.userPrompt.toLowerCase();
    const keywordMatch = trigger.keywords.some((kw) =>
      prompt.includes(kw.toLowerCase())
    );
    if (keywordMatch) return true;
  }

  // Check file patterns
  if (trigger.files && trigger.files.length > 0 && context.files) {
    const fileMatch = trigger.files.some((pattern) =>
      context.files!.some((file) => minimatch(file, pattern, { dot: true }))
    );
    if (fileMatch) return true;
  }

  // Check events
  if (trigger.events && trigger.events.length > 0 && context.event) {
    const eventMatch = trigger.events.some((e) => e === context.event);
    if (eventMatch) return true;
  }

  return false;
}

/**
 * Find chains that match the given context
 */
export function findMatchingChains(
  chains: AgentChain[],
  context: ChainExecutionContext
): AgentChain[] {
  return chains.filter(
    (chain) => chain.enabled !== false && matchChainTrigger(chain.trigger, context)
  );
}

/**
 * Execute a single chain step
 */
async function executeStep(
  step: ChainStep,
  index: number,
  context: ChainExecutionContext,
  options: ChainExecutionOptions
): Promise<ChainStepResult> {
  const result: ChainStepResult = {
    step,
    index,
    status: 'pending',
  };

  // Check condition
  if (step.condition) {
    const conditionMet = evaluateChainCondition(step.condition, context);
    if (!conditionMet) {
      result.status = 'skipped';
      result.skipReason = `Condition not met: ${step.condition}`;
      return result;
    }
  }

  // Execute the step
  result.status = 'running';
  result.startedAt = new Date();

  // Notify step start
  options.onStepStart?.(step, index);

  try {
    // Build the prompt with context
    let prompt = step.prompt;

    // Substitute variables in prompt
    if (context.previousOutputs && context.previousOutputs.length > 0) {
      const lastOutput = context.previousOutputs[context.previousOutputs.length - 1];
      prompt = prompt.replace(/\$\{previous_output\}/g, lastOutput);
      prompt = prompt.replace(/\$\{last_output\}/g, lastOutput);
    }

    if (context.userPrompt) {
      prompt = prompt.replace(/\$\{user_prompt\}/g, context.userPrompt);
    }

    if (context.files && context.files.length > 0) {
      prompt = prompt.replace(/\$\{files\}/g, context.files.join(', '));
    }

    // Create timeout promise
    const timeoutMs = options.stepTimeout || DEFAULT_STEP_TIMEOUT;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Step timeout after ${timeoutMs}ms`)), timeoutMs);
    });

    // Execute with timeout
    const output = await Promise.race([
      options.invoker(step.agent, prompt, context),
      timeoutPromise,
    ]);

    result.status = 'completed';
    result.output = output;
  } catch (error) {
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : String(error);
    // Don't throw here - let the caller check the status and decide
  } finally {
    result.completedAt = new Date();
    result.durationMs = result.completedAt.getTime() - result.startedAt!.getTime();

    // Notify step complete
    options.onStepComplete?.(result);
  }

  return result;
}

/**
 * Execute a chain sequentially
 */
async function executeSequential(
  chain: AgentChain,
  context: ChainExecutionContext,
  options: ChainExecutionOptions
): Promise<ChainStepResult[]> {
  const results: ChainStepResult[] = [];
  const updatedContext = { ...context, previousOutputs: [] as string[] };

  for (let i = 0; i < chain.agents.length; i++) {
    const step = chain.agents[i];
    const result = await executeStep(step, i, updatedContext, options);
    results.push(result);

    // Add output to context for next step
    if (result.status === 'completed' && result.output) {
      updatedContext.previousOutputs.push(result.output);
    }

    // Stop on failure unless optional or continueOnError
    if (result.status === 'failed' && !step.optional && !options.continueOnError) {
      break;
    }
  }

  return results;
}

/**
 * Execute a chain in parallel
 */
async function executeParallel(
  chain: AgentChain,
  context: ChainExecutionContext,
  options: ChainExecutionOptions
): Promise<ChainStepResult[]> {
  const promises = chain.agents.map((step, index) =>
    executeStep(step, index, context, options).catch((error) => ({
      step,
      index,
      status: 'failed' as ChainStepStatus,
      error: error instanceof Error ? error.message : String(error),
      startedAt: new Date(),
      completedAt: new Date(),
    }))
  );

  return Promise.all(promises);
}

/**
 * Consolidate step outputs into final output
 */
function consolidateOutput(
  chain: AgentChain,
  results: ChainStepResult[]
): string {
  const completedResults = results.filter((r) => r.status === 'completed' && r.output);

  if (completedResults.length === 0) {
    return 'No output generated.';
  }

  if (chain.output === 'last_only') {
    // Return only the last successful output
    return completedResults[completedResults.length - 1].output!;
  }

  // Default: consolidated_report
  const sections = completedResults.map((r) => {
    const header = `## ${r.step.agent}`;
    const duration = r.durationMs ? ` (${Math.round(r.durationMs / 1000)}s)` : '';
    return `${header}${duration}\n\n${r.output}`;
  });

  const skippedSteps = results.filter((r) => r.status === 'skipped');
  if (skippedSteps.length > 0) {
    const skippedList = skippedSteps
      .map((r) => `- ${r.step.agent}: ${r.skipReason}`)
      .join('\n');
    sections.push(`## Skipped Steps\n\n${skippedList}`);
  }

  const failedSteps = results.filter((r) => r.status === 'failed');
  if (failedSteps.length > 0) {
    const failedList = failedSteps
      .map((r) => `- ${r.step.agent}: ${r.error}`)
      .join('\n');
    sections.push(`## Failed Steps\n\n${failedList}`);
  }

  return `# ${chain.name} Results\n\n${sections.join('\n\n---\n\n')}`;
}

/**
 * Execute an agent chain
 */
export async function executeChain(
  chain: AgentChain,
  context: ChainExecutionContext,
  options: ChainExecutionOptions
): Promise<ChainExecutionResult> {
  const result: ChainExecutionResult = {
    chain,
    status: 'pending',
    stepResults: [],
    output: '',
    startedAt: new Date(),
  };

  // Validate chain
  if (!chain.agents || chain.agents.length === 0) {
    result.status = 'failed';
    result.error = 'Chain has no agents';
    result.completedAt = new Date();
    result.output = 'Error: Chain has no agents to execute.';
    return result;
  }

  // Check if chain is enabled
  if (chain.enabled === false) {
    result.status = 'failed';
    result.error = 'Chain is disabled';
    result.completedAt = new Date();
    result.output = 'Error: Chain is disabled.';
    return result;
  }

  result.status = 'running';

  try {
    // Create chain timeout
    const chainTimeoutMs = options.chainTimeout || DEFAULT_CHAIN_TIMEOUT;
    const chainTimeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Chain timeout after ${chainTimeoutMs}ms`)),
        chainTimeoutMs
      );
    });

    // Execute based on mode
    const executionPromise =
      chain.execution === 'parallel'
        ? executeParallel(chain, context, options)
        : executeSequential(chain, context, options);

    result.stepResults = await Promise.race([executionPromise, chainTimeout]);

    // Determine overall status
    const hasFailures = result.stepResults.some(
      (r) => r.status === 'failed' && !r.step.optional
    );
    const allSkipped = result.stepResults.every((r) => r.status === 'skipped');

    if (hasFailures) {
      result.status = 'failed';
      result.error = 'One or more required steps failed';
    } else if (allSkipped) {
      result.status = 'completed';
      result.output = 'All steps were skipped due to conditions.';
    } else {
      result.status = 'completed';
    }

    // Generate output
    result.output = consolidateOutput(chain, result.stepResults);
  } catch (error) {
    result.status = 'failed';
    result.error = error instanceof Error ? error.message : String(error);
    result.output = `Error executing chain: ${result.error}`;
  } finally {
    result.completedAt = new Date();
    result.durationMs = result.completedAt.getTime() - result.startedAt.getTime();
  }

  return result;
}

/**
 * ChainExecutor class for managing chain execution
 */
export class ChainExecutor {
  private chains: AgentChain[] = [];
  private invoker: AgentInvoker | null = null;
  private defaultOptions: Partial<ChainExecutionOptions> = {};

  /**
   * Load chains from configuration
   */
  loadChains(chains: AgentChain[]): void {
    this.chains = chains.filter((c) => c.enabled !== false);
  }

  /**
   * Set the agent invoker function
   */
  setInvoker(invoker: AgentInvoker): void {
    this.invoker = invoker;
  }

  /**
   * Set default execution options
   */
  setDefaultOptions(options: Partial<ChainExecutionOptions>): void {
    this.defaultOptions = options;
  }

  /**
   * Get all loaded chains
   */
  getChains(): AgentChain[] {
    return [...this.chains];
  }

  /**
   * Get a chain by name
   */
  getChain(name: string): AgentChain | undefined {
    return this.chains.find((c) => c.name === name);
  }

  /**
   * Find chains that match the given context
   */
  findMatching(context: ChainExecutionContext): AgentChain[] {
    return findMatchingChains(this.chains, context);
  }

  /**
   * Execute a chain by name
   */
  async executeByName(
    name: string,
    context: ChainExecutionContext,
    options?: Partial<ChainExecutionOptions>
  ): Promise<ChainExecutionResult> {
    const chain = this.getChain(name);
    if (!chain) {
      return {
        chain: { name, agents: [], execution: 'sequential', trigger: {} } as AgentChain,
        status: 'failed',
        stepResults: [],
        output: `Error: Chain "${name}" not found.`,
        error: `Chain "${name}" not found`,
        startedAt: new Date(),
        completedAt: new Date(),
      };
    }

    return this.execute(chain, context, options);
  }

  /**
   * Execute a chain
   */
  async execute(
    chain: AgentChain,
    context: ChainExecutionContext,
    options?: Partial<ChainExecutionOptions>
  ): Promise<ChainExecutionResult> {
    if (!this.invoker) {
      throw new Error('Agent invoker not set. Call setInvoker() first.');
    }

    const mergedOptions: ChainExecutionOptions = {
      ...this.defaultOptions,
      ...options,
      invoker: options?.invoker || this.invoker,
    };

    return executeChain(chain, context, mergedOptions);
  }

  /**
   * Execute all chains that match the context
   */
  async executeMatching(
    context: ChainExecutionContext,
    options?: Partial<ChainExecutionOptions>
  ): Promise<ChainExecutionResult[]> {
    const matching = this.findMatching(context);
    const results: ChainExecutionResult[] = [];

    for (const chain of matching) {
      const result = await this.execute(chain, context, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute matching chains in parallel
   */
  async executeMatchingParallel(
    context: ChainExecutionContext,
    options?: Partial<ChainExecutionOptions>
  ): Promise<ChainExecutionResult[]> {
    const matching = this.findMatching(context);
    return Promise.all(
      matching.map((chain) => this.execute(chain, context, options))
    );
  }

  /**
   * Get statistics about loaded chains
   */
  getStats(): {
    totalChains: number;
    sequentialChains: number;
    parallelChains: number;
    totalSteps: number;
    chainsWithConditions: number;
  } {
    const sequential = this.chains.filter((c) => c.execution === 'sequential').length;
    const parallel = this.chains.filter((c) => c.execution === 'parallel').length;
    const totalSteps = this.chains.reduce((sum, c) => sum + c.agents.length, 0);
    const withConditions = this.chains.filter((c) =>
      c.agents.some((a) => a.condition)
    ).length;

    return {
      totalChains: this.chains.length,
      sequentialChains: sequential,
      parallelChains: parallel,
      totalSteps,
      chainsWithConditions: withConditions,
    };
  }
}

export default ChainExecutor;
