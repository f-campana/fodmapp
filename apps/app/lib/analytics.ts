import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";

const DEFAULT_PLAUSIBLE_SRC = "https://plausible.io/js/script.js";
const ANALYTICS_RUNTIME_ENABLED = false;

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
  const configured = ANALYTICS_RUNTIME_ENABLED && flags.analyticsConfigured;

  return {
    provider: "plausible",
    mode: configured ? "runtime" : "disabled",
    configured,
    domain: configured ? env.plausibleDomain : null,
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
  if (!ANALYTICS_RUNTIME_ENABLED) {
    return null;
  }

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
  void event;
  void attributes;

  if (!ANALYTICS_RUNTIME_ENABLED) {
    return;
  }

  const status = getAnalyticsBootstrapStatus();

  if (!status.configured) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.plausible === "function") {
    window.plausible(event, { props: attributes });
    return;
  }

  return;
}
