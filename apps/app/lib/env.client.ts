function readOptionalEnv(key: string): string | null {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : null;
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
    clerkPublishableKey: readOptionalEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    plausibleDomain: readOptionalEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN"),
    plausibleScriptSrc: readOptionalEnv("NEXT_PUBLIC_PLAUSIBLE_SRC"),
    axeptioClientId: readOptionalEnv("NEXT_PUBLIC_AXEPTIO_CLIENT_ID"),
    axeptioCookiesVersion: readOptionalEnv(
      "NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION",
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
