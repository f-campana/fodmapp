import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function AccordionAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-accordion-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const meta = {
  title: "Primitives/Adapter/Accordion",
  component: Accordion,
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
    a11y: {
      test: "error",
      context: {
        include: ["[data-accordion-audit-root]"],
      },
    },
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

function ResponsiveStressAccordion(args: Story["args"]) {
  const disabled = args?.disabled ?? false;
  const dir = args?.dir ?? "ltr";

  return (
    <Accordion
      collapsible
      defaultValue="item-1"
      disabled={disabled}
      dir={dir}
      type="single"
    >
      <AccordionItem value="item-1">
        <AccordionTrigger>
          Quels aliments à faible teneur en FODMAP pouvez-vous préparer à
          l&apos;avance pour un déjeuner transportable pendant une semaine très
          chargée ?
        </AccordionTrigger>
        <AccordionContent>
          Préparez une base simple la veille, répartissez-la en portions
          individuelles et ajoutez au dernier moment les éléments fragiles pour
          conserver une texture agréable et limiter les écarts de tolérance.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          Comment réintroduire progressivement plusieurs légumes cuits sans
          perdre en lisibilité lorsque l&apos;intitulé de la section devient plus
          long sur mobile ?
        </AccordionTrigger>
        <AccordionContent>
          Commencez par une portion modeste, gardez une seule variable nouvelle
          par repas et notez la tolérance sur plusieurs jours avant d&apos;augmenter
          la variété ou le volume.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export const Default: Story = {
  render: (args) => (
    <AccordionAuditFrame maxWidth="xl">
      <DefaultAccordion {...args} />
    </AccordionAuditFrame>
  ),
};

export const OnSurface: Story = {
  render: (args) => (
    <AccordionAuditFrame maxWidth="xl" surface>
      <DefaultAccordion {...args} />
    </AccordionAuditFrame>
  ),
};

export const Multiple: Story = {
  render: () => (
    <AccordionAuditFrame maxWidth="xl">
      <MultipleAccordion />
    </AccordionAuditFrame>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <AccordionAuditFrame maxWidth="xl">
      <CollapsibleAccordion />
    </AccordionAuditFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  render: (args) => (
    <AccordionAuditFrame maxWidth="xl">
      <DefaultAccordion {...args} />
    </AccordionAuditFrame>
  ),
  parameters: {
    docs: {
      disable: true,
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='accordion']");
    const trigger = canvas.getByRole("button", {
      name: "Quels aliments remplacer ?",
    });

    await expect(root).toHaveAttribute("data-slot", "accordion");
    await expect(trigger).toHaveAttribute("data-slot", "accordion-trigger");
    await expect(trigger.className).toContain("cursor-pointer");
    await expect(trigger.className).toContain("min-h-11");
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
    await expect(trigger.className).not.toContain(
      "rounded-[calc(var(--radius)-0.25rem)]",
    );

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

export const ResponsiveStress: Story = {
  render: (args) => (
    <AccordionAuditFrame maxWidth="sm">
      <ResponsiveStressAccordion {...args} />
    </AccordionAuditFrame>
  ),
};
