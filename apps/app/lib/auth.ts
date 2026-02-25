import { getClerkBootstrapStatus } from "./clerk";

export type AuthBootstrapState = "placeholder";

export interface AuthContextStub {
  state: AuthBootstrapState;
  provider: "clerk-deferred";
  mode: "stub";
  isAuthenticated: false;
  configured: boolean;
}

export async function getAuthContext(): Promise<AuthContextStub> {
  const clerk = getClerkBootstrapStatus();

  return {
    state: "placeholder",
    provider: clerk.provider,
    mode: clerk.mode,
    isAuthenticated: false,
    configured: clerk.fullyConfigured,
  };
}
