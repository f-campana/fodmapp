import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import { ScrollArea } from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function ScrollAreaAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-scroll-area-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  dir: "ltr",
  type: "always",
} as const;

const meta = {
  title: "Primitives/Adapter/ScrollArea",
  component: ScrollArea,
  argTypes: {
    type: {
      description: "Controls when scrollbars appear.",
      control: { type: "inline-radio" },
      options: ["always", "auto", "scroll", "hover"],
      table: { defaultValue: { summary: "always" } },
    },
    dir: {
      description: "Sets reading direction for the scroll area layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    className: {
      description: "Additional classes merged with the scroll area root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    children: {
      description: "Scrollable viewport content.",
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
        include: ["[data-scroll-area-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

function WeeklyPlanList({ stress = false }: { stress?: boolean }) {
  const items = stress
    ? [
        "Batch-cook a low-FODMAP grain base with herbs and citrus for four packed lunches.",
        "Keep two fallback breakfast options ready for rushed mornings after late symptom check-ins.",
        "Stage freezer notes, reheating times, and substitution limits in the same card for quick scanning.",
        "Capture portion reminders next to each meal so mobile review stays legible without opening another panel.",
      ]
    : [
        "Breakfast prep notes",
        "Lunch substitutions",
        "Dinner freezer labels",
        "Shopping reminders",
        "Portion check-ins",
        "Reheat timings",
        "Travel-safe snacks",
        "Fallback ingredients",
      ];

  return (
    <div className={stress ? "space-y-3 pr-2" : "space-y-2 pr-2"}>
      {items.map((item) => (
        <div
          className="rounded-(--radius-sm) border border-border bg-card px-3 py-3 text-sm leading-5 shadow-xs"
          key={item}
        >
          <div className="font-medium text-foreground">{item}</div>
          <div className="mt-1 text-muted-foreground">
            Keep only the details needed while cooking so the list stays easy to
            scan on a narrow screen.
          </div>
        </div>
      ))}
    </div>
  );
}

function ScrollAreaExample(
  args: Story["args"],
  options?: {
    stress?: boolean;
  },
) {
  return (
    <ScrollArea
      className={[
        "h-72 w-full rounded-(--radius) border border-border bg-background",
        args?.className ?? "",
      ].join(" ")}
      dir={args?.dir ?? "ltr"}
      type={args?.type ?? "always"}
    >
      <div className="p-3">
        <WeeklyPlanList stress={options?.stress} />
      </div>
    </ScrollArea>
  );
}

export const Playground: Story = {
  render: (args) => (
    <ScrollAreaAuditFrame maxWidth="xl">
      {ScrollAreaExample(args)}
    </ScrollAreaAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ScrollAreaAuditFrame maxWidth="xl">
      {ScrollAreaExample(defaultPlaygroundArgs)}
    </ScrollAreaAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ScrollAreaAuditFrame maxWidth="xl" surface>
      {ScrollAreaExample(defaultPlaygroundArgs)}
    </ScrollAreaAuditFrame>
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
    <ScrollAreaAuditFrame maxWidth="xl">
      {ScrollAreaExample(defaultPlaygroundArgs)}
    </ScrollAreaAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const firstItem = canvas.getByText("Breakfast prep notes");
    const root = firstItem.closest("[data-slot='scroll-area']");
    const viewport = firstItem.closest("[data-slot='scroll-area-viewport']");
    const scrollbars = canvasElement.querySelectorAll(
      "[data-slot='scroll-area-scrollbar']",
    );
    const thumbs = canvasElement.querySelectorAll(
      "[data-slot='scroll-area-thumb']",
    );
    const corners = canvasElement.querySelectorAll(
      "[data-slot='scroll-area-corner']",
    );

    await expect(root).toHaveAttribute("data-slot", "scroll-area");
    await expect(viewport).toHaveAttribute("data-slot", "scroll-area-viewport");
    await expect(viewport).toHaveAttribute("tabindex", "0");
    await expect(scrollbars).toHaveLength(2);
    await expect(thumbs).toHaveLength(2);
    await expect(corners.length).toBeGreaterThan(0);
    await expect(viewport?.scrollWidth ?? 0).toBeLessThanOrEqual(
      viewport?.clientWidth ?? 0,
    );

    await userEvent.tab();
    await expect(viewport).toHaveFocus();
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <ScrollAreaAuditFrame maxWidth="sm" surface>
      {ScrollAreaExample(defaultPlaygroundArgs, { stress: true })}
    </ScrollAreaAuditFrame>
  ),
};
