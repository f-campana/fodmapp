import { act, renderHook } from "@testing-library/react";

import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "./use-debounce";

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounce", () => {
  it("debounces value updates", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "pomme", delay: 300 } },
    );

    expect(result.current).toBe("pomme");

    rerender({ value: "poire", delay: 300 });
    expect(result.current).toBe("pomme");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe("poire");
  });
});
