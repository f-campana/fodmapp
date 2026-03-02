import { act, renderHook } from "@testing-library/react";

import { describe, expect, it, vi } from "vitest";

import { useControllableState } from "./use-controllable-state";

describe("useControllableState", () => {
  it("manages internal state in uncontrolled mode", () => {
    const onChange = vi.fn();

    const { result } = renderHook(() =>
      useControllableState({ defaultProp: "faible", onChange }),
    );

    expect(result.current[0]).toBe("faible");

    act(() => {
      result.current[1]("modéré");
    });

    expect(result.current[0]).toBe("modéré");
    expect(onChange).toHaveBeenCalledWith("modéré");
  });

  it("uses prop value in controlled mode and not internal state", () => {
    const onChange = vi.fn();

    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ prop: value, onChange }),
      { initialProps: { value: "faible" } },
    );

    expect(result.current[0]).toBe("faible");

    act(() => {
      result.current[1]("élevé");
    });

    expect(onChange).toHaveBeenCalledWith("élevé");
    expect(result.current[0]).toBe("faible");

    rerender({ value: "élevé" });
    expect(result.current[0]).toBe("élevé");
  });
});
