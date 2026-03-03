import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls open state in controlled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    openDelay: {
      description: "Delay in ms before opening on hover/focus.",
      control: { type: "number" },
      table: { defaultValue: { summary: "700" } },
    },
    closeDelay: {
      description: "Delay in ms before closing after pointer leave.",
      control: { type: "number" },
      table: { defaultValue: { summary: "300" } },
    },
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    children: {
      description: "HoverCardTrigger and HoverCardContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    openDelay: 0,
    closeDelay: 0,
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <HoverCard {...args}>
        <HoverCardTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Voir la fiche aliment
          </button>
        </HoverCardTrigger>
        <HoverCardContent>
          Faible en FODMAP a portion standard.
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='hover-card']");
    const trigger = canvas.getByRole("button", {
      name: "Voir la fiche aliment",
    });

    await expect(root).toHaveAttribute("data-slot", "hover-card");
    await expect(trigger).toHaveAttribute("data-slot", "hover-card-trigger");

    await userEvent.hover(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='hover-card-content']",
      );
      if (!node) {
        throw new Error("Hover card content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector(
      "[data-slot='hover-card-portal']",
    );
    const arrow = document.body.querySelector(
      "[data-slot='hover-card-arrow']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "hover-card-portal");
    await expect(content).toHaveAttribute("data-slot", "hover-card-content");

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(content.className).toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    await expect(arrow).toHaveAttribute("data-slot", "hover-card-arrow");
    const arrowClassName = arrow?.getAttribute("class") ?? "";
    await expect(arrowClassName).toContain("fill-popover");
    await expect(arrowClassName).toContain("stroke-border");
  },
};

export const DefaultOpen: Story = {
  args: {
    defaultOpen: true,
    onOpenChange: fn(),
  },
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <HoverCard {...args}>
        <HoverCardTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Profil
          </button>
        </HoverCardTrigger>
        <HoverCardContent>
          Contenu visible au chargement.
          <HoverCardArrow />
        </HoverCardContent>
      </HoverCard>
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  args: {
    ...Default.args,
    onOpenChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
