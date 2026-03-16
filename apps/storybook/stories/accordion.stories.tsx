import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fodmapp/ui/accordion";

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

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  type: "single",
  collapsible: true,
  disabled: false,
  dir: "ltr",
} as const;

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
      if: { arg: "type", eq: "single" },
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
  args: defaultPlaygroundArgs,
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

export const Playground: Story = {
  render: (args) => (
    <AccordionAuditFrame maxWidth="xl">
      <DefaultAccordion {...args} />
    </AccordionAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AccordionAuditFrame maxWidth="xl">
      <DefaultAccordion {...defaultPlaygroundArgs} />
    </AccordionAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AccordionAuditFrame maxWidth="xl" surface>
      <DefaultAccordion {...defaultPlaygroundArgs} />
    </AccordionAuditFrame>
  ),
};

export const Multiple: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AccordionAuditFrame maxWidth="xl">
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
    </AccordionAuditFrame>
  ),
};

export const Collapsible: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AccordionAuditFrame maxWidth="xl">
      <Accordion collapsible defaultValue="item-1" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>Plan de la semaine</AccordionTrigger>
          <AccordionContent>
            Organisez vos repas en avance pour éviter les choix impulsifs.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </AccordionAuditFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <AccordionAuditFrame maxWidth="xl">
      <DefaultAccordion {...defaultPlaygroundArgs} />
    </AccordionAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='accordion']");
    const firstTrigger = canvas.getByRole("button", {
      name: "Quels aliments remplacer ?",
    });
    const secondTrigger = canvas.getByRole("button", {
      name: "Comment préparer les légumes ?",
    });

    await expect(root).toHaveAttribute("data-slot", "accordion");
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(secondTrigger).toHaveAttribute("aria-expanded", "false");

    await expect(firstTrigger.className).toContain("min-h-11");
    await expect(firstTrigger.className).toContain(
      "focus-visible:ring-ring-soft",
    );

    await userEvent.click(firstTrigger);

    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
    const firstRegion = canvas.getByRole("region", {
      name: "Quels aliments remplacer ?",
    });
    await expect(firstRegion).toBeVisible();
    await expect(firstRegion).toHaveAttribute(
      "id",
      firstTrigger.getAttribute("aria-controls") ?? "",
    );
    await expect(firstRegion).toHaveAttribute(
      "aria-labelledby",
      firstTrigger.getAttribute("id") ?? "",
    );

    await userEvent.click(secondTrigger);

    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(secondTrigger).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(secondTrigger);
    await expect(secondTrigger).toHaveAttribute("aria-expanded", "false");
  },
};

export const ResponsiveStress: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <AccordionAuditFrame maxWidth="sm">
      <Accordion collapsible defaultValue="item-1" type="single">
        <AccordionItem value="item-1">
          <AccordionTrigger>
            Quels aliments à faible teneur en FODMAP pouvez-vous préparer à
            l&apos;avance pour un déjeuner transportable pendant une semaine
            très chargée ?
          </AccordionTrigger>
          <AccordionContent>
            Préparez une base simple la veille, répartissez-la en portions
            individuelles et ajoutez au dernier moment les éléments fragiles
            pour conserver une texture agréable et limiter les écarts de
            tolérance.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>
            Comment réintroduire progressivement plusieurs légumes cuits sans
            perdre en lisibilité lorsque l&apos;intitulé de la section devient
            plus long sur mobile ?
          </AccordionTrigger>
          <AccordionContent>
            Commencez par une portion modeste, gardez une seule variable
            nouvelle par repas et notez la tolérance sur plusieurs jours avant
            d&apos;augmenter la variété ou le volume.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </AccordionAuditFrame>
  ),
};
