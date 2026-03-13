import { type ComponentProps, createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";

Object.defineProperty(document, "elementFromPoint", {
  configurable: true,
  value: vi.fn(() => null),
});

type InputOTPTestProps = Omit<
  ComponentProps<typeof InputOTP>,
  "children" | "maxLength" | "render"
>;

function OTPLayout(props?: InputOTPTestProps) {
  return (
    <InputOTP id="otp-code" aria-label="Code OTP" maxLength={6} {...props}>
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
  );
}

function renderOTP(props?: InputOTPTestProps) {
  return render(
    <div>
      <label htmlFor="otp-code">Code OTP</label>
      <OTPLayout {...props} />
    </div>,
  );
}

function getSlots() {
  return Array.from(
    document.querySelectorAll("[data-slot='input-otp-slot']"),
  ) as HTMLDivElement[];
}

describe("InputOTP", () => {
  it("uses the linked label as its accessible name and advances the active slot as digits are typed", async () => {
    const user = userEvent.setup();

    renderOTP();

    const input = screen.getByRole("textbox", { name: "Code OTP" });
    const slots = getSlots();

    await user.click(input);

    expect(slots[0]).toHaveAttribute("data-active", "true");

    await user.type(input, "12");

    await waitFor(() => {
      expect(slots[2]).toHaveAttribute("data-active", "true");
    });

    expect(input).toHaveValue("12");
    expect(slots[0]).toHaveTextContent("1");
    expect(slots[1]).toHaveTextContent("2");
  });

  it("supports paste entry and updates every rendered slot", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderOTP({ onChange });

    const input = screen.getByRole("textbox", { name: "Code OTP" });

    await user.click(input);
    await user.paste("987654");

    await waitFor(() => {
      expect(input).toHaveValue("987654");
    });

    expect(getSlots().map((slot) => slot.textContent?.trim())).toEqual([
      "9",
      "8",
      "7",
      "6",
      "5",
      "4",
    ]);
    expect(onChange).toHaveBeenLastCalledWith("987654");
  });

  it("updates a controlled value through the change callback", () => {
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

    fireEvent.change(screen.getByRole("textbox", { name: "Code OTP" }), {
      target: { value: "654321" },
    });

    expect(onChange).toHaveBeenCalledWith("654321");
    expect(container.querySelector("[data-current-value]")).toHaveAttribute(
      "data-current-value",
      "654321",
    );
  });

  it("keeps exposed slot markers stable and applies invalid styling tokens", () => {
    const { container } = render(
      <div>
        <label htmlFor="otp-invalid">Code invalide</label>
        <InputOTP
          id="otp-invalid"
          aria-invalid
          aria-label="Code invalide"
          className="root-personnalisee"
          maxLength={4}
        >
          <InputOTPGroup
            className="group-personnalise"
            data-slot="custom-group"
          >
            <InputOTPSlot
              className="slot-personnalise"
              data-slot="custom-slot"
              index={0}
            />
            <InputOTPSlot
              className="slot-personnalise"
              data-slot="custom-slot"
              index={1}
            />
          </InputOTPGroup>
          <InputOTPSeparator
            className="separator-personnalise"
            data-slot="custom-separator"
          />
          <InputOTPGroup
            className="group-personnalise"
            data-slot="custom-group"
          >
            <InputOTPSlot
              className="slot-personnalise"
              data-slot="custom-slot"
              index={2}
            />
            <InputOTPSlot
              className="slot-personnalise"
              data-slot="custom-slot"
              index={3}
            />
          </InputOTPGroup>
        </InputOTP>
      </div>,
    );

    const root = container.querySelector("[data-slot='input-otp']");
    const group = container.querySelector("[data-slot='input-otp-group']");
    const slot = container.querySelector(
      "[data-slot='input-otp-slot']",
    ) as HTMLElement | null;
    const separator = container.querySelector(
      "[data-slot='input-otp-separator']",
    );

    expect(root).toHaveAttribute("data-invalid", "true");
    expect(root?.className ?? "").toContain("root-personnalisee");
    expect(group?.className ?? "").toContain("group-personnalise");
    expect(slot?.className ?? "").toContain("slot-personnalise");
    expect(separator?.className ?? "").toContain("separator-personnalise");

    expect(container.querySelector("[data-slot='custom-group']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-slot']")).toBeNull();
    expect(
      container.querySelector("[data-slot='custom-separator']"),
    ).toBeNull();

    expect(slot?.className ?? "").toContain("border-validation-error-border");
    expect(slot?.className ?? "").toContain(
      "data-[active=true]:border-validation-error-border",
    );
    expect(slot?.className ?? "").toContain(
      "data-[active=true]:ring-validation-error-ring-soft",
    );
  });

  it("supports the disabled state", () => {
    renderOTP({ disabled: true });

    expect(screen.getByRole("textbox", { name: "Code OTP" })).toBeDisabled();
  });

  it("forwards refs to the input and slot", () => {
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
