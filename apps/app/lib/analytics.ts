import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";

const DEFAULT_PLAUSIBLE_SRC = "https://plausible.io/js/script.js";

export interface AnalyticsBootstrapStatus {
  provider: "plausible-deferred";
  mode: "stub";
  configured: boolean;
  domain: string | null;
  scriptSrc: string;
}

export function getAnalyticsBootstrapStatus(): AnalyticsBootstrapStatus {
  const env = getClientRuntimeEnv();
  const flags = getClientFeatureFlags(env);

  return {
    provider: "plausible-deferred",
    mode: "stub",
    configured: flags.analyticsConfigured,
    domain: env.plausibleDomain,
    scriptSrc: env.plausibleScriptSrc ?? DEFAULT_PLAUSIBLE_SRC,
  };
}

export function trackAnalyticsEvent(
  event: string,
  attributes: Record<string, string> = {},
): void {
  const status = getAnalyticsBootstrapStatus();

  if (!status.configured) {
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[analytics-stub] ${event}`, attributes);
  }
}
