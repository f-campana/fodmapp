import { renderHook } from "@testing-library/react";

import { describe, expect, it } from "vitest";

import { useLocale } from "./use-locale";

function normalizeFrenchSpaces(value: string): string {
  return value.replace(/[\u00A0\u202F]/g, " ");
}

describe("useLocale", () => {
  it("defaults to fr-FR and formats numbers with French separators", () => {
    const { result } = renderHook(() => useLocale());

    expect(result.current.locale).toBe("fr-FR");
    expect(normalizeFrenchSpaces(result.current.formatNumber(1234.5))).toBe(
      "1 234,5",
    );
  });

  it("formats dates with French locale", () => {
    const { result } = renderHook(() => useLocale());
    const date = new Date(Date.UTC(2026, 2, 2));

    const formatted = result.current.formatDate(date, {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    expect(formatted).toBe("02/03/2026");
  });
});
