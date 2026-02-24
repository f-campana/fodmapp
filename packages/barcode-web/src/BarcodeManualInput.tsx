import { useId, type FormEvent } from "react";

import { Button, Input } from "@fodmap/ui";

import { useBarcodeManualInput } from "./useBarcodeManualInput";

export interface BarcodeManualInputProps {
  onSubmit: (normalizedCode: string) => void;
  id?: string;
  label?: string;
  submitLabel?: string;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
}

export function BarcodeManualInput(props: BarcodeManualInputProps) {
  const generatedId = useId().replaceAll(":", "");
  const inputId = props.id ?? `barcode-input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const input = useBarcodeManualInput({
    onSubmit: (normalized) => props.onSubmit(normalized.normalizedCode),
    initialValue: props.initialValue,
  });
  const hasError = Boolean(input.error);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    input.submit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="barcode-manual-form"
      noValidate
      style={{
        display: "grid",
        gap: "0.5rem",
        width: "100%",
        maxWidth: "28rem",
      }}
    >
      <label htmlFor={inputId} className="text-sm font-semibold tracking-wide text-(--color-text)">
        {props.label ?? "Enter barcode"}
      </label>
      <div
        className="barcode-manual-input__controls"
        style={{
          display: "grid",
          gap: "0.5rem",
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        <Input
          id={inputId}
          inputMode="numeric"
          autoComplete="off"
          value={input.value}
          onChange={(event) => input.setValue(event.target.value)}
          placeholder={props.placeholder ?? "EAN/UPC"}
          disabled={props.disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          aria-errormessage={hasError ? errorId : undefined}
          className="h-11"
          style={{ minHeight: 44 }}
        />
        <Button
          type="submit"
          disabled={props.disabled}
          className="barcode-manual-input__submit h-11"
          style={{ minHeight: 44, width: "100%" }}
        >
          {props.submitLabel ?? "Lookup"}
        </Button>
      </div>
      {input.error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-(--color-danger)">
          {input.error}
        </p>
      ) : null}
      <style>
        {`
          @media (min-width: 640px) {
            .barcode-manual-input__controls {
              grid-template-columns: minmax(0, 1fr) auto !important;
              align-items: start;
            }
            .barcode-manual-input__submit {
              width: auto !important;
            }
          }
        `}
      </style>
    </form>
  );
}
