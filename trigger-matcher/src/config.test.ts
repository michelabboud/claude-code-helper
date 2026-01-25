/**
 * Tests for Configuration Loader
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  validateConfig,
  loadConfigFile,
  mergeConfigs,
  agentTriggersToGlobalTriggers,
  detectConflicts,
  resolveConflicts,
  createDefaultConfig,
  ConfigLoader,
  SCHEMA_VERSION,
} from './config.js';
import type {
  GlobalTriggersConfig,
  AgentDefinition,
  MergedTrigger,
} from './types.js';

// Test fixtures
const validConfig: GlobalTriggersConfig = {
  version: '1.0',
  triggers: [
    {
      name: 'test-trigger',
      description: 'A test trigger',
      match: {
        keywords: ['test', 'testing'],
      },
      action: {
        type: 'spawn_agent',
        agent: 'qa-testing-expert',
        prompt: 'Run tests',
      },
      priority: 12,
    },
    {
      name: 'api-files',
      match: {
        files: ['src/api/**/*.ts'],
        events: ['Edit', 'Write'],
      },
      action: {
        type: 'spawn_agent',
        agent: 'api-expert',
      },
    },
  ],
  chains: [
    {
      name: 'review-pipeline',
      description: 'Full review',
      trigger: {
        keywords: ['full review'],
      },
      agents: [
        { agent: 'security-expert', prompt: 'Security audit' },
        { agent: 'api-expert', prompt: 'API review' },
      ],
      execution: 'sequential',
    },
  ],
  mcp_triggers: [],
};

const testAgents: AgentDefinition[] = [
  {
    name: 'api-expert',
    description: 'API specialist',
    filePath: '/test/api-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['REST API', 'endpoint'],
      files: [{ pattern: 'src/api/**/*.ts', on: ['edit', 'write'] }],
      events: [{ type: 'PreToolUse', tool: 'Edit' }],
      priority: 12,
    },
  },
  {
    name: 'security-expert',
    description: 'Security specialist',
    filePath: '/test/security-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['security', 'vulnerability'],
      events: [{ type: 'PreCommit' }],
      priority: 15,
    },
  },
  {
    name: 'no-triggers',
    description: 'Agent without triggers',
    filePath: '/test/no-triggers.md',
    type: 'domain-expert',
  },
];

describe('validateConfig', () => {
  it('should validate a correct config', () => {
    const result = validateConfig(validConfig, 'test.json');
    assert.ok(result.valid);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should reject non-object config', () => {
    const result = validateConfig('not an object', 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('must be an object')));
  });

  it('should require version field', () => {
    const config = { triggers: [] };
    const result = validateConfig(config, 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('version')));
  });

  it('should validate trigger structure', () => {
    const config = {
      version: '1.0',
      triggers: [{ invalid: true }],
    };
    const result = validateConfig(config, 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('name')));
  });

  it('should require at least one match condition', () => {
    const config: GlobalTriggersConfig = {
      version: '1.0',
      triggers: [
        {
          name: 'empty-match',
          match: {},
          action: { type: 'spawn_agent', agent: 'test' },
        },
      ],
    };
    const result = validateConfig(config, 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('at least one of')));
  });

  it('should validate action type', () => {
    const config = {
      version: '1.0',
      triggers: [
        {
          name: 'bad-action',
          match: { keywords: ['test'] },
          action: { type: 'invalid_type' },
        },
      ],
    };
    const result = validateConfig(config, 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('action.type')));
  });

  it('should validate chain structure', () => {
    const config: GlobalTriggersConfig = {
      version: '1.0',
      chains: [
        {
          name: 'empty-chain',
          trigger: { keywords: ['test'] },
          agents: [],
          execution: 'sequential',
        },
      ],
    };
    const result = validateConfig(config, 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('non-empty array')));
  });

  it('should validate execution mode', () => {
    const config = {
      version: '1.0',
      chains: [
        {
          name: 'bad-execution',
          trigger: { keywords: ['test'] },
          agents: [{ agent: 'test', prompt: 'test' }],
          execution: 'invalid',
        },
      ],
    };
    const result = validateConfig(config, 'test.json');
    assert.ok(!result.valid);
    assert.ok(result.errors.some((e) => e.includes('sequential')));
  });
});

describe('loadConfigFile', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trigger-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load a valid config file', () => {
    const configPath = path.join(tempDir, 'triggers.json');
    fs.writeFileSync(configPath, JSON.stringify(validConfig));

    const result = loadConfigFile(configPath);
    assert.ok(result !== null);
    assert.strictEqual(result!.version, '1.0');
    assert.strictEqual(result!.triggers?.length, 2);
  });

  it('should return null for non-existent file', () => {
    const result = loadConfigFile('/non/existent/path.json');
    assert.strictEqual(result, null);
  });

  it('should return null for invalid JSON', () => {
    const configPath = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(configPath, 'not valid json');

    const result = loadConfigFile(configPath);
    assert.strictEqual(result, null);
  });

  it('should return null for invalid config structure', () => {
    const configPath = path.join(tempDir, 'bad.json');
    fs.writeFileSync(configPath, JSON.stringify({ invalid: true }));

    const result = loadConfigFile(configPath);
    assert.strictEqual(result, null);
  });
});

describe('agentTriggersToGlobalTriggers', () => {
  it('should convert keyword triggers', () => {
    const agent = testAgents[0];
    const triggers = agentTriggersToGlobalTriggers(agent);

    const keywordTrigger = triggers.find((t) => t.name.includes(':keywords'));
    assert.ok(keywordTrigger);
    assert.deepStrictEqual(keywordTrigger.match.keywords, ['REST API', 'endpoint']);
    assert.strictEqual(keywordTrigger.action.agent, 'api-expert');
  });

  it('should convert file triggers', () => {
    const agent = testAgents[0];
    const triggers = agentTriggersToGlobalTriggers(agent);

    const fileTrigger = triggers.find((t) => t.name.includes(':files'));
    assert.ok(fileTrigger);
    assert.deepStrictEqual(fileTrigger.match.files, ['src/api/**/*.ts']);
  });

  it('should convert event triggers', () => {
    const agent = testAgents[0];
    const triggers = agentTriggersToGlobalTriggers(agent);

    const eventTrigger = triggers.find((t) => t.name.includes(':events'));
    assert.ok(eventTrigger);
    assert.deepStrictEqual(eventTrigger.match.events, ['PreToolUse:Edit']);
  });

  it('should preserve priority', () => {
    const agent = testAgents[0];
    const triggers = agentTriggersToGlobalTriggers(agent);

    assert.ok(triggers.every((t) => t.priority === 12));
  });

  it('should return empty array for agent without triggers', () => {
    const agent = testAgents[2]; // no-triggers agent
    const triggers = agentTriggersToGlobalTriggers(agent);
    assert.strictEqual(triggers.length, 0);
  });

  it('should handle event triggers without tool', () => {
    const agent = testAgents[1]; // security-expert with PreCommit (no tool)
    const triggers = agentTriggersToGlobalTriggers(agent);

    const eventTrigger = triggers.find((t) => t.name.includes(':events'));
    assert.ok(eventTrigger);
    assert.deepStrictEqual(eventTrigger.match.events, ['PreCommit']);
  });
});

describe('mergeConfigs', () => {
  it('should merge global and project configs', () => {
    const global: GlobalTriggersConfig = {
      version: '1.0',
      triggers: [
        {
          name: 'global-trigger',
          match: { keywords: ['global'] },
          action: { type: 'spawn_agent', agent: 'test' },
        },
      ],
    };

    const project: GlobalTriggersConfig = {
      version: '1.0',
      triggers: [
        {
          name: 'project-trigger',
          match: { keywords: ['project'] },
          action: { type: 'spawn_agent', agent: 'test' },
        },
      ],
    };

    const merged = mergeConfigs(global, project, []);

    assert.strictEqual(merged.triggers.length, 2);
    assert.ok(merged.triggers.some((t) => t.name === 'global-trigger' && t.source === 'global'));
    assert.ok(merged.triggers.some((t) => t.name === 'project-trigger' && t.source === 'project'));
  });

  it('should include agent triggers', () => {
    const merged = mergeConfigs(null, null, testAgents);

    // api-expert has 3 trigger types, security-expert has 2
    assert.ok(merged.triggers.length >= 5);
    assert.ok(merged.triggers.every((t) => t.source === 'agent'));
  });

  it('should filter disabled triggers', () => {
    const config: GlobalTriggersConfig = {
      version: '1.0',
      triggers: [
        {
          name: 'enabled',
          match: { keywords: ['test'] },
          action: { type: 'spawn_agent', agent: 'test' },
          enabled: true,
        },
        {
          name: 'disabled',
          match: { keywords: ['test'] },
          action: { type: 'spawn_agent', agent: 'test' },
          enabled: false,
        },
      ],
    };

    const merged = mergeConfigs(config, null, []);

    assert.strictEqual(merged.triggers.length, 1);
    assert.strictEqual(merged.triggers[0].name, 'enabled');
  });

  it('should track sources', () => {
    const merged = mergeConfigs(validConfig, validConfig, testAgents, {
      globalPath: '/global/triggers.json',
      projectPath: '/project/.claude/triggers.json',
    });

    assert.ok(merged.sources.some((s) => s.source === 'global'));
    assert.ok(merged.sources.some((s) => s.source === 'project'));
    assert.ok(merged.sources.some((s) => s.source === 'agent'));
  });

  it('should merge chains', () => {
    const merged = mergeConfigs(validConfig, null, []);

    assert.strictEqual(merged.chains.length, 1);
    assert.strictEqual(merged.chains[0].name, 'review-pipeline');
  });
});

describe('detectConflicts', () => {
  it('should detect keyword conflicts', () => {
    const triggers: MergedTrigger[] = [
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent1' },
        source: 'global',
        sourcePath: '/global',
        priority: 10,
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent2' },
        source: 'project',
        sourcePath: '/project',
        priority: 12,
      },
    ];

    const config = {
      triggers,
      chains: [],
      mcp_triggers: [],
      agents: [],
      sources: [],
    };

    const conflicts = detectConflicts(config);

    assert.strictEqual(conflicts.length, 1);
    assert.ok(conflicts[0].reason.includes('test'));
    assert.strictEqual(conflicts[0].resolution, 'trigger2'); // Higher priority wins
  });

  it('should detect file pattern conflicts', () => {
    const triggers: MergedTrigger[] = [
      {
        name: 'trigger1',
        match: { files: ['src/**/*.ts'] },
        action: { type: 'spawn_agent', agent: 'agent1' },
        source: 'global',
        sourcePath: '/global',
        priority: 15,
      },
      {
        name: 'trigger2',
        match: { files: ['src/**/*.ts'] },
        action: { type: 'spawn_agent', agent: 'agent2' },
        source: 'project',
        sourcePath: '/project',
        priority: 10,
      },
    ];

    const config = {
      triggers,
      chains: [],
      mcp_triggers: [],
      agents: [],
      sources: [],
    };

    const conflicts = detectConflicts(config);

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].resolution, 'trigger1'); // Higher priority wins
  });

  it('should not conflict when same agent', () => {
    const triggers: MergedTrigger[] = [
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'same-agent' },
        source: 'global',
        sourcePath: '/global',
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'same-agent' },
        source: 'project',
        sourcePath: '/project',
      },
    ];

    const config = {
      triggers,
      chains: [],
      mcp_triggers: [],
      agents: [],
      sources: [],
    };

    const conflicts = detectConflicts(config);

    assert.strictEqual(conflicts.length, 0);
  });

  it('should resolve ties as "both"', () => {
    const triggers: MergedTrigger[] = [
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent1' },
        source: 'global',
        sourcePath: '/global',
        priority: 10,
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent2' },
        source: 'project',
        sourcePath: '/project',
        priority: 10,
      },
    ];

    const config = {
      triggers,
      chains: [],
      mcp_triggers: [],
      agents: [],
      sources: [],
    };

    const conflicts = detectConflicts(config);

    assert.strictEqual(conflicts.length, 1);
    assert.strictEqual(conflicts[0].resolution, 'both');
  });
});

describe('resolveConflicts', () => {
  it('should remove lower priority triggers', () => {
    const triggers: MergedTrigger[] = [
      {
        name: 'high-priority',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent1' },
        source: 'global',
        sourcePath: '/global',
        priority: 15,
      },
      {
        name: 'low-priority',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent2' },
        source: 'project',
        sourcePath: '/project',
        priority: 10,
      },
    ];

    const conflicts = [
      {
        trigger1: triggers[0],
        trigger2: triggers[1],
        reason: 'test',
        resolution: 'trigger1' as const,
      },
    ];

    const resolved = resolveConflicts(triggers, conflicts);

    assert.strictEqual(resolved.length, 1);
    assert.strictEqual(resolved[0].name, 'high-priority');
  });

  it('should keep both when resolution is "both"', () => {
    const triggers: MergedTrigger[] = [
      {
        name: 'trigger1',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent1' },
        source: 'global',
        sourcePath: '/global',
      },
      {
        name: 'trigger2',
        match: { keywords: ['test'] },
        action: { type: 'spawn_agent', agent: 'agent2' },
        source: 'project',
        sourcePath: '/project',
      },
    ];

    const conflicts = [
      {
        trigger1: triggers[0],
        trigger2: triggers[1],
        reason: 'test',
        resolution: 'both' as const,
      },
    ];

    const resolved = resolveConflicts(triggers, conflicts);

    assert.strictEqual(resolved.length, 2);
  });
});

describe('createDefaultConfig', () => {
  it('should create a valid default config', () => {
    const config = createDefaultConfig();

    assert.strictEqual(config.version, SCHEMA_VERSION);
    assert.ok(Array.isArray(config.triggers));
    assert.ok(Array.isArray(config.chains));

    const { valid } = validateConfig(config, 'default');
    assert.ok(valid);
  });

  it('should include security-on-commit trigger', () => {
    const config = createDefaultConfig();

    const securityTrigger = config.triggers?.find((t) => t.name === 'security-on-commit');
    assert.ok(securityTrigger);
    assert.ok(securityTrigger.match.events?.includes('PreCommit'));
    assert.strictEqual(securityTrigger.action.agent, 'security-expert');
  });

  it('should include full-review-pipeline chain', () => {
    const config = createDefaultConfig();

    const reviewChain = config.chains?.find((c) => c.name === 'full-review-pipeline');
    assert.ok(reviewChain);
    assert.ok(reviewChain.agents.length >= 3);
    assert.strictEqual(reviewChain.execution, 'sequential');
  });
});

describe('ConfigLoader', () => {
  let tempDir: string;
  let loader: ConfigLoader;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trigger-loader-'));
    loader = new ConfigLoader({
      globalPath: path.join(tempDir, 'global-triggers.json'),
      projectRoot: tempDir,
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load from empty state', () => {
    loader.load();
    assert.ok(!loader.hasConfig());
  });

  it('should load global config', () => {
    const globalPath = path.join(tempDir, 'global-triggers.json');
    fs.writeFileSync(globalPath, JSON.stringify(validConfig));

    loader.load();
    assert.ok(loader.hasConfig());
    assert.ok(loader.getGlobalConfig() !== null);
  });

  it('should load project config', () => {
    const projectDir = path.join(tempDir, '.claude');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, 'triggers.json'), JSON.stringify(validConfig));

    loader.load();
    assert.ok(loader.hasConfig());
    assert.ok(loader.getProjectConfig() !== null);
  });

  it('should set and merge agents', () => {
    loader.load();
    loader.setAgents(testAgents);

    const config = loader.getMergedConfig();
    assert.ok(config.triggers.length > 0);
    assert.strictEqual(config.agents.length, 3);
  });

  it('should detect conflicts', () => {
    const globalPath = path.join(tempDir, 'global-triggers.json');
    const globalConfig: GlobalTriggersConfig = {
      version: '1.0',
      triggers: [
        {
          name: 'global-api',
          match: { keywords: ['REST API'] },
          action: { type: 'spawn_agent', agent: 'global-api-agent' },
          priority: 8,
        },
      ],
    };
    fs.writeFileSync(globalPath, JSON.stringify(globalConfig));

    loader.load();
    loader.setAgents(testAgents); // api-expert also has 'REST API' keyword

    const conflicts = loader.getConflicts();
    assert.ok(conflicts.length > 0);
  });

  it('should return resolved triggers', () => {
    const globalPath = path.join(tempDir, 'global-triggers.json');
    const globalConfig: GlobalTriggersConfig = {
      version: '1.0',
      triggers: [
        {
          name: 'low-priority',
          match: { keywords: ['REST API'] },
          action: { type: 'spawn_agent', agent: 'low-priority-agent' },
          priority: 5,
        },
      ],
    };
    fs.writeFileSync(globalPath, JSON.stringify(globalConfig));

    loader.load();
    loader.setAgents(testAgents); // api-expert has priority 12

    const resolved = loader.getResolvedTriggers();
    // Low priority trigger should be removed
    assert.ok(!resolved.some((t) => t.name === 'low-priority'));
  });

  it('should provide stats', () => {
    const globalPath = path.join(tempDir, 'global-triggers.json');
    fs.writeFileSync(globalPath, JSON.stringify(validConfig));

    loader.load();
    loader.setAgents(testAgents);

    const stats = loader.getStats();
    assert.ok(stats.globalTriggers > 0);
    assert.ok(stats.agentTriggers > 0);
    assert.ok(stats.totalTriggers > 0);
    assert.ok(stats.chains > 0);
  });
});
