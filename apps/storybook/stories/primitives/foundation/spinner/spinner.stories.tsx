import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Spinner } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function SpinnerAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-spinner-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Spinner",
  component: Spinner,
  tags: ["autodocs", "batch-l"],
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    docs: {
      description: {
        component:
          "Spinner is decorative by default. Pass `announce` when the spinner itself should create a status live region; otherwise let the surrounding region own busy state, progress detail, and completion messaging.",
      },
    },
    a11y: {
      test: "error",
      context: {
        include: ["[data-spinner-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

function LoadingPanel({
  announce = false,
  label,
  size = "default",
}: {
  announce?: boolean;
  label: string;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <div className="rounded-(--radius) border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Spinner announce={announce} label={label} size={size} />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Export in progress
          </p>
          <p className="text-sm text-muted-foreground">
            CSV rows are still being prepared. Keep nearby text for users who
            need more than a generic loading icon.
          </p>
        </div>
      </div>
    </div>
  );
}

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SpinnerAuditFrame maxWidth="md">
      <LoadingPanel label="Chargement" />
    </SpinnerAuditFrame>
  ),
};

export const InlineAction: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SpinnerAuditFrame maxWidth="sm">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-foreground">
          <Spinner label="Synchronisation en cours" size="sm" />
          Synchronisation en cours
        </div>
      </div>
    </SpinnerAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <SpinnerAuditFrame maxWidth="sm">
      <LoadingPanel announce label="Synchronisation en cours" />
    </SpinnerAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = canvas.getByRole("status", {
      name: "Synchronisation en cours",
    });

    await expect(status).toHaveAttribute("data-slot", "spinner");
    await expect(status).toHaveAttribute("data-size", "default");
    await expect(status).toHaveAttribute("aria-live", "polite");
  },
};
