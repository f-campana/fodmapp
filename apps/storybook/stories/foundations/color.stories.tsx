import type { CSSProperties } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import {
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
}

interface SemanticColorGridRow {
  id: string;
  path: string;
  light: string;
  dark: string;
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

function familySort(left: string, right: string): number {
  const preferredOrder = ["neutral", "blue", "emerald", "amber", "red"];
  const leftIndex = preferredOrder.indexOf(left);
  const rightIndex = preferredOrder.indexOf(right);

  if (leftIndex !== -1 || rightIndex !== -1) {
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  }

  return left.localeCompare(right);
}

const baseFamilyEntries = Object.entries(baseColorNode)
  .map(([family, node]) => ({
    family,
    scale: asRecord(node, `base.color.${family}`),
  }))
  .sort((left, right) => familySort(left.family, right.family));

const coreFamilyEntries = baseFamilyEntries.filter(
  (entry) =>
    entry.family !== "brand" &&
    Object.keys(entry.scale).some((key) => isScaleStep(key)),
);

const unionScaleStops = [
  ...new Set(
    coreFamilyEntries.flatMap((entry) =>
      Object.keys(entry.scale).filter((key) => isScaleStep(key)),
    ),
  ),
].sort(sortScaleStep);

const matrixRows: ColorMatrixRow[] = coreFamilyEntries.map((entry) => {
  const values = Object.fromEntries(
    unionScaleStops.map((step) => {
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
).map((group, index) => ({
  id: group.id,
  label: group.label,
  defaultCollapsed: index > 0,
  rows: group.rows.map((row) => ({
    id: row.id,
    path: row.path,
    value: tokenPrimitiveToString(row.value),
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
      label: prefix.replace(/^semantic\.color\./, ""),
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
).map((group, index) => ({
  id: group.id,
  label: group.label,
  defaultCollapsed: index > 0,
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

export const Showcase: Story = {
  render: () => {
    const matrixStyle = {
      "--fd-color-cols": String(unionScaleStops.length),
    } as CSSProperties;

    return (
      <TokenDocsPage
        title="Color Tokens"
        subtitle="A palette-first view: scan hue progression quickly, then use the companion Reference story for full token paths and values."
      >
        <TokenSection
          title="Base Color Scales"
          description="Union scale stops are shown in one matrix. Families without a stop keep that slot intentionally empty."
        >
          <div className="fd-tokendocs-showcase" aria-label="Base color scale matrix">
            <h3 className="fd-tokendocs-showcaseTitle">Scale Matrix</h3>
            <p className="fd-tokendocs-showcaseHint">
              Core families on rows, union scale stops on columns.
            </p>
            <div className="fd-tokendocs-colorMatrix" style={matrixStyle}>
              <div className="fd-tokendocs-colorMatrixHead">
                <span aria-hidden="true" />
                {unionScaleStops.map((step) => (
                  <span key={`head-${step}`} className="fd-tokendocs-colorScaleLabel">
                    {step}
                  </span>
                ))}
              </div>
              {matrixRows.map((row) => (
                <div key={row.family} className="fd-tokendocs-colorMatrixRow">
                  <span className="fd-tokendocs-colorFamilyLabel">{row.family}</span>
                  {unionScaleStops.map((step) => {
                    const value = row.values[step];
                    const tokenPath = `base.color.${row.family}.${step}`;
                    const label = value
                      ? `${tokenPath}: ${value}`
                      : `${tokenPath}: no token at this stop`;

                    return (
                      <div
                        key={`${row.family}-${step}`}
                        className={classNames(
                          "fd-tokendocs-colorMatrixCell",
                          value ? "" : "is-empty",
                        )}
                      >
                        <span
                          className="fd-tokendocs-colorSwatchBlock"
                          style={value ? { backgroundColor: value } : undefined}
                          title={label}
                          role="img"
                          aria-label={label}
                        />
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
                        title={pair.light ?? "Missing value"}
                        role="img"
                        aria-label={`base.color.brand.${pair.label}Light: ${pair.light ?? "missing"}`}
                      />
                    </div>
                    <div className="fd-tokendocs-brandSwatch">
                      <span className="fd-tokendocs-brandLabel">Dark</span>
                      <span
                        className="fd-tokendocs-brandSwatchBlock"
                        style={pair.dark ? { backgroundColor: pair.dark } : undefined}
                        title={pair.dark ?? "Missing value"}
                        role="img"
                        aria-label={`base.color.brand.${pair.label}Dark: ${pair.dark ?? "missing"}`}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TokenSection>

        <TokenSection
          title="Semantic Color Contract"
          description="Role pairs are presented for quick light/dark scanning with minimal text noise."
        >
          <div className="fd-tokendocs-showcase" aria-label="Semantic role pair previews">
            <h3 className="fd-tokendocs-showcaseTitle">Semantic Role Pairs</h3>
            <p className="fd-tokendocs-showcaseHint">
              Each card uses matching `bg` / `fg` pairs to preview contrast across themes.
            </p>
            <div className="fd-tokendocs-semanticGrid">
              {semanticPairCards.map((card) => (
                <article key={card.id} className="fd-tokendocs-semanticCard">
                  <p className="fd-tokendocs-semanticTitle">{card.label}</p>
                  <div className="fd-tokendocs-semanticRow">
                    <span className="fd-tokendocs-semanticMode">Light</span>
                    <span
                      className="fd-tokendocs-semanticSwatch"
                      style={{
                        backgroundColor: card.lightBg,
                        color: card.lightFg,
                      }}
                      title={`${card.path} (light): bg ${card.lightBg}, fg ${card.lightFg}`}
                      role="img"
                      aria-label={`${card.path} light background ${card.lightBg} with foreground ${card.lightFg}`}
                    >
                      Aa
                    </span>
                  </div>
                  <div className="fd-tokendocs-semanticRow">
                    <span className="fd-tokendocs-semanticMode">Dark</span>
                    <span
                      className="fd-tokendocs-semanticSwatch"
                      style={{
                        backgroundColor: card.darkBg,
                        color: card.darkFg,
                      }}
                      title={`${card.path} (dark): bg ${card.darkBg}, fg ${card.darkFg}`}
                      role="img"
                      aria-label={`${card.path} dark background ${card.darkBg} with foreground ${card.darkFg}`}
                    >
                      Aa
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </TokenSection>
      </TokenDocsPage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Color Tokens" })).toBeInTheDocument();
    await expect(canvas.getByText("Scale Matrix")).toBeInTheDocument();
    await expect(canvas.queryByPlaceholderText(/search token path or value/i)).not.toBeInTheDocument();
  },
};

export const Reference: Story = {
  render: () => {
    return (
      <TokenDocsPage
        title="Color Token Reference"
        subtitle="Exact path/value lookup for base and semantic color tokens."
      >
        <TokenSection
          title="Base Color References"
          description="Grouped deterministic tables for every base color token."
        >
          <nav aria-label="Base color group jump links" className="fd-tokendocs-jumpList">
            <span className="fd-tokendocs-jumpLabel">Jump to</span>
            {baseColorGroups.map((group) => (
              <a
                key={`base-${group.id}`}
                href={`#base-color-grid-${group.id}`}
                className="fd-tokendocs-jumpLink"
              >
                {group.label}
              </a>
            ))}
          </nav>

          <TokenDataGrid
            gridLabel="base-color-grid"
            groups={baseColorGroups}
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(340px, 1.6fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "value",
                label: "Color Value",
                width: "minmax(340px, 1fr)",
                getValue: (row) => row.value,
                valueMode: "wrap",
                copyValue: (row) => row.value,
              },
            ]}
          />
        </TokenSection>

        <TokenSection
          title="Semantic Color References"
          description="Light/dark semantic contract values grouped by domain."
        >
          <nav aria-label="Semantic color group jump links" className="fd-tokendocs-jumpList">
            <span className="fd-tokendocs-jumpLabel">Jump to</span>
            {semanticColorGroups.map((group) => (
              <a
                key={`semantic-${group.id}`}
                href={`#semantic-color-grid-${group.id}`}
                className="fd-tokendocs-jumpLink"
              >
                {group.label}
              </a>
            ))}
          </nav>

          <TokenDataGrid
            gridLabel="semantic-color-grid"
            groups={semanticColorGroups}
            columns={[
              {
                key: "path",
                label: "Token Path",
                width: "minmax(340px, 1.6fr)",
                getValue: (row) => row.path,
                render: (row) => <TokenPathText value={row.path} />,
                valueMode: "plain",
                copyValue: (row) => row.path,
              },
              {
                key: "light",
                label: "Light",
                width: "minmax(320px, 1fr)",
                getValue: (row) => row.light,
                valueMode: "wrap",
                copyValue: (row) => row.light,
              },
              {
                key: "dark",
                label: "Dark",
                width: "minmax(320px, 1fr)",
                getValue: (row) => row.dark,
                valueMode: "wrap",
                copyValue: (row) => row.dark,
              },
            ]}
          />
        </TokenSection>
      </TokenDocsPage>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Color Token Reference" })).toBeInTheDocument();
    await expect(canvas.getByText("Base Color References")).toBeInTheDocument();
  },
};

function classNames(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
