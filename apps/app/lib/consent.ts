import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";

const AXEPTIO_DEFERRED_REASON =
  "Deferred: account-level Axeptio project setup and consent taxonomy approval are required before runtime activation.";

export interface ConsentBootstrapStatus {
  provider: "axeptio";
  mode: "disabled" | "deferred-noop";
  configured: boolean;
  runtimeEnabled: false;
  clientId: string | null;
  cookiesVersion: string | null;
  deferredReason: string | null;
}

export function getConsentBootstrapStatus(): ConsentBootstrapStatus {
  const env = getClientRuntimeEnv();
  const flags = getClientFeatureFlags(env);
  const configured = flags.consentConfigured;

  return {
    provider: "axeptio",
    mode: configured ? "deferred-noop" : "disabled",
    configured,
    runtimeEnabled: false,
    clientId: env.axeptioClientId,
    cookiesVersion: env.axeptioCookiesVersion,
    deferredReason: configured ? AXEPTIO_DEFERRED_REASON : null,
  };
}

export function canTrackWithConsent(
  status: ConsentBootstrapStatus = getConsentBootstrapStatus(),
): boolean {
  return status.runtimeEnabled;
}
