import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";
import { logDebug } from "./logger";

const DEFAULT_PLAUSIBLE_SRC = "https://plausible.io/js/script.js";

export interface AnalyticsBootstrapStatus {
  provider: "plausible";
  mode: "disabled" | "runtime";
  configured: boolean;
  domain: string | null;
  scriptSrc: string;
}

export function getAnalyticsBootstrapStatus(): AnalyticsBootstrapStatus {
  const env = getClientRuntimeEnv();
  const flags = getClientFeatureFlags(env);

  return {
    provider: "plausible",
    mode: flags.analyticsConfigured ? "runtime" : "disabled",
    configured: flags.analyticsConfigured,
    domain: env.plausibleDomain,
    scriptSrc: env.plausibleScriptSrc ?? DEFAULT_PLAUSIBLE_SRC,
  };
}

export interface PlausibleScriptConfig {
  domain: string;
  src: string;
}

export function getPlausibleScriptConfig(
  status: AnalyticsBootstrapStatus = getAnalyticsBootstrapStatus(),
): PlausibleScriptConfig | null {
  if (!status.configured || !status.domain) {
    return null;
  }

  return {
    domain: status.domain,
    src: status.scriptSrc,
  };
}

type PlausibleEventFn = (
  event: string,
  options?: {
    props?: Record<string, string>;
  },
) => void;

declare global {
  interface Window {
    plausible?: PlausibleEventFn;
  }
}

export function trackAnalyticsEvent(
  event: string,
  attributes: Record<string, string> = {},
): void {
  const status = getAnalyticsBootstrapStatus();

  if (!status.configured) {
    return;
  }

  if (typeof window === "undefined") {
    logDebug("[analytics-runtime] skipped server event", event, attributes);
    return;
  }

  if (typeof window.plausible === "function") {
    window.plausible(event, { props: attributes });
    return;
  }

  logDebug(
    "[analytics-runtime] plausible queue unavailable",
    event,
    attributes,
  );
}
