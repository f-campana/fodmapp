import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@fodmap/ui/item";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ItemAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-item-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Item",
  component: Item,
  tags: ["autodocs"],
  argTypes: {
    asChild: {
      control: false,
      table: { disable: true },
    },
    children: {
      control: false,
      table: { disable: true },
    },
    className: {
      control: false,
      table: { disable: true },
    },
  },
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        component:
          "Item is a low-level row shell for small media, content, and action layouts. It does not add list, button, or navigation semantics on its own.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-item-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Item>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Default structured row for a compact ingredient result with media, supporting copy, and a small trailing action area.",
      },
    },
  },
  render: () => (
    <ItemAuditFrame maxWidth="md">
      <Item>
        <ItemMedia>
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-lg">
            CA
          </div>
        </ItemMedia>
        <ItemContent>
          <ItemHeader>
            <ItemTitle>Carotte rapee</ItemTitle>
            <ItemActions>120 g</ItemActions>
          </ItemHeader>
          <ItemDescription>
            Portion guidee pour une assiette legerement salee.
          </ItemDescription>
        </ItemContent>
      </Item>
    </ItemAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvas
      .getByText("Carotte rapee")
      .closest("[data-slot='item']");

    await expect(root).toHaveAttribute("data-slot", "item");
    await expect(canvas.getByText("120 g")).toHaveAttribute(
      "data-slot",
      "item-actions",
    );
  },
};

export const AsChildLink: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "As-child edge case when the surrounding screen already needs link semantics on the full row.",
      },
    },
  },
  render: () => (
    <ItemAuditFrame maxWidth="md">
      <Item asChild>
        <a
          className="no-underline transition-colors hover:border-primary hover:bg-accent/30"
          href="/ingredients/quinoa"
        >
          <ItemMedia>
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-lg">
              QU
            </div>
          </ItemMedia>
          <ItemContent>
            <ItemHeader>
              <ItemTitle>Quinoa blanc</ItemTitle>
              <ItemActions>Voir</ItemActions>
            </ItemHeader>
            <ItemDescription>
              Open the ingredient detail page from the full row.
            </ItemDescription>
          </ItemContent>
        </a>
      </Item>
    </ItemAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: /quinoa blanc/i });

    await expect(link).toHaveAttribute("data-slot", "item");
    await expect(link).toHaveAttribute("href", "/ingredients/quinoa");
  },
};
