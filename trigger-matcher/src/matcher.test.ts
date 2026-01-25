/**
 * Tests for Trigger Matcher
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  buildTriggerIndex,
  matchFilePattern,
  matchKeywords,
  matchAll,
  getBestMatch,
  hasTriggers,
} from './matcher.js';
import type { AgentDefinition, TriggerIndex } from './types.js';

// Test fixtures
const testAgents: AgentDefinition[] = [
  {
    name: 'api-expert',
    description: 'REST API specialist',
    filePath: '/test/api-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: [
        'REST API',
        'endpoint',
        { pattern: '(create|design).*api', case_insensitive: true },
      ],
      files: [
        { pattern: 'src/api/**/*.ts', on: ['edit', 'write'] },
        { pattern: '**/routes/**', on: ['edit'] },
        { pattern: 'openapi.yaml', on: ['read', 'edit'] },
      ],
      priority: 12,
      tags: ['backend', 'api'],
    },
    visual: {
      emoji: '🔌',
      label: 'API Expert',
    },
  },
  {
    name: 'react-expert',
    description: 'React and Next.js specialist',
    filePath: '/test/react-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['React', 'Next.js', 'component'],
      files: [
        { pattern: 'src/components/**/*.tsx', on: ['edit', 'write'] },
        { pattern: '**/*.jsx', on: ['edit', 'write'] },
      ],
      priority: 11,
      tags: ['frontend', 'react'],
    },
    visual: {
      emoji: '⚛️',
      label: 'React Expert',
    },
  },
  {
    name: 'security-expert',
    description: 'Security specialist',
    filePath: '/test/security-expert.md',
    type: 'domain-expert',
    triggers: {
      keywords: ['security', 'vulnerability', 'CVE'],
      files: [
        { pattern: '**/*.env', on: ['read', 'edit', 'write'] },
        { pattern: '**/secrets/**', on: ['read', 'edit', 'write'] },
      ],
      priority: 15, // High priority for security
      tags: ['security'],
    },
    visual: {
      emoji: '🔒',
      label: 'Security Expert',
    },
  },
  {
    name: 'generic-agent',
    description: 'Agent without triggers',
    filePath: '/test/generic.md',
    type: 'domain-expert',
    // No triggers defined
  },
];

describe('buildTriggerIndex', () => {
  it('should build index from agent definitions', () => {
    const index = buildTriggerIndex(testAgents);

    assert.ok(index.keywords.size > 0, 'Should have keywords indexed');
    assert.ok(index.filePatterns.size > 0, 'Should have file patterns indexed');
    assert.strictEqual(index.agents.length, 4, 'Should include all agents');
    assert.ok(index.indexedAt instanceof Date, 'Should have timestamp');
  });

  it('should index keywords case-insensitively', () => {
    const index = buildTriggerIndex(testAgents);

    assert.ok(index.keywords.has('rest api'), 'Should have lowercase keyword');
    assert.ok(index.keywords.has('react'), 'Should have React keyword');
  });

  it('should handle agents without triggers', () => {
    const index = buildTriggerIndex(testAgents);

    // Should not throw, and agent should still be in the list
    assert.strictEqual(index.agents.length, 4);
  });
});

describe('matchFilePattern', () => {
  let index: TriggerIndex;

  beforeEach(() => {
    index = buildTriggerIndex(testAgents);
  });

  it('should match exact file patterns', () => {
    const matches = matchFilePattern('openapi.yaml', 'edit', index);

    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].agent.name, 'api-expert');
  });

  it('should match glob patterns with **', () => {
    const matches = matchFilePattern('src/api/users/controller.ts', 'edit', index);

    assert.ok(matches.length > 0, 'Should have matches');
    assert.strictEqual(matches[0].agent.name, 'api-expert');
  });

  it('should filter by event type', () => {
    // openapi.yaml is configured for read and edit, not write
    const writeMatches = matchFilePattern('openapi.yaml', 'write', index);
    assert.strictEqual(writeMatches.length, 0, 'Should not match write event');

    const readMatches = matchFilePattern('openapi.yaml', 'read', index);
    assert.strictEqual(readMatches.length, 1, 'Should match read event');
  });

  it('should return matches sorted by priority', () => {
    // Both security and api-expert might match .env files
    const matches = matchFilePattern('config/.env', 'edit', index);

    if (matches.length > 1) {
      assert.ok(
        matches[0].priority >= matches[1].priority,
        'Should be sorted by priority descending'
      );
    }
  });

  it('should handle paths with leading ./', () => {
    const matches = matchFilePattern('./src/api/test.ts', 'edit', index);

    assert.ok(matches.length > 0, 'Should match with ./ prefix');
  });

  it('should return empty array for non-matching paths', () => {
    const matches = matchFilePattern('README.md', 'read', index);

    assert.strictEqual(matches.length, 0);
  });

  it('should apply minPriority filter', () => {
    const allMatches = matchFilePattern('src/api/test.ts', 'edit', index);
    const highPriorityMatches = matchFilePattern('src/api/test.ts', 'edit', index, {
      minPriority: 12,
    });

    assert.ok(
      highPriorityMatches.length <= allMatches.length,
      'Should filter by minimum priority'
    );
  });

  it('should apply tag filter', () => {
    const matches = matchFilePattern('src/api/test.ts', 'edit', index, {
      tags: ['backend'],
    });

    assert.ok(
      matches.every((m) => m.agent.triggers?.tags?.includes('backend')),
      'All matches should have backend tag'
    );
  });

  it('should apply limit', () => {
    // Create index with many matching agents
    const matches = matchFilePattern('src/api/test.ts', 'edit', index, {
      limit: 1,
    });

    assert.ok(matches.length <= 1, 'Should respect limit');
  });
});

describe('matchKeywords', () => {
  let index: TriggerIndex;

  beforeEach(() => {
    index = buildTriggerIndex(testAgents);
  });

  it('should match simple keywords', () => {
    const matches = matchKeywords('I need help with REST API design', index);

    assert.ok(matches.length > 0, 'Should have matches');
    assert.strictEqual(matches[0].agent.name, 'api-expert');
  });

  it('should match regex patterns', () => {
    const matches = matchKeywords('Please create an API for users', index);

    assert.ok(
      matches.some((m) => m.agent.name === 'api-expert'),
      'Should match regex pattern'
    );
  });

  it('should be case-insensitive for simple keywords', () => {
    const matches = matchKeywords('REACT component help', index);

    assert.ok(
      matches.some((m) => m.agent.name === 'react-expert'),
      'Should match case-insensitively'
    );
  });

  it('should not duplicate agents with multiple keyword matches', () => {
    const matches = matchKeywords(
      'REST API endpoint security vulnerability',
      index
    );

    const agentNames = matches.map((m) => m.agent.name);
    const uniqueNames = [...new Set(agentNames)];

    assert.strictEqual(
      agentNames.length,
      uniqueNames.length,
      'Should not have duplicate agents'
    );
  });

  it('should return matches sorted by priority', () => {
    const matches = matchKeywords('API security check', index);

    if (matches.length > 1) {
      for (let i = 1; i < matches.length; i++) {
        assert.ok(
          matches[i - 1].priority >= matches[i].priority,
          'Should be sorted by priority descending'
        );
      }
    }
  });
});

describe('matchAll', () => {
  let index: TriggerIndex;

  beforeEach(() => {
    index = buildTriggerIndex(testAgents);
  });

  it('should combine file and keyword matches', () => {
    const matches = matchAll(
      'src/api/users.ts',
      'edit',
      'Need help with REST API',
      index
    );

    assert.ok(matches.length > 0, 'Should have matches');
  });

  it('should deduplicate when same agent matches both', () => {
    const matches = matchAll(
      'src/api/users.ts',
      'edit',
      'REST API endpoint',
      index
    );

    const agentNames = matches.map((m) => m.agent.name);
    const uniqueNames = [...new Set(agentNames)];

    assert.strictEqual(
      agentNames.length,
      uniqueNames.length,
      'Should deduplicate agents'
    );
  });

  it('should work with only file path', () => {
    const matches = matchAll('src/api/users.ts', 'edit', null, index);

    assert.ok(matches.length > 0, 'Should match file only');
  });

  it('should work with only prompt', () => {
    const matches = matchAll(null, null, 'Help with React components', index);

    assert.ok(matches.length > 0, 'Should match prompt only');
  });
});

describe('getBestMatch', () => {
  let index: TriggerIndex;

  beforeEach(() => {
    index = buildTriggerIndex(testAgents);
  });

  it('should return single best match', () => {
    const match = getBestMatch('src/api/users.ts', 'edit', index);

    assert.ok(match !== null, 'Should have a match');
    assert.strictEqual(typeof match.agent.name, 'string');
  });

  it('should return null for non-matching paths', () => {
    const match = getBestMatch('package.json', 'read', index);

    assert.strictEqual(match, null);
  });

  it('should return highest priority match', () => {
    // .env files should match security-expert (priority 15)
    const match = getBestMatch('config/.env', 'edit', index);

    if (match) {
      assert.strictEqual(
        match.agent.name,
        'security-expert',
        'Should return highest priority agent'
      );
    }
  });
});

describe('hasTriggers', () => {
  let index: TriggerIndex;

  beforeEach(() => {
    index = buildTriggerIndex(testAgents);
  });

  it('should return true for matching paths', () => {
    assert.ok(hasTriggers('src/api/users.ts', 'edit', index));
  });

  it('should return false for non-matching paths', () => {
    assert.ok(!hasTriggers('package.json', 'read', index));
  });

  it('should consider event type', () => {
    // openapi.yaml is configured for read and edit, not write
    assert.ok(!hasTriggers('openapi.yaml', 'write', index));
    assert.ok(hasTriggers('openapi.yaml', 'read', index));
  });
});

describe('confidence scoring', () => {
  let index: TriggerIndex;

  beforeEach(() => {
    index = buildTriggerIndex(testAgents);
  });

  it('should assign higher confidence to more specific patterns', () => {
    // Create agents with different pattern specificity
    const specificAgent: AgentDefinition = {
      name: 'specific-agent',
      description: 'Specific',
      filePath: '/test/specific.md',
      type: 'domain-expert',
      triggers: {
        files: [
          { pattern: 'src/api/users/controller.ts', on: ['edit'] },
        ],
        priority: 10,
      },
    };

    const broadAgent: AgentDefinition = {
      name: 'broad-agent',
      description: 'Broad',
      filePath: '/test/broad.md',
      type: 'domain-expert',
      triggers: {
        files: [{ pattern: '**/*.ts', on: ['edit'] }],
        priority: 10, // Same priority
      },
    };

    const testIndex = buildTriggerIndex([specificAgent, broadAgent]);
    const matches = matchFilePattern(
      'src/api/users/controller.ts',
      'edit',
      testIndex
    );

    assert.ok(matches.length === 2, 'Should match both');
    // With same priority, more specific pattern should have higher confidence
    assert.ok(
      matches[0].confidence >= matches[1].confidence,
      'Specific pattern should have higher confidence'
    );
  });
});
