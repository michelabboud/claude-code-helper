/**
 * Agent file parser - handles both Markdown (YAML frontmatter) and JSON formats
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { AgentDefinition, AgentTriggers, AgentVisual, EventTriggerDef } from './types.js';

/**
 * Parse a single agent file (Markdown or JSON)
 */
export function parseAgentFile(filePath: string): AgentDefinition | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, ext);

    if (ext === '.md') {
      return parseMarkdownAgent(content, filePath, fileName);
    } else if (ext === '.json') {
      return parseJsonAgent(content, filePath, fileName);
    }

    return null;
  } catch (error) {
    console.error(`Error parsing agent file ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse Markdown agent file with YAML frontmatter
 */
function parseMarkdownAgent(
  content: string,
  filePath: string,
  fileName: string
): AgentDefinition | null {
  try {
    const { data } = matter(content);

    if (!data.name && !data.description) {
      return null; // Not a valid agent file
    }

    return {
      name: data.name || fileName,
      description: data.description || '',
      model: data.model,
      tools: data.tools,
      triggers: normalizeTriggers(data.triggers),
      visual: normalizeVisual(data.visual),
      filePath,
      type: 'domain-expert',
    };
  } catch (error) {
    console.error(`Error parsing Markdown agent ${filePath}:`, error);
    return null;
  }
}

/**
 * Parse JSON agent file
 */
function parseJsonAgent(
  content: string,
  filePath: string,
  fileName: string
): AgentDefinition | null {
  try {
    const data = JSON.parse(content);

    if (!data.name && !data.description) {
      return null; // Not a valid agent file
    }

    return {
      name: data.name || fileName,
      description: data.description || '',
      model: data.model,
      tools: data.tools,
      triggers: normalizeTriggers(data.triggers),
      visual: normalizeVisual(data.visual),
      mcp_servers: data.mcp_servers,
      filePath,
      type: 'mcp-integrated',
    };
  } catch (error) {
    console.error(`Error parsing JSON agent ${filePath}:`, error);
    return null;
  }
}

/**
 * Normalize triggers to consistent format
 */
function normalizeTriggers(triggers: unknown): AgentTriggers | undefined {
  if (!triggers || typeof triggers !== 'object') {
    return undefined;
  }

  const t = triggers as Record<string, unknown>;
  const normalized: AgentTriggers = {};

  // Normalize keywords
  if (Array.isArray(t.keywords)) {
    normalized.keywords = t.keywords.map((k) => {
      if (typeof k === 'string') {
        return k;
      }
      if (typeof k === 'object' && k !== null && 'pattern' in k) {
        return {
          pattern: String((k as Record<string, unknown>).pattern),
          case_insensitive: Boolean((k as Record<string, unknown>).case_insensitive),
        };
      }
      return String(k);
    });
  }

  // Normalize file patterns
  if (Array.isArray(t.files)) {
    normalized.files = t.files.map((f) => {
      if (typeof f === 'object' && f !== null) {
        const file = f as Record<string, unknown>;
        return {
          pattern: String(file.pattern || ''),
          on: normalizeFileEvents(file.on),
        };
      }
      // String shorthand - default to all events
      return {
        pattern: String(f),
        on: ['read', 'edit', 'write'] as ('read' | 'edit' | 'write')[],
      };
    }).filter((f) => f.pattern);
  }

  // Normalize event triggers
  if (Array.isArray(t.events)) {
    normalized.events = t.events
      .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
      .map((e) => ({
        type: String(e.type) as EventTriggerDef['type'],
        tool: e.tool as string | string[] | undefined,
        condition: e.condition ? String(e.condition) : undefined,
        files: e.files as string | string[] | undefined,
      }))
      .filter((e) => e.type); // Must have a type
  }

  // Priority
  if (typeof t.priority === 'number') {
    normalized.priority = t.priority;
  }

  // Tags
  if (Array.isArray(t.tags)) {
    normalized.tags = t.tags.map(String);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Normalize file events array
 */
function normalizeFileEvents(events: unknown): ('read' | 'edit' | 'write')[] {
  if (!Array.isArray(events)) {
    return ['read', 'edit', 'write'];
  }

  const validEvents = ['read', 'edit', 'write'] as const;
  return events
    .map((e) => String(e).toLowerCase())
    .filter((e): e is 'read' | 'edit' | 'write' =>
      validEvents.includes(e as typeof validEvents[number])
    );
}

/**
 * Normalize visual configuration
 */
function normalizeVisual(visual: unknown): AgentVisual | undefined {
  if (!visual || typeof visual !== 'object') {
    return undefined;
  }

  const v = visual as Record<string, unknown>;
  const normalized: AgentVisual = {};

  if (v.emoji) normalized.emoji = String(v.emoji);
  if (v.color) normalized.color = String(v.color);
  if (v.label) normalized.label = String(v.label);
  if (v.spinner) normalized.spinner = String(v.spinner);

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

/**
 * Scan a directory for agent files
 */
export function scanAgentDirectory(dirPath: string): AgentDefinition[] {
  const agents: AgentDefinition[] = [];

  try {
    if (!fs.existsSync(dirPath)) {
      return agents;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        agents.push(...scanAgentDirectory(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.md' || ext === '.json') {
          const agent = parseAgentFile(fullPath);
          if (agent) {
            agents.push(agent);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dirPath}:`, error);
  }

  return agents;
}

/**
 * Load agents from standard Claude Code locations
 */
export function loadAllAgents(): AgentDefinition[] {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const agents: AgentDefinition[] = [];

  // Standard agent locations
  const locations = [
    path.join(homeDir, '.claude', 'agents'),
    path.join(process.cwd(), '.claude', 'agents'),
    // Also check repo locations for development
    path.join(process.cwd(), 'agents', 'domain-experts'),
    path.join(process.cwd(), 'agents', 'mcp-integrated'),
  ];

  for (const location of locations) {
    agents.push(...scanAgentDirectory(location));
  }

  // Deduplicate by name (prefer first found)
  const seen = new Set<string>();
  return agents.filter((agent) => {
    if (seen.has(agent.name)) {
      return false;
    }
    seen.add(agent.name);
    return true;
  });
}
