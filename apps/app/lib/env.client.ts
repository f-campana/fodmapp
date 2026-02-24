function readOptionalEnv(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

export interface ClientRuntimeEnv {
  clerkPublishableKey: string | null;
  plausibleDomain: string | null;
  plausibleScriptSrc: string | null;
  axeptioClientId: string | null;
  axeptioCookiesVersion: string | null;
}

export function getClientRuntimeEnv(): ClientRuntimeEnv {
  return {
    clerkPublishableKey: readOptionalEnv(
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
    plausibleDomain: readOptionalEnv(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
    plausibleScriptSrc: readOptionalEnv(process.env.NEXT_PUBLIC_PLAUSIBLE_SRC),
    axeptioClientId: readOptionalEnv(process.env.NEXT_PUBLIC_AXEPTIO_CLIENT_ID),
    axeptioCookiesVersion: readOptionalEnv(
      process.env.NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION,
    ),
  };
}

export interface ClientFeatureFlags {
  clerkConfigured: boolean;
  analyticsConfigured: boolean;
  consentConfigured: boolean;
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
  };
}
