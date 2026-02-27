export function parseOnboardingCompleted(raw: string | null): boolean {
  return raw === "true";
}

export function serializeOnboardingCompleted(completed: boolean): string {
  return completed ? "true" : "false";
}
