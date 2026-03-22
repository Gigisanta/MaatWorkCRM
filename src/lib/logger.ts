// Logger estructurado con niveles configurables
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const ENABLE_CONSOLE = process.env.LOG_ENABLE_CONSOLE !== 'false'

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4
}

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL as LogLevel] || ENABLE_CONSOLE
}

// Contexto de request para inyección de metadata
interface RequestContext {
  requestId?: string
  userId?: string
  orgId?: string
}

let requestContext: RequestContext = {}

export function setRequestContext(ctx: RequestContext) {
  requestContext = { ...requestContext, ...ctx }
}

export function clearRequestContext() {
  requestContext = {}
}

function formatLog(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  return JSON.stringify({
    level,
    msg,
    timestamp: new Date().toISOString(),
    requestId: requestContext.requestId,
    userId: requestContext.userId,
    orgId: requestContext.orgId,
    ...meta
  })
}

const logger = {
  debug: (meta: Record<string, unknown>, msg: string) => {
    if (shouldLog('debug')) {
      console.log(formatLog('debug', msg, meta))
    }
  },
  info: (meta: Record<string, unknown>, msg: string) => {
    if (shouldLog('info')) {
      console.log(formatLog('info', msg, meta))
    }
  },
  warn: (meta: Record<string, unknown>, msg: string) => {
    if (shouldLog('warn')) {
      console.warn(formatLog('warn', msg, meta))
    }
  },
  error: (meta: Record<string, unknown>, msg: string) => {
    if (shouldLog('error')) {
      // Extraer err para manejo especial
      const { err, ...rest } = meta
      if (err instanceof Error) {
        console.error(formatLog('error', msg, {
          ...rest,
          error: err.message,
          stack: err.stack
        }))
      } else {
        console.error(formatLog('error', msg, meta))
      }
    }
  },
  fatal: (meta: Record<string, unknown>, msg: string) => {
    console.error(formatLog('fatal', msg, meta))
  }
}

export default logger
