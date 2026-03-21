import { createElement, type ReactNode } from "react";

import { vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement("a", { href }, children),
}));

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
  usePathname: () => "/aliments",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/font/google", () => {
  const createFontMock = (config?: { variable?: string }) => ({
    className: "",
    style: {},
    variable: config?.variable ?? "",
  });

  return {
    Cormorant_Garamond: createFontMock,
    Source_Sans_3: createFontMock,
  };
});
