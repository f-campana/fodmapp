import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    type: {
      description: "Accordion mode: one item or many items opened at a time.",
      control: { type: "inline-radio" },
      options: ["single", "multiple"],
      table: { defaultValue: { summary: "single" } },
    },
    collapsible: {
      description: "Allows closing an opened item in single mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables all accordion items when true.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    children: {
      description: "AccordionItem composition with trigger and content.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    type: "single",
    collapsible: true,
    disabled: false,
    dir: "ltr",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
      <Accordion collapsible dir="ltr" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Quels aliments remplacer ?</AccordionTrigger>
          <AccordionContent>
            Remplacez l&apos;oignon par de la ciboulette pour limiter les
            FODMAP.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Comment preparer les legumes ?</AccordionTrigger>
          <AccordionContent>
            Faites une cuisson douce et testez des portions progressives.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='accordion']");
    const trigger = canvas.getByRole("button", {
      name: "Quels aliments remplacer ?",
    });

    await expect(root).toHaveAttribute("data-slot", "accordion");
    await expect(trigger).toHaveAttribute("data-slot", "accordion-trigger");
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");

    await userEvent.click(trigger);

    const content = canvas
      .getByText(
        "Remplacez l'oignon par de la ciboulette pour limiter les FODMAP.",
      )
      .closest("[data-slot='accordion-content']");
    const contentInner = canvas
      .getByText(
        "Remplacez l'oignon par de la ciboulette pour limiter les FODMAP.",
      )
      .closest("[data-slot='accordion-content-inner']");

    await expect(content).toHaveAttribute("data-slot", "accordion-content");
    await expect(contentInner).toHaveAttribute(
      "data-slot",
      "accordion-content-inner",
    );
    await expect(content?.className ?? "").toContain(
      "data-[state=open]:animate-accordion-down",
    );
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
      <Accordion defaultValue={["item-1"]} type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Petit dejeuner</AccordionTrigger>
          <AccordionContent>
            Favorisez les portions mesurees en debut de journee.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Dejeuner</AccordionTrigger>
          <AccordionContent>
            Privilegiez une base simple et ajoutez les fibres progressivement.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
      <Accordion collapsible defaultValue="item-1" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Plan de la semaine</AccordionTrigger>
          <AccordionContent>
            Organisez vos repas en avance pour eviter les choix impulsifs.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
