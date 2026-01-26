/**
 * Redis Cache Client
 * Phase 9: Performance & Optimization
 *
 * Redis connection and basic operations.
 * Should trigger: redis-expert, performance-optimizer
 */

// Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = 60 * 60; // 1 hour in seconds
const KEY_PREFIX = 'taskmanager:';

// In-memory fallback for development (when Redis is not available)
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

// Cache statistics
let stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
};

/**
 * Redis-like interface for memory fallback
 */
class MemoryRedis {
  async get(key: string): Promise<string | null> {
    const entry = memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : 0;
    memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<number> {
    return memoryCache.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const entry = memoryCache.get(key);
    if (!entry) return 0;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryCache.delete(key);
      return 0;
    }
    return 1;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    const matchingKeys: string[] = [];
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        matchingKeys.push(key);
      }
    }
    return matchingKeys;
  }

  async flushdb(): Promise<void> {
    memoryCache.clear();
  }

  async ttl(key: string): Promise<number> {
    const entry = memoryCache.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

// Use memory cache (in production, replace with actual Redis client like ioredis)
const client = new MemoryRedis();

/**
 * Get the full cache key with prefix
 */
function getKey(key: string): string {
  return `${KEY_PREFIX}${key}`;
}

/**
 * Get a value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  try {
    const fullKey = getKey(key);
    const value = await client.get(fullKey);

    if (value === null) {
      stats.misses++;
      return null;
    }

    stats.hits++;
    return JSON.parse(value) as T;
  } catch (error) {
    stats.errors++;
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in cache
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    const fullKey = getKey(key);
    const serialized = JSON.stringify(value);

    await client.set(fullKey, serialized, { EX: ttlSeconds });
    stats.sets++;
    return true;
  } catch (error) {
    stats.errors++;
    console.error(`Cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete a value from cache
 */
export async function del(key: string): Promise<boolean> {
  try {
    const fullKey = getKey(key);
    const result = await client.del(fullKey);
    stats.deletes++;
    return result > 0;
  } catch (error) {
    stats.errors++;
    console.error(`Cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function delPattern(pattern: string): Promise<number> {
  try {
    const fullPattern = getKey(pattern);
    const keys = await client.keys(fullPattern);

    let deleted = 0;
    for (const key of keys) {
      await client.del(key);
      deleted++;
    }

    stats.deletes += deleted;
    return deleted;
  } catch (error) {
    stats.errors++;
    console.error(`Cache delete pattern error for ${pattern}:`, error);
    return 0;
  }
}

/**
 * Check if a key exists
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const fullKey = getKey(key);
    const result = await client.exists(fullKey);
    return result > 0;
  } catch (error) {
    stats.errors++;
    console.error(`Cache exists error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get time-to-live for a key
 */
export async function ttl(key: string): Promise<number> {
  try {
    const fullKey = getKey(key);
    return await client.ttl(fullKey);
  } catch (error) {
    stats.errors++;
    console.error(`Cache TTL error for key ${key}:`, error);
    return -2;
  }
}

/**
 * Get or set a value (cache-aside pattern)
 */
export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  // Try to get from cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const value = await fetchFn();

  // Store in cache (don't await to not block)
  set(key, value, ttlSeconds).catch(() => {});

  return value;
}

/**
 * Refresh a key's TTL
 */
export async function touch(key: string, ttlSeconds: number = DEFAULT_TTL): Promise<boolean> {
  try {
    const fullKey = getKey(key);
    const value = await client.get(fullKey);

    if (value === null) {
      return false;
    }

    await client.set(fullKey, value, { EX: ttlSeconds });
    return true;
  } catch (error) {
    stats.errors++;
    console.error(`Cache touch error for key ${key}:`, error);
    return false;
  }
}

/**
 * Clear all cache
 */
export async function flush(): Promise<boolean> {
  try {
    await client.flushdb();
    return true;
  } catch (error) {
    stats.errors++;
    console.error('Cache flush error:', error);
    return false;
  }
}

/**
 * Get cache statistics
 */
export function getStats(): typeof stats & { hitRate: number } {
  const total = stats.hits + stats.misses;
  const hitRate = total > 0 ? stats.hits / total : 0;

  return {
    ...stats,
    hitRate,
  };
}

/**
 * Reset cache statistics
 */
export function resetStats(): void {
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };
}

// Cache key generators for common entities
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  project: (id: string) => `project:${id}`,
  projectTasks: (projectId: string) => `project:${projectId}:tasks`,
  projectMembers: (projectId: string) => `project:${projectId}:members`,
  task: (id: string) => `task:${id}`,
  taskComments: (taskId: string) => `task:${taskId}:comments`,
  team: (id: string) => `team:${id}`,
  teamMembers: (teamId: string) => `team:${teamId}:members`,
  teamProjects: (teamId: string) => `team:${teamId}:projects`,
  session: (userId: string, sessionId: string) => `session:${userId}:${sessionId}`,
};

// Export client for direct access if needed
export { client };
