/**
 * Tests for Event Dispatcher
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  EventDispatcher,
  buildEventIndex,
  matchEvent,
} from './dispatcher.js';
import { createPreToolUseEvent, createPreCommitEvent } from './events.js';
import type { AgentDefinition } from './types.js';

// Test fixtures with event triggers
const testAgents: AgentDefinition[] = [
  {
    name: 'api-expert',
    description: 'REST API specialist',
    filePath: '/test/api-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['REST API'],
      files: [{ pattern: 'src/api/**/*.ts', on: ['edit', 'write'] }],
      events: [
        { type: 'PreToolUse', tool: 'Edit', condition: 'file.path.includes("/api/")' },
        { type: 'PostToolUse', tool: 'Write', files: 'src/api/**' },
      ],
      priority: 12,
      tags: ['backend', 'api'],
    },
    visual: { emoji: '🔌', label: 'API Expert' },
  } as AgentDefinition & { triggers: { events: unknown[] } },
  {
    name: 'security-expert',
    description: 'Security specialist',
    filePath: '/test/security-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['security'],
      events: [
        { type: 'PreCommit' },
        { type: 'PreToolUse', tool: ['Write', 'Edit'], files: '**/.env*' },
      ],
      priority: 15,
      tags: ['security'],
    },
    visual: { emoji: '🔒', label: 'Security Expert' },
  } as AgentDefinition & { triggers: { events: unknown[] } },
  {
    name: 'test-expert',
    description: 'Testing specialist',
    filePath: '/test/test-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['test'],
      events: [
        { type: 'PostToolUse', tool: 'Bash', condition: 'command.includes("test")' },
      ],
      priority: 10,
    },
  } as AgentDefinition & { triggers: { events: unknown[] } },
  {
    name: 'no-events-agent',
    description: 'Agent without event triggers',
    filePath: '/test/no-events.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['generic'],
      files: [{ pattern: '**/*.ts', on: ['edit'] }],
      priority: 8,
    },
  },
];

describe('buildEventIndex', () => {
  it('should index agents by event type', () => {
    const index = buildEventIndex(testAgents);

    assert.ok(index.byEventType.has('PreToolUse'));
    assert.ok(index.byEventType.has('PostToolUse'));
    assert.ok(index.byEventType.has('PreCommit'));

    // api-expert and security-expert have PreToolUse
    assert.strictEqual(index.byEventType.get('PreToolUse')!.length, 2);
  });

  it('should index agents by tool', () => {
    const index = buildEventIndex(testAgents);

    assert.ok(index.byTool.has('Edit'));
    assert.ok(index.byTool.has('Write'));
    assert.ok(index.byTool.has('Bash'));

    // api-expert and security-expert have Edit
    assert.strictEqual(index.byTool.get('Edit')!.length, 2);
  });

  it('should only include agents with event triggers', () => {
    const index = buildEventIndex(testAgents);

    // no-events-agent should not be in the index
    assert.strictEqual(index.agents.length, 3);
    assert.ok(!index.agents.some((a) => a.name === 'no-events-agent'));
  });
});

describe('matchEvent', () => {
  it('should match PreToolUse events', () => {
    const index = buildEventIndex(testAgents);
    const event = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    const matches = matchEvent(event, index);

    assert.ok(matches.length > 0);
    assert.ok(matches.some((m) => m.agent.name === 'api-expert'));
  });

  it('should match PreCommit events', () => {
    const index = buildEventIndex(testAgents);
    const event = createPreCommitEvent(['src/app.ts'], 'main');

    const matches = matchEvent(event, index);

    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].agent.name, 'security-expert');
  });

  it('should match by condition', () => {
    const index = buildEventIndex(testAgents);

    // Event that matches the condition
    const matchingEvent = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    // Event that doesn't match the condition
    const nonMatchingEvent = createPreToolUseEvent('Edit', {
      file_path: 'src/utils/helper.ts',
    });

    const matches1 = matchEvent(matchingEvent, index);
    const matches2 = matchEvent(nonMatchingEvent, index);

    assert.ok(matches1.some((m) => m.agent.name === 'api-expert'));
    assert.ok(!matches2.some((m) => m.agent.name === 'api-expert'));
  });

  it('should sort by priority', () => {
    const index = buildEventIndex(testAgents);

    // Both security-expert and api-expert match this
    const event = createPreToolUseEvent('Edit', {
      file_path: '.env.local',
    });

    const matches = matchEvent(event, index);

    if (matches.length > 1) {
      // Security expert has priority 15, should be first
      assert.strictEqual(matches[0].agent.name, 'security-expert');
    }
  });

  it('should return empty for non-matching events', () => {
    const index = buildEventIndex(testAgents);
    const event = createPreToolUseEvent('Glob', {});

    const matches = matchEvent(event, index);
    assert.strictEqual(matches.length, 0);
  });
});

describe('EventDispatcher', () => {
  let dispatcher: EventDispatcher;

  beforeEach(() => {
    dispatcher = new EventDispatcher();
    dispatcher.loadAgents(testAgents);
  });

  it('should dispatch events and return matches', async () => {
    const event = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    const result = await dispatcher.dispatch(event);

    assert.ok(result.matches.length > 0);
    assert.ok(result.actions.length > 0);
    assert.strictEqual(result.event, event);
  });

  it('should combine event and file triggers', async () => {
    // This file matches both event triggers and file patterns
    const event = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    const result = await dispatcher.dispatch(event);

    // Should have matches from both event triggers and file patterns
    assert.ok(result.matches.length > 0);
  });

  it('should emit to event bus', async () => {
    let emittedEvent: unknown = null;
    dispatcher.getEventBus().on('PreToolUse', (event) => {
      emittedEvent = event;
    });

    const event = createPreToolUseEvent('Edit', { file_path: 'test.ts' });
    await dispatcher.dispatch(event);

    assert.ok(emittedEvent !== null);
  });

  it('should check for event triggers', () => {
    const event = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    assert.ok(dispatcher.hasEventTriggers(event));

    const noMatchEvent = createPreToolUseEvent('Glob', {});
    assert.ok(!dispatcher.hasEventTriggers(noMatchEvent));
  });

  it('should get agents with event triggers', () => {
    const agents = dispatcher.getAgentsWithEventTriggers();

    assert.strictEqual(agents.length, 3);
    assert.ok(agents.some((a) => a.name === 'api-expert'));
    assert.ok(agents.some((a) => a.name === 'security-expert'));
    assert.ok(agents.some((a) => a.name === 'test-expert'));
  });

  it('should get agents for specific event type', () => {
    const preCommitAgents = dispatcher.getAgentsForEventType('PreCommit');

    assert.strictEqual(preCommitAgents.length, 1);
    assert.strictEqual(preCommitAgents[0].name, 'security-expert');
  });

  it('should get agents for specific tool', () => {
    const bashAgents = dispatcher.getAgentsForTool('Bash');

    assert.strictEqual(bashAgents.length, 1);
    assert.strictEqual(bashAgents[0].name, 'test-expert');
  });

  it('should return stats', () => {
    const stats = dispatcher.getStats();

    assert.strictEqual(stats.totalAgents, 4);
    assert.strictEqual(stats.agentsWithEventTriggers, 3);
    assert.ok(stats.eventTypes.includes('PreToolUse'));
    assert.ok(stats.tools.includes('Edit'));
  });

  it('should throw if agents not loaded', async () => {
    const newDispatcher = new EventDispatcher();

    await assert.rejects(async () => {
      await newDispatcher.dispatch(createPreToolUseEvent('Edit', {}));
    }, /Agents not loaded/);
  });
});
