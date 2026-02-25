function readOptionalEnv(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function readBooleanEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export interface ClientRuntimeEnv {
  sentryDsnAppPublic: string | null;
  clerkPublishableKey: string | null;
  plausibleDomain: string | null;
  plausibleScriptSrc: string | null;
  axeptioClientId: string | null;
  axeptioCookiesVersion: string | null;
  analyticsConsentGranted: boolean;
}

export function getClientRuntimeEnv(): ClientRuntimeEnv {
  return {
    sentryDsnAppPublic: readOptionalEnv(process.env.NEXT_PUBLIC_SENTRY_DSN_APP),
    clerkPublishableKey: readOptionalEnv(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    plausibleDomain: readOptionalEnv(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
    plausibleScriptSrc: readOptionalEnv(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC),
    axeptioClientId: readOptionalEnv(process.env.NEXT_PUBLIC_AXEPTIO_CLIENT_ID),
    axeptioCookiesVersion: readOptionalEnv(
      process.env.NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION,
    ),
    analyticsConsentGranted: readBooleanEnv(
      process.env.NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED,
    ),
  };
}

export interface ClientFeatureFlags {
  clerkConfigured: boolean;
  analyticsConfigured: boolean;
  consentConfigured: boolean;
  analyticsConsentGranted: boolean;
}

export function getClientFeatureFlags(
  env: ClientRuntimeEnv = getClientRuntimeEnv(),
): ClientFeatureFlags {
  return {
    clerkConfigured: Boolean(env.clerkPublishableKey),
    analyticsConfigured: Boolean(env.plausibleDomain),
    consentConfigured: Boolean(
      env.axeptioClientId && env.axeptioCookiesVersion,
    ),
    analyticsConsentGranted: env.analyticsConsentGranted,
  };
}
