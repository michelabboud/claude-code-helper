/**
 * Tests for MCP Integration Module
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  substituteVariables,
  resolveParams,
  matchMCPTrigger,
  findMatchingMCPTriggers,
  matchHook,
  evaluateHookCondition,
  executeMCPTrigger,
  MCPTriggerExecutor,
} from './mcp.js';
import type {
  MCPTrigger,
  MCPExecutionContext,
  MCPExecutionOptions,
  MCPHook,
  MCPToolInvoker,
} from './types.js';

// Helper to create mock MCP invoker
const createMockMCPInvoker = (delay = 0): MCPToolInvoker => {
  return async (server: string, tool: string, params: Record<string, unknown>) => {
    if (delay > 0) {
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, delay);
        if (typeof timer.unref === 'function') timer.unref();
      });
    } else {
      await new Promise((resolve) => setImmediate(resolve));
    }
    return { server, tool, params, result: 'success' };
  };
};

// Helper to create mock agent invoker
const createMockAgentInvoker = (output = 'Agent output') => {
  return async (_name: string, _prompt: string) => {
    await new Promise((resolve) => setImmediate(resolve));
    return output;
  };
};

describe('substituteVariables', () => {
  it('should substitute file variables', () => {
    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
      files: ['src/main.ts', 'src/utils.ts'],
    };

    assert.strictEqual(
      substituteVariables('Files: ${files}', context),
      'Files: src/main.ts, src/utils.ts'
    );

    assert.strictEqual(
      substituteVariables('First file: ${file}', context),
      'First file: src/main.ts'
    );
  });

  it('should substitute server and tool variables', () => {
    const context: MCPExecutionContext = {
      server: 'api-server',
      tool: 'validate',
      params: {},
    };

    assert.strictEqual(
      substituteVariables('Running ${tool} on ${server}', context),
      'Running validate on api-server'
    );
  });

  it('should substitute user prompt', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
      userPrompt: 'Please validate the API',
    };

    assert.strictEqual(
      substituteVariables('User said: ${user_prompt}', context),
      'User said: Please validate the API'
    );
  });

  it('should substitute previous output', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
      previousOutputs: ['First output', 'Second output'],
    };

    assert.strictEqual(
      substituteVariables('Previous: ${previous_output}', context),
      'Previous: Second output'
    );
  });

  it('should substitute custom variables', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
      variables: {
        custom_var: 'custom_value',
        number_var: 42,
      },
    };

    assert.strictEqual(
      substituteVariables('Custom: ${custom_var}, Number: ${number_var}', context),
      'Custom: custom_value, Number: 42'
    );
  });

  it('should handle missing variables gracefully', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    assert.strictEqual(
      substituteVariables('Files: ${files}, Prompt: ${user_prompt}', context),
      'Files: , Prompt: '
    );
  });
});

describe('resolveParams', () => {
  it('should resolve variables in params', () => {
    const params = {
      file_path: '${file}',
      description: 'Analyzing ${files}',
    };

    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
      files: ['src/main.ts'],
    };

    const resolved = resolveParams(params, context);

    assert.strictEqual(resolved.file_path, 'src/main.ts');
    assert.strictEqual(resolved.description, 'Analyzing src/main.ts');
  });

  it('should handle undefined params', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    const resolved = resolveParams(undefined, context);
    assert.deepStrictEqual(resolved, {});
  });
});

describe('matchMCPTrigger', () => {
  const baseTrigger: MCPTrigger = {
    name: 'test-trigger',
    match: {},
    action: {
      type: 'mcp_tool',
      server: 'test-server',
      tool: 'test-tool',
    },
  };

  it('should match keywords in user prompt', () => {
    const trigger: MCPTrigger = {
      ...baseTrigger,
      match: { keywords: ['validate', 'check'] },
    };

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'Please validate the API',
    };

    const result = matchMCPTrigger(trigger, context);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.matchType, 'keyword');
    assert.strictEqual(result?.matchedPattern, 'validate');
  });

  it('should be case-insensitive for keywords', () => {
    const trigger: MCPTrigger = {
      ...baseTrigger,
      match: { keywords: ['VALIDATE'] },
    };

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'please validate this',
    };

    const result = matchMCPTrigger(trigger, context);
    assert.notStrictEqual(result, null);
  });

  it('should match file patterns', () => {
    const trigger: MCPTrigger = {
      ...baseTrigger,
      match: { files: ['**/*.ts'] },
    };

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      files: ['src/main.ts'],
    };

    const result = matchMCPTrigger(trigger, context);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.matchType, 'file');
    assert.strictEqual(result?.matchedValue, 'src/main.ts');
  });

  it('should match events', () => {
    const trigger: MCPTrigger = {
      ...baseTrigger,
      match: { events: ['PreToolUse', 'PostToolUse'] },
    };

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      event: 'PreToolUse',
    };

    const result = matchMCPTrigger(trigger, context);
    assert.notStrictEqual(result, null);
    assert.strictEqual(result?.matchType, 'event');
  });

  it('should return null for disabled triggers', () => {
    const trigger: MCPTrigger = {
      ...baseTrigger,
      enabled: false,
      match: { keywords: ['test'] },
    };

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'test',
    };

    const result = matchMCPTrigger(trigger, context);
    assert.strictEqual(result, null);
  });

  it('should return null when no conditions match', () => {
    const trigger: MCPTrigger = {
      ...baseTrigger,
      match: { keywords: ['validate'] },
    };

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'do something else',
    };

    const result = matchMCPTrigger(trigger, context);
    assert.strictEqual(result, null);
  });
});

describe('findMatchingMCPTriggers', () => {
  it('should find all matching triggers sorted by priority', () => {
    const triggers: MCPTrigger[] = [
      {
        name: 'low-priority',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's1', tool: 't1' },
        priority: 5,
      },
      {
        name: 'high-priority',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's2', tool: 't2' },
        priority: 15,
      },
      {
        name: 'medium-priority',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's3', tool: 't3' },
        priority: 10,
      },
    ];

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'test',
    };

    const results = findMatchingMCPTriggers(triggers, context);

    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].trigger.name, 'high-priority');
    assert.strictEqual(results[1].trigger.name, 'medium-priority');
    assert.strictEqual(results[2].trigger.name, 'low-priority');
  });

  it('should exclude disabled triggers', () => {
    const triggers: MCPTrigger[] = [
      {
        name: 'enabled',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's1', tool: 't1' },
      },
      {
        name: 'disabled',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's2', tool: 't2' },
        enabled: false,
      },
    ];

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'test',
    };

    const results = findMatchingMCPTriggers(triggers, context);

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].trigger.name, 'enabled');
  });
});

describe('matchHook', () => {
  it('should match when no patterns specified', () => {
    const hook: MCPHook = { timing: 'before' };
    const context: MCPExecutionContext = {
      server: 'any-server',
      tool: 'any-tool',
      params: {},
    };

    assert.strictEqual(matchHook(hook, context), true);
  });

  it('should match server pattern', () => {
    const hook: MCPHook = {
      timing: 'before',
      server: 'api-*',
    };

    assert.strictEqual(
      matchHook(hook, { server: 'api-server', tool: 'test', params: {} }),
      true
    );
    assert.strictEqual(
      matchHook(hook, { server: 'other-server', tool: 'test', params: {} }),
      false
    );
  });

  it('should match tool pattern', () => {
    const hook: MCPHook = {
      timing: 'before',
      tool: 'validate*',
    };

    assert.strictEqual(
      matchHook(hook, { server: 'test', tool: 'validate_api', params: {} }),
      true
    );
    assert.strictEqual(
      matchHook(hook, { server: 'test', tool: 'other_tool', params: {} }),
      false
    );
  });

  it('should match both server and tool patterns', () => {
    const hook: MCPHook = {
      timing: 'before',
      server: 'api-*',
      tool: 'validate*',
    };

    assert.strictEqual(
      matchHook(hook, { server: 'api-server', tool: 'validate_api', params: {} }),
      true
    );
    assert.strictEqual(
      matchHook(hook, { server: 'api-server', tool: 'other_tool', params: {} }),
      false
    );
    assert.strictEqual(
      matchHook(hook, { server: 'other-server', tool: 'validate_api', params: {} }),
      false
    );
  });
});

describe('evaluateHookCondition', () => {
  it('should evaluate serverIs condition', () => {
    const context: MCPExecutionContext = {
      server: 'api-server',
      tool: 'test',
      params: {},
    };

    assert.strictEqual(evaluateHookCondition('serverIs("api-server")', context), true);
    assert.strictEqual(evaluateHookCondition('serverIs("other")', context), false);
  });

  it('should evaluate toolIs condition', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'validate',
      params: {},
    };

    assert.strictEqual(evaluateHookCondition('toolIs("validate")', context), true);
    assert.strictEqual(evaluateHookCondition('toolIs("other")', context), false);
  });

  it('should evaluate hasFile condition', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
      files: ['src/main.ts', 'src/utils.ts'],
    };

    assert.strictEqual(evaluateHookCondition('hasFile("**/*.ts")', context), true);
    assert.strictEqual(evaluateHookCondition('hasFile("**/*.py")', context), false);
  });

  it('should evaluate hasParam condition', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: { path: '/some/path' },
    };

    assert.strictEqual(evaluateHookCondition('hasParam("path")', context), true);
    assert.strictEqual(evaluateHookCondition('hasParam("missing")', context), false);
  });

  it('should reject dangerous patterns', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    assert.strictEqual(evaluateHookCondition('eval("1+1")', context), false);
    assert.strictEqual(evaluateHookCondition('process.exit(1)', context), false);
    assert.strictEqual(evaluateHookCondition('require("fs")', context), false);
  });

  it('should handle evaluation errors gracefully', () => {
    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    assert.strictEqual(evaluateHookCondition('this is not valid js', context), false);
  });
});

describe('executeMCPTrigger', () => {
  it('should execute MCP tool successfully', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
        params: { key: 'value' },
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(),
    };

    const result = await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.output);
    assert.ok(result.durationMs !== undefined);
  });

  it('should resolve variables in params', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
        params: { file_path: '${file}' },
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
      files: ['src/main.ts'],
    };

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(),
    };

    const result = await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(result.status, 'completed');
    assert.strictEqual(context.resolvedParams?.file_path, 'src/main.ts');
  });

  it('should execute before hooks', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    const beforeHook: MCPHook = {
      timing: 'before',
      agent: 'validator',
      prompt: 'Validate before execution',
    };

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(),
      agentInvoker: createMockAgentInvoker('Validation passed'),
      beforeHooks: [beforeHook],
    };

    const result = await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.beforeHookResults);
    assert.strictEqual(result.beforeHookResults.length, 1);
    assert.strictEqual(result.beforeHookResults[0].success, true);
  });

  it('should block execution when before hook blocks', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    const blockingHook: MCPHook = {
      timing: 'before',
      blocking: true,
      agent: 'security-checker',
      prompt: 'Check security',
    };

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(),
      agentInvoker: createMockAgentInvoker('BLOCK: Security violation detected'),
      beforeHooks: [blockingHook],
    };

    const result = await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(result.status, 'blocked');
    assert.ok(result.blockedBy);
    assert.ok(result.error?.includes('BLOCK'));
  });

  it('should execute after hooks', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    const afterHook: MCPHook = {
      timing: 'after',
      agent: 'logger',
      prompt: 'Log the result',
    };

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(),
      agentInvoker: createMockAgentInvoker('Logged'),
      afterHooks: [afterHook],
    };

    const result = await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(result.status, 'completed');
    assert.ok(result.afterHookResults);
    assert.strictEqual(result.afterHookResults.length, 1);
    assert.strictEqual(result.afterHookResults[0].success, true);
  });

  it('should handle MCP tool timeout', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(500), // 500ms delay
      timeout: 100, // 100ms timeout
    };

    const result = await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(result.status, 'failed');
    assert.ok(result.error?.includes('timeout'));
  });

  it('should call onExecutionStart and onExecutionComplete callbacks', async () => {
    const trigger: MCPTrigger = {
      name: 'test-trigger',
      match: {},
      action: {
        type: 'mcp_tool',
        server: 'test-server',
        tool: 'test-tool',
      },
    };

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    let startCalled = false;
    let completeCalled = false;

    const options: MCPExecutionOptions = {
      mcpInvoker: createMockMCPInvoker(),
      onExecutionStart: () => {
        startCalled = true;
      },
      onExecutionComplete: () => {
        completeCalled = true;
      },
    };

    await executeMCPTrigger(trigger, context, options);

    assert.strictEqual(startCalled, true);
    assert.strictEqual(completeCalled, true);
  });
});

describe('MCPTriggerExecutor', () => {
  it('should load triggers', () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's1', tool: 't1' },
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's2', tool: 't2' },
        enabled: false, // Should be filtered out
      },
    ]);

    const triggers = executor.getTriggers();
    assert.strictEqual(triggers.length, 1);
    assert.strictEqual(triggers[0].name, 'trigger1');
  });

  it('should load hooks', () => {
    const executor = new MCPTriggerExecutor();

    executor.loadHooks([
      { timing: 'before', agent: 'before-agent', prompt: 'before' },
      { timing: 'after', agent: 'after-agent', prompt: 'after' },
      { timing: 'before', agent: 'another-before', prompt: 'before2' },
    ]);

    assert.strictEqual(executor.getBeforeHooks().length, 2);
    assert.strictEqual(executor.getAfterHooks().length, 1);
  });

  it('should get trigger by name', () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'my-trigger',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's1', tool: 't1' },
      },
    ]);

    const trigger = executor.getTrigger('my-trigger');
    assert.ok(trigger);
    assert.strictEqual(trigger.name, 'my-trigger');

    const notFound = executor.getTrigger('not-found');
    assert.strictEqual(notFound, undefined);
  });

  it('should find matching triggers', () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'api-trigger',
        match: { keywords: ['api', 'validate'] },
        action: { type: 'mcp_tool', server: 'api-server', tool: 'validate' },
      },
      {
        name: 'file-trigger',
        match: { files: ['**/*.ts'] },
        action: { type: 'mcp_tool', server: 'code-server', tool: 'analyze' },
      },
    ]);

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'validate api',
    };

    const matches = executor.findMatching(context);
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].trigger.name, 'api-trigger');
  });

  it('should execute trigger by name', async () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'test-trigger',
        match: {},
        action: { type: 'mcp_tool', server: 'test-server', tool: 'test-tool' },
      },
    ]);

    executor.setMCPInvoker(createMockMCPInvoker());

    const context: MCPExecutionContext = {
      server: 'test-server',
      tool: 'test-tool',
      params: {},
    };

    const result = await executor.executeByName('test-trigger', context);

    assert.strictEqual(result.status, 'completed');
  });

  it('should return error for non-existent trigger', async () => {
    const executor = new MCPTriggerExecutor();
    executor.setMCPInvoker(createMockMCPInvoker());

    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    const result = await executor.executeByName('non-existent', context);

    assert.strictEqual(result.status, 'failed');
    assert.ok(result.error?.includes('not found'));
  });

  it('should throw error when MCP invoker not set', async () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'test-trigger',
        match: {},
        action: { type: 'mcp_tool', server: 'test', tool: 'test' },
      },
    ]);

    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    await assert.rejects(async () => {
      await executor.execute(executor.getTrigger('test-trigger')!, context);
    }, /MCP invoker not set/);
  });

  it('should add before and after hooks', () => {
    const executor = new MCPTriggerExecutor();

    executor.addBeforeHook({ timing: 'before', agent: 'before', prompt: 'before' });
    executor.addAfterHook({ timing: 'after', agent: 'after', prompt: 'after' });

    assert.strictEqual(executor.getBeforeHooks().length, 1);
    assert.strictEqual(executor.getAfterHooks().length, 1);
  });

  it('should execute matching triggers', async () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's1', tool: 't1' },
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's2', tool: 't2' },
      },
    ]);

    executor.setMCPInvoker(createMockMCPInvoker());

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'test',
    };

    const results = await executor.executeMatching(context);

    assert.strictEqual(results.length, 2);
    assert.ok(results.every((r) => r.status === 'completed'));
  });

  it('should execute matching triggers in parallel', async () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's1', tool: 't1' },
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'mcp_tool', server: 's2', tool: 't2' },
      },
    ]);

    executor.setMCPInvoker(createMockMCPInvoker(50));

    const context: MCPExecutionContext = {
      server: '',
      tool: '',
      params: {},
      userPrompt: 'test',
    };

    const startTime = Date.now();
    const results = await executor.executeMatchingParallel(context);
    const duration = Date.now() - startTime;

    assert.strictEqual(results.length, 2);
    // If parallel, should complete in roughly the same time as one trigger
    // (allowing for some overhead)
    assert.ok(duration < 150, `Expected parallel execution but took ${duration}ms`);
  });

  it('should get stats', () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 't1',
        match: {},
        action: { type: 'mcp_tool', server: 'server-a', tool: 'tool1' },
      },
      {
        name: 't2',
        match: {},
        action: { type: 'mcp_tool', server: 'server-a', tool: 'tool2' },
      },
      {
        name: 't3',
        match: {},
        action: { type: 'mcp_tool', server: 'server-b', tool: 'tool3' },
      },
    ]);

    executor.loadHooks([
      { timing: 'before', blocking: true },
      { timing: 'before', blocking: false },
      { timing: 'after' },
    ]);

    const stats = executor.getStats();

    assert.strictEqual(stats.totalTriggers, 3);
    assert.strictEqual(stats.beforeHooks, 2);
    assert.strictEqual(stats.afterHooks, 1);
    assert.strictEqual(stats.blockingHooks, 1);
    assert.strictEqual(stats.triggersByServer['server-a'], 2);
    assert.strictEqual(stats.triggersByServer['server-b'], 1);
  });

  it('should use default options', async () => {
    const executor = new MCPTriggerExecutor();

    executor.loadTriggers([
      {
        name: 'test-trigger',
        match: {},
        action: { type: 'mcp_tool', server: 'test', tool: 'test' },
      },
    ]);

    let callbackCalled = false;
    executor.setDefaultOptions({
      onExecutionComplete: () => {
        callbackCalled = true;
      },
    });

    executor.setMCPInvoker(createMockMCPInvoker());

    const context: MCPExecutionContext = {
      server: 'test',
      tool: 'test',
      params: {},
    };

    await executor.executeByName('test-trigger', context);

    assert.strictEqual(callbackCalled, true);
  });
});
