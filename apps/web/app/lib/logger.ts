import fs from "node:fs";
import path from "node:path";
import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";
const isTest = process.env.NODE_ENV === "test";

const logDir = path.join(process.cwd(), "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, "app.log");

const transport =
  isDevelopment && !isTest
    ? {
        targets: [
          {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          },
        ],
      }
    : undefined;

const baseConfig = {
  level: isDevelopment ? "debug" : "info",
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
};

export const logger = isTest
  ? pino({ ...baseConfig, level: "silent" })
  : pino(transport ? { ...baseConfig, transport } : baseConfig);

export function createLogger(context: string) {
  return logger.child({ context });
}

export const logRequest = (req: { method: string; url: string; headers: Record<string, string> }) => {
  logger.debug(
    {
      method: req.method,
      url: req.url,
      requestId: req.headers["x-request-id"] || "unknown",
    },
    "Incoming request",
  );
};

export const logError = (error: Error | unknown, context?: string) => {
  const err =
    error instanceof Error
      ? { message: error.message, stack: error.stack, name: error.name }
      : { message: String(error) };

  logger.error({ ...err, context }, "Error occurred");
};

export const logAuth = (action: string, data?: Record<string, unknown>) => {
  logger.info({ action, ...data }, "Auth action");
};

export const logDB = (operation: string, data?: Record<string, unknown>) => {
  logger.debug({ operation, ...data }, "Database operation");
};
