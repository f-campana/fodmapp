import { getClientFeatureFlags } from "./env.client";
import { getServerFeatureFlags } from "./env.server";

export interface ClerkBootstrapStatus {
  provider: "clerk";
  mode: "disabled" | "runtime";
  publishableKeyConfigured: boolean;
  serverKeysConfigured: boolean;
  fullyConfigured: boolean;
}

export function getClerkBootstrapStatus(): ClerkBootstrapStatus {
  const clientFlags = getClientFeatureFlags();
  const serverFlags = getServerFeatureFlags();
  const fullyConfigured =
    clientFlags.clerkConfigured && serverFlags.clerkConfigured;

  return {
    provider: "clerk",
    mode: fullyConfigured ? "runtime" : "disabled",
    publishableKeyConfigured: clientFlags.clerkConfigured,
    serverKeysConfigured: serverFlags.clerkConfigured,
    fullyConfigured,
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
