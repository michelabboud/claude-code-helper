/**
 * Tests for Event System
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  EventBus,
  matchEventTrigger,
  evaluateCondition,
  createEventContext,
  createPreToolUseEvent,
  createPostToolUseEvent,
  createPreCommitEvent,
  createPostCommitEvent,
} from './events.js';
import type { EventContext, EventTrigger } from './events.js';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should subscribe and receive events', async () => {
    let received: EventContext | null = null;

    bus.on('PreToolUse', (event) => {
      received = event;
    });

    const event = createPreToolUseEvent('Edit', { file_path: 'test.ts' });
    await bus.emit(event, []);

    assert.ok(received !== null);
    assert.strictEqual((received as EventContext).type, 'PreToolUse');
    assert.strictEqual((received as EventContext).tool, 'Edit');
  });

  it('should support wildcard listeners', async () => {
    const events: EventContext[] = [];

    bus.on('*', (event) => {
      events.push(event);
    });

    await bus.emit(createPreToolUseEvent('Edit', {}), []);
    await bus.emit(createPostToolUseEvent('Bash', {}, 'result'), []);

    assert.strictEqual(events.length, 2);
  });

  it('should unsubscribe correctly', async () => {
    let count = 0;
    const listener = () => {
      count++;
    };

    const unsubscribe = bus.on('PreToolUse', listener);
    await bus.emit(createPreToolUseEvent('Edit', {}), []);
    assert.strictEqual(count, 1);

    unsubscribe();
    await bus.emit(createPreToolUseEvent('Edit', {}), []);
    assert.strictEqual(count, 1); // Should not increase
  });

  it('should support once listeners', async () => {
    let count = 0;

    bus.once('PreToolUse', () => {
      count++;
    });

    await bus.emit(createPreToolUseEvent('Edit', {}), []);
    await bus.emit(createPreToolUseEvent('Edit', {}), []);

    assert.strictEqual(count, 1); // Only called once
  });

  it('should maintain event history', async () => {
    await bus.emit(createPreToolUseEvent('Edit', {}), []);
    await bus.emit(createPreToolUseEvent('Write', {}), []);
    await bus.emit(createPostToolUseEvent('Bash', {}, null), []);

    const history = bus.getHistory();
    assert.strictEqual(history.length, 3);

    const preToolHistory = bus.getHistory('PreToolUse');
    assert.strictEqual(preToolHistory.length, 2);
  });

  it('should clear history', async () => {
    await bus.emit(createPreToolUseEvent('Edit', {}), []);
    bus.clearHistory();

    assert.strictEqual(bus.getHistory().length, 0);
  });

  it('should count listeners', () => {
    bus.on('PreToolUse', () => {});
    bus.on('PreToolUse', () => {});
    bus.on('PostToolUse', () => {});

    assert.strictEqual(bus.listenerCount('PreToolUse'), 2);
    assert.strictEqual(bus.listenerCount('PostToolUse'), 1);
    assert.strictEqual(bus.listenerCount(), 3);
  });
});

describe('matchEventTrigger', () => {
  it('should match by event type', () => {
    const trigger: EventTrigger = { type: 'PreToolUse' };
    const event = createPreToolUseEvent('Edit', {});

    assert.ok(matchEventTrigger(trigger, event));
  });

  it('should not match different event types', () => {
    const trigger: EventTrigger = { type: 'PreCommit' };
    const event = createPreToolUseEvent('Edit', {});

    assert.ok(!matchEventTrigger(trigger, event));
  });

  it('should match by tool', () => {
    const trigger: EventTrigger = { type: 'PreToolUse', tool: 'Edit' };
    const event = createPreToolUseEvent('Edit', {});

    assert.ok(matchEventTrigger(trigger, event));
  });

  it('should not match different tools', () => {
    const trigger: EventTrigger = { type: 'PreToolUse', tool: 'Write' };
    const event = createPreToolUseEvent('Edit', {});

    assert.ok(!matchEventTrigger(trigger, event));
  });

  it('should match multiple tools', () => {
    const trigger: EventTrigger = {
      type: 'PreToolUse',
      tool: ['Edit', 'Write'],
    };

    assert.ok(matchEventTrigger(trigger, createPreToolUseEvent('Edit', {})));
    assert.ok(matchEventTrigger(trigger, createPreToolUseEvent('Write', {})));
    assert.ok(!matchEventTrigger(trigger, createPreToolUseEvent('Read', {})));
  });

  it('should match file patterns', () => {
    const trigger: EventTrigger = {
      type: 'PreToolUse',
      files: 'src/api/**',
    };

    const event = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    assert.ok(matchEventTrigger(trigger, event));
  });

  it('should match with conditions', () => {
    const trigger: EventTrigger = {
      type: 'PreToolUse',
      tool: 'Edit',
      condition: 'file.path.includes("/api/")',
    };

    const matchingEvent = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    const nonMatchingEvent = createPreToolUseEvent('Edit', {
      file_path: 'src/utils/helper.ts',
    });

    assert.ok(matchEventTrigger(trigger, matchingEvent));
    assert.ok(!matchEventTrigger(trigger, nonMatchingEvent));
  });
});

describe('evaluateCondition', () => {
  it('should evaluate file.path.includes()', () => {
    const event = createPreToolUseEvent('Edit', { file_path: 'src/api/users.ts' });

    assert.ok(evaluateCondition('file.path.includes("/api/")', event));
    assert.ok(!evaluateCondition('file.path.includes("/models/")', event));
  });

  it('should evaluate command.includes()', () => {
    const event = createPreToolUseEvent('Bash', { command: 'npm run test' });

    assert.ok(evaluateCondition('command.includes("test")', event));
    assert.ok(!evaluateCondition('command.includes("build")', event));
  });

  it('should evaluate tool comparison', () => {
    const event = createPreToolUseEvent('Edit', {});

    assert.ok(evaluateCondition('tool === "Edit"', event));
    assert.ok(!evaluateCondition('tool === "Write"', event));
  });

  it('should evaluate git properties', () => {
    const event = createPreCommitEvent(['src/app.ts'], 'main');

    assert.ok(evaluateCondition('git.branch === "main"', event));
    assert.ok(evaluateCondition('git.stagedFiles.length > 0', event));
  });

  it('should evaluate logical operators', () => {
    const event = createPreToolUseEvent('Edit', {
      file_path: 'src/api/users.ts',
    });

    assert.ok(
      evaluateCondition(
        'tool === "Edit" && file.path.includes("/api/")',
        event
      )
    );

    assert.ok(
      evaluateCondition(
        'tool === "Write" || file.path.includes("/api/")',
        event
      )
    );

    assert.ok(!evaluateCondition('!file.path.includes("/api/")', event));
  });

  it('should reject dangerous patterns', () => {
    const event = createPreToolUseEvent('Edit', {});

    // These should return false due to sanitization
    assert.ok(!evaluateCondition('eval("1+1")', event));
    assert.ok(!evaluateCondition('process.exit(1)', event));
    assert.ok(!evaluateCondition('require("fs")', event));
    assert.ok(!evaluateCondition('this.constructor', event));
  });

  it('should handle missing properties gracefully', () => {
    const event = createEventContext('PreToolUse');

    // Should not throw, just return false for missing data
    assert.ok(!evaluateCondition('file.path.includes("/api/")', event));
    assert.ok(evaluateCondition('file.path === ""', event));
  });
});

describe('Event Context Creators', () => {
  it('should create PreToolUse event', () => {
    const event = createPreToolUseEvent('Edit', {
      file_path: 'test.ts',
    });

    assert.strictEqual(event.type, 'PreToolUse');
    assert.strictEqual(event.tool, 'Edit');
    assert.strictEqual(event.filePath, 'test.ts');
    assert.strictEqual(event.fileEvent, 'edit');
  });

  it('should create PostToolUse event', () => {
    const event = createPostToolUseEvent(
      'Bash',
      { command: 'npm test' },
      { exitCode: 0 }
    );

    assert.strictEqual(event.type, 'PostToolUse');
    assert.strictEqual(event.tool, 'Bash');
    assert.strictEqual(event.command, 'npm test');
    assert.deepStrictEqual(event.result, { exitCode: 0 });
  });

  it('should create PreCommit event', () => {
    const event = createPreCommitEvent(['src/app.ts', 'src/utils.ts'], 'main');

    assert.strictEqual(event.type, 'PreCommit');
    assert.deepStrictEqual(event.git?.stagedFiles, [
      'src/app.ts',
      'src/utils.ts',
    ]);
    assert.strictEqual(event.git?.branch, 'main');
  });

  it('should create PostCommit event', () => {
    const event = createPostCommitEvent(
      'abc123',
      'Fix bug in login',
      'feature-branch'
    );

    assert.strictEqual(event.type, 'PostCommit');
    assert.strictEqual(event.git?.commitHash, 'abc123');
    assert.strictEqual(event.git?.commitMessage, 'Fix bug in login');
    assert.strictEqual(event.git?.branch, 'feature-branch');
  });

  it('should set correct fileEvent for different tools', () => {
    assert.strictEqual(
      createPreToolUseEvent('Read', { file_path: 'x' }).fileEvent,
      'read'
    );
    assert.strictEqual(
      createPreToolUseEvent('Write', { file_path: 'x' }).fileEvent,
      'write'
    );
    assert.strictEqual(
      createPreToolUseEvent('Edit', { file_path: 'x' }).fileEvent,
      'edit'
    );
  });
});
