/* eslint-disable no-console */
/* This logger is designed to be used in development mode only. In production, it will not log anything to the console. */
type LoggerArg = unknown;

type LoggerArgs = LoggerArg[];

const isProduction = process.env.NODE_ENV === "production";

function logIfEnabled(
  logFn: (...args: LoggerArgs) => void,
  args: LoggerArgs,
): void {
  if (isProduction) {
    return;
  }

  logFn(...args);
}

export function logDebug(...args: LoggerArgs): void {
  logIfEnabled(console.debug, args);
}

export function logInfo(...args: LoggerArgs): void {
  logIfEnabled(console.info, args);
}

export function logWarn(...args: LoggerArgs): void {
  logIfEnabled(console.warn, args);
}

export function logError(...args: LoggerArgs): void {
  logIfEnabled(console.error, args);
}
