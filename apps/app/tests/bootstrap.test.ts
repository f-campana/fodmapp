import { afterEach, describe, expect, it, vi } from "vitest";
import { getAnalyticsBootstrapStatus } from "../lib/analytics";
import { getAuthMiddlewareMode, getClerkBootstrapStatus } from "../lib/clerk";
import { canTrackWithConsent, getConsentBootstrapStatus } from "../lib/consent";
import { getMonitoringBootstrapStatus } from "../lib/monitoring";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("cross-cutting bootstrap stubs", () => {
  it("returns placeholder status when env keys are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "");
    vi.stubEnv("SENTRY_DSN_APP", "");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION", "");

    const auth = getClerkBootstrapStatus();
    const monitoring = getMonitoringBootstrapStatus();
    const analytics = getAnalyticsBootstrapStatus();
    const consent = getConsentBootstrapStatus();

    expect(auth.fullyConfigured).toBe(false);
    expect(monitoring.configured).toBe(false);
    expect(analytics.configured).toBe(false);
    expect(consent.configured).toBe(false);
    expect(canTrackWithConsent(consent)).toBe(false);
  });

  it("marks stubs as configured when env keys are set", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_stub");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_stub");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "https://issuer.example");
    vi.stubEnv("SENTRY_DSN_APP", "https://sentry.example/42");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_CLIENT_ID", "axeptio-client");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION", "v1");

    const auth = getClerkBootstrapStatus();
    const monitoring = getMonitoringBootstrapStatus();
    const analytics = getAnalyticsBootstrapStatus();
    const consent = getConsentBootstrapStatus();

    expect(auth.fullyConfigured).toBe(true);
    expect(monitoring.configured).toBe(true);
    expect(analytics.configured).toBe(true);
    expect(consent.configured).toBe(true);
    expect(canTrackWithConsent(consent)).toBe(true);
  });

  it("keeps middleware route protection in placeholder mode", () => {
    expect(getAuthMiddlewareMode("/")).toBe("public-pass-through");
    expect(getAuthMiddlewareMode("/espace")).toBe("protected-placeholder");
    expect(getAuthMiddlewareMode("/espace/preferences")).toBe(
      "protected-placeholder",
    );
  });
});
