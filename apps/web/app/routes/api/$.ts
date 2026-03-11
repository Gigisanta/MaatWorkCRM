import { createFileRoute } from "@tanstack/react-router";
import { logError } from "~/lib/logger";
import { createRequestScopedLogger, getOrCreateRequestId } from "~/lib/request-id";

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return handleApiRequest(request, "GET");
      },
      POST: async ({ request }: { request: Request }) => {
        return handleApiRequest(request, "POST");
      },
      PUT: async ({ request }: { request: Request }) => {
        return handleApiRequest(request, "PUT");
      },
      PATCH: async ({ request }: { request: Request }) => {
        return handleApiRequest(request, "PATCH");
      },
      DELETE: async ({ request }: { request: Request }) => {
        return handleApiRequest(request, "DELETE");
      },
    },
  },
});

async function handleApiRequest(request: Request, method: string): Promise<Response> {
  const start = Date.now();
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const requestId = getOrCreateRequestId(headers);
  const reqLogger = createRequestScopedLogger(headers, "api");

  reqLogger.logger.info(
    {
      method,
      path: url.pathname,
      requestId,
    },
    `${method} ${url.pathname}`,
  );

  reqLogger.logger.debug(
    {
      headers: {
        "content-type": request.headers.get("content-type"),
        authorization: request.headers.get("authorization") ? "[REDACTED]" : undefined,
      },
    },
    "Request headers",
  );

  const duration = Date.now() - start;

  reqLogger.logger.warn(
    {
      method,
      path: url.pathname,
      requestId,
      duration,
    },
    `${method} ${url.pathname} - 404 Not Found (${duration}ms)`,
  );

  return new Response(
    JSON.stringify({
      error: "Not Found",
      path: url.pathname,
      method,
      requestId,
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    },
  );
}
