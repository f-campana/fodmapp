import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Label } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function LabelAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-label-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  htmlFor: "contact-email",
  children: "Contact email",
} as const;

const meta = {
  title: "Primitives/Adapter/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    htmlFor: {
      description: "Associates the label with a form control id.",
      control: "text",
      table: { defaultValue: { summary: '"contact-email"' } },
    },
    children: {
      description: "Visible copy rendered inside the label.",
      control: "text",
      table: { defaultValue: { summary: '"Contact email"' } },
    },
    className: {
      description: "Additional classes merged with the label root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-label-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

function EmailField({ args }: { args?: Story["args"] }) {
  const inputId = args?.htmlFor ?? defaultPlaygroundArgs.htmlFor;

  return (
    <div className="grid gap-2 rounded-(--radius) border border-border bg-card p-4">
      <Label {...args} />
      <input
        aria-describedby={`${inputId}-hint`}
        className="h-10 rounded-(--radius) border border-input bg-background px-3 text-sm"
        id={inputId}
        placeholder="name@example.com"
        required
        type="email"
      />
      <p className="text-sm text-muted-foreground" id={`${inputId}-hint`}>
        Keep the visible label tied to the same field id that owns the input
        requirement and helper text.
      </p>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <LabelAuditFrame maxWidth="md">
      <EmailField args={args} />
    </LabelAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <LabelAuditFrame maxWidth="md">
      <div className="grid gap-2 rounded-(--radius) border border-border bg-card p-4">
        <Label className="justify-between gap-3" htmlFor="patient-email">
          <span>Patient contact email</span>
          <span aria-hidden="true" className="text-destructive">
            Required
          </span>
        </Label>
        <input
          aria-describedby="patient-email-hint"
          className="h-10 rounded-(--radius) border border-input bg-background px-3 text-sm"
          id="patient-email"
          placeholder="patient@example.com"
          required
          type="email"
        />
        <p className="text-sm text-muted-foreground" id="patient-email-hint">
          Required state is still communicated by the surrounding form, while
          the label keeps the field association explicit.
        </p>
      </div>
    </LabelAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const labelText = canvas.getByText("Patient contact email");
    const label = labelText.closest("label");
    const input = canvas.getByPlaceholderText("patient@example.com");

    if (!label) {
      throw new Error(
        "Expected the label text to be wrapped by a label element.",
      );
    }

    await expect(label).toHaveAttribute("data-slot", "label");
    await userEvent.click(label);
    await expect(input).toHaveFocus();
  },
};

export const DisabledField: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <LabelAuditFrame maxWidth="md">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <input
            checked
            className="peer size-4 rounded border border-input accent-foreground"
            disabled
            id="sms-reminders"
            readOnly
            type="checkbox"
          />
          <Label htmlFor="sms-reminders">SMS reminders</Label>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          The label keeps the same association while the peer-disabled styling
          contract stays visible in the disabled row.
        </p>
      </div>
    </LabelAuditFrame>
  ),
};
