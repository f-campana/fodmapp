import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fodmap/ui";

const meta = {
  title: "Primitives/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  argTypes: {
    defaultValue: {
      description: "Sets initial active tab value in uncontrolled mode.",
      control: "text",
      table: { defaultValue: { summary: "ingredients" } },
    },
    orientation: {
      description: "Defines horizontal or vertical tab orientation.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    onValueChange: {
      description: "Callback invoked when active tab changes.",
    },
    className: {
      description: "Additional classes merged with tabs root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "TabsList, TabsTrigger and TabsContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultValue: "ingredients",
    orientation: "horizontal",
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Tabs {...args} className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
        <TabsTrigger value="preparation">Préparation</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients">
        Liste d&apos;ingrédients adaptée aux portions.
      </TabsContent>
      <TabsContent value="preparation">
        Étapes de cuisson et substitutions conseillées.
      </TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const tablist = canvas.getByRole("tablist");
    const trigger = canvas.getByRole("tab", { name: "Ingrédients" });
    const second = canvas.getByRole("tab", { name: "Préparation" });
    const root = tablist.closest("[data-slot='tabs']");

    await expect(root).toHaveAttribute("data-slot", "tabs");
    await expect(tablist).toHaveAttribute("data-slot", "tabs-list");
    await expect(trigger).toHaveAttribute("data-slot", "tabs-trigger");
    await expect(trigger.className).toContain(
      "data-[state=active]:bg-background",
    );
    await expect(trigger.className).toContain(
      "data-[state=active]:text-foreground",
    );
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");

    await userEvent.click(second);
    await expect(args.onValueChange).toHaveBeenCalledWith("preparation");

    const panel = canvas
      .getByText("Étapes de cuisson et substitutions conseillées.")
      .closest("[data-slot='tabs-content']");
    await expect(panel).toHaveAttribute("data-slot", "tabs-content");
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
    onValueChange: fn(),
  },
  render: (args) => (
    <Tabs {...args} className="w-full max-w-md">
      <TabsList>
        <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
        <TabsTrigger value="preparation">Préparation</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients">Ingrédients adaptés</TabsContent>
      <TabsContent value="preparation">Préparation détaillée</TabsContent>
    </Tabs>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
