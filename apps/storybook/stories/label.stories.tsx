import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Label } from "@fodmap/ui";

const meta = {
  title: "Primitives/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    htmlFor: {
      description: "Associates the label with a form control id.",
      control: "text",
      table: { defaultValue: { summary: "champ-email" } },
    },
    children: {
      description: "Text or inline content rendered by the label.",
      control: "text",
      table: { defaultValue: { summary: "Adresse e-mail" } },
    },
    className: {
      description: "Additional classes merged with label classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    htmlFor: "champ-email",
    children: "Adresse e-mail",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="grid max-w-sm gap-2">
      <Label {...args} />
      <input
        id="champ-email"
        className="h-10 rounded-(--radius) border border-input bg-background px-3 text-sm"
        placeholder="nom@exemple.fr"
        type="email"
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Adresse e-mail");
    const label = canvas.getByText("Adresse e-mail");

    await expect(label).toHaveAttribute("data-slot", "label");
    await expect(input).toHaveAttribute("id", "champ-email");
  },
};

export const DisabledPeer: Story = {
  render: () => (
    <div className="grid max-w-sm gap-2">
      <Label htmlFor="champ-desactive">Commentaire</Label>
      <input
        id="champ-desactive"
        className="peer h-10 rounded-(--radius) border border-input bg-background px-3 text-sm"
        disabled
        placeholder="Indisponible"
        type="text"
      />
    </div>
  ),
};
