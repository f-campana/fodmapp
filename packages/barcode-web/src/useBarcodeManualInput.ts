import { useMemo, useState } from "react";

import { normalizeBarcode, validateRetailBarcode } from "@fodmap/barcode-core";
import type { NormalizedBarcode } from "@fodmap/barcode-core";

export interface UseBarcodeManualInputOptions {
  onSubmit: (normalized: NormalizedBarcode) => void;
  initialValue?: string;
}

export interface UseBarcodeManualInputResult {
  value: string;
  error: string | null;
  normalized: NormalizedBarcode | null;
  setValue: (next: string) => void;
  submit: () => void;
}

export function useBarcodeManualInput(options: UseBarcodeManualInputOptions): UseBarcodeManualInputResult {
  const [value, setRawValue] = useState(options.initialValue ?? "");
  const [error, setError] = useState<string | null>(null);

  const validation = useMemo(() => validateRetailBarcode(value), [value]);

  const normalized = validation.valid ? validation.normalized ?? null : null;

  function setValue(next: string): void {
    const digitsOnly = next.replace(/\D+/g, "");
    setRawValue(digitsOnly);
    setError(null);
  }

  function submit(): void {
    if (!value) {
      setError("Barcode is required");
      return;
    }
    if (!validation.valid) {
      setError(validation.error ?? "Invalid barcode");
      return;
    }
    const result = normalizeBarcode(value);
    options.onSubmit(result);
    setError(null);
  }

  return {
    value,
    error,
    normalized,
    setValue,
    submit,
  };
}
