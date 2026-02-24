import { getClientFeatureFlags, getClientRuntimeEnv } from "./env.client";

export interface ConsentBootstrapStatus {
  provider: "axeptio-deferred";
  mode: "stub";
  configured: boolean;
  clientId: string | null;
  cookiesVersion: string | null;
}

export function getConsentBootstrapStatus(): ConsentBootstrapStatus {
  const env = getClientRuntimeEnv();
  const flags = getClientFeatureFlags(env);

  return {
    provider: "axeptio-deferred",
    mode: "stub",
    configured: flags.consentConfigured,
    clientId: env.axeptioClientId,
    cookiesVersion: env.axeptioCookiesVersion,
  };
}

export function canTrackWithConsent(
  status: ConsentBootstrapStatus = getConsentBootstrapStatus(),
): boolean {
  return status.configured;
}
