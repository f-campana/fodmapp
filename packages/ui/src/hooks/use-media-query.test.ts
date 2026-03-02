import { act, renderHook } from "@testing-library/react";

import { afterEach, describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "./use-media-query";

type MockMediaQueryList = MediaQueryList & {
  dispatch: (matches: boolean) => void;
  setMedia: (media: string) => void;
};

function createMockMediaQueryList(initialMatches = false): MockMediaQueryList {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mock = {
    matches: initialMatches,
    media: "",
    onchange: null,
    addEventListener: (
      _event: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.add(listener);
    },
    removeEventListener: (
      _event: string,
      listener: (event: MediaQueryListEvent) => void,
    ) => {
      listeners.delete(listener);
    },
    addListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeListener: (listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
    dispatch: (matches: boolean) => {
      mock.matches = matches;
      const event = { matches, media: mock.media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
    setMedia: (media: string) => {
      mock.media = media;
    },
  };

  return mock as MockMediaQueryList;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useMediaQuery", () => {
  it("returns current media query status and updates on change", () => {
    const media = createMockMediaQueryList(false);

    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => {
        media.setMedia(query);
        return media;
      }),
    );

    const { result } = renderHook(() => useMediaQuery("(max-width: 768px)"));

    expect(result.current).toBe(false);

    act(() => {
      media.dispatch(true);
    });

    expect(result.current).toBe(true);
  });
});
