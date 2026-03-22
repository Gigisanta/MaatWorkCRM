const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100;

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, path?: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    // Log rate limit violations
    console.log(JSON.stringify({
      level: 'warn',
      msg: 'rate_limit_exceeded',
      ip,
      path: path || 'unknown',
      remaining: 0,
      limit: MAX_REQUESTS_PER_WINDOW
    }))
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetAt: record.resetAt };
}
