/* eslint-disable no-console */
/* This logger is designed to be used in development mode only. In production, it will not log anything to the console. */
export function logError(...args) {
  console.error(...args);
}

export function logWarn(...args) {
  console.warn(...args);
}

export function logInfo(...args) {
  console.info(...args);
}
