import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Avatar, AvatarFallback, AvatarImage } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function AvatarAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-avatar-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  className: "size-14",
} as const;

const avatarImageSrc = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
    <rect width="96" height="96" fill="#f1e4d7" />
    <circle cx="48" cy="36" r="18" fill="#d2a679" />
    <path d="M18 88c4-18 18-28 30-28s26 10 30 28" fill="#8b5e3c" />
  </svg>
`)}`;

const meta = {
  title: "Primitives/Adapter/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {
    className: {
      description: "Additional classes merged with the avatar root.",
      control: "text",
      table: { defaultValue: { summary: '"size-14"' } },
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
        include: ["[data-avatar-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

function AvatarProfile({
  args,
  description,
  withImage,
}: {
  args?: Story["args"];
  description: string;
  withImage: boolean;
}) {
  return (
    <AvatarAuditFrame centeredMinHeight={72} maxWidth="sm">
      <div className="flex items-center gap-4 rounded-(--radius) border border-border bg-card p-4">
        <Avatar {...args}>
          {withImage ? (
            <AvatarImage alt="Camille profile photo" src={avatarImageSrc} />
          ) : null}
          <AvatarFallback>CF</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Camille Fabre</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </AvatarAuditFrame>
  );
}

export const Playground: Story = {
  render: (args) => (
    <AvatarProfile
      args={args}
      description="Use a loaded image when identity is known and stable."
      withImage
    />
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AvatarProfile
      args={defaultPlaygroundArgs}
      description="The fallback stays in place as a readable backup, but the default story proves the loaded-image path."
      withImage
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const image = await canvas.findByRole("img", {
      name: "Camille profile photo",
    });

    await expect(image).toHaveAttribute("data-slot", "avatar-image");
    await expect(image.closest("[data-slot='avatar']")).toHaveAttribute(
      "data-slot",
      "avatar",
    );
  },
};

export const Fallback: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AvatarProfile
      args={defaultPlaygroundArgs}
      description="Fallback text should stay legible when no image source is available yet."
      withImage={false}
    />
  ),
};
