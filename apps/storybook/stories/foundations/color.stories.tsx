import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import { ColorValueCell, TokenDataGrid, TokenDocsPage, TokenSection } from "./token-docs.components";
import { asRecord, flattenTokenTree, groupRowsBySegment, isColorTokenValue, naturalTokenPathCompare, tokenPrimitiveToString } from "./token-docs.helpers";

interface BaseColorGridRow {
  id: string;
  path: string;
  value: string;
  searchText: string;
}

interface SemanticColorGridRow {
  id: string;
  path: string;
  light: string;
  dark: string;
  searchText: string;
}

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");

const baseColorNode = asRecord(base.color, "base.color");
const semanticLightColor = asRecord(asRecord(lightTheme.semantic, "themes.light.semantic").color, "themes.light.semantic.color");
const semanticDarkColor = asRecord(asRecord(darkTheme.semantic, "themes.dark.semantic").color, "themes.dark.semantic.color");

const baseColorRows: BaseColorGridRow[] = flattenTokenTree(baseColorNode, "base.color")
  .map((row) => ({
    id: row.id,
    path: row.path,
    value: tokenPrimitiveToString(row.value),
    searchText: row.path,
  }))
  .filter((row) => isColorTokenValue(row.value));

const baseColorGroups = groupRowsBySegment(
  baseColorRows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.value,
    valueText: row.value,
  })),
  2
).map((group) => ({
  id: group.id,
  label: group.label,
  rows: group.rows.map((row) => ({
    id: row.id,
    path: row.path,
    value: tokenPrimitiveToString(row.value),
    searchText: row.path,
  })),
}));

const semanticLightRows = flattenTokenTree(semanticLightColor, "semantic.color")
  .map((row) => ({
    path: row.path,
    value: tokenPrimitiveToString(row.value),
  }))
  .filter((row) => isColorTokenValue(row.value));

const semanticDarkRows = flattenTokenTree(semanticDarkColor, "semantic.color")
  .map((row) => ({
    path: row.path,
    value: tokenPrimitiveToString(row.value),
  }))
  .filter((row) => isColorTokenValue(row.value));

const semanticLightByPath = new Map(semanticLightRows.map((row) => [row.path, row.value]));
const semanticDarkByPath = new Map(semanticDarkRows.map((row) => [row.path, row.value]));
const semanticAllPaths = [...new Set([...semanticLightByPath.keys(), ...semanticDarkByPath.keys()])].sort((left, right) =>
  naturalTokenPathCompare(left, right)
);

const semanticColorRows: SemanticColorGridRow[] = semanticAllPaths.map((path) => {
  const light = semanticLightByPath.get(path) ?? "-";
  const dark = semanticDarkByPath.get(path) ?? "-";
  return {
    id: path,
    path,
    light,
    dark,
    searchText: `${path} ${light} ${dark}`,
  };
});

const semanticColorGroups = groupRowsBySegment(
  semanticColorRows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.light,
    valueText: row.light,
  })),
  2
).map((group) => ({
  id: group.id,
  label: group.label,
  rows: semanticColorRows.filter((row) => row.path.split(".")[2] === group.id),
}));

const meta = {
  title: "Foundations/Tokens/Color",
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
      title="Color Tokens"
      subtitle="Base palette scales and semantic role colors in a dense, searchable data-grid format."
    >
      <TokenSection
        title="Base Color Scales"
        description="Primitive palette families grouped by color domain. Use search and sort controls to inspect exact token values."
      >
        <TokenDataGrid
          gridLabel="base-color-grid"
          groups={baseColorGroups}
          virtualizationThreshold={10}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(320px, 1.6fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "value",
              label: "Color Value",
              width: "minmax(260px, 1fr)",
              getValue: (row) => row.value,
              render: (row) => <ColorValueCell value={row.value} />,
              copyValue: (row) => row.value,
            },
          ]}
        />
      </TokenSection>

      <TokenSection
        title="Semantic Color Contract"
        description="Light and dark theme semantic values compared side-by-side per role token."
      >
        <TokenDataGrid
          gridLabel="semantic-color-grid"
          groups={semanticColorGroups}
          virtualizationThreshold={12}
          columns={[
            {
              key: "path",
              label: "Token Path",
              width: "minmax(320px, 1.5fr)",
              getValue: (row) => row.path,
              render: (row) => <span className="font-mono text-xs text-foreground">{row.path}</span>,
              copyValue: (row) => row.path,
            },
            {
              key: "light",
              label: "Light",
              width: "minmax(260px, 1fr)",
              getValue: (row) => row.light,
              render: (row) => <ColorValueCell value={row.light} />,
              copyValue: (row) => row.light,
            },
            {
              key: "dark",
              label: "Dark",
              width: "minmax(260px, 1fr)",
              getValue: (row) => row.dark,
              render: (row) => <ColorValueCell value={row.dark} />,
              copyValue: (row) => row.dark,
            },
          ]}
        />
      </TokenSection>
    </TokenDocsPage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Color Tokens" })).toBeInTheDocument();
    await expect(canvas.getByText("Semantic Color Contract")).toBeInTheDocument();
    await expect(canvas.getByText("semantic.color.action.primary.bg")).toBeInTheDocument();
  },
};
