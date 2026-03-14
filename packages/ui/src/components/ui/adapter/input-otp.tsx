"use client";

import * as React from "react";

import { OTPInput, OTPInputContext } from "input-otp";

import { useControllableState } from "../../../hooks/use-controllable-state";
import { cn } from "../../../lib/cn";

export type InputOTPProps = React.ComponentProps<typeof OTPInput>;

interface InputOTPState {
  invalid: boolean;
}

const InputOTPStateContext = React.createContext<InputOTPState>({
  invalid: false,
});

function InputOTP({
  className,
  containerClassName,
  "aria-invalid": ariaInvalid,
  defaultValue,
  onChange,
  pushPasswordManagerStrategy = "none",
  value: valueProp,
  ...props
}: InputOTPProps) {
  const invalid = ariaInvalid === true || ariaInvalid === "true";
  const [value = "", setValue] = useControllableState<string>({
    defaultProp: typeof defaultValue === "string" ? defaultValue : "",
    onChange,
    prop: typeof valueProp === "string" ? valueProp : undefined,
  });

  return (
    <InputOTPStateContext.Provider value={{ invalid }}>
      <div
        data-slot="input-otp"
        data-invalid={invalid ? "true" : "false"}
        className={cn("group/otp flex items-center", className)}
      >
        <OTPInput
          aria-invalid={ariaInvalid}
          containerClassName={cn(
            "flex items-center gap-1 has-[:disabled]:opacity-50 sm:gap-2",
            containerClassName,
          )}
          onChange={setValue}
          pushPasswordManagerStrategy={pushPasswordManagerStrategy}
          value={value}
          {...props}
        />
      </div>
    </InputOTPStateContext.Provider>
  );
}

export type InputOTPGroupProps = React.ComponentProps<"div">;

function InputOTPGroup({ className, ...props }: InputOTPGroupProps) {
  return (
    <div
      {...props}
      data-slot="input-otp-group"
      className={cn("flex items-center", className)}
    />
  );
}

export interface InputOTPSlotProps extends React.ComponentProps<"div"> {
  index: number;
}

function InputOTPSlot({ index, className, ...props }: InputOTPSlotProps) {
  const inputContext = React.useContext(OTPInputContext);
  const { invalid } = React.useContext(InputOTPStateContext);

  const slot = inputContext.slots[index];

  if (!slot) {
    return null;
  }

  return (
    <div
      {...props}
      data-slot="input-otp-slot"
      data-active={slot.isActive ? "true" : "false"}
      data-invalid={invalid ? "true" : "false"}
      className={cn(
        "relative flex size-9 items-center justify-center border-y border-r border-input text-sm sm:size-10",
        "first:rounded-l-(--radius) first:border-l last:rounded-r-(--radius)",
        "transition-all duration-(--transition-duration-interactive) ease-(--transition-timing-interactive)",
        "data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring-soft",
        invalid &&
          "border-validation-error-border data-[active=true]:border-validation-error-border data-[active=true]:ring-validation-error-ring-soft",
        className,
      )}
    >
      {slot.char ?? slot.placeholderChar}
      {slot.hasFakeCaret ? (
        <div
          aria-hidden="true"
          data-slot="input-otp-caret"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-4 w-px bg-foreground" />
        </div>
      ) : null}
    </div>
  );
}

export type InputOTPSeparatorProps = React.ComponentProps<"div">;

function InputOTPSeparator({ className, ...props }: InputOTPSeparatorProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      data-slot="input-otp-separator"
      role="separator"
      className={cn("text-muted-foreground", className)}
    >
      <svg
        aria-hidden="true"
        className="size-3 sm:size-4"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5 12H19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
