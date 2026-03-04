import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables trigger interaction when true.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    className: {
      description: "Additional classes merged with collapsible root classes.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "CollapsibleTrigger and CollapsibleContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    disabled: false,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Collapsible {...args} className="w-full max-w-md">
      <CollapsibleTrigger>Voir les substitutions possibles</CollapsibleTrigger>
      <CollapsibleContent>
        Remplacez l&apos;ail par de l&apos;huile infusée pour limiter les
        FODMAP.
      </CollapsibleContent>
    </Collapsible>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", {
      name: "Voir les substitutions possibles",
    });

    await expect(trigger).toHaveAttribute("data-slot", "collapsible-trigger");
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");

    await userEvent.click(trigger);

    const root = trigger.closest("[data-slot='collapsible']");
    const content = canvas
      .getByText(
        "Remplacez l'ail par de l'huile infusée pour limiter les FODMAP.",
      )
      .closest("[data-slot='collapsible-content']");

    await expect(root).toHaveAttribute("data-slot", "collapsible");
    await expect(content).toHaveAttribute("data-slot", "collapsible-content");
    await expect(content?.className ?? "").toContain(
      "data-[state=open]:animate-accordion-down",
    );
  },
};

export const InitiallyOpen: Story = {
  args: {
    defaultOpen: true,
  },
  render: (args) => (
    <Collapsible {...args} className="w-full max-w-md">
      <CollapsibleTrigger>Conseils de préparation</CollapsibleTrigger>
      <CollapsibleContent>
        Faites tremper les légumineuses puis rincez-les abondamment.
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <Collapsible {...args} className="w-full max-w-md">
      <CollapsibleTrigger>Section indisponible</CollapsibleTrigger>
      <CollapsibleContent>Contenu masqué</CollapsibleContent>
    </Collapsible>
  ),
};
