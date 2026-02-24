import { useMemo } from "react";

import { normalizeBarcode } from "@fodmap/barcode-core";

import type { VisionDetectedCode, VisionScannerOptions } from "./types";

const RETAIL_TYPES = new Set(["ean-13", "ean13", "ean-8", "ean8", "upc-a", "upca"]);

function isRetailType(type: string | null | undefined): boolean {
  if (!type) {
    return false;
  }
  return RETAIL_TYPES.has(type.toLowerCase());
}

export function createVisionBarcodeHandler(options: VisionScannerOptions) {
  const seen = new Map<string, number>();
  const dedupeWindowMs = options.dedupeWindowMs ?? 1200;

  return (codes: VisionDetectedCode[]): void => {
    const now = options.now?.() ?? Date.now();

    for (const code of codes) {
      const rawValue = (code.value ?? "").trim();
      if (!rawValue) {
        continue;
      }

      if (!options.acceptAllTypes && !isRetailType(code.type)) {
        continue;
      }

      let normalized;
      try {
        normalized = normalizeBarcode(rawValue);
      } catch {
        continue;
      }

      const previous = seen.get(normalized.normalizedCode);
      if (previous !== undefined && now - previous < dedupeWindowMs) {
        continue;
      }

      seen.set(normalized.normalizedCode, now);
      options.onDetected(normalized, {
        rawValue,
        type: code.type ?? null,
      });
      return;
    }
  };
}

export function useVisionBarcodeScanner(options: VisionScannerOptions) {
  return useMemo(
    () => createVisionBarcodeHandler(options),
    [options.acceptAllTypes, options.dedupeWindowMs, options.now, options.onDetected],
  );
}
