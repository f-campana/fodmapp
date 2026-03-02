import { renderHook } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { useMobile } from "./use-mobile";

describe("useMobile", () => {
  it("uses the mobile media query breakpoint", () => {
    let lastQuery = "";
    const media = {
      matches: false,
      media: "",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as MediaQueryList;

    const matchMedia = vi.fn((query: string) => {
      lastQuery = query;
      return media;
    });

    vi.stubGlobal("matchMedia", matchMedia);

    const { result } = renderHook(() => useMobile());

    expect(matchMedia).toHaveBeenCalledWith("(max-width: 768px)");
    expect(lastQuery).toBe("(max-width: 768px)");
    expect(result.current).toBe(false);
  });
});
