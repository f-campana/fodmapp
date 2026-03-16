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

import { NativeSelect } from "@fodmapp/ui/native-select";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function NativeSelectAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-native-select-audit-root="">
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
  value: "rice",
} as const;

type NativeSelectStoryArgs = Pick<
  ComponentProps<typeof NativeSelect>,
  "className" | "disabled"
> & {
  invalid: boolean;
  value: "rice" | "oats" | "quinoa";
};

const meta = {
  title: "Primitives/Foundation/NativeSelect",
  component: NativeSelect as ComponentType<NativeSelectStoryArgs>,
  args: defaultPlaygroundArgs,
  argTypes: {
    value: {
      control: { type: "select" },
      description: "Current selected option in the story harness.",
      options: ["rice", "oats", "quinoa"],
      table: { defaultValue: { summary: "rice" } },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Disables the native control.",
      table: { defaultValue: { summary: "false" } },
    },
    invalid: {
      control: { type: "boolean" },
      description: "Maps to `aria-invalid` for semantics and styling only.",
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      control: "text",
      description: "Additional classes merged with the native select styles.",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-native-select-audit-root]"],
      },
    },
  },
} satisfies Meta<NativeSelectStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function NativeSelectField({
  description,
  disabled = false,
  invalid = false,
  label,
  value = "rice",
}: {
  description: string;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
  value?: "rice" | "oats" | "quinoa";
}) {
  const selectId = useId();
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const [currentValue, setCurrentValue] = useState(value);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor={selectId}
        >
          {label}
        </label>
        <p className="text-sm text-muted-foreground" id={hintId}>
          {description}
        </p>
      </div>
      <NativeSelect
        aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        id={selectId}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          setCurrentValue(event.target.value as "rice" | "oats" | "quinoa")
        }
        value={currentValue}
      >
        <option value="rice">Rice</option>
        <option value="oats">Oats</option>
        <option value="quinoa">Quinoa</option>
      </NativeSelect>
      {invalid ? (
        <p className="text-validation-error-foreground text-sm" id={errorId}>
          Choose one reviewed option before saving.
        </p>
      ) : null}
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <NativeSelectAuditFrame maxWidth="md">
      <NativeSelectField
        key={[args.disabled, args.invalid, args.value].join(":")}
        description="Use the native browser picker when the option set is short and straightforward."
        disabled={args.disabled}
        invalid={args.invalid}
        label="Fallback grain"
        value={args.value}
      />
    </NativeSelectAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NativeSelectAuditFrame maxWidth="md">
      <NativeSelectField
        description="Choose the reviewed fallback grain for this recipe."
        label="Fallback grain"
        value="rice"
      />
    </NativeSelectAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: "Fallback grain" });

    await userEvent.selectOptions(select, "oats");
    await expect(select).toHaveValue("oats");
    await expect(select).toHaveAttribute("data-slot", "native-select");
    await expect(select.className).toContain("text-base");
    await expect(select.className).toContain("focus-visible:ring-ring-soft");
  },
};

export const Invalid: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NativeSelectAuditFrame maxWidth="md">
      <NativeSelectField
        description="The field itself only exposes semantics and styling for invalid state."
        invalid
        label="Fallback grain"
        value="rice"
      />
    </NativeSelectAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("combobox", { name: "Fallback grain" });

    await expect(select).toHaveAttribute("aria-invalid", "true");
    await expect(select.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
  },
};

export const Disabled: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NativeSelectAuditFrame maxWidth="md">
      <NativeSelectField
        description="Disable the field only when the choice is temporarily locked."
        disabled
        label="Fallback grain"
        value="rice"
      />
    </NativeSelectAuditFrame>
  ),
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <NativeSelectAuditFrame maxWidth="sm">
      <NativeSelectField
        description="Longer labels and helper text should stay readable while the native control surface keeps its browser-default affordances."
        label="Preferred fallback grain after symptom review"
        value="quinoa"
      />
    </NativeSelectAuditFrame>
  ),
};
