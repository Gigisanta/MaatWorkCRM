import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Cache helper with TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
  try {
    await getRedis().set(key, JSON.stringify(value), { ex: ttlSeconds });
  } catch {
    // Silently fail - cache is optional
  }
}
