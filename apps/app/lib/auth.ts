export type AuthBootstrapState = "placeholder";

export interface AuthContextStub {
  state: AuthBootstrapState;
  provider: "clerk-deferred";
  isAuthenticated: false;
}

export async function getAuthContext(): Promise<AuthContextStub> {
  return {
    state: "placeholder",
    provider: "clerk-deferred",
    isAuthenticated: false,
  };
}
