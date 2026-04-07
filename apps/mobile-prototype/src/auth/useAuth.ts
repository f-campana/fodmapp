import { createContext, useContext } from "react";

export type AuthTokenGetter = () => Promise<string | null>;

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  getToken: AuthTokenGetter;
  signOut: () => Promise<void>;
  configurationError: string | null;
}

export const anonymousTokenGetter: AuthTokenGetter = async () => null;

export function createSignedOutAuthState(
  configurationError: string | null = null,
): AuthState {
  return {
    isLoaded: true,
    isSignedIn: false,
    userId: null,
    getToken: anonymousTokenGetter,
    signOut: async () => {},
    configurationError,
  };
}

export function createLoadingAuthState(
  configurationError: string | null = null,
): AuthState {
  return {
    ...createSignedOutAuthState(configurationError),
    isLoaded: false,
  };
}

export const AuthContext = createContext<AuthState>(createLoadingAuthState());

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
