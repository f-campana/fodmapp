import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description: "Layout direction of the panel group.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    id: {
      description: "Unique identifier for persisting layouts per panel group.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    disabled: {
      description: "Disables resize interactions.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onLayoutChanged: {
      description: "Callback invoked after layout updates.",
      control: false,
      table: { type: { summary: "(layout: Layout) => void" } },
    },
    children: {
      description: "Panel and handle composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    orientation: "horizontal",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: (args) => (
    <div className="flex min-h-96 items-center justify-center">
      <ResizablePanelGroup
        {...args}
        className="h-72 w-full max-w-3xl rounded-(--radius) border border-border"
      >
        <ResizablePanel defaultSize={45}>
          <div className="flex h-full items-center justify-center bg-card text-sm">
            Panneau gauche
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55}>
          <div className="flex h-full items-center justify-center bg-card text-sm">
            Panneau droit
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvasElement.querySelector(
      "[data-slot='resizable-panel-group']",
    );
    const panel = canvasElement.querySelector("[data-slot='resizable-panel']");
    const handle = canvasElement.querySelector(
      "[data-slot='resizable-handle']",
    ) as HTMLElement | null;
    const grip = canvasElement.querySelector(
      "[data-slot='resizable-handle-grip']",
    );

    await expect(group).toHaveAttribute("data-slot", "resizable-panel-group");
    await expect(panel).toHaveAttribute("data-slot", "resizable-panel");
    await expect(handle).toHaveAttribute("data-slot", "resizable-handle");
    await expect(grip).toHaveAttribute("data-slot", "resizable-handle-grip");

    await expect(handle?.className ?? "").toContain(
      "data-[panel-group-direction=horizontal]:h-px",
    );
    await expect(handle?.className ?? "").toContain(
      "focus-visible:ring-ring-soft",
    );
    await expect(handle?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );

    await expect(canvas.getByText("Panneau gauche")).toBeInTheDocument();
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div className="flex min-h-96 items-center justify-center">
      <ResizablePanelGroup
        {...args}
        className="h-96 w-full max-w-md rounded-(--radius) border border-border"
      >
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-card text-sm">
            Panneau haut
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50}>
          <div className="flex h-full items-center justify-center bg-card text-sm">
            Panneau bas
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

export const WithHandle: Story = {
  ...Horizontal,
};

export const DarkMode: Story = {
  ...Horizontal,
  globals: {
    theme: "dark",
  },
};
