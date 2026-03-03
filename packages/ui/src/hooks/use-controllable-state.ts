import * as React from "react";

interface UseControllableStateParams<T> {
  prop?: T;
  defaultProp?: T;
  onChange?: (value: T) => void;
}

function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: UseControllableStateParams<T>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    T | undefined
  >(defaultProp);

  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledValue;

  const setValue = React.useCallback(
    (next: React.SetStateAction<T | undefined>) => {
      const nextValue =
        typeof next === "function"
          ? (next as (prev: T | undefined) => T | undefined)(value)
          : next;

      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      if (nextValue !== undefined && !Object.is(nextValue, value)) {
        onChange?.(nextValue);
      }
    },
    [isControlled, onChange, value],
  );

  return [value, setValue] as const;
}

export { useControllableState };
export type { UseControllableStateParams };
