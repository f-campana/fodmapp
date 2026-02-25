import { getServerFeatureFlags, getServerRuntimeEnv } from "./env.server";

export interface SentryBootstrapStatus {
  provider: "sentry-deferred";
  mode: "stub";
  dsnConfigured: boolean;
  nodeEnv: string;
}

export function getSentryBootstrapStatus(): SentryBootstrapStatus {
  const env = getServerRuntimeEnv();
  const flags = getServerFeatureFlags(env);

  return {
    provider: "sentry-deferred",
    mode: "stub",
    dsnConfigured: flags.sentryConfigured,
    nodeEnv: env.nodeEnv,
  };
}

export function initializeSentryBootstrap(): SentryBootstrapStatus {
  const status = getSentryBootstrapStatus();

  if (process.env.NODE_ENV !== "production") {
    console.info("[sentry-stub] initialized", status);
  }

  return status;
}

export function captureSentryStubEvent(
  event: string,
  attributes: Record<string, string> = {},
): void {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[sentry-stub] ${event}`, attributes);
  }
}
