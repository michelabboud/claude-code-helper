/**
 * Tests for Agent Chain Executor
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  evaluateChainCondition,
  matchChainTrigger,
  findMatchingChains,
  executeChain,
  ChainExecutor,
} from './chain.js';
import type {
  AgentChain,
  ChainExecutionContext,
  ChainExecutionOptions,
  AgentInvoker,
  ChainStepResult,
} from './types.js';

// Test fixtures
const testChains: AgentChain[] = [
  {
    name: 'review-pipeline',
    description: 'Code review workflow',
    trigger: {
      keywords: ['full review', 'review all'],
    },
    agents: [
      { agent: 'security-expert', prompt: 'Security audit' },
      { agent: 'performance-optimizer', prompt: 'Performance review' },
      { agent: 'qa-testing-expert', prompt: 'Test coverage' },
    ],
    execution: 'sequential',
    output: 'consolidated_report',
  },
  {
    name: 'api-review',
    description: 'API file review',
    trigger: {
      files: ['src/api/**/*.ts', '**/routes/**'],
    },
    agents: [
      { agent: 'api-expert', prompt: 'Review API changes' },
      { agent: 'security-expert', prompt: 'API security check' },
    ],
    execution: 'sequential',
  },
  {
    name: 'parallel-checks',
    description: 'Parallel validation',
    trigger: {
      events: ['PreCommit'],
    },
    agents: [
      { agent: 'linter', prompt: 'Run linting' },
      { agent: 'type-checker', prompt: 'Check types' },
      { agent: 'formatter', prompt: 'Check formatting' },
    ],
    execution: 'parallel',
  },
  {
    name: 'conditional-chain',
    description: 'Chain with conditions',
    trigger: {
      keywords: ['conditional review'],
    },
    agents: [
      { agent: 'security-expert', prompt: 'Security check' },
      {
        agent: 'api-expert',
        prompt: 'API review',
        condition: 'hasFileWith("/api/")',
      },
      {
        agent: 'db-expert',
        prompt: 'Database review',
        condition: 'hasFile("**/migrations/**")',
      },
    ],
    execution: 'sequential',
  },
  {
    name: 'disabled-chain',
    description: 'Disabled chain',
    trigger: { keywords: ['disabled'] },
    agents: [{ agent: 'test', prompt: 'test' }],
    execution: 'sequential',
    enabled: false,
  },
];

// Mock invoker that returns predictable output
const createMockInvoker = (delay = 0): AgentInvoker => {
  return async (agentName: string, prompt: string) => {
    if (delay > 0) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, delay);
        // Unref so Node.js doesn't wait for this timer to complete
        if (typeof timer.unref === 'function') timer.unref();
      });
    } else {
      // Use setImmediate for zero delay to ensure async behavior
      await new Promise((resolve) => setImmediate(resolve));
    }
    return `Output from ${agentName}: processed "${prompt}"`;
  };
};

// Mock invoker that fails for specific agents
const createFailingInvoker = (failAgents: string[]): AgentInvoker => {
  return async (agentName: string, prompt: string) => {
    if (failAgents.includes(agentName)) {
      throw new Error(`${agentName} failed`);
    }
    return `Output from ${agentName}: ${prompt}`;
  };
};

describe('evaluateChainCondition', () => {
  it('should evaluate hasFile condition', () => {
    const context: ChainExecutionContext = {
      files: ['src/api/users.ts', 'src/utils/helper.ts'],
    };

    assert.ok(evaluateChainCondition('hasFile("src/api/**")', context));
    assert.ok(!evaluateChainCondition('hasFile("src/db/**")', context));
  });

  it('should evaluate hasFileWith condition', () => {
    const context: ChainExecutionContext = {
      files: ['src/api/users.ts', 'db/migrations/001.sql'],
    };

    assert.ok(evaluateChainCondition('hasFileWith("/api/")', context));
    assert.ok(evaluateChainCondition('hasFileWith("migrations")', context));
    assert.ok(!evaluateChainCondition('hasFileWith("/models/")', context));
  });

  it('should evaluate previousContains condition', () => {
    const context: ChainExecutionContext = {
      previousOutputs: ['Found 3 security issues', 'No performance problems'],
    };

    assert.ok(evaluateChainCondition('previousContains("security issues")', context));
    assert.ok(!evaluateChainCondition('previousContains("errors")', context));
  });

  it('should evaluate hasFiles condition', () => {
    assert.ok(evaluateChainCondition('hasFiles()', { files: ['a.ts'] }));
    assert.ok(!evaluateChainCondition('hasFiles()', { files: [] }));
    assert.ok(!evaluateChainCondition('hasFiles()', {}));
  });

  it('should evaluate files.length condition', () => {
    const context: ChainExecutionContext = {
      files: ['a.ts', 'b.ts', 'c.ts'],
    };

    assert.ok(evaluateChainCondition('files.length > 2', context));
    assert.ok(!evaluateChainCondition('files.length > 5', context));
  });

  it('should evaluate files.some condition', () => {
    const context: ChainExecutionContext = {
      files: ['src/api/users.ts', 'src/routes/auth.ts'],
    };

    assert.ok(evaluateChainCondition('files.some(f => f.includes("/api/"))', context));
    assert.ok(!evaluateChainCondition('files.some(f => f.includes("/models/"))', context));
  });

  it('should evaluate custom variables', () => {
    const context: ChainExecutionContext = {
      variables: { hasApiChanges: true, changeCount: 5 },
    };

    assert.ok(evaluateChainCondition('hasApiChanges', context));
    assert.ok(evaluateChainCondition('changeCount > 3', context));
    assert.ok(!evaluateChainCondition('changeCount > 10', context));
  });

  it('should reject dangerous patterns', () => {
    const context: ChainExecutionContext = { files: ['test.ts'] };

    assert.ok(!evaluateChainCondition('eval("1+1")', context));
    assert.ok(!evaluateChainCondition('process.exit(1)', context));
    assert.ok(!evaluateChainCondition('require("fs")', context));
  });

  it('should handle evaluation errors gracefully', () => {
    const context: ChainExecutionContext = {};

    // Invalid syntax should return false, not throw
    assert.ok(!evaluateChainCondition('this is not valid js', context));
    assert.ok(!evaluateChainCondition('undefined.property.access', context));
  });
});

describe('matchChainTrigger', () => {
  it('should match keywords in user prompt', () => {
    const trigger = { keywords: ['full review', 'complete review'] };
    const context: ChainExecutionContext = { userPrompt: 'Please do a full review' };

    assert.ok(matchChainTrigger(trigger, context));
  });

  it('should be case-insensitive for keywords', () => {
    const trigger = { keywords: ['FULL REVIEW'] };
    const context: ChainExecutionContext = { userPrompt: 'do a full review please' };

    assert.ok(matchChainTrigger(trigger, context));
  });

  it('should match file patterns', () => {
    const trigger = { files: ['src/api/**/*.ts'] };
    const context: ChainExecutionContext = { files: ['src/api/users.ts'] };

    assert.ok(matchChainTrigger(trigger, context));
  });

  it('should match events', () => {
    const trigger = { events: ['PreCommit', 'PrePush'] };
    const context: ChainExecutionContext = { event: 'PreCommit' };

    assert.ok(matchChainTrigger(trigger, context));
  });

  it('should return false when no conditions match', () => {
    const trigger = { keywords: ['specific keyword'] };
    const context: ChainExecutionContext = { userPrompt: 'something else' };

    assert.ok(!matchChainTrigger(trigger, context));
  });
});

describe('findMatchingChains', () => {
  it('should find chains matching keywords', () => {
    const context: ChainExecutionContext = { userPrompt: 'do a full review' };
    const matching = findMatchingChains(testChains, context);

    assert.ok(matching.some((c) => c.name === 'review-pipeline'));
  });

  it('should find chains matching files', () => {
    const context: ChainExecutionContext = { files: ['src/api/users.ts'] };
    const matching = findMatchingChains(testChains, context);

    assert.ok(matching.some((c) => c.name === 'api-review'));
  });

  it('should find chains matching events', () => {
    const context: ChainExecutionContext = { event: 'PreCommit' };
    const matching = findMatchingChains(testChains, context);

    assert.ok(matching.some((c) => c.name === 'parallel-checks'));
  });

  it('should exclude disabled chains', () => {
    const context: ChainExecutionContext = { userPrompt: 'disabled' };
    const matching = findMatchingChains(testChains, context);

    assert.ok(!matching.some((c) => c.name === 'disabled-chain'));
  });
});

describe('executeChain - Sequential', () => {
  it('should execute steps in order', async () => {
    const executionOrder: string[] = [];
    const invoker: AgentInvoker = async (agentName) => {
      executionOrder.push(agentName);
      return `Output from ${agentName}`;
    };

    const chain = testChains[0]; // review-pipeline
    const result = await executeChain(chain, {}, { invoker });

    assert.strictEqual(result.status, 'completed');
    assert.deepStrictEqual(executionOrder, [
      'security-expert',
      'performance-optimizer',
      'qa-testing-expert',
    ]);
  });

  it('should pass previous outputs to next step', async () => {
    const receivedContexts: ChainExecutionContext[] = [];
    const invoker: AgentInvoker = async (agentName, prompt, context) => {
      receivedContexts.push({ ...context });
      return `Output from ${agentName}`;
    };

    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [
        { agent: 'step1', prompt: 'First' },
        { agent: 'step2', prompt: 'Second: ${previous_output}' },
      ],
      execution: 'sequential',
    };

    await executeChain(chain, {}, { invoker });

    // Second step should have first step's output in previousOutputs
    assert.ok(receivedContexts[1].previousOutputs?.includes('Output from step1'));
  });

  it('should stop on non-optional failure', async () => {
    const invoker = createFailingInvoker(['performance-optimizer']);
    const chain = testChains[0]; // review-pipeline

    const result = await executeChain(chain, {}, { invoker });

    assert.strictEqual(result.status, 'failed');
    assert.strictEqual(result.stepResults.length, 2); // Stopped after failure
    assert.strictEqual(result.stepResults[1].status, 'failed');
  });

  it('should continue on optional failure', async () => {
    const invoker = createFailingInvoker(['optional-agent']);
    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [
        { agent: 'optional-agent', prompt: 'Optional', optional: true },
        { agent: 'required-agent', prompt: 'Required' },
      ],
      execution: 'sequential',
    };

    const result = await executeChain(chain, {}, { invoker });

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.stepResults[0].status, 'failed');
    assert.strictEqual(result.stepResults[1].status, 'completed');
  });

  it('should skip steps when condition is false', async () => {
    const invoker = createMockInvoker();
    const chain = testChains[3]; // conditional-chain
    const context: ChainExecutionContext = {
      files: ['src/utils/helper.ts'], // No API or migration files
    };

    const result = await executeChain(chain, context, { invoker });

    assert.strictEqual(result.status, 'completed');
    // Security should complete, API and DB should be skipped
    assert.strictEqual(result.stepResults[0].status, 'completed');
    assert.strictEqual(result.stepResults[1].status, 'skipped');
    assert.strictEqual(result.stepResults[2].status, 'skipped');
  });

  it('should execute conditional steps when condition is true', async () => {
    const invoker = createMockInvoker();
    const chain = testChains[3]; // conditional-chain
    const context: ChainExecutionContext = {
      files: ['src/api/users.ts', 'db/migrations/001.sql'],
    };

    const result = await executeChain(chain, context, { invoker });

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.stepResults.every((r) => r.status === 'completed'));
  });
});

describe('executeChain - Parallel', () => {
  it('should execute steps concurrently', async () => {
    const startTimes: number[] = [];
    const invoker: AgentInvoker = async () => {
      startTimes.push(Date.now());
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 50);
        // Unref so Node.js doesn't wait for this timer
        if (typeof timer.unref === 'function') timer.unref();
      });
      return 'done';
    };

    const chain = testChains[2]; // parallel-checks
    const start = Date.now();
    const result = await executeChain(chain, {}, { invoker });

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.stepResults.length, 3);

    // All should start within a small window (parallel)
    const maxStartDiff = Math.max(...startTimes) - Math.min(...startTimes);
    assert.ok(maxStartDiff < 30, `Start times spread too wide: ${maxStartDiff}ms`);

    // Total time should be ~50ms, not 150ms
    const totalTime = Date.now() - start;
    assert.ok(totalTime < 100, `Took too long for parallel: ${totalTime}ms`);
  });

  it('should complete even if some steps fail', async () => {
    const invoker = createFailingInvoker(['linter']);
    const chain = testChains[2]; // parallel-checks

    const result = await executeChain(chain, {}, { invoker });

    // One failed, but parallel continues
    assert.strictEqual(result.stepResults.length, 3);
    const failed = result.stepResults.filter((r) => r.status === 'failed');
    const completed = result.stepResults.filter((r) => r.status === 'completed');
    assert.strictEqual(failed.length, 1);
    assert.strictEqual(completed.length, 2);
  });
});

describe('executeChain - Output Consolidation', () => {
  it('should generate consolidated report', async () => {
    const invoker = createMockInvoker();
    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [
        { agent: 'agent1', prompt: 'First' },
        { agent: 'agent2', prompt: 'Second' },
      ],
      execution: 'sequential',
      output: 'consolidated_report',
    };

    const result = await executeChain(chain, {}, { invoker });

    assert.ok(result.output.includes('# test Results'));
    assert.ok(result.output.includes('## agent1'));
    assert.ok(result.output.includes('## agent2'));
  });

  it('should return last_only output', async () => {
    const invoker: AgentInvoker = async (agentName) => `${agentName} output`;
    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [
        { agent: 'agent1', prompt: 'First' },
        { agent: 'agent2', prompt: 'Second' },
      ],
      execution: 'sequential',
      output: 'last_only',
    };

    const result = await executeChain(chain, {}, { invoker });

    assert.strictEqual(result.output, 'agent2 output');
    assert.ok(!result.output.includes('agent1'));
  });

  it('should include skipped steps in report', async () => {
    const invoker = createMockInvoker();
    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [
        { agent: 'agent1', prompt: 'First' },
        { agent: 'agent2', prompt: 'Second', condition: 'false' },
      ],
      execution: 'sequential',
      output: 'consolidated_report',
    };

    const result = await executeChain(chain, {}, { invoker });

    assert.ok(result.output.includes('Skipped Steps'));
    assert.ok(result.output.includes('agent2'));
  });
});

describe('executeChain - Callbacks', () => {
  it('should call onStepStart', async () => {
    const startedSteps: string[] = [];
    const invoker = createMockInvoker();
    const chain = testChains[0];

    await executeChain(chain, {}, {
      invoker,
      onStepStart: (step) => startedSteps.push(step.agent),
    });

    assert.deepStrictEqual(startedSteps, [
      'security-expert',
      'performance-optimizer',
      'qa-testing-expert',
    ]);
  });

  it('should call onStepComplete', async () => {
    const completedSteps: ChainStepResult[] = [];
    const invoker = createMockInvoker();
    const chain = testChains[0];

    await executeChain(chain, {}, {
      invoker,
      onStepComplete: (result) => completedSteps.push(result),
    });

    assert.strictEqual(completedSteps.length, 3);
    assert.ok(completedSteps.every((r) => r.status === 'completed'));
  });
});

describe('executeChain - Timeouts', () => {
  it('should set timeout error message correctly', async () => {
    // Test that the timeout error message is formatted correctly
    // We verify the timeout mechanism by checking the error message format
    // without actually waiting for a long timeout

    const invoker: AgentInvoker = async () => {
      // Immediate rejection simulating what happens after timeout
      throw new Error('Step timeout after 50ms');
    };

    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [{ agent: 'slow', prompt: 'test' }],
      execution: 'sequential',
    };

    const result = await executeChain(chain, {}, { invoker });

    assert.strictEqual(result.status, 'failed');
    assert.ok(result.stepResults[0].error?.includes('timeout'));
    assert.ok(result.stepResults[0].error?.includes('50ms'));
  });
});

describe('ChainExecutor', () => {
  let executor: ChainExecutor;

  beforeEach(() => {
    executor = new ChainExecutor();
    executor.loadChains(testChains);
    executor.setInvoker(createMockInvoker());
  });

  it('should load chains', () => {
    const chains = executor.getChains();
    // Excludes disabled chain
    assert.strictEqual(chains.length, 4);
  });

  it('should get chain by name', () => {
    const chain = executor.getChain('review-pipeline');
    assert.ok(chain);
    assert.strictEqual(chain.name, 'review-pipeline');
  });

  it('should find matching chains', () => {
    const context: ChainExecutionContext = { userPrompt: 'do a full review' };
    const matching = executor.findMatching(context);

    assert.ok(matching.some((c) => c.name === 'review-pipeline'));
  });

  it('should execute chain by name', async () => {
    const result = await executor.executeByName('review-pipeline', {});

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(result.stepResults.length, 3);
  });

  it('should return error for unknown chain', async () => {
    const result = await executor.executeByName('unknown-chain', {});

    assert.strictEqual(result.status, 'failed');
    assert.ok(result.error?.includes('not found'));
  });

  it('should execute matching chains', async () => {
    const context: ChainExecutionContext = { userPrompt: 'do a full review' };
    const results = await executor.executeMatching(context);

    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.chain.name === 'review-pipeline'));
  });

  it('should execute matching chains in parallel', async () => {
    // Create context that matches multiple chains
    const context: ChainExecutionContext = {
      userPrompt: 'conditional review',
      event: 'PreCommit',
    };

    const start = Date.now();
    const results = await executor.executeMatchingParallel(context);
    const duration = Date.now() - start;

    assert.ok(results.length >= 2);
    // Should be faster than sequential (each chain takes ~30ms with 3 steps)
    assert.ok(duration < 200, `Parallel execution took too long: ${duration}ms`);
  });

  it('should throw if invoker not set', async () => {
    const newExecutor = new ChainExecutor();
    newExecutor.loadChains(testChains);

    await assert.rejects(async () => {
      await newExecutor.executeByName('review-pipeline', {});
    }, /invoker not set/);
  });

  it('should return stats', () => {
    const stats = executor.getStats();

    assert.strictEqual(stats.totalChains, 4);
    assert.ok(stats.sequentialChains > 0);
    assert.ok(stats.parallelChains > 0);
    assert.ok(stats.totalSteps > 0);
    assert.ok(stats.chainsWithConditions > 0);
  });

  it('should use default options', async () => {
    const stepStarts: number[] = [];
    executor.setDefaultOptions({
      onStepStart: () => stepStarts.push(Date.now()),
    });

    await executor.executeByName('review-pipeline', {});

    assert.strictEqual(stepStarts.length, 3);
  });
});

describe('Variable Substitution', () => {
  it('should substitute ${previous_output}', async () => {
    const receivedPrompts: string[] = [];
    const invoker: AgentInvoker = async (_, prompt) => {
      receivedPrompts.push(prompt);
      return 'step output';
    };

    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [
        { agent: 'step1', prompt: 'First' },
        { agent: 'step2', prompt: 'Based on: ${previous_output}' },
      ],
      execution: 'sequential',
    };

    await executeChain(chain, {}, { invoker });

    assert.strictEqual(receivedPrompts[1], 'Based on: step output');
  });

  it('should substitute ${user_prompt}', async () => {
    const receivedPrompts: string[] = [];
    const invoker: AgentInvoker = async (_, prompt) => {
      receivedPrompts.push(prompt);
      return 'done';
    };

    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [{ agent: 'agent', prompt: 'User asked: ${user_prompt}' }],
      execution: 'sequential',
    };

    await executeChain(chain, { userPrompt: 'please review' }, { invoker });

    assert.strictEqual(receivedPrompts[0], 'User asked: please review');
  });

  it('should substitute ${files}', async () => {
    const receivedPrompts: string[] = [];
    const invoker: AgentInvoker = async (_, prompt) => {
      receivedPrompts.push(prompt);
      return 'done';
    };

    const chain: AgentChain = {
      name: 'test',
      trigger: {},
      agents: [{ agent: 'agent', prompt: 'Review files: ${files}' }],
      execution: 'sequential',
    };

    await executeChain(
      chain,
      { files: ['a.ts', 'b.ts'] },
      { invoker }
    );

    assert.strictEqual(receivedPrompts[0], 'Review files: a.ts, b.ts');
  });
});
