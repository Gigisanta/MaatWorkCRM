import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const SLOW_QUERY_THRESHOLD = 1000 // ms

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  datasources: { db: { url: process.env.DATABASE_URL } },
})

// Always assign to global in serverless
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL === '1') {
  globalForPrisma.prisma = db
}

// Enhanced query logging for development only (includes slow query detection)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (process.env.NODE_ENV === 'development') {
  (db as any).$on('query', (e: unknown) => {
    const event = e as { timestamp: Date; query: string; params: string; duration: number };
    console.log(JSON.stringify({
      level: 'debug',
      msg: 'prisma_query',
      query: event.query,
      duration_ms: event.duration,
      timestamp: event.timestamp
    }))

    if (event.duration > SLOW_QUERY_THRESHOLD) {
      console.warn(JSON.stringify({
        level: 'warn',
        msg: 'slow_query',
        query: event.query,
        duration_ms: event.duration,
        threshold: SLOW_QUERY_THRESHOLD
      }))
    }
  })
}
