import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import { Avatar, AvatarFallback, AvatarImage } from "@fodmapp/ui";

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
    <circle cx="48" cy="32" r="18" fill="#d2a679" />
    <path d="M16 84c6-16 18-24 32-24s26 8 32 24" fill="#8b5e3c" />
    <path d="M26 25c4-8 11-14 22-14 12 0 22 7 26 18-4-2-9-3-14-3-13 0-24 5-34 13z" fill="#6f472b" />
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
    docs: {
      description: {
        component:
          "Avatar provides the circular media slot and fallback container. The surrounding layout still decides how identity details, status copy, and loading states are presented.",
      },
    },
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

function CareTeamRow({
  args,
  description,
  withImage,
}: {
  args?: Story["args"];
  description: string;
  withImage: boolean;
}) {
  return (
    <AvatarAuditFrame maxWidth="md">
      <div className="rounded-(--radius) border border-border bg-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar {...args}>
            {withImage ? (
              <AvatarImage alt="Camille profile photo" src={avatarImageSrc} />
            ) : null}
            <AvatarFallback>CF</AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Care plan owner
            </p>
            <p className="text-sm font-semibold text-foreground">
              Camille Fabre
            </p>
            <p className="text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>
    </AvatarAuditFrame>
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Resize the avatar while keeping the same profile-row context so the identity layout stays readable.",
      },
    },
  },
  render: (args) => (
    <CareTeamRow
      args={args}
      description="Use the loaded image path when identity is known and the profile photo is available."
      withImage
    />
  ),
};

export const Default: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story: "Default loaded-image state inside a responsive profile row.",
      },
    },
  },
  render: () => (
    <CareTeamRow
      args={defaultPlaygroundArgs}
      description="A profile photo can replace the fallback while the row keeps the surrounding person details readable on narrow and wide layouts."
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
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Fallback initials stay readable when the image has not loaded or no photo exists for the record.",
      },
    },
  },
  render: () => (
    <CareTeamRow
      args={defaultPlaygroundArgs}
      description="Fallback initials remain the visible identity cue while the record is pending a profile image or the image source is unavailable."
      withImage={false}
    />
  ),
};
