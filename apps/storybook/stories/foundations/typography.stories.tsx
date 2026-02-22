import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import { TokenDataGrid, TokenDocsPage, TokenSection, TokenValuePill } from "./token-docs.components";
import { asRecord, flattenTokenTree, tokenPrimitiveToString } from "./token-docs.helpers";

interface TypographyRow {
  id: string;
  path: string;
  value: string;
  searchText: string;
}

const base = asRecord(tokens.base, "base");
const typography = asRecord(base.typography, "base.typography");

function rowsFor(node: unknown, prefix: string): TypographyRow[] {
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

const groups = [
  { id: "families", label: "Font Families", rows: rowsFor(asRecord(typography.fontFamily, "base.typography.fontFamily"), "base.typography.fontFamily") },
  { id: "sizes", label: "Font Sizes", rows: rowsFor(asRecord(typography.fontSize, "base.typography.fontSize"), "base.typography.fontSize") },
  { id: "weights", label: "Font Weights", rows: rowsFor(asRecord(typography.fontWeight, "base.typography.fontWeight"), "base.typography.fontWeight") },
  { id: "line-heights", label: "Line Heights", rows: rowsFor(asRecord(typography.lineHeight, "base.typography.lineHeight"), "base.typography.lineHeight") },
  { id: "letter-spacing", label: "Letter Spacing", rows: rowsFor(asRecord(typography.letterSpacing, "base.typography.letterSpacing"), "base.typography.letterSpacing") },
];

const meta = {
  title: "Foundations/Tokens/Typography",
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
      title="Typography Tokens"
      subtitle="Primitive typography tokens for families, sizes, weights, line-heights, and letter-spacing."
    >
      <TokenSection
        title="Typography Primitives"
        description="Use sorting and search to inspect typography values without visual noise from decorative card layouts."
      >
        <TokenDataGrid
          gridLabel="typography-grid"
          groups={groups}
          virtualizationThreshold={8}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(340px, 1.8fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Value",
              width: "minmax(280px, 1fr)",
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
    await expect(canvas.getByRole("heading", { name: "Typography Tokens" })).toBeInTheDocument();
    await expect(canvas.getByText("base.typography.fontSize.xs")).toBeInTheDocument();
  },
};
