import { getClientFeatureFlags } from "./env.client";
import { getServerFeatureFlags } from "./env.server";

export interface ClerkBootstrapStatus {
  provider: "clerk-deferred";
  mode: "stub";
  publishableKeyConfigured: boolean;
  serverKeysConfigured: boolean;
  fullyConfigured: boolean;
}

export function getClerkBootstrapStatus(): ClerkBootstrapStatus {
  const clientFlags = getClientFeatureFlags();
  const serverFlags = getServerFeatureFlags();

  return {
    provider: "clerk-deferred",
    mode: "stub",
    publishableKeyConfigured: clientFlags.clerkConfigured,
    serverKeysConfigured: serverFlags.clerkConfigured,
    fullyConfigured: clientFlags.clerkConfigured && serverFlags.clerkConfigured,
  };
}

export type AuthMiddlewareMode =
  | "public-pass-through"
  | "protected-placeholder";

export function getAuthMiddlewareMode(pathname: string): AuthMiddlewareMode {
  if (pathname.startsWith("/espace")) {
    return "protected-placeholder";
  }

  return "public-pass-through";
}
