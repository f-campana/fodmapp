import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fodmapp/ui/tabs";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function TabsAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-tabs-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultValue: "ingredients",
  orientation: "horizontal",
  onValueChange: fn(),
} as const;

const meta = {
  title: "Primitives/Adapter/Tabs",
  component: Tabs,
  argTypes: {
    defaultValue: {
      description: "Sets initial active tab value in uncontrolled mode.",
      control: "text",
      table: { defaultValue: { summary: "ingredients" } },
    },
    orientation: {
      description: "Defines keyboard navigation orientation.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    onValueChange: {
      description: "Callback invoked when the active tab changes.",
    },
    className: {
      description: "Additional classes merged with the tabs root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "TabsList, TabsTrigger, and TabsContent composition.",
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
        include: ["[data-tabs-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

function DefaultTabs(args: Story["args"]) {
  const orientation =
    args?.orientation === "vertical" ? "vertical" : "horizontal";
  const rootClassName =
    orientation === "vertical"
      ? "w-full gap-4 sm:grid sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start"
      : "w-full max-w-xl";
  const listClassName =
    orientation === "vertical"
      ? "w-full justify-start overflow-x-auto sm:h-auto sm:flex-col sm:overflow-visible"
      : "w-full justify-start overflow-x-auto";

  return (
    <Tabs
      className={`${rootClassName} ${args?.className ?? ""}`.trim()}
      defaultValue={args?.defaultValue ?? "ingredients"}
      onValueChange={args?.onValueChange}
      orientation={orientation}
    >
      <TabsList className={listClassName}>
        <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
        <TabsTrigger value="preparation">Préparation</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients">
        Organisez les ingrédients par portions et gardez seulement les
        substitutions utiles au moment de cuisiner.
      </TabsContent>
      <TabsContent value="preparation">
        Détaillez la cuisson, les gestes de préparation et les substitutions qui
        modifient vraiment le résultat.
      </TabsContent>
    </Tabs>
  );
}

function VerticalTabs() {
  return (
    <Tabs
      className="w-full gap-4 sm:grid sm:grid-cols-[12rem_minmax(0,1fr)] sm:items-start"
      defaultValue="ingredients"
      orientation="vertical"
    >
      <TabsList className="w-full justify-start overflow-x-auto sm:h-auto sm:flex-col sm:overflow-visible">
        <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
        <TabsTrigger value="preparation">Préparation</TabsTrigger>
      </TabsList>
      <TabsContent value="ingredients">
        Ingrédients adaptés pour un lot simple à préparer sans multiplier les
        décisions.
      </TabsContent>
      <TabsContent value="preparation">
        Préparation détaillée avec ordre de cuisson, points de vigilance et
        ajustements de dernière minute.
      </TabsContent>
    </Tabs>
  );
}

function ResponsiveStressTabs() {
  return (
    <Tabs
      className="w-full max-w-sm gap-3"
      defaultValue="semaine"
      orientation="vertical"
    >
      <TabsList className="h-auto w-full flex-col items-stretch justify-start gap-1">
        <TabsTrigger value="semaine">
          Planning hebdomadaire très détaillé
        </TabsTrigger>
        <TabsTrigger value="courses">Liste de courses à revalider</TabsTrigger>
        <TabsTrigger value="batch">Préparation en plusieurs étapes</TabsTrigger>
      </TabsList>
      <TabsContent value="semaine">
        Regroupez les repas les plus simples au début de la semaine, puis
        laissez les essais plus délicats pour les jours avec plus de marge.
      </TabsContent>
      <TabsContent value="courses">
        Isolez les substitutions incertaines, les portions à vérifier et les
        achats à reprendre au dernier moment.
      </TabsContent>
      <TabsContent value="batch">
        Préparez les bases la veille, stockez-les séparément puis assemblez au
        dernier moment pour garder une texture lisible.
      </TabsContent>
    </Tabs>
  );
}

export const Playground: Story = {
  render: (args) => (
    <TabsAuditFrame maxWidth="xl">
      <DefaultTabs {...args} />
    </TabsAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TabsAuditFrame maxWidth="xl">
      <DefaultTabs {...defaultPlaygroundArgs} />
    </TabsAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TabsAuditFrame maxWidth="xl" surface>
      <DefaultTabs {...defaultPlaygroundArgs} />
    </TabsAuditFrame>
  ),
};

export const Vertical: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TabsAuditFrame maxWidth="xl">
      <VerticalTabs />
    </TabsAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onValueChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <TabsAuditFrame maxWidth="xl" surface>
      <DefaultTabs {...args} />
    </TabsAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='tabs']");
    const list = canvas.getByRole("tablist");
    const firstTrigger = canvas.getByRole("tab", { name: "Ingrédients" });
    const secondTrigger = canvas.getByRole("tab", { name: "Préparation" });

    await expect(root).toHaveAttribute("data-slot", "tabs");
    await expect(list).toHaveAttribute("data-slot", "tabs-list");
    await expect(firstTrigger).toHaveAttribute("data-slot", "tabs-trigger");
    await expect(firstTrigger).toHaveAttribute("aria-selected", "true");

    await userEvent.click(secondTrigger);

    await expect(args.onValueChange).toHaveBeenCalledWith("preparation");
    await expect(secondTrigger).toHaveAttribute("aria-selected", "true");

    const secondPanel = canvas
      .getByText(
        "Détaillez la cuisson, les gestes de préparation et les substitutions qui modifient vraiment le résultat.",
      )
      .closest("[data-slot='tabs-content']");

    await expect(secondPanel).toHaveAttribute(
      "id",
      secondTrigger.getAttribute("aria-controls") ?? "",
    );
    await expect(secondPanel).toHaveAttribute(
      "aria-labelledby",
      secondTrigger.getAttribute("id") ?? "",
    );

    secondTrigger.focus();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(firstTrigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect(firstTrigger).toHaveAttribute("aria-selected", "true");
  },
};

export const ResponsiveStress: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <TabsAuditFrame maxWidth="sm">
      <ResponsiveStressTabs />
    </TabsAuditFrame>
  ),
};
