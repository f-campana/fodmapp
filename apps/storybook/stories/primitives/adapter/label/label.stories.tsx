import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Checkbox, Input, Label } from "@fodmap/ui";

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
    docs: {
      description: {
        component:
          "Label handles visible form-copy association and label styling. Required and disabled semantics still come from the surrounding field and control.",
      },
    },
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
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Form association
        </p>
        <p className="text-sm leading-5 text-muted-foreground">
          Keep the visible label, helper text, and field id aligned so the
          control keeps the same accessible name and supporting context.
        </p>
      </div>
      <div className="grid gap-2">
        <Label {...args} />
        <Input
          aria-describedby={`${inputId}-hint`}
          id={inputId}
          placeholder="name@example.com"
          required
          type="email"
        />
        <p
          className="text-sm leading-5 text-muted-foreground"
          id={`${inputId}-hint`}
        >
          The helper text belongs to the same field id referenced by the label.
        </p>
      </div>
    </div>
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Update the field id and label copy together to confirm the association remains explicit.",
      },
    },
  },
  render: (args) => (
    <LabelAuditFrame maxWidth="md">
      <EmailField args={args} />
    </LabelAuditFrame>
  ),
};

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Required field scenario with helper text and click-to-focus behavior.",
      },
    },
  },
  render: () => (
    <LabelAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Required field
          </p>
          <p className="text-sm leading-5 text-muted-foreground">
            The label keeps the field name visible while the input and helper
            text communicate the required context.
          </p>
        </div>
        <div className="grid gap-2">
          <Label className="justify-between gap-3" htmlFor="patient-email">
            <span>Patient contact email</span>
            <span
              aria-hidden="true"
              className="text-xs font-medium text-destructive"
            >
              Required
            </span>
          </Label>
          <Input
            aria-describedby="patient-email-hint"
            id="patient-email"
            placeholder="patient@example.com"
            required
            type="email"
          />
          <p
            className="text-sm leading-5 text-muted-foreground"
            id="patient-email-hint"
          >
            Use the same field id for the label and helper text so the input
            keeps a stable accessible name and support copy.
          </p>
        </div>
      </div>
    </LabelAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const labelText = canvas.getByText("Patient contact email");
    const label = labelText.closest("label");
    const input = canvas.getByRole("textbox", {
      name: "Patient contact email",
    });

    if (!label) {
      throw new Error(
        "Expected the label text to be wrapped by a label element.",
      );
    }

    await expect(label).toHaveAttribute("data-slot", "label");
    await expect(input).toHaveAttribute("required");
    await expect(input).toHaveAttribute(
      "aria-describedby",
      "patient-email-hint",
    );
    await userEvent.click(label);
    await expect(input).toHaveFocus();
  },
};

export const DisabledField: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Disabled peer example showing the label association and disabled styling contract.",
      },
    },
  },
  render: () => (
    <LabelAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Disabled peer
          </p>
          <p className="text-sm leading-5 text-muted-foreground">
            The label keeps the same association even when the peer control is
            disabled and visually dimmed.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            aria-describedby="sms-reminders-hint"
            checked
            disabled
            id="sms-reminders"
          />
          <div className="space-y-1">
            <Label htmlFor="sms-reminders">SMS reminders</Label>
            <p
              className="text-sm leading-5 text-muted-foreground"
              id="sms-reminders-hint"
            >
              Keep the same field association when this option is temporarily
              unavailable.
            </p>
          </div>
        </div>
      </div>
    </LabelAuditFrame>
  ),
};
