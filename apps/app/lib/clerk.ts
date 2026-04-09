import { getClientFeatureFlags } from "./env.client";
import { getServerFeatureFlags, getServerRuntimeEnv } from "./env.server";

export interface ClerkBootstrapStatus {
  provider: "clerk";
  mode: "disabled" | "preview" | "runtime";
  environment: string;
  publishableKeyConfigured: boolean;
  serverKeysConfigured: boolean;
  fullyConfigured: boolean;
  previewValuePresent: boolean;
  previewValueValid: boolean;
  previewUserId: string | null;
  missingClientEnvKeys: string[];
  missingServerEnvKeys: string[];
  runtimeIssue: "missing_runtime_configuration" | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string | null): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export function getClerkBootstrapStatus(): ClerkBootstrapStatus {
  const clientFlags = getClientFeatureFlags();
  const env = getServerRuntimeEnv();
  const serverFlags = getServerFeatureFlags(env);
  const missingClientEnvKeys = clientFlags.clerkConfigured
    ? []
    : ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"];
  const missingServerEnvKeys = [
    env.clerkSecretKey ? null : "CLERK_SECRET_KEY",
    env.clerkJwtIssuerDomain ? null : "CLERK_JWT_ISSUER_DOMAIN",
    env.clerkJwtKey ? null : "CLERK_JWT_KEY",
    env.clerkAuthorizedParties ? null : "CLERK_AUTHORIZED_PARTIES",
  ].filter((value): value is string => value !== null);
  const fullyConfigured =
    clientFlags.clerkConfigured && serverFlags.clerkConfigured;
  const previewValuePresent = Boolean(env.appAuthPreviewUserId);
  const previewValueValid = isValidUuid(env.appAuthPreviewUserId);
  const previewEnabled =
    !fullyConfigured &&
    env.nodeEnv !== "production" &&
    previewValuePresent &&
    previewValueValid;
  const runtimeIssue =
    !fullyConfigured && env.nodeEnv === "production"
      ? "missing_runtime_configuration"
      : null;

  return {
    provider: "clerk",
    mode: fullyConfigured ? "runtime" : previewEnabled ? "preview" : "disabled",
    environment: env.nodeEnv,
    publishableKeyConfigured: clientFlags.clerkConfigured,
    serverKeysConfigured: serverFlags.clerkConfigured,
    fullyConfigured,
    previewValuePresent,
    previewValueValid,
    previewUserId: previewEnabled ? env.appAuthPreviewUserId : null,
    missingClientEnvKeys,
    missingServerEnvKeys,
    runtimeIssue,
  };
}

export type AuthMiddlewareMode =
  | "public-pass-through"
  | "protected-placeholder"
  | "protected-runtime";

export function getAuthMiddlewareMode(
  pathname: string,
  status: ClerkBootstrapStatus = getClerkBootstrapStatus(),
): AuthMiddlewareMode {
  if (pathname.startsWith("/espace")) {
    return status.fullyConfigured
      ? "protected-runtime"
      : "protected-placeholder";
  }

  return "public-pass-through";
}
