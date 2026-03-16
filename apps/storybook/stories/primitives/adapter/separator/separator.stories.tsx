import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Separator } from "@fodmapp/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function SeparatorAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-separator-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  decorative: true,
  orientation: "horizontal",
} as const;

const meta = {
  title: "Primitives/Adapter/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description: "Sets the separator direction.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: '"horizontal"' } },
    },
    decorative: {
      description:
        "Hide the semantic separator role when the divider is only visual.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    className: {
      description: "Additional classes merged with the separator root.",
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
          "Decorative separators should stay hidden from assistive technologies. Only switch to semantic separators when the divider represents real structure between related regions.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-separator-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<typeof meta>;

function HorizontalSection({ args }: { args?: Story["args"] }) {
  return (
    <SeparatorAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Decorative divider
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Preparation notes
          </h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Decorative separators help scan nearby content without adding a
            semantic landmark.
          </p>
        </div>
        <Separator
          {...args}
          className={[args?.className, "my-1"].filter(Boolean).join(" ")}
        />
        <p className="text-sm leading-5 text-muted-foreground">
          Keep this mode purely visual when the surrounding heading hierarchy
          already conveys the structure.
        </p>
      </div>
    </SeparatorAuditFrame>
  );
}

function VerticalSection({ args }: { args?: Story["args"] }) {
  const semanticSeparatorClassName = [
    "mx-1 h-auto min-h-16 self-stretch w-[2px] bg-border",
    args?.className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SeparatorAuditFrame maxWidth="md">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Semantic divider
            </p>
            <p className="text-sm leading-5 text-muted-foreground">
              Use a non-decorative vertical separator only when it represents a
              meaningful split between related regions.
            </p>
          </div>
          <div className="flex items-stretch gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground">Plan</p>
              <p className="text-sm leading-5 text-muted-foreground">
                Confirm the substitution note before publishing.
              </p>
            </div>
            <Separator {...args} className={semanticSeparatorClassName} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold text-foreground">Review</p>
              <p className="text-sm leading-5 text-muted-foreground">
                Expose a real separator only when the split carries meaning.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SeparatorAuditFrame>
  );
}

function SeparatorExample({ args }: { args?: Story["args"] }) {
  const orientation = args?.orientation ?? defaultPlaygroundArgs.orientation;

  return orientation === "vertical" ? (
    <VerticalSection args={args} />
  ) : (
    <HorizontalSection args={args} />
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Adjust orientation and decorative mode in a realistic layout instead of an isolated divider sample.",
      },
    },
  },
  render: (args) => <SeparatorExample args={args} />,
};

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Default decorative horizontal divider inside a content section.",
      },
    },
  },
  render: () => <HorizontalSection args={defaultPlaygroundArgs} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole("separator")).toBeNull();
  },
};

export const SemanticVertical: Story = {
  args: {
    ...defaultPlaygroundArgs,
    decorative: false,
    orientation: "vertical",
  },
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Vertical semantic divider for a real structural split between adjacent regions.",
      },
    },
  },
  render: (args) => <VerticalSection args={args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const separator = canvas.getByRole("separator");

    await expect(separator).toHaveAttribute("data-slot", "separator");
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
  },
};
