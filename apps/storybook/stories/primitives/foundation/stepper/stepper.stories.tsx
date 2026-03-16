import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperSeparator,
  StepperStep,
} from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function StepperAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-stepper-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Stepper",
  component: Stepper,
  tags: ["batch-l"],
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-stepper-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

function ReviewStepper({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Review packet status
        </p>
        <p className="text-sm text-muted-foreground">
          The stepper reflects status only. Review flow, validation, and
          navigation still belong to the surrounding product logic.
        </p>
      </div>
      <Stepper orientation={orientation}>
        <StepperStep status="completed" step="1">
          <StepperLabel>Batch generated</StepperLabel>
          <StepperDescription>
            Draft materialization and scoring finished
          </StepperDescription>
        </StepperStep>
        <StepperSeparator orientation={orientation} />
        <StepperStep status="current" step="2">
          <StepperLabel>Human review</StepperLabel>
          <StepperDescription>
            CSV decisions are in progress before activation
          </StepperDescription>
        </StepperStep>
        <StepperSeparator orientation={orientation} />
        <StepperStep status="upcoming" step="3">
          <StepperLabel>Activation checks</StepperLabel>
          <StepperDescription>
            Post-activation verification has not started yet
          </StepperDescription>
        </StepperStep>
      </Stepper>
    </div>
  );
}

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <StepperAuditFrame maxWidth="3xl" surface>
      <ReviewStepper orientation="horizontal" />
    </StepperAuditFrame>
  ),
};

export const Vertical: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <StepperAuditFrame maxWidth="md" surface>
      <ReviewStepper orientation="vertical" />
    </StepperAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <StepperAuditFrame maxWidth="3xl" surface>
      <ReviewStepper orientation="horizontal" />
    </StepperAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stepper = canvas
      .getByText("Batch generated")
      .closest("[data-slot='stepper']");
    const currentStep = canvas
      .getByText("Human review")
      .closest("[data-slot='stepper-step']");
    const separator = stepper?.querySelector("[data-slot='stepper-separator']");

    await expect(stepper).toHaveAttribute("data-orientation", "horizontal");
    await expect(currentStep).toHaveAttribute("aria-current", "step");
    await expect(currentStep).toHaveAttribute("data-status", "current");
    await expect(separator).toHaveAttribute("role", "presentation");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <StepperAuditFrame maxWidth="sm" surface>
      <ReviewStepper orientation="horizontal" />
    </StepperAuditFrame>
  ),
};
