export type MonitoringEvent = "app_shell_rendered" | "gated_placeholder_rendered";

export function captureArchitectureEvent(
  event: MonitoringEvent,
  attributes: Record<string, string> = {},
): void {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[monitoring-stub] ${event}`, attributes);
  }
}
