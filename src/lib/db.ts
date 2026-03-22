import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const SLOW_QUERY_THRESHOLD = 1000 // ms

// Connection pool configuration for Vercel serverless environment
const prismaClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Enhanced query logging for development and slow query detection
prismaClient.$on('query' as any, (e: { timestamp: Date; query: string; params: string; duration: number }) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify({
      level: 'debug',
      msg: 'prisma_query',
      query: e.query,
      duration_ms: e.duration,
      timestamp: e.timestamp
    }))
  }

  if (e.duration > SLOW_QUERY_THRESHOLD) {
    console.warn(JSON.stringify({
      level: 'warn',
      msg: 'slow_query',
      query: e.query,
      duration_ms: e.duration,
      threshold: SLOW_QUERY_THRESHOLD
    }))
  }
})

export const db = prismaClient

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
