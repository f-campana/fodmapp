import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import EspacePage from "../app/espace/page";
import HomePage from "../app/page";
import { getAuthContext } from "../lib/auth";

vi.mock("../lib/auth", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("../app/espace/ConsentRightsClient", () => ({
  __esModule: true,
  default: ({ userId }: { userId: string }) => (
    <div>{`consent-rights-client:${userId}`}</div>
  ),
}));

const mockedGetAuthContext = vi.mocked(getAuthContext);

describe("apps/app scaffold routes", () => {
  it("renders home route with FR-first scaffold copy and espace link", async () => {
    const html = renderToStaticMarkup(
      await HomePage({ searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain(
      "L’app soutient vos choix digestifs et ne pose pas de conclusion clinique.",
    );
    expect(html).toContain("fodmapp-api@v0");
    expect(html).toContain("Mode minimal / Mode consenti");
    expect(html).toContain(
      "Partager un récapitulatif avec votre professionnel",
    );
    expect(html).toContain('href="/espace"');
  });

  it("renders espace route with sign-in CTA when unauthenticated", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "anonymous",
      provider: "clerk",
      mode: "runtime",
      isAuthenticated: false,
      configured: true,
      userId: null,
    });

    const html = renderToStaticMarkup(
      await EspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain(
      "L’app soutient vos choix digestifs et ne pose pas de conclusion clinique.",
    );
    expect(html).toContain("Connexion requise pour gérer vos droits");
    expect(html).toContain('href="/sign-in"');
    expect(html).not.toContain("consent-rights-client:");
    expect(html).not.toContain("Créer le récapitulatif");
    expect(html).not.toContain("Supprimer vos données");
    expect(html).toContain('href="/"');
  });

  it("renders espace route with rights client when authenticated", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "authenticated",
      provider: "clerk",
      mode: "runtime",
      isAuthenticated: true,
      configured: true,
      userId: "user_123",
    });

    const html = renderToStaticMarkup(
      await EspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain("consent-rights-client:user_123");
    expect(html).not.toContain('href="/sign-in"');
  });
});
