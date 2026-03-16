import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, within } from "storybook/test";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@fodmapp/ui/breadcrumb";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function BreadcrumbAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-breadcrumb-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Foundation/Breadcrumb",
  component: Breadcrumb,
  tags: ["batch-l"],
  argTypes: {
    "aria-label": {
      description: "Accessible name for the breadcrumb navigation landmark.",
      control: "text",
      table: { defaultValue: { summary: "Fil d'Ariane" } },
    },
    className: {
      description:
        "Additional classes merged with the root navigation element.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: {
    "aria-label": "Fil d'Ariane",
  },
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-breadcrumb-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;

type Story = StoryObj<typeof meta>;

function RecipeBreadcrumb({
  ariaLabel,
  collapsed = false,
  compact = false,
}: {
  ariaLabel?: string;
  collapsed?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="space-y-3">
      <Breadcrumb aria-label={ariaLabel}>
        <BreadcrumbList
          className={compact ? "flex-nowrap overflow-x-auto pb-1" : undefined}
        >
          <BreadcrumbItem className={compact ? "shrink-0" : undefined}>
            <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {collapsed ? (
            <>
              <BreadcrumbItem className="shrink-0">
                <BreadcrumbEllipsis />
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : (
            <>
              <BreadcrumbItem className={compact ? "shrink-0" : undefined}>
                <BreadcrumbLink href="/recipes">
                  Substitutions FODMAP
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage
              className={compact ? "block max-w-[14rem] truncate" : undefined}
              title="Salade de quinoa aux legumes rotis et sauce citronnee"
            >
              Salade de quinoa aux legumes rotis et sauce citronnee
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          Salade de quinoa aux legumes rotis
        </h2>
        <p className="text-sm text-muted-foreground">
          The breadcrumb stays separate from the page heading, even when the
          trail is collapsed for a dense layout.
        </p>
      </div>
    </div>
  );
}

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: (args) => (
    <BreadcrumbAuditFrame maxWidth="xl" surface>
      <RecipeBreadcrumb ariaLabel={args["aria-label"]} />
    </BreadcrumbAuditFrame>
  ),
};

export const CollapsedTrail: Story = {
  parameters: fixedStoryParameters,
  render: (args) => (
    <BreadcrumbAuditFrame maxWidth="md" surface>
      <RecipeBreadcrumb ariaLabel={args["aria-label"]} collapsed />
    </BreadcrumbAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <BreadcrumbAuditFrame maxWidth="md" surface>
      <RecipeBreadcrumb ariaLabel="Fil d'Ariane recette" collapsed />
    </BreadcrumbAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole("navigation", {
      name: "Fil d'Ariane recette",
    });

    await expect(nav).toHaveAttribute("data-slot", "breadcrumb");
    await expect(canvas.getByRole("list")).toHaveAttribute(
      "data-slot",
      "breadcrumb-list",
    );
    await expect(
      canvas.getByText("Salade de quinoa aux legumes rotis et sauce citronnee"),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.queryByRole("link", {
        name: "Salade de quinoa aux legumes rotis et sauce citronnee",
      }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByLabelText("Niveaux intermédiaires masqués"),
    ).toHaveAttribute("data-slot", "breadcrumb-ellipsis");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <BreadcrumbAuditFrame maxWidth="sm" surface>
      <RecipeBreadcrumb ariaLabel="Fil d'Ariane compact" compact collapsed />
    </BreadcrumbAuditFrame>
  ),
};
