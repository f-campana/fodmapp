import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import { ScaleBarCell, TokenDataGrid, TokenDocsPage, TokenSection, TokenValuePill } from "./token-docs.components";
import { asRecord, flattenTokenTree, parseNumberish, tokenPrimitiveToString } from "./token-docs.helpers";

interface ScaleRow {
  id: string;
  path: string;
  value: string;
  searchText: string;
}

interface SpacingRow extends ScaleRow {
  widthPx: number;
}

const base = asRecord(tokens.base, "base");
const spacing = asRecord(base.space, "base.space");
const radius = asRecord(base.radius, "base.radius");
const borderWidth = asRecord(asRecord(base.border, "base.border").width, "base.border.width");
const opacity = asRecord(base.opacity, "base.opacity");
const breakpoints = asRecord(base.breakpoint, "base.breakpoint");
const zIndex = asRecord(base.zIndex, "base.zIndex");

function toScaleRows(node: unknown, prefix: string): ScaleRow[] {
  return flattenTokenTree(node, prefix).map((row) => {
    const value = tokenPrimitiveToString(row.value);
    return {
      id: row.id,
      path: row.path,
      value,
      searchText: `${row.path} ${value}`,
    };
  });
}

function spacingWidth(value: string): number {
  const parsed = parseNumberish(value);
  if (parsed === null) {
    return 6;
  }

  if (value.endsWith("px")) {
    return Math.round(parsed * 12);
  }

  if (value.endsWith("rem")) {
    return Math.round(parsed * 56);
  }

  return Math.round(parsed * 40);
}

const spacingRows: SpacingRow[] = toScaleRows(spacing, "base.space").map((row) => ({
  ...row,
  widthPx: Math.max(6, spacingWidth(row.value)),
}));

const layoutGroups = [
  { id: "radius", label: "Radius", rows: toScaleRows(radius, "base.radius") },
  { id: "border-width", label: "Border Width", rows: toScaleRows(borderWidth, "base.border.width") },
  { id: "opacity", label: "Opacity", rows: toScaleRows(opacity, "base.opacity") },
  { id: "breakpoints", label: "Breakpoints", rows: toScaleRows(breakpoints, "base.breakpoint") },
  { id: "z-index", label: "Z-Index", rows: toScaleRows(zIndex, "base.zIndex") },
];

const meta = {
  title: "Foundations/Tokens/Spacing & Layout",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => (
    <TokenDocsPage
      title="Spacing & Layout Tokens"
      subtitle="Spacing, radius, border width, opacity, breakpoint, and z-index scales presented as dense technical grids."
    >
      <TokenSection
        title="Spacing Scale"
        description="Spacing tokens include compact proportional indicators for faster visual comparison across the scale."
      >
        <TokenDataGrid
          gridLabel="spacing-grid"
          groups={[{ id: "spacing", label: "Spacing", rows: spacingRows }]}
          virtualizationThreshold={10}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(280px, 1.5fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(340px, 1.5fr)",
              getValue: (row) => row.value,
              render: (row) => <ScaleBarCell value={row.value} widthPx={row.widthPx} />,
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Layout and Structural Scales"
        description="Non-spacing scales grouped by domain with sortable values and copy actions."
      >
        <TokenDataGrid
          gridLabel="layout-grid"
          groups={layoutGroups}
          virtualizationThreshold={8}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(320px, 1.8fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(260px, 1fr)",
              align: "right",
              getValue: (row) => row.value,
              render: (row) => <TokenValuePill value={row.value} />,
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Spacing & Layout Tokens" })).toBeInTheDocument();
    await expect(canvas.getByText("base.space.4")).toBeInTheDocument();
    await expect(canvas.getByText("base.breakpoint.md")).toBeInTheDocument();
  },
};
