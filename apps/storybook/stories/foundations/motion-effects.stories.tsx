import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import { TokenDataGrid, TokenDocsPage, TokenSection, TokenValuePill } from "./token-docs.components";
import { asRecord, flattenTokenTree, tokenPrimitiveToString } from "./token-docs.helpers";

interface EffectRow {
  id: string;
  path: string;
  value: string;
  searchText: string;
}

const base = asRecord(tokens.base, "base");
const motion = asRecord(base.motion, "base.motion");
const shadows = asRecord(base.shadow, "base.shadow");

function toRows(node: unknown, prefix: string): EffectRow[] {
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

const motionGroups = [
  { id: "durations", label: "Durations", rows: toRows(asRecord(motion.duration, "base.motion.duration"), "base.motion.duration") },
  { id: "easing", label: "Easing Curves", rows: toRows(asRecord(motion.easing, "base.motion.easing"), "base.motion.easing") },
];

const shadowGroups = [{ id: "shadow", label: "Shadow Scale", rows: toRows(shadows, "base.shadow") }];

const meta = {
  title: "Foundations/Tokens/Motion & Effects",
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
      title="Motion & Effects Tokens"
      subtitle="Duration, easing, and elevation primitives for interaction and surface layering."
    >
      <TokenSection
        title="Motion"
        description="Interactive timing primitives split between duration and easing definitions."
      >
        <TokenDataGrid
          gridLabel="motion-grid"
          groups={motionGroups}
          virtualizationThreshold={6}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(320px, 1.7fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(320px, 1fr)",
              align: "right",
              getValue: (row) => row.value,
              render: (row) => <TokenValuePill value={row.value} />,
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Shadows"
        description="Elevation values with inline visual previews for quick comparison."
      >
        <TokenDataGrid
          gridLabel="shadow-grid"
          groups={shadowGroups}
          virtualizationThreshold={6}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(280px, 1.4fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "preview",
              label: "Preview",
              width: "minmax(220px, 1fr)",
              sortable: false,
              getValue: (row) => row.value,
              render: (row) => (
                <span className="inline-block h-5 w-16 rounded border border-border bg-surface" style={{ boxShadow: row.value }} aria-hidden="true" />
              ),
              copyValue: () => null,
            },
            {
              key: "value",
              label: "Shadow Value",
              width: "minmax(420px, 2fr)",
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
    await expect(canvas.getByRole("heading", { name: "Motion & Effects Tokens" })).toBeInTheDocument();
    await expect(canvas.getByText("base.motion.duration.fast")).toBeInTheDocument();
    await expect(canvas.getByText("base.shadow.md")).toBeInTheDocument();
  },
};
