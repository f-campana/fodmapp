export function formatDateTimeLocalValue(value: Date): string {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function formatUtcIsoForDateTimeLocal(value: string): string {
  return formatDateTimeLocalValue(new Date(value));
}

export function nowDateInputValue(now: Date = new Date()): string {
  return formatDateTimeLocalValue(now);
}
