import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Portal } from "@fodmapp/ui/portal";

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
    docs: {
      description: {
        component:
          "Portal mounts children into `document.body` by default inside the preview iframe. Pass a local container only when the destination must stay inside a specific region of the same screen.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: [
          "[data-portal-audit-root]",
          "[data-testid='portal-body-content']",
        ],
      },
    },
  },
} satisfies Meta<typeof Portal>;

export default meta;

type Story = StoryObj<typeof meta>;

function BodyMountedPortalExample() {
  return (
    <PortalAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Default target
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Mounted to the preview body
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Use the default body mount for overlays, toasts, or floating layers
            that should escape the local layout container.
          </p>
        </div>
        <div
          className="rounded-(--radius) border border-dashed border-border p-3"
          data-testid="portal-body-source"
        >
          <p className="text-sm leading-5 text-muted-foreground">
            The portal is declared in this card, but its content should appear
            as a floating layer elsewhere in the preview.
          </p>
          <Portal>
            <div
              className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center px-4"
              data-testid="portal-body-content"
            >
              <div className="max-w-xs rounded-(--radius) border border-border bg-card px-3 py-2 text-sm leading-5 text-foreground shadow-lg">
                Mounted in preview body
              </div>
            </div>
          </Portal>
        </div>
      </div>
    </PortalAuditFrame>
  );
}

function LocalPortalExample({ args }: { args?: Story["args"] }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <PortalAuditFrame maxWidth="xl">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Local container
          </p>
          <p className="text-sm leading-5 text-muted-foreground">
            Pass a container only when the mounted content must stay inside a
            specific region instead of escaping to the preview body.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Source region
            </p>
            <div
              className="rounded-(--radius) border border-dashed border-border p-3"
              data-testid="portal-inline-host"
            >
              <p className="text-sm leading-5 text-muted-foreground">
                The portal is declared here.
              </p>
              <Portal container={container} disabled={args?.disabled}>
                <div
                  className="mt-3 rounded-(--radius) border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground shadow-xs"
                  data-testid="portal-content"
                >
                  Mounted through local container
                </div>
              </Portal>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Local target
            </p>
            <div
              className="min-h-24 rounded-(--radius) border border-border bg-muted/40 p-3"
              data-testid="portal-target"
              ref={setContainer}
            >
              <p className="text-sm leading-5 text-muted-foreground">
                This region receives the portalled content when local mounting
                is enabled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PortalAuditFrame>
  );
}

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Default body mount inside the preview iframe, independent from the source card.",
      },
    },
  },
  render: () => <BodyMountedPortalExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const source = canvas.getByTestId("portal-body-source");
    const previewBody = canvasElement.ownerDocument.body;

    await expect(
      await within(previewBody).findByTestId("portal-body-content"),
    ).toHaveTextContent("Mounted in preview body");
    await expect(
      within(source).queryByTestId("portal-body-content"),
    ).toBeNull();
  },
};

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Use the local-container example to compare portalled mounting with inline fallback when `disabled` is toggled.",
      },
    },
  },
  render: (args) => <LocalPortalExample args={args} />,
};

export const DisabledInline: Story = {
  args: {
    ...defaultPlaygroundArgs,
    disabled: true,
  },
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Disabled portal rendering keeps the content inline instead of moving it into the target container.",
      },
    },
  },
  render: (args) => <LocalPortalExample args={args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inlineHost = canvas.getByTestId("portal-inline-host");
    const target = canvas.getByTestId("portal-target");

    await expect(
      await within(inlineHost).findByText("Mounted through local container"),
    ).toBeInTheDocument();
    await expect(
      within(target).queryByText("Mounted through local container"),
    ).toBeNull();
  },
};
