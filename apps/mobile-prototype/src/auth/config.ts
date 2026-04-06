export const CLERK_PUBLISHABLE_KEY_ENV =
  "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" as const;

export function getClerkPublishableKey(): string | null {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();

  return publishableKey ? publishableKey : null;
}

export function getClerkConfigurationError(): string | null {
  return getClerkPublishableKey()
    ? null
    : `Set ${CLERK_PUBLISHABLE_KEY_ENV} to enable mobile sign-in.`;
}
