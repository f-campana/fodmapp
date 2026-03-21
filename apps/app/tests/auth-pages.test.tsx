import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import SignInPage from "../app/sign-in/[[...sign-in]]/page";
import SignUpPage from "../app/sign-up/[[...sign-up]]/page";
import { getClerkBootstrapStatus } from "../lib/clerk";

vi.mock("../lib/clerk", () => ({
  getClerkBootstrapStatus: vi.fn(),
}));

vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: Record<string, unknown>) => (
    <div data-sign-in={JSON.stringify(props)} />
  ),
  SignUp: (props: Record<string, unknown>) => (
    <div data-sign-up={JSON.stringify(props)} />
  ),
}));

const mockedGetClerkBootstrapStatus = vi.mocked(getClerkBootstrapStatus);

afterEach(() => {
  mockedGetClerkBootstrapStatus.mockReset();
});

describe("clerk auth pages", () => {
  it("renders a runtime sign-in surface when Clerk is configured", () => {
    mockedGetClerkBootstrapStatus.mockReturnValue({
      provider: "clerk",
      mode: "runtime",
      publishableKeyConfigured: true,
      serverKeysConfigured: true,
      fullyConfigured: true,
      previewValuePresent: false,
      previewValueValid: false,
      previewUserId: null,
    });

    const html = renderToStaticMarkup(<SignInPage />);

    expect(html).toContain("Se connecter");
    expect(html).toContain(
      'data-sign-in="{&quot;path&quot;:&quot;/sign-in&quot;,&quot;routing&quot;:&quot;path&quot;,&quot;signUpUrl&quot;:&quot;/sign-up&quot;}"',
    );
  });

  it("renders a fallback sign-in surface when Clerk is absent", () => {
    mockedGetClerkBootstrapStatus.mockReturnValue({
      provider: "clerk",
      mode: "disabled",
      publishableKeyConfigured: false,
      serverKeysConfigured: false,
      fullyConfigured: false,
      previewValuePresent: false,
      previewValueValid: false,
      previewUserId: null,
    });

    const html = renderToStaticMarkup(<SignInPage />);

    expect(html).toContain("Connexion Clerk non disponible");
    expect(html).not.toContain("data-sign-in=");
    expect(html).toContain('href="/"');
  });

  it("renders a runtime sign-up surface when Clerk is configured", () => {
    mockedGetClerkBootstrapStatus.mockReturnValue({
      provider: "clerk",
      mode: "runtime",
      publishableKeyConfigured: true,
      serverKeysConfigured: true,
      fullyConfigured: true,
      previewValuePresent: false,
      previewValueValid: false,
      previewUserId: null,
    });

    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain("Créer un compte");
    expect(html).toContain(
      'data-sign-up="{&quot;path&quot;:&quot;/sign-up&quot;,&quot;routing&quot;:&quot;path&quot;,&quot;signInUrl&quot;:&quot;/sign-in&quot;}"',
    );
  });

  it("renders a fallback sign-up surface when Clerk is absent", () => {
    mockedGetClerkBootstrapStatus.mockReturnValue({
      provider: "clerk",
      mode: "disabled",
      publishableKeyConfigured: false,
      serverKeysConfigured: false,
      fullyConfigured: false,
      previewValuePresent: false,
      previewValueValid: false,
      previewUserId: null,
    });

    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain("Inscription Clerk non disponible");
    expect(html).not.toContain("data-sign-up=");
    expect(html).toContain('href="/"');
  });
});
