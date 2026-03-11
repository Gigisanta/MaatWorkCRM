export const logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => logger,
};

export const createLogger = () => logger;

export const logRequest = () => {};
export const logError = () => {};
export const logAuth = () => {};
export const logDB = () => {};
