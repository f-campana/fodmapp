import { logInfo } from "./logger";
import { captureSentryEvent, getSentryBootstrapStatus } from "./sentry";

export type MonitoringEvent =
  | "layout_bootstrap_rendered"
  | "app_shell_rendered"
  | "gated_placeholder_rendered";

export interface MonitoringBootstrapStatus {
  provider: "sentry";
  mode: "disabled" | "runtime";
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
  captureSentryEvent(event, attributes);

  logInfo(`[monitoring-runtime] ${event}`, attributes);
}
