import { getClerkBootstrapStatus } from "./clerk";
import { captureSentryEvent } from "./sentry";

export type AuthBootstrapState =
  | "placeholder"
  | "anonymous"
  | "authenticated"
  | "error";

export interface AuthContextStub {
  state: AuthBootstrapState;
  provider: "clerk";
  mode: "disabled" | "runtime";
  isAuthenticated: boolean;
  configured: boolean;
  userId: string | null;
}

interface ClerkAuthResult {
  userId: string | null;
}

interface ClerkAuthModule {
  auth: () => Promise<ClerkAuthResult>;
}

export type ClerkAuthModuleLoader = () => Promise<ClerkAuthModule>;
export type AuthRuntimeFailureReporter = (reason: string, error?: unknown) => void;

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "unknown";
}

async function loadClerkAuthModule(): Promise<ClerkAuthModule> {
  return import("@clerk/nextjs/server");
}

function reportAuthRuntimeFailure(reason: string, error?: unknown): void {
  const errorMessage = getAuthErrorMessage(error);

  captureSentryEvent("auth_runtime_context_failed", {
    reason,
    error_message: errorMessage,
  });

  if (process.env.NODE_ENV !== "production") {
    console.error("[auth-runtime] context failed", { reason, error: errorMessage });
  }
}

export async function getAuthContext(
  loadAuthModule: ClerkAuthModuleLoader = loadClerkAuthModule,
  reportFailure: AuthRuntimeFailureReporter = reportAuthRuntimeFailure,
): Promise<AuthContextStub> {
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
    const { auth } = await loadAuthModule();
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
  } catch (error) {
    reportFailure("clerk_auth_context_unavailable", error);

    return {
      state: "error",
      provider: clerk.provider,
      mode: clerk.mode,
      isAuthenticated: false,
      configured: true,
      userId: null,
    };
  }
}
