/**
 * Rate Limiting
 * Phase 5: Authentication & Security
 *
 * In-memory and Redis-backed rate limiting for API protection.
 * Should trigger: security-expert, redis-expert
 */

import { NextRequest, NextResponse } from 'next/server';

// Configuration
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100; // 100 requests per minute

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Prefix for storage keys
  skipFailedRequests?: boolean; // Don't count failed requests
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  message?: string; // Custom error message
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetAt: Date;
  isBlocked: boolean;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

/**
 * Get client identifier from request
 * Uses IP address and optionally user ID
 */
export function getClientIdentifier(request: NextRequest, userId?: string): string {
  // Get IP from headers (works with proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Combine IP with user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  return `ip:${ip}`;
}

/**
 * Check rate limit for a client
 */
export async function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitInfo> {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    keyPrefix = 'ratelimit',
  } = config;

  const fullKey = `${keyPrefix}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  // Get current state
  let state = rateLimitStore.get(fullKey);

  // Reset if window has passed
  if (!state || state.resetAt < now) {
    state = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment counter
  state.count += 1;
  rateLimitStore.set(fullKey, state);

  const remaining = Math.max(0, maxRequests - state.count);
  const isBlocked = state.count > maxRequests;

  return {
    limit: maxRequests,
    current: state.count,
    remaining,
    resetAt: new Date(state.resetAt),
    isBlocked,
  };
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}) {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    message = 'Too many requests, please try again later.',
  } = config;

  return async function rateLimitMiddleware(
    request: NextRequest,
    userId?: string
  ): Promise<{ response: NextResponse | null; info: RateLimitInfo }> {
    const key = getClientIdentifier(request, userId);
    const info = await checkRateLimit(key, { windowMs, maxRequests });

    // Set rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(info.limit));
    headers.set('X-RateLimit-Remaining', String(info.remaining));
    headers.set('X-RateLimit-Reset', String(Math.ceil(info.resetAt.getTime() / 1000)));

    if (info.isBlocked) {
      return {
        response: NextResponse.json(
          { error: message },
          {
            status: 429,
            headers: {
              ...Object.fromEntries(headers),
              'Retry-After': String(Math.ceil((info.resetAt.getTime() - Date.now()) / 1000)),
            },
          }
        ),
        info,
      };
    }

    return { response: null, info };
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  /**
   * General API rate limit
   * 100 requests per minute
   */
  api: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'api',
  }),

  /**
   * Authentication rate limit (stricter)
   * 5 attempts per 15 minutes
   */
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyPrefix: 'auth',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  }),

  /**
   * Password reset rate limit
   * 3 requests per hour
   */
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'pwd-reset',
    message: 'Too many password reset requests. Please try again later.',
  }),

  /**
   * Sensitive actions (e.g., delete account)
   * 3 attempts per hour
   */
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    keyPrefix: 'sensitive',
  }),

  /**
   * File upload rate limit
   * 10 uploads per hour
   */
  upload: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'upload',
    message: 'Upload limit reached. Please try again later.',
  }),

  /**
   * Search/heavy queries rate limit
   * 30 requests per minute
   */
  search: createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'search',
  }),
};

/**
 * Sliding window rate limiter for more accurate limiting
 * Stores timestamps of requests instead of just a counter
 */
export class SlidingWindowRateLimiter {
  private store = new Map<string, number[]>();

  constructor(
    private windowMs: number = DEFAULT_WINDOW_MS,
    private maxRequests: number = DEFAULT_MAX_REQUESTS
  ) {}

  check(key: string): RateLimitInfo {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing timestamps
    let timestamps = this.store.get(key) || [];

    // Remove expired timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    // Add current request
    timestamps.push(now);
    this.store.set(key, timestamps);

    const current = timestamps.length;
    const remaining = Math.max(0, this.maxRequests - current);
    const isBlocked = current > this.maxRequests;

    // Calculate reset time based on oldest timestamp in window
    const oldestInWindow = timestamps[0] || now;
    const resetAt = new Date(oldestInWindow + this.windowMs);

    return {
      limit: this.maxRequests,
      current,
      remaining,
      resetAt,
      isBlocked,
    };
  }

  reset(key: string): void {
    this.store.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.store.entries()) {
      const valid = timestamps.filter((ts) => ts > now - this.windowMs);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
  }
}

/**
 * IP-based blocking for severe violations
 */
const blockedIPs = new Set<string>();
const blockExpirations = new Map<string, number>();

export function blockIP(ip: string, durationMs: number = 24 * 60 * 60 * 1000): void {
  blockedIPs.add(ip);
  blockExpirations.set(ip, Date.now() + durationMs);
}

export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
  blockExpirations.delete(ip);
}

export function isIPBlocked(ip: string): boolean {
  const expiration = blockExpirations.get(ip);

  if (!expiration) {
    return blockedIPs.has(ip);
  }

  if (Date.now() > expiration) {
    unblockIP(ip);
    return false;
  }

  return true;
}
