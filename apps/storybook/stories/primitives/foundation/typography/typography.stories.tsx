import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Typography } from "@fodmapp/ui/typography";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function TypographyAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-typography-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  variant: "p",
  children:
    "Les portions conseillees gardent le contenu lisible sans surcharger la page.",
} as const;

const meta = {
  title: "Primitives/Foundation/Typography",
  component: Typography,
  argTypes: {
    variant: {
      description: "Chooses the text preset and default rendered element.",
      control: { type: "radio" },
      options: [
        "h1",
        "h2",
        "h3",
        "h4",
        "p",
        "blockquote",
        "code",
        "lead",
        "muted",
      ],
      table: { defaultValue: { summary: "p" } },
    },
    children: {
      description: "Text or inline content rendered by the primitive.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description: "Additional classes merged with the selected preset.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    asChild: {
      description:
        "Transfers classes to a child element instead of rendering the default element.",
      control: false,
      table: { defaultValue: { summary: "false" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    docs: {
      description: {
        component:
          "Typography applies text presets and default element mapping. `asChild` only transfers classes and data attributes, so the child element still owns the semantics.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-typography-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

function PlaygroundCard({ args }: { args?: Story["args"] }) {
  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Text preview
        </p>
        <p className="text-sm leading-5 text-muted-foreground">
          Adjust the preset while keeping the same editorial container.
        </p>
      </div>
      <Typography {...args} />
    </div>
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Try the text presets in a stable reading context instead of a disconnected variant wall.",
      },
    },
  },
  render: (args) => (
    <TypographyAuditFrame maxWidth="md">
      <PlaygroundCard args={args} />
    </TypographyAuditFrame>
  ),
};

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Curated editorial stack showing how the primitive is usually composed in real reading surfaces.",
      },
    },
  },
  render: () => (
    <TypographyAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-5">
        <Typography variant="h3">Meal swap summary</Typography>
        <Typography variant="lead">
          A short lead sets the reading rhythm before the detailed guidance.
        </Typography>
        <Typography>
          Keep the body copy plain and readable so the content system remains
          consistent between ingredient notes, plan explanations, and support
          messages.
        </Typography>
        <Typography variant="muted">
          Updated from the latest validated portion guidance.
        </Typography>
      </div>
    </TypographyAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByText("Meal swap summary");

    await expect(heading.tagName).toBe("H3");
    await expect(heading).toHaveAttribute("data-slot", "typography");
    await expect(canvas.getByText(/short lead/i)).toHaveAttribute(
      "data-variant",
      "lead",
    );
  },
};

export const AsChildLink: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "As-child edge case where the design wants heading styling on an existing link element.",
      },
    },
  },
  render: () => (
    <TypographyAuditFrame maxWidth="md">
      <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
        <p className="text-sm leading-5 text-muted-foreground">
          The link keeps link semantics while receiving the chosen typography
          preset.
        </p>
        <Typography asChild variant="h4">
          <a
            className="underline-offset-4 hover:underline"
            href="/guides/meal-swaps"
          >
            Open the meal swap writing guide
          </a>
        </Typography>
      </div>
    </TypographyAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", {
      name: "Open the meal swap writing guide",
    });

    await expect(link).toHaveAttribute("data-slot", "typography");
    await expect(link).toHaveAttribute("data-variant", "h4");
    await expect(link).toHaveAttribute("href", "/guides/meal-swaps");
  },
};
