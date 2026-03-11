import { logger } from "./logger";
import { createRequestScopedLogger, getOrCreateRequestId } from "./request-id";

export interface RequestLogMetadata {
  method: string;
  path: string;
  requestId: string;
  duration?: number;
  status?: number;
  error?: unknown;
}

export function withRequestLogging<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  options?: { context?: string },
) {
  return async (...args: Parameters<T>): Promise<Response> => {
    const request = args.find((a) => a instanceof Request) as Request | undefined;

    if (!request) {
      return handler(...args);
    }

    const start = Date.now();
    const url = new URL(request.url);
    const headers = Object.fromEntries(request.headers.entries());
    const requestId = getOrCreateRequestId(headers);
    const reqLogger = createRequestScopedLogger(headers, options?.context || "api");

    reqLogger.logger.info(
      {
        method: request.method,
        path: url.pathname,
        requestId,
      },
      `→ ${request.method} ${url.pathname}`,
    );

    try {
      const response = await handler(...args);
      const duration = Date.now() - start;

      reqLogger.logger.info(
        {
          method: request.method,
          path: url.pathname,
          requestId,
          status: response.status,
          duration,
        },
        `← ${request.method} ${url.pathname} - ${response.status} (${duration}ms)`,
      );

      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("x-request-id", requestId);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      const duration = Date.now() - start;

      reqLogger.logger.error(
        {
          method: request.method,
          path: url.pathname,
          requestId,
          duration,
          error:
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack,
                  name: error.name,
                }
              : String(error),
        },
        `✗ ${request.method} ${url.pathname} - Error (${duration}ms)`,
      );

      throw error;
    }
  };
}

export function createApiLogger(headers: Headers | Record<string, string>, context?: string) {
  const requestId = getOrCreateRequestId(headers);
  const reqLogger = createRequestScopedLogger(headers, context || "api");

  return {
    requestId,
    info: (msg: string, data?: Record<string, unknown>) => {
      reqLogger.logger.info({ ...data }, msg);
    },
    error: (msg: string, error?: unknown) => {
      reqLogger.logger.error({ error }, msg);
    },
    warn: (msg: string, data?: Record<string, unknown>) => {
      reqLogger.logger.warn({ ...data }, msg);
    },
    debug: (msg: string, data?: Record<string, unknown>) => {
      reqLogger.logger.debug({ ...data }, msg);
    },
    child: (ctx: Record<string, unknown>) => reqLogger.child(ctx),
  };
}
