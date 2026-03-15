import {
  type ChangeEvent,
  type ComponentProps,
  type ComponentType,
  type ReactNode,
  useId,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import { Input } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function InputAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-input-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  disabled: false,
  invalid: false,
  placeholder: "Search ingredient",
  type: "text",
} as const;

type InputStoryArgs = Pick<
  ComponentProps<typeof Input>,
  "className" | "disabled" | "placeholder" | "type"
> & {
  invalid: boolean;
};

const meta = {
  title: "Primitives/Foundation/Input",
  component: Input as ComponentType<InputStoryArgs>,
  args: defaultPlaygroundArgs,
  argTypes: {
    type: {
      control: { type: "inline-radio" },
      description: "Native input type used for entry.",
      options: ["text", "email", "search", "password", "number"],
      table: { defaultValue: { summary: "text" } },
    },
    placeholder: {
      control: "text",
      description: "Short placeholder hint when the field is empty.",
      table: { defaultValue: { summary: "Search ingredient" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Disables editing while keeping the field visible.",
      table: { defaultValue: { summary: "false" } },
    },
    invalid: {
      control: { type: "boolean" },
      description: "Maps to `aria-invalid` for semantics and styling only.",
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      control: "text",
      description: "Additional classes merged with the base field styles.",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-input-audit-root]"],
      },
    },
  },
} satisfies Meta<InputStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function InputField({
  description,
  invalid = false,
  label,
  placeholder,
  type = "text",
  disabled = false,
}: {
  description: string;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
  placeholder: string;
  type?: ComponentProps<typeof Input>["type"];
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const [value, setValue] = useState("");

  const describedBy = invalid ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor={inputId}
        >
          {label}
        </label>
        <p className="text-sm text-muted-foreground" id={hintId}>
          {description}
        </p>
      </div>
      <Input
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        id={inputId}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setValue(event.target.value)
        }
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {invalid ? (
        <p className="text-validation-error-foreground text-sm" id={errorId}>
          Enter the ingredient name before saving the plan.
        </p>
      ) : null}
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <InputAuditFrame maxWidth="md">
      <InputField
        key={[args.disabled, args.invalid, args.placeholder, args.type].join(
          ":",
        )}
        description="Use a visible label and keep the placeholder as a secondary hint."
        disabled={args.disabled}
        invalid={args.invalid}
        label="Ingredient name"
        placeholder={args.placeholder ?? "Search ingredient"}
        type={args.type}
      />
    </InputAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <InputAuditFrame maxWidth="md">
      <InputField
        description="Search for the ingredient to review before choosing a substitution."
        label="Ingredient name"
        placeholder="Search ingredient"
      />
    </InputAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Ingredient name" });

    await userEvent.type(input, "courgette");
    await expect(input).toHaveValue("courgette");
    await expect(input).toHaveAttribute("data-slot", "input");
    await expect(input.className).toContain("focus-visible:border-ring");
    await expect(input.className).toContain("focus-visible:ring-ring-soft");
  },
};

export const Invalid: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <InputAuditFrame maxWidth="md">
      <InputField
        description="Validation copy should stay readable without changing the runtime contract."
        invalid
        label="Ingredient name"
        placeholder="Search ingredient"
      />
    </InputAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Ingredient name" });

    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <InputAuditFrame maxWidth="sm">
      <InputField
        description="Long labels and helper text should stay readable on compact widths while the placeholder remains a short secondary hint."
        label="Preferred ingredient substitution search"
        placeholder="Search ingredient"
      />
    </InputAuditFrame>
  ),
};
