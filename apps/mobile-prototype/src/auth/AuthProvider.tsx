import { type ReactNode, useMemo } from "react";

import { ClerkProvider, useAuth as useClerkAuth, useClerk } from "@clerk/expo";

import { clerkTokenCache } from "./clerk";
import { getClerkConfigurationError, getClerkPublishableKey } from "./config";
import {
  AuthContext,
  createLoadingAuthState,
  createSignedOutAuthState,
} from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const publishableKey = getClerkPublishableKey();
  const configurationError = getClerkConfigurationError();

  if (!publishableKey) {
    return (
      <AuthContext.Provider
        value={createSignedOutAuthState(configurationError)}
      >
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={clerkTokenCache}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </ClerkProvider>
  );
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const { signOut } = useClerk();
  const clerkAuth = useClerkAuth();

  const value = useMemo(() => {
    if (!clerkAuth.isLoaded) {
      return createLoadingAuthState();
    }

    if (!clerkAuth.isSignedIn) {
      return createSignedOutAuthState();
    }

    return {
      isLoaded: true,
      isSignedIn: true,
      userId: clerkAuth.userId ?? null,
      getToken: clerkAuth.getToken,
      signOut: async () => {
        await signOut();
      },
      configurationError: null,
    };
  }, [
    clerkAuth.getToken,
    clerkAuth.isLoaded,
    clerkAuth.isSignedIn,
    clerkAuth.userId,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
