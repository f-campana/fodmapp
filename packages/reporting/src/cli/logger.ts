type LoggerArg = unknown;
type LoggerArgs = LoggerArg[];

function formatLine(parts: LoggerArgs): string {
  return parts
    .map((part) =>
      typeof part === "string" ? part : (JSON.stringify(part) ?? String(part)),
    )
    .join(" ");
}

function writeLine(stream: NodeJS.WritableStream, parts: LoggerArgs): void {
  stream.write(`${formatLine(parts)}\n`);
}

export function logInfo(...args: LoggerArgs): void {
  writeLine(process.stdout, args);
}

export function logError(...args: LoggerArgs): void {
  writeLine(process.stderr, args);
}
