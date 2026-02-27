import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAnalyticsBootstrapStatus,
  trackAnalyticsEvent,
} from "../lib/analytics";
import { getAuthMiddlewareMode, getClerkBootstrapStatus } from "../lib/clerk";
import { canTrackWithConsent, getConsentBootstrapStatus } from "../lib/consent";
import { getMonitoringBootstrapStatus } from "../lib/monitoring";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("cross-cutting runtime adapters", () => {
  it("returns disabled status when env keys are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN_APP", "");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "");
    vi.stubEnv("SENTRY_DSN_APP", "");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION", "");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "false");

    const auth = getClerkBootstrapStatus();
    const monitoring = getMonitoringBootstrapStatus();
    const analytics = getAnalyticsBootstrapStatus();
    const consent = getConsentBootstrapStatus();

    expect(auth.fullyConfigured).toBe(false);
    expect(auth.mode).toBe("disabled");
    expect(monitoring.configured).toBe(false);
    expect(monitoring.mode).toBe("disabled");
    expect(analytics.configured).toBe(false);
    expect(analytics.mode).toBe("disabled");
    expect(consent.configured).toBe(false);
    expect(consent.mode).toBe("disabled");
    expect(canTrackWithConsent(consent)).toBe(false);
  });

  it("enables runtime path for Clerk/Sentry/Plausible when env keys are set", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_stub");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_stub");
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN_APP", "https://sentry.example/42");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_CLIENT_ID", "axeptio-client");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION", "v1");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "false");

    const auth = getClerkBootstrapStatus();
    const monitoring = getMonitoringBootstrapStatus();
    const analytics = getAnalyticsBootstrapStatus();
    const consent = getConsentBootstrapStatus();

    expect(auth.fullyConfigured).toBe(true);
    expect(auth.mode).toBe("runtime");
    expect(monitoring.configured).toBe(true);
    expect(monitoring.mode).toBe("runtime");
    expect(analytics.configured).toBe(false);
    expect(analytics.mode).toBe("disabled");
    expect(consent.mode).toBe("disabled");
    expect(consent.configured).toBe(false);
    expect(canTrackWithConsent(consent)).toBe(false);
    expect(consent.deferredReason).toContain("not configured");
  });

  it("switches consent bootstrap to API-backed mode when /v0 base URL is provided", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_CLIENT_ID", "axeptio-client");
    vi.stubEnv("NEXT_PUBLIC_AXEPTIO_COOKIES_VERSION", "v1");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "true");

    const analytics = getAnalyticsBootstrapStatus();
    const consent = getConsentBootstrapStatus();

    expect(analytics.configured).toBe(false);
    expect(consent.mode).toBe("api-ready");
    expect(consent.configured).toBe(true);
    expect(consent.manualOptIn).toBe(false);
    expect(consent.manualOptInRequested).toBe(false);
    expect(canTrackWithConsent(consent)).toBe(false);
    expect(consent.deferredReason).toContain("API-backed");
  });

  it("keeps manual consent override placeholders out of runtime bootstrap mode", () => {
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "true");

    const consent = getConsentBootstrapStatus();

    expect(consent.manualOptInRequested).toBe(false);
    expect(consent.manualOptIn).toBe(false);
    expect(consent.mode).toBe("disabled");
    expect(canTrackWithConsent(consent)).toBe(false);
  });

  it("does not emit analytics events while runtime hard-off policy is active", () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    const plausible = vi.fn();
    vi.stubGlobal("window", { plausible });

    trackAnalyticsEvent("home_page_viewed", { route: "/" });

    expect(plausible).not.toHaveBeenCalled();
  });

  it("keeps middleware route protection in placeholder mode when env is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("CLERK_SECRET_KEY", "");
    vi.stubEnv("CLERK_JWT_ISSUER_DOMAIN", "");

    expect(getAuthMiddlewareMode("/")).toBe("public-pass-through");
    expect(getAuthMiddlewareMode("/espace")).toBe("protected-placeholder");
    expect(getAuthMiddlewareMode("/espace/preferences")).toBe(
      "protected-placeholder",
    );
  });

  it("switches middleware to runtime mode when Clerk env is complete", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_stub");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_stub");

    expect(getAuthMiddlewareMode("/espace")).toBe("protected-runtime");
    expect(getAuthMiddlewareMode("/espace/preferences")).toBe(
      "protected-runtime",
    );
  });
});
