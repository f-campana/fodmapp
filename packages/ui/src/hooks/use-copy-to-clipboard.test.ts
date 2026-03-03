import { act, renderHook } from "@testing-library/react";

import { afterEach, describe, expect, it, vi } from "vitest";

import { useCopyToClipboard } from "./use-copy-to-clipboard";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("useCopyToClipboard", () => {
  it("copies text and exposes success state", async () => {
    vi.useFakeTimers();

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy("Bonjour");
      expect(success).toBe(true);
    });

    expect(writeText).toHaveBeenCalledWith("Bonjour");
    expect(result.current.copiedText).toBe("Bonjour");
    expect(result.current.isCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.copiedText).toBeUndefined();
    expect(result.current.isCopied).toBe(false);
  });

  it("returns false when clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy("Test");
      expect(success).toBe(false);
    });

    expect(result.current.isCopied).toBe(false);
  });
});
