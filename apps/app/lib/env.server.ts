function readOptionalEnv(key: string): string | null {
  const value = process.env[key]?.trim();
  return value && value.length > 0 ? value : null;
}

export interface ServerRuntimeEnv {
  sentryDsnApp: string | null;
  clerkSecretKey: string | null;
  clerkJwtIssuerDomain: string | null;
  nodeEnv: string;
}

export function getServerRuntimeEnv(): ServerRuntimeEnv {
  return {
    sentryDsnApp: readOptionalEnv("SENTRY_DSN_APP"),
    clerkSecretKey: readOptionalEnv("CLERK_SECRET_KEY"),
    clerkJwtIssuerDomain: readOptionalEnv("CLERK_JWT_ISSUER_DOMAIN"),
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}

export interface ServerFeatureFlags {
  sentryConfigured: boolean;
  clerkConfigured: boolean;
}

export function getServerFeatureFlags(
  env: ServerRuntimeEnv = getServerRuntimeEnv(),
): ServerFeatureFlags {
  return {
    sentryConfigured: Boolean(env.sentryDsnApp),
    clerkConfigured: Boolean(env.clerkSecretKey && env.clerkJwtIssuerDomain),
  };
}
