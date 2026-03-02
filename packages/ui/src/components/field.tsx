import {
  Children,
  cloneElement,
  type InputHTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { cn } from "../lib/cn";

type ControlProps = InputHTMLAttributes<HTMLInputElement> & {
  id?: string;
  "aria-describedby"?: string;
};

type FieldControl = ReactElement<ControlProps>;

export interface FieldProps {
  label: string;
  id?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: FieldControl;
}

function mergeDescribedBy(
  existing: string | undefined,
  incoming: string | undefined,
): string | undefined {
  return [existing, incoming].filter(Boolean).join(" ").trim() || undefined;
}

export function Field({
  label,
  id,
  hint,
  error,
  required,
  className,
  labelClassName,
  children,
}: FieldProps) {
  const child = Children.only(children) as ReactNode;

  if (!isValidElement<ControlProps>(child)) {
    throw new Error("Field requires a single valid form control child.");
  }

  const controlId = child.props.id ?? id;
  if (!controlId) {
    throw new Error(
      "Field requires either an `id` prop or a child with an `id`.",
    );
  }

  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = mergeDescribedBy(hintId, errorId);

  const control = cloneElement(child, {
    id: controlId,
    "aria-describedby": mergeDescribedBy(
      child.props["aria-describedby"],
      describedBy,
    ),
    "aria-invalid": error ? true : child.props["aria-invalid"],
  });

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label
        htmlFor={controlId}
        className={cn(
          "text-sm font-semibold tracking-wide text-(--color-text)",
          labelClassName,
        )}
      >
        {label}
        {required ? (
          <span className="ml-1 text-validation-error-text">*</span>
        ) : null}
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="text-xs text-(--color-text-muted)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          className="text-xs font-medium text-validation-error-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
