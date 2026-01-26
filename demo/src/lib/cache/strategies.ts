/**
 * Cache Strategies
 * Phase 9: Performance & Optimization
 *
 * Advanced caching patterns for optimal performance.
 * Should trigger: performance-optimizer, redis-expert
 */

import * as redis from './redis';

// TTL configurations for different data types
export const TTL = {
  SHORT: 60, // 1 minute - frequently changing data
  MEDIUM: 300, // 5 minutes - moderate change rate
  LONG: 3600, // 1 hour - slowly changing data
  DAY: 86400, // 24 hours - rarely changing data
  WEEK: 604800, // 7 days - almost static data
} as const;

/**
 * Cache-aside pattern with automatic refresh
 * Fetches from cache, falls back to source, and updates cache
 */
export async function cacheAside<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    forceRefresh?: boolean;
  } = {}
): Promise<T> {
  const { ttl = TTL.MEDIUM, forceRefresh = false } = options;

  // Force refresh bypasses cache
  if (!forceRefresh) {
    const cached = await redis.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await redis.set(key, data, ttl);

  return data;
}

/**
 * Write-through pattern
 * Writes to cache and source simultaneously
 */
export async function writeThrough<T>(
  key: string,
  data: T,
  writeFn: (data: T) => Promise<void>,
  ttl: number = TTL.MEDIUM
): Promise<T> {
  // Write to source
  await writeFn(data);

  // Update cache
  await redis.set(key, data, ttl);

  return data;
}

/**
 * Write-behind pattern (async write)
 * Writes to cache immediately, queues source write
 */
const writeQueue: Array<{ fn: () => Promise<void>; retries: number }> = [];
let isProcessingQueue = false;

export async function writeBehind<T>(
  key: string,
  data: T,
  writeFn: (data: T) => Promise<void>,
  ttl: number = TTL.MEDIUM
): Promise<T> {
  // Write to cache immediately
  await redis.set(key, data, ttl);

  // Queue source write
  writeQueue.push({
    fn: () => writeFn(data),
    retries: 3,
  });

  // Process queue
  processWriteQueue();

  return data;
}

async function processWriteQueue(): Promise<void> {
  if (isProcessingQueue || writeQueue.length === 0) return;

  isProcessingQueue = true;

  while (writeQueue.length > 0) {
    const item = writeQueue.shift()!;

    try {
      await item.fn();
    } catch (error) {
      if (item.retries > 0) {
        writeQueue.push({ ...item, retries: item.retries - 1 });
      } else {
        console.error('Write-behind failed after retries:', error);
      }
    }
  }

  isProcessingQueue = false;
}

/**
 * Read-through pattern with stale-while-revalidate
 * Returns stale data while refreshing in background
 */
export async function staleWhileRevalidate<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    ttl?: number;
    staleTtl?: number;
  } = {}
): Promise<T> {
  const { ttl = TTL.MEDIUM, staleTtl = TTL.LONG } = options;
  const staleKey = `${key}:stale`;

  // Check fresh cache first
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Check stale cache
  const stale = await redis.get<T>(staleKey);

  // Trigger background refresh
  const refreshPromise = fetchFn().then(async (data) => {
    await Promise.all([
      redis.set(key, data, ttl),
      redis.set(staleKey, data, staleTtl),
    ]);
    return data;
  });

  // If we have stale data, return it immediately
  if (stale !== null) {
    // Don't await the refresh
    refreshPromise.catch(console.error);
    return stale;
  }

  // No cached data at all, must wait for fetch
  return refreshPromise;
}

/**
 * Cache warming - preload frequently accessed data
 */
export async function warmCache<T>(
  items: Array<{
    key: string;
    fetchFn: () => Promise<T>;
    ttl?: number;
  }>
): Promise<void> {
  const promises = items.map(async ({ key, fetchFn, ttl = TTL.MEDIUM }) => {
    try {
      const data = await fetchFn();
      await redis.set(key, data, ttl);
    } catch (error) {
      console.error(`Cache warming failed for ${key}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Invalidation strategies
 */
export const invalidate = {
  /**
   * Invalidate a single key
   */
  key: async (key: string): Promise<boolean> => {
    return redis.del(key);
  },

  /**
   * Invalidate all keys matching a pattern
   */
  pattern: async (pattern: string): Promise<number> => {
    return redis.delPattern(pattern);
  },

  /**
   * Invalidate all keys for an entity
   */
  entity: async (entityType: string, entityId: string): Promise<number> => {
    return redis.delPattern(`${entityType}:${entityId}*`);
  },

  /**
   * Invalidate all keys for a user
   */
  user: async (userId: string): Promise<number> => {
    const patterns = [
      `user:${userId}*`,
      `session:${userId}*`,
    ];

    let total = 0;
    for (const pattern of patterns) {
      total += await redis.delPattern(pattern);
    }
    return total;
  },

  /**
   * Invalidate all keys for a project
   */
  project: async (projectId: string): Promise<number> => {
    const patterns = [
      `project:${projectId}*`,
      `*:${projectId}:*`,
    ];

    let total = 0;
    for (const pattern of patterns) {
      total += await redis.delPattern(pattern);
    }
    return total;
  },

  /**
   * Invalidate all keys for a team
   */
  team: async (teamId: string): Promise<number> => {
    const patterns = [
      `team:${teamId}*`,
    ];

    let total = 0;
    for (const pattern of patterns) {
      total += await redis.delPattern(pattern);
    }
    return total;
  },
};

/**
 * Batch caching operations
 */
export async function batchGet<T>(keys: string[]): Promise<Map<string, T>> {
  const results = new Map<string, T>();

  const promises = keys.map(async (key) => {
    const value = await redis.get<T>(key);
    if (value !== null) {
      results.set(key, value);
    }
  });

  await Promise.all(promises);
  return results;
}

export async function batchSet<T>(
  items: Array<{ key: string; value: T; ttl?: number }>
): Promise<void> {
  const promises = items.map(({ key, value, ttl = TTL.MEDIUM }) =>
    redis.set(key, value, ttl)
  );

  await Promise.all(promises);
}

/**
 * Cache decorator for class methods
 */
export function cached(
  keyGenerator: (...args: any[]) => string,
  options: { ttl?: number } = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      return cacheAside(key, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

/**
 * Rate limiting with cache
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const cacheKey = `ratelimit:${key}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Get existing counts
  let counts = await redis.get<number[]>(cacheKey) || [];

  // Filter to current window
  counts = counts.filter((timestamp) => timestamp > windowStart);

  const allowed = counts.length < limit;
  const remaining = Math.max(0, limit - counts.length - (allowed ? 1 : 0));

  if (allowed) {
    counts.push(now);
    await redis.set(cacheKey, counts, windowSeconds);
  }

  const oldestInWindow = counts[0] || now;
  const resetAt = new Date(oldestInWindow + windowSeconds * 1000);

  return { allowed, remaining, resetAt };
}
