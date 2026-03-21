import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ClerkShell } from "../components/clerk-shell";

vi.mock("@clerk/nextjs", () => ({
  ClerkProvider: ({ children }: { children: ReactNode }) => (
    <div data-clerk-provider="true">{children}</div>
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("clerk shell", () => {
  it("passes children through when disabled", () => {
    const html = renderToStaticMarkup(
      <ClerkShell enabled={false}>
        <div>content</div>
      </ClerkShell>,
    );

    expect(html).not.toContain("data-clerk-provider");
    expect(html).toContain("<div>content</div>");
  });

  it("wraps children in ClerkProvider when enabled", () => {
    const html = renderToStaticMarkup(
      <ClerkShell enabled>
        <div>content</div>
      </ClerkShell>,
    );

    expect(html).toContain('data-clerk-provider="true"');
    expect(html).toContain("<div>content</div>");
  });
});
