import { getClerkBootstrapStatus } from "./clerk";

export type AuthBootstrapState = "placeholder" | "anonymous" | "authenticated";

export interface AuthContextStub {
  state: AuthBootstrapState;
  provider: "clerk";
  mode: "disabled" | "runtime";
  isAuthenticated: boolean;
  configured: boolean;
  userId: string | null;
}

export async function getAuthContext(): Promise<AuthContextStub> {
  const clerk = getClerkBootstrapStatus();
  if (!clerk.fullyConfigured) {
    return {
      state: "placeholder",
      provider: clerk.provider,
      mode: clerk.mode,
      isAuthenticated: false,
      configured: false,
      userId: null,
    };
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const authState = await auth();
    const isAuthenticated = Boolean(authState.userId);

    return {
      state: isAuthenticated ? "authenticated" : "anonymous",
      provider: clerk.provider,
      mode: clerk.mode,
      isAuthenticated,
      configured: true,
      userId: authState.userId ?? null,
    };
  } catch {
    return {
      state: "placeholder",
      provider: clerk.provider,
      mode: "disabled",
      isAuthenticated: false,
      configured: false,
      userId: null,
    };
  }
}
