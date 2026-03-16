import { type ComponentProps, type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@fodmapp/ui/resizable";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function ResizableAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-resizable-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Adapter/Resizable",
  component: ResizablePanelGroup,
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
    disabled: false,
    onLayoutChanged: fn(),
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-resizable-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

type ResizableGroupProps = ComponentProps<typeof ResizablePanelGroup>;

function ResizableDemoCanvas({
  children,
  height,
}: {
  children: ReactNode;
  height: number;
}) {
  return (
    <div
      className="w-full overflow-hidden rounded-(--radius) border border-border bg-background"
      style={{ height }}
    >
      {children}
    </div>
  );
}

function ResizablePanelBody({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex h-full flex-col justify-between gap-4 bg-card p-4 text-left">
      <div className="space-y-2">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm leading-5 text-muted-foreground">{body}</p>
    </div>
  );
}

function formatLayoutSummary(layout: unknown) {
  if (!layout || typeof layout !== "object") {
    return "Ajustez la séparation au clavier ou à la souris.";
  }

  const entries = Object.entries(layout as Record<string, number>);

  if (entries.length === 0) {
    return "Ajustez la séparation au clavier ou à la souris.";
  }

  return entries
    .map(([key, value]) => `${key} ${Math.round(value)}%`)
    .join(" / ");
}

function HorizontalResizable(args: ResizableGroupProps) {
  return (
    <ResizableDemoCanvas height={288}>
      <ResizablePanelGroup
        className="h-full w-full"
        defaultLayout={{ left: 45, right: 55 }}
        disabled={args?.disabled ?? false}
        id={args?.id}
        onLayoutChanged={args?.onLayoutChanged}
        orientation="horizontal"
      >
        <ResizablePanel defaultSize={45} id="left">
          <ResizablePanelBody
            body="Regroupez ici les notes de préparation, les substitutions confirmées et ce qui doit rester visible pendant tout le flux."
            eyebrow="Mise en place"
            title="Panneau de contexte"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} id="right">
          <ResizablePanelBody
            body="Conservez l'espace principal pour les étapes actives, les contrôles du moment et la validation finale."
            eyebrow="Exécution"
            title="Panneau principal"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizableDemoCanvas>
  );
}

function VerticalResizable(args: ResizableGroupProps) {
  return (
    <ResizableDemoCanvas height={360}>
      <ResizablePanelGroup
        className="h-full w-full"
        defaultLayout={{ top: 50, bottom: 50 }}
        disabled={args?.disabled ?? false}
        id={args?.id}
        onLayoutChanged={args?.onLayoutChanged}
        orientation="vertical"
      >
        <ResizablePanel defaultSize={50} id="top">
          <ResizablePanelBody
            body="Placez en haut le contenu à suivre pendant la session, comme un plan de repas, une liste de contrôle ou un résumé d'étapes."
            eyebrow="Référence"
            title="Panneau haut"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={50} id="bottom">
          <ResizablePanelBody
            body="Gardez en bas les détails secondaires, les remarques de suivi ou les résultats à comparer sans perdre le contexte."
            eyebrow="Suivi"
            title="Panneau bas"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizableDemoCanvas>
  );
}

function ObservedResizable(args: Story["args"]) {
  const [layoutSummary, setLayoutSummary] = useState(
    "Ajustez la séparation au clavier ou à la souris.",
  );

  return (
    <div className="w-full space-y-3">
      <HorizontalResizable
        {...args}
        onLayoutChanged={(layout) => {
          args?.onLayoutChanged?.(layout);
          setLayoutSummary(formatLayoutSummary(layout));
        }}
      />
      <output
        className="block rounded-(--radius) border border-border/80 bg-muted/20 px-3 py-2 text-xs font-medium text-muted-foreground"
        data-testid="resizable-layout"
      >
        Répartition actuelle : {layoutSummary}
      </output>
    </div>
  );
}

function ResponsiveStressResizable() {
  return (
    <ResizableDemoCanvas height={420}>
      <ResizablePanelGroup
        className="h-full w-full"
        defaultLayout={{ notes: 34, batch: 33, checks: 33 }}
        orientation="vertical"
      >
        <ResizablePanel defaultSize={34} id="notes">
          <ResizablePanelBody
            body="Notes de préparation longues à conserver visibles sans cacher les contraintes de portion."
            eyebrow="Notes"
            title="Préparation amont"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={33} id="batch">
          <ResizablePanelBody
            body="Batch de cuisson avec étapes intermédiaires et rappels à conserver sous les yeux."
            eyebrow="Batch"
            title="Cuisson en série"
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={33} id="checks">
          <ResizablePanelBody
            body="Vérifications finales sur une largeur contrainte pour valider les ajustements avant service."
            eyebrow="Contrôle"
            title="Dernier passage"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </ResizableDemoCanvas>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ResizableAuditFrame centeredMinHeight={80} maxWidth="3xl" surface>
      {args?.orientation === "vertical" ? (
        <VerticalResizable {...args} />
      ) : (
        <HorizontalResizable {...args} />
      )}
    </ResizableAuditFrame>
  ),
};

export const Horizontal: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ResizableAuditFrame centeredMinHeight={80} maxWidth="3xl" surface>
      <HorizontalResizable />
    </ResizableAuditFrame>
  ),
};

export const Vertical: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ResizableAuditFrame centeredMinHeight={80} maxWidth="xl" surface>
      <VerticalResizable />
    </ResizableAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  args: {
    disabled: false,
    onLayoutChanged: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <ResizableAuditFrame centeredMinHeight={80} maxWidth="3xl" surface>
      <ObservedResizable {...args} />
    </ResizableAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const onLayoutChangedMock = args.onLayoutChanged as {
      mock?: { calls: unknown[][] };
    };
    const group = canvasElement.querySelector(
      "[data-slot='resizable-panel-group']",
    );
    const panels = canvasElement.querySelectorAll(
      "[data-slot='resizable-panel']",
    );
    const handle = canvasElement.querySelector(
      "[data-slot='resizable-handle']",
    ) as HTMLElement | null;
    const grip = canvasElement.querySelector(
      "[data-slot='resizable-handle-grip']",
    );
    if (!handle) {
      throw new Error("Expected resizable handle to be present");
    }

    await expect(group).toHaveAttribute("data-slot", "resizable-panel-group");
    await expect(panels).toHaveLength(2);
    await expect(handle).toHaveAttribute("data-slot", "resizable-handle");
    await expect(grip).toHaveAttribute("data-slot", "resizable-handle-grip");

    await expect(handle).toHaveAttribute("role", "separator");
    await expect(handle).toHaveAttribute("aria-orientation", "vertical");
    await expect(handle?.className ?? "").toContain(
      "aria-[orientation=vertical]:w-px",
    );
    await expect(handle?.className ?? "").toContain(
      "focus-visible:ring-ring-soft",
    );

    const layoutSummary = canvas.getByTestId("resizable-layout");
    const callbackCallsBefore = onLayoutChangedMock.mock?.calls.length ?? 0;
    const valueBefore = handle.getAttribute("aria-valuenow");

    handle.focus();
    await userEvent.keyboard("{ArrowLeft}");

    await waitFor(() => {
      const callbackCallsAfter = onLayoutChangedMock.mock?.calls.length ?? 0;
      if (callbackCallsAfter <= callbackCallsBefore) {
        throw new Error(
          "Expected onLayoutChanged to be called after keyboard resize",
        );
      }
    });
    await waitFor(() => {
      const valueAfter = handle.getAttribute("aria-valuenow");
      if (valueAfter === valueBefore) {
        throw new Error("Expected separator value to change after ArrowLeft");
      }
    });
    await expect(layoutSummary).not.toHaveTextContent(
      "Ajustez la séparation au clavier ou à la souris.",
    );
  },
};

export const ResponsiveStress: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ResizableAuditFrame centeredMinHeight={80} maxWidth="xl" surface>
      <ResponsiveStressResizable />
    </ResizableAuditFrame>
  ),
};
