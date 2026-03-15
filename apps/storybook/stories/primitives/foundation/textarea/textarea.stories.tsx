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

import { Textarea } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function TextareaAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-textarea-audit-root="">
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
  placeholder: "Summarize the symptom notes for this meal",
  rows: 4,
} as const;

type TextareaStoryArgs = Pick<
  ComponentProps<typeof Textarea>,
  "className" | "disabled" | "placeholder" | "rows"
> & {
  invalid: boolean;
};

const meta = {
  title: "Primitives/Foundation/Textarea",
  component: Textarea as ComponentType<TextareaStoryArgs>,
  args: defaultPlaygroundArgs,
  argTypes: {
    rows: {
      control: { type: "number", min: 3, max: 8, step: 1 },
      description: "Initial visible row count.",
      table: { defaultValue: { summary: "4" } },
    },
    placeholder: {
      control: "text",
      description: "Secondary hint shown while the field is empty.",
      table: {
        defaultValue: { summary: "Summarize the symptom notes for this meal" },
      },
    },
    disabled: {
      control: { type: "boolean" },
      description: "Disables editing while preserving the multiline layout.",
      table: { defaultValue: { summary: "false" } },
    },
    invalid: {
      control: { type: "boolean" },
      description: "Maps to `aria-invalid` for semantics and styling only.",
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      control: "text",
      description: "Additional classes merged with the textarea styles.",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-textarea-audit-root]"],
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<TextareaStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

function TextareaField({
  description,
  disabled = false,
  invalid = false,
  label,
  placeholder,
  rows = 4,
}: {
  description: string;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
  placeholder: string;
  rows?: number;
}) {
  const textareaId = useId();
  const hintId = `${textareaId}-hint`;
  const errorId = `${textareaId}-error`;
  const [value, setValue] = useState("");

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor={textareaId}
        >
          {label}
        </label>
        <p className="text-sm text-muted-foreground" id={hintId}>
          {description}
        </p>
      </div>
      <Textarea
        aria-describedby={invalid ? `${hintId} ${errorId}` : hintId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        id={textareaId}
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          setValue(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
      {invalid ? (
        <p className="text-validation-error-foreground text-sm" id={errorId}>
          Add the reviewed symptom context before publishing the note.
        </p>
      ) : null}
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <TextareaAuditFrame maxWidth="md">
      <TextareaField
        key={[args.disabled, args.invalid, args.placeholder, args.rows].join(
          ":",
        )}
        description="Use a textarea when the note needs multiple lines and should remain fully editable."
        disabled={args.disabled}
        invalid={args.invalid}
        label="Meal review notes"
        placeholder={
          args.placeholder ?? "Summarize the symptom notes for this meal"
        }
        rows={args.rows ?? 4}
      />
    </TextareaAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TextareaAuditFrame maxWidth="md">
      <TextareaField
        description="Capture the reviewed meal context and symptom summary in one multiline note."
        label="Meal review notes"
        placeholder="Summarize the symptom notes for this meal"
      />
    </TextareaAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Meal review notes" });

    await userEvent.type(textarea, "Symptoms settled after the oat swap.");
    await expect(textarea).toHaveValue("Symptoms settled after the oat swap.");
    await expect(textarea).toHaveAttribute("data-slot", "textarea");
    await expect(textarea.className).toContain("focus-visible:ring-ring-soft");
  },
};

export const Invalid: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TextareaAuditFrame maxWidth="md">
      <TextareaField
        description="Invalid state styling should support surrounding copy without implying built-in validation logic."
        invalid
        label="Meal review notes"
        placeholder="Summarize the symptom notes for this meal"
      />
    </TextareaAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox", { name: "Meal review notes" });

    await expect(textarea).toHaveAttribute("aria-invalid", "true");
    await expect(textarea.className).toContain(
      "aria-invalid:border-validation-error-border",
    );
  },
};

export const Disabled: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TextareaAuditFrame maxWidth="md">
      <TextareaField
        description="Disable the note only while another workflow owns the record."
        disabled
        label="Meal review notes"
        placeholder="Summarize the symptom notes for this meal"
      />
    </TextareaAuditFrame>
  ),
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <TextareaAuditFrame maxWidth="sm">
      <TextareaField
        description="Long labels, helper text, and multiline content should remain readable on compact widths without clipped borders or focus rings."
        label="Detailed meal review notes for the current substitution plan"
        placeholder="Summarize the symptom notes for this meal and mention any tolerated fallback"
        rows={5}
      />
    </TextareaAuditFrame>
  ),
};
