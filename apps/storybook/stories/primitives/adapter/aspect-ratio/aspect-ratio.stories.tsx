import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { AspectRatio } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function AspectRatioAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-aspect-ratio-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  ratio: 4 / 3,
} as const;

const recipeImageSrc =
  "https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=1200&q=80";

const meta = {
  title: "Primitives/Adapter/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  argTypes: {
    ratio: {
      description: "Width-to-height ratio used to reserve the media box.",
      control: { type: "number", min: 0.5, max: 3, step: 0.1 },
      table: { defaultValue: { summary: "1.333... (4/3)" } },
    },
    className: {
      description: "Additional classes merged with the aspect-ratio root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
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
        include: ["[data-aspect-ratio-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<typeof meta>;

function EditorialImage({
  alt,
  args,
  caption,
}: {
  alt: string;
  args?: Story["args"];
  caption: string;
}) {
  return (
    <AspectRatioAuditFrame maxWidth="md" surface>
      <div className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Editorial media</p>
          <p className="text-sm text-muted-foreground">{caption}</p>
        </div>
        <div className="overflow-hidden rounded-(--radius) border border-border">
          <AspectRatio {...args}>
            <img
              alt={alt}
              className="size-full object-cover"
              src={recipeImageSrc}
            />
          </AspectRatio>
        </div>
      </div>
    </AspectRatioAuditFrame>
  );
}

export const Playground: Story = {
  render: (args) => (
    <EditorialImage
      alt="Recipe detail"
      args={args}
      caption="Keep a defined parent width so the ratio box has a real sizing context before the media loads."
    />
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <EditorialImage
      alt="Recipe detail"
      args={defaultPlaygroundArgs}
      caption="The primitive only reserves space. Cropping and presentation still come from the parent container and child media."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = canvas.getByRole("img", { name: "Recipe detail" });

    await expect(image.closest("[data-slot='aspect-ratio']")).toHaveAttribute(
      "data-slot",
      "aspect-ratio",
    );
  },
};

export const Square: Story = {
  args: {
    ...defaultPlaygroundArgs,
    ratio: 1,
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <EditorialImage
      alt="Square crop"
      args={args}
      caption="Square crops are the main contract edge for avatars, cards, and thumbnail grids."
    />
  ),
};
