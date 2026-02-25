import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";

const AXEPTIO_DEFERRED_REASON =
  "Deferred: account-level Axeptio project setup and consent taxonomy approval are required before runtime activation.";
const CONSENT_OVERRIDE_BLOCKED_REASON =
  "Manual analytics consent override is disabled in production until Axeptio runtime activation.";

export interface ConsentBootstrapStatus {
  provider: "axeptio";
  mode: "disabled" | "deferred-noop" | "manual-opt-in";
  configured: boolean;
  runtimeEnabled: boolean;
  manualOptInRequested: boolean;
  manualOptIn: boolean;
  clientId: string | null;
  cookiesVersion: string | null;
  deferredReason: string | null;
}

export function getConsentBootstrapStatus(): ConsentBootstrapStatus {
  const env = getClientRuntimeEnv();
  const flags = getClientFeatureFlags(env);
  const configured = flags.consentConfigured;
  const manualOptInRequested = flags.analyticsConsentGranted;
  const manualOptIn =
    manualOptInRequested && process.env.NODE_ENV !== "production";
  const blockedInProduction = manualOptInRequested && !manualOptIn;
  const deferredReason = blockedInProduction
    ? CONSENT_OVERRIDE_BLOCKED_REASON
    : configured && !manualOptIn
      ? AXEPTIO_DEFERRED_REASON
      : null;

  return {
    provider: "axeptio",
    mode: manualOptIn
      ? "manual-opt-in"
      : configured
        ? "deferred-noop"
        : "disabled",
    configured,
    runtimeEnabled: manualOptIn,
    manualOptInRequested,
    manualOptIn,
    clientId: env.axeptioClientId,
    cookiesVersion: env.axeptioCookiesVersion,
    deferredReason,
  };
}

export function canTrackWithConsent(
  status: ConsentBootstrapStatus = getConsentBootstrapStatus(),
): boolean {
  return status.runtimeEnabled;
}
