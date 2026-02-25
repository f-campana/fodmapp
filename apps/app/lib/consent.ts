import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";

const AXEPTIO_DEFERRED_REASON =
  "Deferred: account-level Axeptio project setup and consent taxonomy approval are required before runtime activation.";

export interface ConsentBootstrapStatus {
  provider: "axeptio";
  mode: "disabled" | "deferred-noop" | "manual-opt-in";
  configured: boolean;
  runtimeEnabled: boolean;
  manualOptIn: boolean;
  clientId: string | null;
  cookiesVersion: string | null;
  deferredReason: string | null;
}

export function getConsentBootstrapStatus(): ConsentBootstrapStatus {
  const env = getClientRuntimeEnv();
  const flags = getClientFeatureFlags(env);
  const configured = flags.consentConfigured;
  const manualOptIn = flags.analyticsConsentGranted;

  return {
    provider: "axeptio",
    mode: manualOptIn
      ? "manual-opt-in"
      : configured
        ? "deferred-noop"
        : "disabled",
    configured,
    runtimeEnabled: manualOptIn,
    manualOptIn,
    clientId: env.axeptioClientId,
    cookiesVersion: env.axeptioCookiesVersion,
    deferredReason: configured && !manualOptIn ? AXEPTIO_DEFERRED_REASON : null,
  };
}

export function canTrackWithConsent(
  status: ConsentBootstrapStatus = getConsentBootstrapStatus(),
): boolean {
  return status.runtimeEnabled;
}
