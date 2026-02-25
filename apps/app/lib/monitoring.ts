import { captureSentryStubEvent, getSentryBootstrapStatus } from "./sentry";

export type MonitoringEvent =
  | "layout_bootstrap_rendered"
  | "app_shell_rendered"
  | "gated_placeholder_rendered";

export interface MonitoringBootstrapStatus {
  provider: "sentry-deferred";
  mode: "stub";
  configured: boolean;
}

export function getMonitoringBootstrapStatus(): MonitoringBootstrapStatus {
  const sentry = getSentryBootstrapStatus();

  return {
    provider: sentry.provider,
    mode: sentry.mode,
    configured: sentry.dsnConfigured,
  };
}

export function captureArchitectureEvent(
  event: MonitoringEvent,
  attributes: Record<string, string> = {},
): void {
  captureSentryStubEvent(event, attributes);

  if (process.env.NODE_ENV !== "production") {
    console.info(`[monitoring-stub] ${event}`, attributes);
  }
}
