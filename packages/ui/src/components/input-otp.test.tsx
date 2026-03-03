import { type ComponentProps, createRef, useState } from "react";

import { fireEvent, render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";

describe("InputOTP", () => {
  type InputOTPTestProps = Omit<
    ComponentProps<typeof InputOTP>,
    "children" | "maxLength" | "render"
  >;

  function renderOTP(props?: InputOTPTestProps) {
    return render(
      <InputOTP aria-label="Code OTP" maxLength={6} {...props}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>,
    );
  }

  it("supports uncontrolled input entry and value progression", () => {
    const onChange = vi.fn();

    renderOTP({ onChange });

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "123456" } });

    expect(onChange).toHaveBeenCalled();

    expect(input).toHaveValue("123456");
  });

  it("updates controlled value through callback", () => {
    const onChange = vi.fn();

    function ControlledExample() {
      const [value, setValue] = useState("111111");

      return (
        <>
          <span data-current-value={value} />
          <InputOTP
            aria-label="Code OTP"
            maxLength={6}
            onChange={(next) => {
              setValue(next);
              onChange(next);
            }}
            value={value}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "654321" },
    });

    expect(onChange).toHaveBeenCalledWith("654321");
    expect(container.querySelector("[data-current-value]")).toHaveAttribute(
      "data-current-value",
      "654321",
    );
  });

  it("renders expected slots and separator", () => {
    const { container } = renderOTP();

    expect(container.querySelector("[data-slot='input-otp']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-otp-group']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-otp-slot']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='input-otp-separator']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts for active and invalid slots", () => {
    const { container } = renderOTP({ "aria-invalid": true });

    const root = container.querySelector("[data-slot='input-otp']");
    const slot = container.querySelector(
      "[data-slot='input-otp-slot']",
    ) as HTMLElement | null;

    expect(root).toHaveAttribute("data-invalid", "true");
    expect(slot?.className ?? "").toContain(
      "data-[active=true]:border-validation-error-border",
    );
    expect(slot?.className ?? "").toContain(
      "data-[active=true]:ring-validation-error-ring-soft",
    );
    expect(slot?.className ?? "").toContain("border-validation-error-border");
  });

  it("supports disabled state", () => {
    renderOTP({ disabled: true });

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("merges className on root, group, slot, and separator", () => {
    const { container } = render(
      <InputOTP className="root-personnalisee" maxLength={4}>
        <InputOTPGroup className="group-personnalise">
          <InputOTPSlot className="slot-personnalise" index={0} />
          <InputOTPSlot className="slot-personnalise" index={1} />
        </InputOTPGroup>
        <InputOTPSeparator className="separator-personnalise" />
        <InputOTPGroup className="group-personnalise">
          <InputOTPSlot className="slot-personnalise" index={2} />
          <InputOTPSlot className="slot-personnalise" index={3} />
        </InputOTPGroup>
      </InputOTP>,
    );

    expect(
      container.querySelector("[data-slot='input-otp']")?.className ?? "",
    ).toContain("root-personnalisee");
    expect(
      container.querySelector("[data-slot='input-otp-group']")?.className ?? "",
    ).toContain("group-personnalise");
    expect(
      container.querySelector("[data-slot='input-otp-slot']")?.className ?? "",
    ).toContain("slot-personnalise");
    expect(
      container.querySelector("[data-slot='input-otp-separator']")?.className ??
        "",
    ).toContain("separator-personnalise");
  });

  it("forwards refs to input and slot", () => {
    const inputRef = createRef<HTMLInputElement>();
    const slotRef = createRef<HTMLDivElement>();

    render(
      <InputOTP aria-label="Code OTP" maxLength={3} ref={inputRef}>
        <InputOTPGroup>
          <InputOTPSlot ref={slotRef} index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
      </InputOTP>,
    );

    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(slotRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderOTP();

    expect(await axe(container)).toHaveNoViolations();
  });
});
