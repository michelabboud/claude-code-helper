/**
 * Trigger Matcher - matches file paths against agent trigger patterns
 */

import { minimatch } from 'minimatch';
import type {
  AgentDefinition,
  FileEvent,
  TriggerMatch,
  MatchOptions,
  TriggerIndex,
  KeywordPattern,
} from './types.js';

/**
 * Build a trigger index from agent definitions for fast lookups
 */
export function buildTriggerIndex(agents: AgentDefinition[]): TriggerIndex {
  const keywords = new Map<string, AgentDefinition[]>();
  const filePatterns = new Map<
    string,
    { agent: AgentDefinition; events: FileEvent[] }[]
  >();

  for (const agent of agents) {
    if (!agent.triggers) continue;

    // Index keywords
    if (agent.triggers.keywords) {
      for (const keyword of agent.triggers.keywords) {
        const key =
          typeof keyword === 'string'
            ? keyword.toLowerCase()
            : keyword.pattern.toLowerCase();

        if (!keywords.has(key)) {
          keywords.set(key, []);
        }
        keywords.get(key)!.push(agent);
      }
    }

    // Index file patterns
    if (agent.triggers.files) {
      for (const filePattern of agent.triggers.files) {
        const pattern = filePattern.pattern;
        if (!filePatterns.has(pattern)) {
          filePatterns.set(pattern, []);
        }
        filePatterns.get(pattern)!.push({
          agent,
          events: filePattern.on,
        });
      }
    }
  }

  return {
    keywords,
    filePatterns,
    agents,
    indexedAt: new Date(),
  };
}

/**
 * Match a file path against agent triggers
 */
export function matchFilePattern(
  filePath: string,
  event: FileEvent,
  index: TriggerIndex,
  options: MatchOptions = {}
): TriggerMatch[] {
  const matches: TriggerMatch[] = [];
  const { minPriority = 0, limit, tags } = options;

  // Normalize file path for matching
  const normalizedPath = normalizePath(filePath);

  // Check each file pattern in the index
  for (const [pattern, entries] of index.filePatterns) {
    // Test if path matches pattern
    if (matchGlob(normalizedPath, pattern)) {
      for (const { agent, events } of entries) {
        // Check if event type matches
        if (!events.includes(event)) {
          continue;
        }

        // Check priority threshold
        const priority = agent.triggers?.priority ?? 10;
        if (priority < minPriority) {
          continue;
        }

        // Check tag filter
        if (tags && tags.length > 0) {
          const agentTags = agent.triggers?.tags ?? [];
          if (!tags.some((t) => agentTags.includes(t))) {
            continue;
          }
        }

        matches.push({
          agent,
          matchType: 'file',
          matchedPattern: pattern,
          matchedValue: normalizedPath,
          priority,
          confidence: calculateFileMatchConfidence(normalizedPath, pattern),
        });
      }
    }
  }

  // Sort by priority (descending) then confidence (descending)
  matches.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.confidence - a.confidence;
  });

  // Apply limit
  if (limit && matches.length > limit) {
    return matches.slice(0, limit);
  }

  return matches;
}

/**
 * Match a prompt against keyword triggers
 */
export function matchKeywords(
  prompt: string,
  index: TriggerIndex,
  options: MatchOptions = {}
): TriggerMatch[] {
  const matches: TriggerMatch[] = [];
  const { minPriority = 0, limit, tags } = options;
  const normalizedPrompt = prompt.toLowerCase();

  // Track which agents have already matched to avoid duplicates
  const matchedAgents = new Set<string>();

  for (const agent of index.agents) {
    if (!agent.triggers?.keywords) continue;

    // Check priority threshold
    const priority = agent.triggers.priority ?? 10;
    if (priority < minPriority) continue;

    // Check tag filter
    if (tags && tags.length > 0) {
      const agentTags = agent.triggers.tags ?? [];
      if (!tags.some((t) => agentTags.includes(t))) {
        continue;
      }
    }

    for (const keyword of agent.triggers.keywords) {
      if (matchedAgents.has(agent.name)) break;

      const match = matchKeyword(normalizedPrompt, keyword);
      if (match) {
        matchedAgents.add(agent.name);
        matches.push({
          agent,
          matchType: 'keyword',
          matchedPattern: typeof keyword === 'string' ? keyword : keyword.pattern,
          matchedValue: match,
          priority,
          confidence: calculateKeywordConfidence(prompt, match),
        });
      }
    }
  }

  // Sort by priority (descending) then confidence (descending)
  matches.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.confidence - a.confidence;
  });

  // Apply limit
  if (limit && matches.length > limit) {
    return matches.slice(0, limit);
  }

  return matches;
}

/**
 * Match both file patterns and keywords
 */
export function matchAll(
  filePath: string | null,
  event: FileEvent | null,
  prompt: string | null,
  index: TriggerIndex,
  options: MatchOptions = {}
): TriggerMatch[] {
  const allMatches: TriggerMatch[] = [];

  if (filePath && event) {
    allMatches.push(...matchFilePattern(filePath, event, index, options));
  }

  if (prompt) {
    allMatches.push(...matchKeywords(prompt, index, options));
  }

  // Deduplicate by agent name, keeping highest priority match
  const seen = new Map<string, TriggerMatch>();
  for (const match of allMatches) {
    const existing = seen.get(match.agent.name);
    if (!existing || match.priority > existing.priority) {
      seen.set(match.agent.name, match);
    }
  }

  const deduplicated = Array.from(seen.values());

  // Sort by priority (descending) then confidence (descending)
  deduplicated.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.confidence - a.confidence;
  });

  // Apply limit
  const { limit } = options;
  if (limit && deduplicated.length > limit) {
    return deduplicated.slice(0, limit);
  }

  return deduplicated;
}

/**
 * Normalize file path for consistent matching
 */
function normalizePath(filePath: string): string {
  // Remove leading ./ if present
  let normalized = filePath.replace(/^\.\//, '');

  // Convert backslashes to forward slashes (Windows compatibility)
  normalized = normalized.replace(/\\/g, '/');

  // Remove leading slash for relative matching
  normalized = normalized.replace(/^\//, '');

  return normalized;
}

/**
 * Match a path against a glob pattern
 */
function matchGlob(filePath: string, pattern: string): boolean {
  // Handle negation patterns
  if (pattern.startsWith('!')) {
    return !minimatch(filePath, pattern.slice(1), {
      dot: true,
      matchBase: true,
    });
  }

  return minimatch(filePath, pattern, {
    dot: true,
    matchBase: true,
  });
}

/**
 * Match a keyword against prompt text
 */
function matchKeyword(
  normalizedPrompt: string,
  keyword: string | KeywordPattern
): string | null {
  if (typeof keyword === 'string') {
    // Simple substring match
    const keywordLower = keyword.toLowerCase();
    if (normalizedPrompt.includes(keywordLower)) {
      return keyword;
    }
    return null;
  }

  // Regex pattern match
  try {
    const flags = keyword.case_insensitive ? 'gi' : 'g';
    const regex = new RegExp(keyword.pattern, flags);
    const match = normalizedPrompt.match(regex);
    if (match) {
      return match[0];
    }
  } catch (error) {
    console.error(`Invalid regex pattern: ${keyword.pattern}`, error);
  }

  return null;
}

/**
 * Calculate confidence score for file pattern match (0-1)
 */
function calculateFileMatchConfidence(filePath: string, pattern: string): number {
  // More specific patterns get higher confidence
  const specificity = pattern.split('/').length;
  const hasDoubleWildcard = pattern.includes('**');

  let confidence = 0.5;

  // More path segments = more specific = higher confidence
  confidence += Math.min(specificity * 0.1, 0.3);

  // Exact filename match (no wildcards in filename)
  const filename = pattern.split('/').pop() || '';
  if (!filename.includes('*')) {
    confidence += 0.2;
  }

  // Penalize very broad patterns
  if (hasDoubleWildcard) {
    confidence -= 0.1;
  }
  if (pattern === '**/*' || pattern === '*') {
    confidence = 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Calculate confidence score for keyword match (0-1)
 */
function calculateKeywordConfidence(prompt: string, matchedKeyword: string): number {
  const promptLength = prompt.length;
  const keywordLength = matchedKeyword.length;

  // Longer keyword matches relative to prompt = higher confidence
  const lengthRatio = keywordLength / promptLength;

  // Base confidence
  let confidence = 0.5;

  // Longer matches are more confident
  confidence += Math.min(lengthRatio * 0.3, 0.3);

  // Exact word boundaries increase confidence
  const wordBoundaryRegex = new RegExp(
    `\\b${escapeRegex(matchedKeyword)}\\b`,
    'i'
  );
  if (wordBoundaryRegex.test(prompt)) {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get the best matching agent for a file operation
 */
export function getBestMatch(
  filePath: string,
  event: FileEvent,
  index: TriggerIndex
): TriggerMatch | null {
  const matches = matchFilePattern(filePath, event, index, { limit: 1 });
  return matches[0] || null;
}

/**
 * Check if any triggers would match for a given file
 */
export function hasTriggers(
  filePath: string,
  event: FileEvent,
  index: TriggerIndex
): boolean {
  return matchFilePattern(filePath, event, index, { limit: 1 }).length > 0;
}
