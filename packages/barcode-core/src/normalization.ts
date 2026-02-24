import type { BarcodeCanonicalFormat, BarcodeSourceFormat, NormalizedBarcode, RetailValidation } from "./types";

function computeCheckDigit(payload: string): number {
  let sum = 0;
  const reversed = payload.split("").reverse();
  for (let idx = 0; idx < reversed.length; idx += 1) {
    const digit = Number(reversed[idx]);
    sum += (idx + 1) % 2 === 1 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

function hasValidCheckDigit(code: string): boolean {
  const payload = code.slice(0, -1);
  const expected = computeCheckDigit(payload);
  return Number(code[code.length - 1]) === expected;
}

function makeResult(queryCode: string, sourceFormat: BarcodeSourceFormat, canonicalFormat: BarcodeCanonicalFormat, normalizedCode: string): NormalizedBarcode {
  return {
    queryCode,
    sourceFormat,
    canonicalFormat,
    normalizedCode,
  };
}

export function normalizeBarcode(queryCode: string): NormalizedBarcode {
  const cleaned = queryCode.trim();
  if (!cleaned) {
    throw new Error("Barcode must not be empty");
  }
  if (!/^\d+$/.test(cleaned)) {
    throw new Error("Barcode must contain digits only");
  }

  if (cleaned.length === 8) {
    if (!hasValidCheckDigit(cleaned)) {
      throw new Error("Invalid EAN-8 check digit");
    }
    return makeResult(queryCode, "EAN8", "EAN8", cleaned);
  }

  if (cleaned.length === 12) {
    if (!hasValidCheckDigit(cleaned)) {
      throw new Error("Invalid UPC-A check digit");
    }
    return makeResult(queryCode, "UPC_A", "EAN13", `0${cleaned}`);
  }

  if (cleaned.length === 13) {
    if (!hasValidCheckDigit(cleaned)) {
      throw new Error("Invalid EAN-13 check digit");
    }
    return makeResult(queryCode, "EAN13", "EAN13", cleaned);
  }

  throw new Error("Barcode must be 8, 12, or 13 digits");
}

export function validateRetailBarcode(queryCode: string): RetailValidation {
  try {
    return {
      valid: true,
      normalized: normalizeBarcode(queryCode),
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Invalid barcode",
    };
  }
}
