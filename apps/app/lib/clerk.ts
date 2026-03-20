import { getClientFeatureFlags } from "./env.client";
import { getServerFeatureFlags, getServerRuntimeEnv } from "./env.server";

export interface ClerkBootstrapStatus {
  provider: "clerk";
  mode: "disabled" | "preview" | "runtime";
  publishableKeyConfigured: boolean;
  serverKeysConfigured: boolean;
  fullyConfigured: boolean;
  previewValuePresent: boolean;
  previewValueValid: boolean;
  previewUserId: string | null;
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
  const fullyConfigured =
    clientFlags.clerkConfigured && serverFlags.clerkConfigured;
  const previewValuePresent = Boolean(env.appAuthPreviewUserId);
  const previewValueValid = isValidUuid(env.appAuthPreviewUserId);
  const previewEnabled =
    !fullyConfigured &&
    env.nodeEnv !== "production" &&
    previewValuePresent &&
    previewValueValid;

  return {
    provider: "clerk",
    mode: fullyConfigured ? "runtime" : previewEnabled ? "preview" : "disabled",
    publishableKeyConfigured: clientFlags.clerkConfigured,
    serverKeysConfigured: serverFlags.clerkConfigured,
    fullyConfigured,
    previewValuePresent,
    previewValueValid,
    previewUserId: previewEnabled ? env.appAuthPreviewUserId : null,
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
