import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { ScrollArea } from "@fodmapp/ui/scroll-area";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

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
          className="rounded-sm border border-border bg-card px-3 py-3 text-sm leading-5 shadow-xs"
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

function PrepRailRow() {
  const items = [
    "Breakfast prep lane",
    "Lunch swap lane",
    "Dinner note lane",
    "Freezer label lane",
    "Travel-safe lane",
    "Fallback pantry lane",
  ];

  return (
    <div className="flex w-max gap-3 pr-3 pb-2">
      {items.map((item) => (
        <div
          className="w-64 shrink-0 rounded-sm border border-border bg-card px-3 py-3 text-sm leading-5 shadow-xs"
          key={item}
        >
          <div className="font-medium text-foreground">{item}</div>
          <div className="mt-1 text-muted-foreground">
            Keep the note short so the row can scan quickly while you compare
            adjacent plans.
          </div>
        </div>
      ))}
    </div>
  );
}

function PantryGrid() {
  const items = [
    "Breakfast prep",
    "Lunch swaps",
    "Dinner notes",
    "Freezer labels",
    "Travel-safe kit",
    "Fallback pantry",
    "Reheat timings",
    "Portion check-ins",
    "Snack backups",
    "Weekend batch",
    "Shopping holds",
    "Serving notes matrix",
  ];

  return (
    <div className="grid w-max grid-cols-4 gap-3 pr-3 pb-3">
      {items.map((item) => (
        <div
          className="min-h-28 w-60 rounded-sm border border-border bg-card px-3 py-3 text-sm leading-5 shadow-xs"
          key={item}
        >
          <div className="font-medium text-foreground">{item}</div>
          <div className="mt-1 text-muted-foreground">
            Keep each block compact so both axes stay readable inside the same
            bounded review panel.
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
    variant?: "vertical" | "horizontal" | "both";
  },
) {
  const variant = options?.variant ?? "vertical";

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
        {variant === "horizontal" ? (
          <PrepRailRow />
        ) : variant === "both" ? (
          <PantryGrid />
        ) : (
          <WeeklyPlanList stress={options?.stress} />
        )}
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

export const Horizontal: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ScrollAreaAuditFrame maxWidth="xl">
      {ScrollAreaExample(defaultPlaygroundArgs, { variant: "horizontal" })}
    </ScrollAreaAuditFrame>
  ),
};

export const BothAxes: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ScrollAreaAuditFrame maxWidth="xl">
      {ScrollAreaExample(defaultPlaygroundArgs, { variant: "both" })}
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
      <div className="space-y-8">
        {ScrollAreaExample(defaultPlaygroundArgs)}
        {ScrollAreaExample(defaultPlaygroundArgs, { variant: "horizontal" })}
        {ScrollAreaExample(defaultPlaygroundArgs, { variant: "both" })}
      </div>
    </ScrollAreaAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const verticalItem = canvas.getByText("Breakfast prep notes");
    const horizontalItem = canvas.getByText("Breakfast prep lane");
    const bothAxesItem = canvas.getByText("Serving notes matrix");
    const verticalRoot = verticalItem.closest("[data-slot='scroll-area']");
    const horizontalRoot = horizontalItem.closest("[data-slot='scroll-area']");
    const bothAxesRoot = bothAxesItem.closest("[data-slot='scroll-area']");
    const verticalViewport = verticalItem.closest(
      "[data-slot='scroll-area-viewport']",
    );
    const horizontalViewport = horizontalItem.closest(
      "[data-slot='scroll-area-viewport']",
    );
    const bothAxesViewport = bothAxesItem.closest(
      "[data-slot='scroll-area-viewport']",
    );

    await expect(verticalRoot).toHaveAttribute("data-slot", "scroll-area");
    await expect(verticalViewport).toHaveAttribute(
      "data-slot",
      "scroll-area-viewport",
    );
    await expect(verticalViewport).toHaveAttribute("tabindex", "0");
    await expect(horizontalRoot).toHaveAttribute("data-slot", "scroll-area");
    await expect(bothAxesRoot).toHaveAttribute("data-slot", "scroll-area");

    const verticalScrollbar = verticalRoot?.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='vertical']",
    );
    const verticalHorizontalScrollbar = verticalRoot?.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='horizontal']",
    );
    const horizontalScrollbar = horizontalRoot?.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='horizontal']",
    );
    const horizontalVerticalScrollbar = horizontalRoot?.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='vertical']",
    );
    const bothAxesVerticalScrollbar = bothAxesRoot?.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='vertical']",
    );
    const bothAxesHorizontalScrollbar = bothAxesRoot?.querySelector(
      "[data-slot='scroll-area-scrollbar'][data-orientation='horizontal']",
    );

    await expect(verticalScrollbar).not.toBeNull();
    await expect(verticalHorizontalScrollbar).not.toBeNull();
    await expect(horizontalScrollbar).not.toBeNull();
    await expect(horizontalVerticalScrollbar).not.toBeNull();
    await expect(bothAxesVerticalScrollbar).not.toBeNull();
    await expect(bothAxesHorizontalScrollbar).not.toBeNull();

    await waitFor(async () => {
      await expect(
        verticalRoot?.querySelectorAll("[data-slot='scroll-area-thumb']") ?? [],
      ).toHaveLength(1);
      await expect(
        verticalHorizontalScrollbar?.querySelector(
          "[data-slot='scroll-area-thumb']",
        ),
      ).toBeNull();
      await expect(
        horizontalRoot?.querySelectorAll("[data-slot='scroll-area-thumb']") ??
          [],
      ).toHaveLength(1);
      await expect(
        horizontalVerticalScrollbar?.querySelector(
          "[data-slot='scroll-area-thumb']",
        ),
      ).toBeNull();
      await expect(
        bothAxesRoot?.querySelectorAll("[data-slot='scroll-area-thumb']") ?? [],
      ).toHaveLength(2);
    });

    await expect(verticalViewport?.scrollWidth ?? 0).toBeLessThanOrEqual(
      verticalViewport?.clientWidth ?? 0,
    );
    await expect(horizontalViewport?.scrollWidth ?? 0).toBeGreaterThan(
      horizontalViewport?.clientWidth ?? 0,
    );
    await expect(horizontalViewport?.scrollHeight ?? 0).toBeLessThanOrEqual(
      horizontalViewport?.clientHeight ?? 0,
    );
    await expect(bothAxesViewport?.scrollWidth ?? 0).toBeGreaterThan(
      bothAxesViewport?.clientWidth ?? 0,
    );
    await expect(bothAxesViewport?.scrollHeight ?? 0).toBeGreaterThan(
      bothAxesViewport?.clientHeight ?? 0,
    );

    await userEvent.tab();
    await expect(verticalViewport).toHaveFocus();
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
      {ScrollAreaExample(defaultPlaygroundArgs, { variant: "both" })}
    </ScrollAreaAuditFrame>
  ),
};
