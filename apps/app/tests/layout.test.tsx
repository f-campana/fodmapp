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

  it("keeps analytics hard-off even when analytics and consent envs are configured", () => {
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "example.com");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.fodmap.example");
    vi.stubEnv("NEXT_PUBLIC_ANALYTICS_CONSENT_GRANTED", "true");

    const html = renderToStaticMarkup(
      <RootLayout>
        <div>content</div>
      </RootLayout>,
    );

    expect(html).not.toContain("plausible.io/js/script.js");
    expect(html).not.toContain('data-domain="example.com"');
  });
});
