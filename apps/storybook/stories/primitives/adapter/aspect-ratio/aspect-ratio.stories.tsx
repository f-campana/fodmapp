import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { AspectRatio } from "@fodmapp/ui/aspect-ratio";

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

const recipeImageSrc = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
    <defs>
      <linearGradient id="plate" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f7ede1" />
        <stop offset="100%" stop-color="#e2c4a8" />
      </linearGradient>
    </defs>
    <rect width="1200" height="900" fill="#f5efe7" />
    <rect x="88" y="88" width="1024" height="724" rx="48" fill="url(#plate)" />
    <circle cx="600" cy="450" r="220" fill="#fff8f0" />
    <circle cx="600" cy="450" r="174" fill="#d37a45" />
    <path d="M470 420c42-54 80-78 128-78 70 0 126 44 164 120-48 34-108 56-176 56-42 0-84-14-116-34z" fill="#f4d36f" />
    <circle cx="706" cy="370" r="30" fill="#7e8f49" />
    <circle cx="728" cy="428" r="18" fill="#90a959" />
    <circle cx="666" cy="334" r="20" fill="#90a959" />
    <path d="M430 650c92-32 180-46 264-46s172 14 274 48" stroke="#8b5e3c" stroke-width="28" stroke-linecap="round" opacity="0.24" />
  </svg>
`)}`;

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
    docs: {
      description: {
        component:
          "Use AspectRatio inside a container that already has a real width. The primitive reserves media space; cropping and presentation still come from the parent container and child content.",
      },
    },
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

function EditorialMediaCard({
  alt,
  args,
  caption,
}: {
  alt: string;
  args?: Story["args"];
  caption: string;
}) {
  return (
    <AspectRatioAuditFrame maxWidth="xl">
      <div className="rounded-(--radius) border border-border bg-card p-4 sm:p-5">
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Editorial media slot
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              Recipe card cover image
            </h3>
            <p className="text-sm leading-5 text-muted-foreground">{caption}</p>
          </div>
          <div className="w-full max-w-lg space-y-2">
            <p className="text-sm leading-5 text-muted-foreground">
              Constrained parent width keeps the ratio box predictable before
              the image is loaded.
            </p>
            <div className="overflow-hidden rounded-(--radius) border border-border bg-muted/20 shadow-xs">
              <AspectRatio {...args}>
                <img
                  alt={alt}
                  className="size-full object-cover"
                  src={recipeImageSrc}
                />
              </AspectRatio>
            </div>
          </div>
        </div>
      </div>
    </AspectRatioAuditFrame>
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Adjust the ratio while keeping the same constrained media card so the sizing contract stays honest.",
      },
    },
  },
  render: (args) => (
    <EditorialMediaCard
      alt="Recipe card cover"
      args={args}
      caption="Reserve a stable media block inside a card that already defines the available width."
    />
  ),
};

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Default editorial framing with a 4:3 slot inside a bounded container.",
      },
    },
  },
  render: () => (
    <EditorialMediaCard
      alt="Recipe card cover"
      args={defaultPlaygroundArgs}
      caption="The primitive only reserves space. Border radius, overflow, and object-fit still belong to the surrounding card and image."
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = canvas.getByRole("img", { name: "Recipe card cover" });

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
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Square crops are the practical edge case for thumbnails, avatars, and compact cards.",
      },
    },
  },
  render: (args) => (
    <EditorialMediaCard
      alt="Square recipe thumbnail"
      args={args}
      caption="Switch to a square slot when the same media needs to fit tighter thumbnail and card layouts."
    />
  ),
};
