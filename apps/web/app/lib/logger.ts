import fs from "node:fs";
import path from "node:path";
import pino from "pino";

// Asegurarse de que el directorio de logs exista en el root del monorepo
const logDir = path.join(process.cwd(), "../../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, "app.log");

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: {
    targets: [
      {
        target: "pino-pretty", // Imprime en consola en desarrollo (y prod si se desea)
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
      {
        target: "pino/file",
        options: { destination: logFile },
      },
    ],
  },
});
