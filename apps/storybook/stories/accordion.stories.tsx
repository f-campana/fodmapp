import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fodmap/ui";

import { StoryFrame } from "./story-frame";

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
      table: { defaultValue: { summary: "true" } },
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
    layout: "padded",
  },
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<typeof meta>;

function DefaultAccordion(args: Story["args"]) {
  const disabled = args?.disabled ?? false;
  const dir = args?.dir ?? "ltr";
  const collapsible =
    args && "collapsible" in args ? (args.collapsible ?? true) : true;

  if (args?.type === "multiple") {
    return (
      <Accordion disabled={disabled} dir={dir} type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Quels aliments remplacer ?</AccordionTrigger>
          <AccordionContent>
            Remplacez l&apos;oignon par de la ciboulette pour limiter les
            FODMAP.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Comment préparer les légumes ?</AccordionTrigger>
          <AccordionContent>
            Faites une cuisson douce et testez des portions progressives.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Accordion
      collapsible={collapsible}
      disabled={disabled}
      dir={dir}
      type="single"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>Quels aliments remplacer ?</AccordionTrigger>
        <AccordionContent>
          Remplacez l&apos;oignon par de la ciboulette pour limiter les FODMAP.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Comment préparer les légumes ?</AccordionTrigger>
        <AccordionContent>
          Faites une cuisson douce et testez des portions progressives.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MultipleAccordion() {
  return (
    <Accordion defaultValue={["item-1"]} type="multiple">
      <AccordionItem value="item-1">
        <AccordionTrigger>Petit déjeuner</AccordionTrigger>
        <AccordionContent>
          Favorisez les portions mesurées en début de journée.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Déjeuner</AccordionTrigger>
        <AccordionContent>
          Privilégiez une base simple et ajoutez les fibres progressivement.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function CollapsibleAccordion() {
  return (
    <Accordion collapsible defaultValue="item-1" type="single">
      <AccordionItem value="item-1">
        <AccordionTrigger>Plan de la semaine</AccordionTrigger>
        <AccordionContent>
          Organisez vos repas en avance pour éviter les choix impulsifs.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const Default: Story = {
  render: (args) => (
    <StoryFrame maxWidth="xl">
      <DefaultAccordion {...args} />
    </StoryFrame>
  ),
  play: async ({ canvasElement, args }) => {
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

    if (args.type === "single" && args.collapsible) {
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute("data-state", "closed");
    }
  },
};

export const OnSurface: Story = {
  render: (args) => (
    <StoryFrame maxWidth="xl" surface>
      <DefaultAccordion {...args} />
    </StoryFrame>
  ),
};

export const Multiple: Story = {
  render: () => (
    <StoryFrame maxWidth="xl">
      <MultipleAccordion />
    </StoryFrame>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <StoryFrame maxWidth="xl">
      <CollapsibleAccordion />
    </StoryFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
