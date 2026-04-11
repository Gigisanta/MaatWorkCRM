import { Redis } from '@upstash/redis';

// Initialize Redis client from environment variables
// Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = Redis.fromEnv();

/**
 * Rate limit types with different default limits
 */
export type RateLimitType = 'auth' | 'api-read' | 'api-write';

const RATE_LIMITS: Record<RateLimitType, { limit: number; window: number }> = {
  auth: { limit: 10, window: 60 },      // 10 requests per minute for auth endpoints
  'api-read': { limit: 100, window: 60 }, // 100 requests per minute for read operations
  'api-write': { limit: 30, window: 60 }, // 30 requests per minute for write operations
};

/**
 * Distributed rate limiter using Upstash Redis with sliding window algorithm
 *
 * Uses Redis sorted sets to implement a sliding window rate limiter:
 * - Each request adds a timestamp to a sorted set keyed by identifier
 * - Old timestamps outside the window are removed
 * - Count of remaining timestamps determines if limit is exceeded
 */
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - window * 1000;

  // Lua script for atomic sliding window rate limiting
  // 1. Remove entries older than windowStart
  // 2. Count remaining entries
  // 3. If under limit, add new entry and return allowed
  // 4. If over limit, return denied
  const script = `
    redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1])
    local count = redis.call('ZCARD', KEYS[1])
    if count >= tonumber(ARGV[2]) then
      return {0, count, ARGV[3]}
    end
    redis.call('ZADD', KEYS[1], ARGV[4], ARGV[4])
    redis.call('EXPIRE', KEYS[1], ARGV[2])
    return {1, count + 1, ARGV[3]}
  `;

  const result = await redis.eval(
    script,
    [key],  // KEYS array
    [windowStart.toString(), limit.toString(), (now + window * 1000).toString(), now.toString()]  // ARGV array
  ) as [number, number, number];

  return {
    allowed: result[0] === 1,
    remaining: Math.max(0, limit - result[1]),
    resetAt: now + window * 1000,
  };
}

/**
 * Convenience function for rate limiting by type
 */
export async function rateLimitByType(
  identifier: string,
  type: RateLimitType = 'api-read'
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { limit, window } = RATE_LIMITS[type];
  return rateLimit(identifier, limit, window);
}
