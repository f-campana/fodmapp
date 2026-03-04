import { type ComponentProps, type ComponentType, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@fodmap/ui";

type OTPLayoutProps = Omit<
  ComponentProps<typeof InputOTP>,
  "children" | "render"
>;

const meta = {
  title: "Primitives/Adapter/InputOTP",
  component: InputOTP as ComponentType<OTPLayoutProps>,
  tags: ["autodocs"],
  argTypes: {
    maxLength: {
      description: "Maximum number of characters allowed in the OTP field.",
      control: { type: "number", min: 1, max: 12, step: 1 },
      table: { defaultValue: { summary: "6" } },
    },
    value: {
      description: "Controlled OTP value.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultValue: {
      description: "Initial OTP value for uncontrolled mode.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    disabled: {
      description: "Disables user interaction when true.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      description: "Marks the hidden input as required for form usage.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    pattern: {
      description: "Validation pattern applied to the hidden input.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    onChange: {
      description: "Callback invoked whenever the OTP value changes.",
    },
  },
  args: {
    maxLength: 6,
    disabled: false,
    required: false,
    onChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<OTPLayoutProps>;

export default meta;

type Story = StoryObj<typeof meta>;

function OTPLayout(props: OTPLayoutProps) {
  return (
    <InputOTP aria-label="Code OTP" {...props}>
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

export const Default: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <OTPLayout {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='input-otp']");
    const input = canvas.getByRole("textbox");

    await expect(root).toHaveAttribute("data-slot", "input-otp");
    await expect(
      canvasElement.querySelector("[data-slot='input-otp-group']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='input-otp-slot']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='input-otp-separator']"),
    ).toBeTruthy();

    await userEvent.type(input, "123456");

    await expect(input).toHaveValue("123456");

    const slot = canvasElement.querySelector(
      "[data-slot='input-otp-slot']",
    ) as HTMLElement | null;

    await expect(slot?.className ?? "").toContain("border-input");
    await expect(slot?.className ?? "").toContain(
      "data-[active=true]:border-ring",
    );
    await expect(slot?.className ?? "").toContain(
      "data-[active=true]:ring-ring-soft",
    );
    await expect(slot?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
};

export const Controlled: Story = {
  render: (args) => {
    function ControlledOTP() {
      const [value, setValue] = useState("120340");

      return (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Code actuel: {value}</p>
          <OTPLayout
            {...args}
            onChange={(next) => {
              args.onChange?.(next);
              setValue(next);
            }}
            value={value}
          />
        </div>
      );
    }

    return <ControlledOTP />;
  },
};

export const WithSeparator: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <OTPLayout {...args} />
    </div>
  ),
};

export const InvalidAndDisabled: Story = {
  render: (args) => (
    <div className="w-full max-w-sm">
      <OTPLayout {...args} aria-invalid disabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    const root = canvasElement.querySelector("[data-slot='input-otp']");

    await expect(input).toBeDisabled();
    await expect(root).toHaveAttribute("data-invalid", "true");

    const slot = canvasElement.querySelector(
      "[data-slot='input-otp-slot']",
    ) as HTMLElement | null;

    await expect(slot?.className ?? "").toContain(
      "border-validation-error-border",
    );
  },
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
