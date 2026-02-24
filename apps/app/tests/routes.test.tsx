import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EspacePage from "../app/espace/page";
import HomePage from "../app/page";

describe("apps/app scaffold routes", () => {
  it("renders home route with FR-first scaffold copy and espace link", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("Socle app Next.js en place");
    expect(html).toContain("fodmap-api@v0");
    expect(html).toContain('href="/espace"');
  });

  it("renders espace route with placeholder auth state", async () => {
    const html = renderToStaticMarkup(await EspacePage());

    expect(html).toContain("Espace protege (placeholder)");
    expect(html).toContain("Etat auth actuel");
    expect(html).toContain("placeholder");
    expect(html).toContain("clerk-deferred");
    expect(html).toContain('href="/"');
  });
});
