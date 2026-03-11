import { randomUUID } from "node:crypto";
import { createLogger, logger } from "./logger";

export const REQUEST_ID_HEADER = "x-request-id";
export const CORRELATION_ID_HEADER = "x-correlation-id";

export function generateRequestId(): string {
  return randomUUID();
}

export function getRequestId(headers: Headers | Record<string, string>): string | undefined {
  const h = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
  return h[REQUEST_ID_HEADER] || h[CORRELATION_ID_HEADER];
}

export function getOrCreateRequestId(headers: Headers | Record<string, string>): string {
  const existingId = getRequestId(headers);
  if (existingId) return existingId;
  return generateRequestId();
}

export function createRequestScopedLogger(headers: Headers | Record<string, string>, context?: string) {
  const requestId = getOrCreateRequestId(headers);
  const scopedLogger = createLogger(context || "request");

  return {
    requestId,
    logger: scopedLogger.child({ requestId }),
    child: (ctx: Record<string, unknown>) => scopedLogger.child({ requestId, ...ctx }),
  };
}

export function createRequestLogger(requestId: string, context?: string) {
  const baseLogger = createLogger(context || "request");

  return {
    requestId,
    context,
    info: (msg: string, data?: Record<string, unknown>) => baseLogger.info({ requestId, ...data }, msg),
    error: (msg: string, error?: unknown) => {
      const err =
        error instanceof Error
          ? { message: error.message, stack: error.stack, name: error.name }
          : { message: String(error) };
      baseLogger.error({ requestId, ...err }, msg);
    },
    warn: (msg: string, data?: Record<string, unknown>) => baseLogger.warn({ requestId, ...data }, msg),
    debug: (msg: string, data?: Record<string, unknown>) => baseLogger.debug({ requestId, ...data }, msg),
  };
}
