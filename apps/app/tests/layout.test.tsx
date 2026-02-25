import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import RootLayout from "../app/layout";

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

  it("injects plausible script when consent override is enabled", () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "true");

    const html = renderToStaticMarkup(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(html).toContain("plausible.io/js/script.js");
    expect(html).toContain('data-domain="example.com"');
  });
});
