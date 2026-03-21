import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import RootLayout from "../app/layout";

vi.mock("../components/clerk-shell", () => ({
  ClerkShell: ({
    enabled,
    children,
  }: {
    enabled: boolean;
    children: ReactNode;
  }) => <div data-clerk-shell={String(enabled)}>{children}</div>,
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("root layout runtime injections", () => {
  it("does not inject plausible script without consent", () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "false");

    const html = renderToStaticMarkup(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(html).not.toContain("plausible.io/js/script.js");
    expect(html).not.toContain('data-domain="example.com"');
  });

  it("keeps analytics hard-off even when analytics and consent envs are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmapp.example");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "true");

    const html = renderToStaticMarkup(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(html).not.toContain("plausible.io/js/script.js");
    expect(html).not.toContain('data-domain="example.com"');
  });

  it("mounts the clerk shell only when runtime auth is configured", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_stub");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test_stub");

    const html = renderToStaticMarkup(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(html).toContain('data-clerk-shell="true"');
    expect(html).toContain('data-auth-mode="runtime"');
    expect(html).toContain('data-auth-configured="true"');
  });
});
