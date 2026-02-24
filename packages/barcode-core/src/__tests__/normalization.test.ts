import { describe, expect, it } from "vitest";

import { normalizeBarcode, validateRetailBarcode } from "../normalization";

describe("normalizeBarcode", () => {
  it("normalizes EAN-13", () => {
    const normalized = normalizeBarcode("4006381333931");
    expect(normalized.normalizedCode).toBe("4006381333931");
    expect(normalized.canonicalFormat).toBe("EAN13");
    expect(normalized.sourceFormat).toBe("EAN13");
  });

  it("normalizes UPC-A into EAN-13", () => {
    const normalized = normalizeBarcode("036000291452");
    expect(normalized.normalizedCode).toBe("0036000291452");
    expect(normalized.canonicalFormat).toBe("EAN13");
    expect(normalized.sourceFormat).toBe("UPC_A");
  });

  it("accepts EAN-8", () => {
    const normalized = normalizeBarcode("55123457");
    expect(normalized.normalizedCode).toBe("55123457");
    expect(normalized.canonicalFormat).toBe("EAN8");
  });

  it("rejects invalid payload", () => {
    expect(() => normalizeBarcode("ABC123")).toThrow("digits only");
    expect(() => normalizeBarcode("4006381333932")).toThrow("check digit");
  });
});

describe("validateRetailBarcode", () => {
  it("returns structured validation output", () => {
    expect(validateRetailBarcode("4006381333931").valid).toBe(true);
    expect(validateRetailBarcode("foo").valid).toBe(false);
  });
});
