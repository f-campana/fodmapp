import type { ReactNode } from "react";
import { useState } from "react";

import { normalizeBarcode } from "@fodmap/barcode-core";

export interface BarcodeManualEntryRenderProps {
  value: string;
  error: string | null;
  setValue: (next: string) => void;
  submit: () => void;
}

export interface BarcodeManualEntryProps {
  onSubmit: (normalizedCode: string) => void;
  render: (props: BarcodeManualEntryRenderProps) => ReactNode;
}

export function BarcodeManualEntry(props: BarcodeManualEntryProps) {
  const [value, setRawValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function setValue(next: string): void {
    setRawValue(next.replace(/\D+/g, ""));
    setError(null);
  }

  function submit(): void {
    try {
      const normalized = normalizeBarcode(value);
      props.onSubmit(normalized.normalizedCode);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid barcode");
    }
  }

  return <>{props.render({ value, error, setValue, submit })}</>;
}
