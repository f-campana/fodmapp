import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatDateTimeLocalValue,
  formatUtcIsoForDateTimeLocal,
  nowDateInputValue,
} from "../lib/dateTimeLocal";

describe("datetime-local helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats current values in local wall-clock time", () => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(420);

    expect(nowDateInputValue(new Date("2026-03-19T10:00:00Z"))).toBe(
      "2026-03-19T03:00",
    );
  });

  it("formats explicit dates in local wall-clock time", () => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(420);

    expect(formatDateTimeLocalValue(new Date("2026-03-19T10:00:00Z"))).toBe(
      "2026-03-19T03:00",
    );
  });

  it("converts stored UTC strings before seeding datetime-local inputs", () => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-60);

    expect(formatUtcIsoForDateTimeLocal("2026-03-19T10:00:00Z")).toBe(
      "2026-03-19T11:00",
    );
  });
});
