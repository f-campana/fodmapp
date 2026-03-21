import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import EspacePage from "../app/espace/page";
import EspaceSuiviLoading from "../app/espace/suivi/loading";
import EspaceSuiviPage from "../app/espace/suivi/page";
import HomePage from "../app/page";
import { getAuthContext } from "../lib/auth";

vi.mock("../lib/auth", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("../app/espace/ConsentRightsClient", () => ({
  __esModule: true,
  default: ({
    auth,
  }: {
    auth: { mode: "preview"; userId: string } | { mode: "runtime" };
  }) => (
    <div>
      {`consent-rights-client:${auth.mode === "preview" ? auth.userId : "runtime"}`}
    </div>
  ),
}));

vi.mock("../app/espace/suivi/TrackingHubClient", () => ({
  __esModule: true,
  default: ({
    auth,
  }: {
    auth: { mode: "preview"; userId: string } | { mode: "runtime" };
  }) => (
    <div>
      {`tracking-hub-client:${auth.mode === "preview" ? auth.userId : "runtime"}`}
    </div>
  ),
}));

vi.mock("../app/espace/RuntimeUserButton", () => ({
  __esModule: true,
  default: () => <div>runtime-user-button</div>,
}));

const mockedGetAuthContext = vi.mocked(getAuthContext);

afterEach(() => {
  mockedGetAuthContext.mockReset();
});

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

  it("renders espace route with disabled auth copy and no sign-in link", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "placeholder",
      provider: "clerk",
      mode: "disabled",
      isAuthenticated: false,
      configured: false,
      userId: null,
    });

    const html = renderToStaticMarkup(
      await EspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain(
      "L’app soutient vos choix digestifs et ne pose pas de conclusion clinique.",
    );
    expect(html).toContain("Connexion indisponible dans cette version");
    expect(html).toContain(
      "Cette version locale n’embarque pas encore de parcours de connexion.",
    );
    expect(html).not.toContain('href="/sign-in"');
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

    expect(html).toContain("consent-rights-client:runtime");
    expect(html).toContain("runtime-user-button");
    expect(html).toContain('href="/espace/suivi"');
    expect(html).not.toContain('href="/sign-in"');
  });

  it("renders espace route with preview banner when preview auth is active", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "authenticated",
      provider: "clerk",
      mode: "preview",
      isAuthenticated: true,
      configured: true,
      userId: "11111111-1111-4111-8111-111111111111",
    });

    const html = renderToStaticMarkup(
      await EspacePage({ searchParams: Promise.resolve({}) }),
    );

    expect(html).toContain("Mode aperçu local actif");
    expect(html).toContain("11111111-1111-4111-8111-111111111111");
    expect(html).toContain(
      "consent-rights-client:11111111-1111-4111-8111-111111111111",
    );
    expect(html).not.toContain('href="/sign-in"');
  });

  it("renders suivi route with disabled auth copy and no sign-in link", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "placeholder",
      provider: "clerk",
      mode: "disabled",
      isAuthenticated: false,
      configured: false,
      userId: null,
    });

    const html = renderToStaticMarkup(await EspaceSuiviPage());

    expect(html).toContain("Connexion indisponible dans cette version");
    expect(html).toContain(
      "Cette version locale n’embarque pas encore de parcours de connexion.",
    );
    expect(html).not.toContain('href="/sign-in"');
    expect(html).toContain('href="/espace"');
    expect(html).not.toContain("tracking-hub-client:");
  });

  it("renders suivi route with tracking hub when authenticated", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "authenticated",
      provider: "clerk",
      mode: "runtime",
      isAuthenticated: true,
      configured: true,
      userId: "user_456",
    });

    const html = renderToStaticMarkup(await EspaceSuiviPage());

    expect(html).toContain("tracking-hub-client:runtime");
    expect(html).toContain("runtime-user-button");
    expect(html).toContain("Journal descriptif, sans interprétation clinique.");
    expect(html).toContain('href="/espace"');
  });

  it("renders suivi route with preview banner when preview auth is active", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "authenticated",
      provider: "clerk",
      mode: "preview",
      isAuthenticated: true,
      configured: true,
      userId: "user_preview_456",
    });

    const html = renderToStaticMarkup(await EspaceSuiviPage());

    expect(html).toContain("Mode aperçu local actif");
    expect(html).toContain("user_preview_456");
    expect(html).toContain("tracking-hub-client:user_preview_456");
    expect(html).not.toContain('href="/sign-in"');
  });

  it("renders sign-in CTA on espace when Clerk runtime is configured but user is anonymous", async () => {
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

    expect(html).toContain('href="/sign-in"');
    expect(html).toContain("Se connecter");
  });

  it("renders sign-in CTA on suivi when Clerk runtime is configured but user is anonymous", async () => {
    mockedGetAuthContext.mockResolvedValue({
      state: "anonymous",
      provider: "clerk",
      mode: "runtime",
      isAuthenticated: false,
      configured: true,
      userId: null,
    });

    const html = renderToStaticMarkup(await EspaceSuiviPage());

    expect(html).toContain('href="/sign-in"');
    expect(html).toContain("Se connecter");
  });

  it("renders suivi loading route", () => {
    const html = renderToStaticMarkup(<EspaceSuiviLoading />);

    expect(html).toContain("Chargement du suivi…");
  });
});
