import type { CSSProperties } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
  ColorValueCell,
  ReferenceTables,
  TokenDataGrid,
  TokenDocsPage,
  TokenPathText,
  TokenSection,
} from "./token-docs.components";
import {
  asRecord,
  flattenTokenTree,
  groupRowsBySegment,
  isColorTokenValue,
  naturalTokenPathCompare,
  tokenPrimitiveToString,
} from "./token-docs.helpers";

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

interface ColorMatrixRow {
  family: string;
  values: Record<string, string | null>;
}

interface BrandPair {
  id: string;
  label: string;
  light: string | null;
  dark: string | null;
}

interface SemanticPairCard {
  id: string;
  label: string;
  path: string;
  lightBg: string;
  lightFg: string;
  darkBg: string;
  darkFg: string;
}

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");

const baseColorNode = asRecord(base.color, "base.color");
const semanticLightColor = asRecord(
  asRecord(lightTheme.semantic, "themes.light.semantic").color,
  "themes.light.semantic.color",
);
const semanticDarkColor = asRecord(
  asRecord(darkTheme.semantic, "themes.dark.semantic").color,
  "themes.dark.semantic.color",
);

function isScaleStep(value: string): boolean {
  return /^\d+$/.test(value);
}

function sortScaleStep(left: string, right: string): number {
  return Number.parseInt(left, 10) - Number.parseInt(right, 10);
}

const baseFamilyEntries = Object.entries(baseColorNode).map(([family, node]) => ({
  family,
  scale: asRecord(node, `base.color.${family}`),
}));

const matrixScaleSteps = [
  ...new Set(
    baseFamilyEntries
      .flatMap((entry) => Object.keys(entry.scale))
      .filter((key) => isScaleStep(key)),
  ),
].sort(sortScaleStep);

const matrixRows: ColorMatrixRow[] = baseFamilyEntries
  .filter((entry) => Object.keys(entry.scale).some((key) => isScaleStep(key)))
  .map((entry) => {
    const values = Object.fromEntries(
      matrixScaleSteps.map((step) => {
        const token = entry.scale[step];
        return [
          step,
          typeof token === "string" && isColorTokenValue(token) ? token : null,
        ];
      }),
    );

    return {
      family: entry.family,
      values,
    };
  });

const brandScale = asRecord(baseColorNode.brand, "base.color.brand");
const brandPairsMap = new Map<string, BrandPair>();
for (const [key, value] of Object.entries(brandScale)) {
  if (typeof value !== "string" || !isColorTokenValue(value)) {
    continue;
  }

  const lightMatch = key.match(/^(.*)Light$/);
  if (lightMatch) {
    const pairKey = lightMatch[1];
    const existing = brandPairsMap.get(pairKey) ?? {
      id: pairKey,
      label: pairKey,
      light: null,
      dark: null,
    };
    existing.light = value;
    brandPairsMap.set(pairKey, existing);
    continue;
  }

  const darkMatch = key.match(/^(.*)Dark$/);
  if (darkMatch) {
    const pairKey = darkMatch[1];
    const existing = brandPairsMap.get(pairKey) ?? {
      id: pairKey,
      label: pairKey,
      light: null,
      dark: null,
    };
    existing.dark = value;
    brandPairsMap.set(pairKey, existing);
  }
}

const brandPairs = [...brandPairsMap.values()].sort((left, right) =>
  left.label.localeCompare(right.label),
);

const baseColorRows: BaseColorGridRow[] = flattenTokenTree(
  baseColorNode,
  "base.color",
)
  .map((row) => {
    const value = tokenPrimitiveToString(row.value);
    return {
      id: row.id,
      path: row.path,
      value,
      searchText: `${row.path} ${value}`,
    };
  })
  .filter((row) => isColorTokenValue(row.value));

const baseColorGroups = groupRowsBySegment(
  baseColorRows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.value,
    valueText: row.value,
  })),
  2,
).map((group) => ({
  id: group.id,
  label: group.label,
  rows: group.rows.map((row) => ({
    id: row.id,
    path: row.path,
    value: tokenPrimitiveToString(row.value),
    searchText: `${row.path} ${tokenPrimitiveToString(row.value)}`,
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

const semanticLightByPath = new Map(
  semanticLightRows.map((row) => [row.path, row.value]),
);
const semanticDarkByPath = new Map(
  semanticDarkRows.map((row) => [row.path, row.value]),
);
const semanticAllPaths = [
  ...new Set([...semanticLightByPath.keys(), ...semanticDarkByPath.keys()]),
].sort((left, right) => naturalTokenPathCompare(left, right));

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

const semanticByPath = new Map(semanticColorRows.map((row) => [row.path, row]));

const semanticPairCards: SemanticPairCard[] = semanticColorRows
  .filter((row) => row.path.endsWith(".bg"))
  .map((row) => {
    const prefix = row.path.slice(0, -3);
    const lightFg = semanticByPath.get(`${prefix}.fg`)?.light;
    const darkFg = semanticByPath.get(`${prefix}.fg`)?.dark;

    if (
      !lightFg ||
      !darkFg ||
      !isColorTokenValue(row.light) ||
      !isColorTokenValue(row.dark) ||
      !isColorTokenValue(lightFg) ||
      !isColorTokenValue(darkFg)
    ) {
      return null;
    }

    return {
      id: prefix,
      label: prefix.split(".").slice(2).join("."),
      path: row.path,
      lightBg: row.light,
      lightFg,
      darkBg: row.dark,
      darkFg,
    };
  })
  .filter((value): value is SemanticPairCard => value !== null)
  .sort((left, right) => left.label.localeCompare(right.label));

const semanticColorGroups = groupRowsBySegment(
  semanticColorRows.map((row) => ({
    id: row.id,
    path: row.path,
    value: row.light,
    valueText: row.light,
  })),
  2,
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
  render: () => {
    const matrixStyle = {
      "--fd-color-cols": String(matrixScaleSteps.length),
    } as CSSProperties;

    return (
      <TokenDocsPage
        title="Color Tokens"
        subtitle="A palette-first view inspired by modern token docs: scan full scales visually first, then inspect exact values in collapsed reference tables."
      >
        <TokenSection
          title="Base Color Scales"
          description="Token scales rendered as a matrix for quick perception of hue families and tonal progression."
        >
          <div className="fd-tokendocs-showcase" aria-label="Base color scale matrix">
            <h3 className="fd-tokendocs-showcaseTitle">Scale Matrix</h3>
            <p className="fd-tokendocs-showcaseHint">
              Families on rows, scale stops on columns. Empty cells indicate missing stops in a family.
            </p>
            <div className="fd-tokendocs-colorMatrix" style={matrixStyle}>
              <div className="fd-tokendocs-colorMatrixHead">
                <span aria-hidden="true" />
                {matrixScaleSteps.map((step) => (
                  <span key={`head-${step}`} className="fd-tokendocs-colorScaleLabel">
                    {step}
                  </span>
                ))}
              </div>
              {matrixRows.map((row) => (
                <div key={row.family} className="fd-tokendocs-colorMatrixRow">
                  <span className="fd-tokendocs-colorFamilyLabel">{row.family}</span>
                  {matrixScaleSteps.map((step) => {
                    const value = row.values[step];
                    const tokenPath = `base.color.${row.family}.${step}`;
                    const label = value
                      ? `${tokenPath}: ${value}`
                      : `${tokenPath}: missing value`;
                    return (
                      <div
                        key={`${row.family}-${step}`}
                        className={`fd-tokendocs-colorMatrixCell${value ? "" : " is-missing"}`}
                      >
                        <span
                          className="fd-tokendocs-colorSwatchBlock"
                          style={value ? { backgroundColor: value } : undefined}
                          title={label}
                          role="img"
                          aria-label={label}
                        />
                        <span className="fd-tokendocs-colorCellValue">
                          {value ?? "Missing value"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="fd-tokendocs-brandGrid">
              {brandPairs.map((pair) => (
                <article key={pair.id} className="fd-tokendocs-brandCard">
                  <p className="fd-tokendocs-brandTitle">brand.{pair.label}</p>
                  <div className="fd-tokendocs-brandSwatches">
                    <div className="fd-tokendocs-brandSwatch">
                      <span className="fd-tokendocs-brandLabel">Light</span>
                      <span
                        className="fd-tokendocs-brandSwatchBlock"
                        style={pair.light ? { backgroundColor: pair.light } : undefined}
                      />
                      <span className="fd-tokendocs-brandValue">{pair.light ?? "-"}</span>
                    </div>
                    <div className="fd-tokendocs-brandSwatch">
                      <span className="fd-tokendocs-brandLabel">Dark</span>
                      <span
                        className="fd-tokendocs-brandSwatchBlock"
                        style={pair.dark ? { backgroundColor: pair.dark } : undefined}
                      />
                      <span className="fd-tokendocs-brandValue">{pair.dark ?? "-"}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <ReferenceTables hint="Expand for exact base color path/value references.">
            <TokenDataGrid
              gridLabel="base-color-grid"
              groups={baseColorGroups}
              showToolbar={false}
              columns={[
                {
                  key: "path",
                  label: "Token Path",
                  width: "minmax(320px, 1.6fr)",
                  sortable: false,
                  getValue: (row) => row.path,
                  render: (row) => <TokenPathText value={row.path} />,
                  valueMode: "plain",
                  copyValue: (row) => row.path,
                },
                {
                  key: "value",
                  label: "Color Value",
                  width: "minmax(260px, 1fr)",
                  sortable: false,
                  getValue: (row) => row.value,
                  render: (row) => <ColorValueCell value={row.value} />,
                  valueMode: "plain",
                  copyValue: (row) => row.value,
                },
              ]}
            />
          </ReferenceTables>
        </TokenSection>

        <TokenSection
          title="Semantic Color Contract"
          description="Role-oriented light and dark values with foreground/background pairing previews."
        >
          <div className="fd-tokendocs-showcase" aria-label="Semantic role pair previews">
            <h3 className="fd-tokendocs-showcaseTitle">Semantic Role Pairs</h3>
            <p className="fd-tokendocs-showcaseHint">
              Each card uses paired `bg` and `fg` tokens for light/dark readability checks.
            </p>
            <div className="fd-tokendocs-contrastGrid">
              {semanticPairCards.map((card) => (
                <article key={card.id} className="fd-tokendocs-contrastCard">
                  <p className="fd-tokendocs-contrastTitle">{card.label}</p>
                  <p className="fd-tokendocs-contrastPath">{card.path}</p>
                  <div className="fd-tokendocs-contrastSwatches">
                    <div className="fd-tokendocs-contrastChip">
                      <span className="fd-tokendocs-contrastChipLabel">Light</span>
                      <span
                        className="fd-tokendocs-contrastChipSample"
                        style={{ backgroundColor: card.lightBg, color: card.lightFg }}
                      >
                        Aa
                      </span>
                      <span className="fd-tokendocs-contrastChipValue">{card.lightBg}</span>
                    </div>
                    <div className="fd-tokendocs-contrastChip">
                      <span className="fd-tokendocs-contrastChipLabel">Dark</span>
                      <span
                        className="fd-tokendocs-contrastChipSample"
                        style={{ backgroundColor: card.darkBg, color: card.darkFg }}
                      >
                        Aa
                      </span>
                      <span className="fd-tokendocs-contrastChipValue">{card.darkBg}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <ReferenceTables hint="Expand for exact semantic light/dark references.">
            <TokenDataGrid
              gridLabel="semantic-color-grid"
              groups={semanticColorGroups}
              showToolbar={false}
              columns={[
                {
                  key: "path",
                  label: "Token Path",
                  width: "minmax(320px, 1.5fr)",
                  sortable: false,
                  getValue: (row) => row.path,
                  render: (row) => <TokenPathText value={row.path} />,
                  valueMode: "plain",
                  copyValue: (row) => row.path,
                },
                {
                  key: "light",
                  label: "Light",
                  width: "minmax(260px, 1fr)",
                  sortable: false,
                  getValue: (row) => row.light,
                  render: (row) => <ColorValueCell value={row.light} />,
                  valueMode: "plain",
                  copyValue: (row) => row.light,
                },
                {
                  key: "dark",
                  label: "Dark",
                  width: "minmax(260px, 1fr)",
                  sortable: false,
                  getValue: (row) => row.dark,
                  render: (row) => <ColorValueCell value={row.dark} />,
                  valueMode: "plain",
                  copyValue: (row) => row.dark,
                },
              ]}
            />
          </ReferenceTables>
        </TokenSection>
      </TokenDocsPage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByRole("heading", { name: "Color Tokens" }),
    ).toBeInTheDocument();
    await expect(canvas.getByText("Scale Matrix")).toBeInTheDocument();
    await expect(canvas.getByText("Semantic Role Pairs")).toBeInTheDocument();
  },
};
