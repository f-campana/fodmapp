import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Portal } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function PortalAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-portal-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  children: null,
  disabled: false,
} as const;

const meta = {
  title: "Utilities/Portal",
  component: Portal,
  tags: ["autodocs"],
  argTypes: {
    disabled: {
      description:
        "Render children inline instead of moving them into the target container.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      control: false,
      table: { disable: true },
    },
    children: {
      control: false,
      table: { disable: true },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-portal-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Portal>;

export default meta;

type Story = StoryObj<typeof meta>;

function LocalPortalExample({ args }: { args?: Story["args"] }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <PortalAuditFrame maxWidth="md">
      <div className="grid gap-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Source region</p>
          <div
            className="rounded-(--radius) border border-dashed border-border p-3"
            data-testid="portal-inline-host"
          >
            <p className="text-sm text-muted-foreground">
              The portal is declared here.
            </p>
            <Portal container={container} disabled={args?.disabled}>
              <div
                className="mt-3 rounded-(--radius) border border-border bg-background p-3 text-sm text-foreground shadow-xs"
                data-testid="portal-content"
              >
                Mounted through Portal
              </div>
            </Portal>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Local target</p>
          <div
            className="min-h-20 rounded-(--radius) border border-border bg-muted/40 p-3"
            data-testid="portal-target"
            ref={setContainer}
          />
        </div>
      </div>
    </PortalAuditFrame>
  );
}

export const Playground: Story = {
  render: (args) => <LocalPortalExample args={args} />,
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => <LocalPortalExample args={defaultPlaygroundArgs} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByTestId("portal-target");

    await expect(
      await within(target).findByText("Mounted through Portal"),
    ).toBeInTheDocument();
  },
};

export const DisabledInline: Story = {
  args: {
    ...defaultPlaygroundArgs,
    disabled: true,
  },
  parameters: fixedStoryParameters,
  render: (args) => <LocalPortalExample args={args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inlineHost = canvas.getByTestId("portal-inline-host");
    const target = canvas.getByTestId("portal-target");

    await expect(
      await within(inlineHost).findByText("Mounted through Portal"),
    ).toBeInTheDocument();
    await expect(
      within(target).queryByText("Mounted through Portal"),
    ).toBeNull();
  },
};
