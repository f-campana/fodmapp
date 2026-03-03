import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Popover",
  component: Popover,
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
    modal: {
      description: "Whether interactions outside should be treated as modal.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    children: {
      description: "PopoverTrigger and PopoverContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    modal: false,
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-36 items-center justify-center">
      <Popover {...args}>
        <PopoverAnchor>Ancre de positionnement</PopoverAnchor>
        <PopoverTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir les details
          </button>
        </PopoverTrigger>
        <PopoverContent>
          Portion recommandee : 120 g maximum.
          <PopoverArrow />
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='popover']");
    const trigger = canvas.getByRole("button", { name: "Ouvrir les details" });
    const anchor = canvas.getByText("Ancre de positionnement");

    await expect(root).toHaveAttribute("data-slot", "popover");
    await expect(trigger).toHaveAttribute("data-slot", "popover-trigger");
    await expect(anchor).toHaveAttribute("data-slot", "popover-anchor");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='popover-content']");
      if (!node) {
        throw new Error("Popover content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector("[data-slot='popover-portal']");
    const arrow = document.body.querySelector(
      "[data-slot='popover-arrow']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "popover-portal");
    await expect(content).toHaveAttribute("data-slot", "popover-content");

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(content.className).toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    await expect(arrow).toHaveAttribute("data-slot", "popover-arrow");
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
      <Popover {...args}>
        <PopoverTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Informations
          </button>
        </PopoverTrigger>
        <PopoverContent>
          Valeur energetique affichee immediatement.
          <PopoverArrow />
        </PopoverContent>
      </Popover>
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
