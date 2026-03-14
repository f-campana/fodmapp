import {
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function InputOTPAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-input-otp-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

type InputOTPStoryArgs = Pick<
  ComponentProps<typeof InputOTP>,
  | "aria-invalid"
  | "defaultValue"
  | "disabled"
  | "onChange"
  | "pattern"
  | "required"
> & {
  maxLength: number;
};

const defaultPlaygroundArgs = {
  "aria-invalid": false,
  defaultValue: "",
  disabled: false,
  maxLength: 6,
  onChange: fn(),
  pattern: undefined,
  required: false,
} satisfies InputOTPStoryArgs;

function renderSlots({
  groupDataSlot,
  maxLength,
  separatorDataSlot,
  slotDataSlot,
}: {
  groupDataSlot?: string;
  maxLength: number;
  separatorDataSlot?: string;
  slotDataSlot?: string;
}) {
  const leadingLength = Math.ceil(maxLength / 2);
  const trailingLength = maxLength - leadingLength;

  return (
    <>
      <InputOTPGroup data-slot={groupDataSlot}>
        {Array.from({ length: leadingLength }, (_, index) => (
          <InputOTPSlot data-slot={slotDataSlot} index={index} key={index} />
        ))}
      </InputOTPGroup>
      {trailingLength > 0 ? (
        <>
          <InputOTPSeparator data-slot={separatorDataSlot} />
          <InputOTPGroup data-slot={groupDataSlot}>
            {Array.from({ length: trailingLength }, (_, index) => {
              const slotIndex = index + leadingLength;

              return (
                <InputOTPSlot
                  data-slot={slotDataSlot}
                  index={slotIndex}
                  key={slotIndex}
                />
              );
            })}
          </InputOTPGroup>
        </>
      ) : null}
    </>
  );
}

function getInputOTPFieldKey(args?: InputOTPStoryArgs) {
  return [
    args?.defaultValue ?? defaultPlaygroundArgs.defaultValue,
    args?.maxLength ?? defaultPlaygroundArgs.maxLength,
  ].join(":");
}

function InputOTPField({
  args,
  description,
  groupDataSlot,
  slotDataSlot,
  separatorDataSlot,
}: {
  args?: InputOTPStoryArgs;
  description: string;
  groupDataSlot?: string;
  separatorDataSlot?: string;
  slotDataSlot?: string;
}) {
  const [value, setValue] = useState(args?.defaultValue ?? "");

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="otp-story"
        >
          Code de verification
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">
        <InputOTP
          {...args}
          id="otp-story"
          maxLength={args?.maxLength ?? 6}
          onChange={(nextValue) => {
            setValue(nextValue);
            args?.onChange?.(nextValue);
          }}
        >
          {renderSlots({
            groupDataSlot,
            maxLength: args?.maxLength ?? 6,
            separatorDataSlot,
            slotDataSlot,
          })}
        </InputOTP>
        <p
          className="text-sm text-muted-foreground"
          data-current-value={value || "empty"}
        >
          Code saisi: {value || "aucun"}
        </p>
      </div>
    </div>
  );
}

const meta = {
  title: "Primitives/Adapter/InputOTP",
  component: InputOTP as ComponentType<InputOTPStoryArgs>,
  argTypes: {
    maxLength: {
      description: "Maximum number of characters accepted by the OTP input.",
      control: { type: "number", min: 4, max: 8, step: 1 },
      table: { defaultValue: { summary: "6" } },
    },
    defaultValue: {
      description: "Initial OTP value for uncontrolled usage.",
      control: { type: "text" },
      table: { defaultValue: { summary: '""' } },
    },
    disabled: {
      description:
        "Disables user input while keeping the grouped slots visible.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      description: "Marks the hidden input as required for form submission.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    pattern: {
      description: "Validation pattern applied to the hidden input element.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    "aria-invalid": {
      description: "Applies error styling tokens to the grouped slots.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onChange: {
      description: "Callback fired whenever the OTP value changes.",
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: [
        "maxLength",
        "defaultValue",
        "disabled",
        "required",
        "pattern",
        "aria-invalid",
      ],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-input-otp-audit-root]"],
      },
    },
  },
} satisfies Meta<InputOTPStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <InputOTPAuditFrame maxWidth="md">
      <InputOTPField
        args={args}
        description="Use grouped slots when the verification code is short enough to scan at a glance."
        key={getInputOTPFieldKey(args)}
      />
    </InputOTPAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <InputOTPAuditFrame maxWidth="md">
      <InputOTPField
        args={defaultPlaygroundArgs}
        description="The visible groups mirror one hidden input so form libraries still receive a single string value."
        key={getInputOTPFieldKey(defaultPlaygroundArgs)}
      />
    </InputOTPAuditFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <InputOTPAuditFrame maxWidth="md">
      <InputOTPField
        args={args}
        description="Verify linked labeling, grouped slot stability, and focus progression."
        groupDataSlot="custom-group"
        key={getInputOTPFieldKey(args)}
        separatorDataSlot="custom-separator"
        slotDataSlot="custom-slot"
      />
    </InputOTPAuditFrame>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", {
      name: "Code de verification",
    });
    const root = canvasElement.querySelector("[data-slot='input-otp']");
    const slots = Array.from(
      canvasElement.querySelectorAll("[data-slot='input-otp-slot']"),
    ) as HTMLDivElement[];

    await expect(root).toHaveAttribute("data-slot", "input-otp");
    await expect(
      canvasElement.querySelector("[data-slot='input-otp-group']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='input-otp-separator']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='custom-group']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='custom-slot']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='custom-separator']"),
    ).toBeNull();

    await userEvent.click(input);
    await expect(slots[0]).toHaveAttribute("data-active", "true");

    await userEvent.type(input, "12");

    await waitFor(() => {
      if (slots[2]?.getAttribute("data-active") !== "true") {
        throw new Error("The third slot is not active yet.");
      }
    });

    await expect(slots[0]).toHaveTextContent("1");
    await expect(slots[1]).toHaveTextContent("2");
    await expect(
      canvasElement.querySelector("[data-current-value]"),
    ).toHaveAttribute("data-current-value", "12");
    await expect(args.onChange).toHaveBeenLastCalledWith("12");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <InputOTPAuditFrame maxWidth="sm">
      <div className="w-full max-w-[15rem] sm:max-w-[17rem]">
        <InputOTPField
          args={{
            ...defaultPlaygroundArgs,
            defaultValue: "120340",
            onChange: fn(),
          }}
          description="Keep the grouped slots and the supporting copy readable when the verification help text needs to explain a fallback delivery path on compact screens."
          key={getInputOTPFieldKey({
            ...defaultPlaygroundArgs,
            defaultValue: "120340",
            onChange: fn(),
          })}
        />
      </div>
    </InputOTPAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector(
      "[data-slot='input-otp']",
    ) as HTMLDivElement | null;

    if (!root) {
      throw new Error("InputOTP root is missing.");
    }

    const slots = Array.from(
      canvasElement.querySelectorAll("[data-slot='input-otp-slot']"),
    ) as HTMLDivElement[];

    await waitFor(() => {
      if (root.scrollWidth > root.clientWidth) {
        throw new Error("InputOTP overflows its compact stress harness.");
      }
    });

    await expect(slots[0]).toHaveTextContent("1");
    await expect(slots[5]).toHaveTextContent("0");
  },
};
