import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls tooltip open state in controlled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    onOpenChange: {
      description: "Callback invoked when tooltip open state changes.",
    },
    children: {
      description: "TooltipTrigger and TooltipContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-24 items-center justify-center">
      <TooltipProvider delayDuration={0}>
        <Tooltip {...args}>
          <TooltipTrigger asChild>
            <button
              className="rounded-(--radius) border border-border bg-card px-3 py-1.5 text-sm"
              type="button"
            >
              Aide contextuelle
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Vérifiez la portion pour limiter la charge en FODMAP.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Aide contextuelle" });

    await expect(trigger).toHaveAttribute("data-slot", "tooltip-trigger");

    await userEvent.hover(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='tooltip-content']");
      if (!node) {
        throw new Error("Tooltip content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(content).toHaveAttribute("data-slot", "tooltip-content");
    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(content.className).toContain(
      "data-[state=closed]:animate-out",
    );

    const root = canvasElement.querySelector("[data-slot='tooltip']");
    const provider = canvasElement.querySelector(
      "[data-slot='tooltip-provider']",
    );
    await expect(root).toHaveAttribute("data-slot", "tooltip");
    await expect(provider).toHaveAttribute("data-slot", "tooltip-provider");
  },
};

export const DefaultOpen: Story = {
  args: {
    defaultOpen: true,
    onOpenChange: fn(),
  },
  render: (args) => (
    <div className="flex min-h-24 items-center justify-center">
      <TooltipProvider delayDuration={0}>
        <Tooltip {...args}>
          <TooltipTrigger asChild>
            <button
              className="rounded-(--radius) border border-border bg-card px-3 py-1.5 text-sm"
              type="button"
            >
              Information
            </button>
          </TooltipTrigger>
          <TooltipContent>Conseil visible au chargement.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
