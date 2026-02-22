import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import { asRecord, flattenTokenTree, parseScalarNumber, stripPathPrefix, tokenValueToString } from "./token-docs.helpers";

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

const baseColors = asRecord(base.color, "base.color");
const baseTypography = asRecord(base.typography, "base.typography");
const baseSpace = asRecord(base.space, "base.space");
const baseRadius = asRecord(base.radius, "base.radius");
const baseShadow = asRecord(base.shadow, "base.shadow");
const baseMotion = asRecord(base.motion, "base.motion");
const baseBorder = asRecord(base.border, "base.border");
const baseBorderWidth = asRecord(baseBorder.width, "base.border.width");
const baseOpacity = asRecord(base.opacity, "base.opacity");
const baseBreakpoint = asRecord(base.breakpoint, "base.breakpoint");
const baseZIndex = asRecord(base.zIndex, "base.zIndex");

const semanticLightColor = asRecord(semanticLight.color, "themes.light.semantic.color");
const semanticDarkColor = asRecord(semanticDark.color, "themes.dark.semantic.color");

const meta = {
  title: "Foundations/Tokens",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

type SemanticColorRow = {
  path: string;
  light: string;
  dark: string;
};

function isColorValue(value: string): boolean {
  return value.startsWith("oklch(") || value.startsWith("#") || value.startsWith("rgb(") || value.startsWith("hsl(");
}

function toSortedEntries(record: Record<string, unknown>): Array<[string, string]> {
  return Object.entries(record)
    .map(([key, value]) => [key, tokenValueToString(value as string | number | boolean)] as [string, string])
    .sort((left, right) => left[0].localeCompare(right[0]));
}

function toSpaceRows(record: Record<string, unknown>) {
  return toSortedEntries(record).sort((left, right) => {
    const leftValue = parseScalarNumber(left[1].replace("_", "."));
    const rightValue = parseScalarNumber(right[1].replace("_", "."));
    if (leftValue === null || rightValue === null) {
      return left[0].localeCompare(right[0]);
    }
    return leftValue - rightValue;
  });
}

function getSpaceBarWidth(value: string): number {
  const parsed = parseScalarNumber(value);
  if (parsed === null) {
    return 4;
  }

  if (value.endsWith("rem")) {
    return Math.max(4, Math.round(parsed * 48));
  }

  if (value.endsWith("px")) {
    return Math.max(4, Math.round(parsed * 8));
  }

  return Math.max(4, Math.round(parsed * 48));
}

function buildSemanticColorRows(): SemanticColorRow[] {
  const lightRows = flattenTokenTree(semanticLightColor, "semantic.color")
    .map((row) => ({ ...row, value: tokenValueToString(row.value) }))
    .filter((row) => isColorValue(row.value));

  const darkRows = flattenTokenTree(semanticDarkColor, "semantic.color")
    .map((row) => ({ ...row, value: tokenValueToString(row.value) }))
    .filter((row) => isColorValue(row.value));

  const lightByPath = new Map(lightRows.map((row) => [row.path, row.value]));
  const darkByPath = new Map(darkRows.map((row) => [row.path, row.value]));
  const allPaths = [...new Set([...lightByPath.keys(), ...darkByPath.keys()])].sort((left, right) => left.localeCompare(right));

  return allPaths.map((path) => ({
    path,
    light: lightByPath.get(path) ?? "-",
    dark: darkByPath.get(path) ?? "-",
  }));
}

const semanticRows = buildSemanticColorRows();
const typographySections = [
  { label: "Font Families", data: asRecord(baseTypography.fontFamily, "base.typography.fontFamily"), prefix: "base.typography.fontFamily" },
  { label: "Font Sizes", data: asRecord(baseTypography.fontSize, "base.typography.fontSize"), prefix: "base.typography.fontSize" },
  { label: "Font Weights", data: asRecord(baseTypography.fontWeight, "base.typography.fontWeight"), prefix: "base.typography.fontWeight" },
  { label: "Line Heights", data: asRecord(baseTypography.lineHeight, "base.typography.lineHeight"), prefix: "base.typography.lineHeight" },
  { label: "Letter Spacing", data: asRecord(baseTypography.letterSpacing, "base.typography.letterSpacing"), prefix: "base.typography.letterSpacing" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ValueCode({ value }: { value: string }) {
  return <code className="rounded bg-surface-muted px-2 py-1 text-xs text-foreground">{value}</code>;
}

export const Explorer: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8 text-foreground">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Design Tokens</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Source of truth: <code>@fodmap/design-tokens</code> generated artifacts.
        </p>
      </header>

      <Section title="Base Colors" description="Palette families used to compose semantic tokens.">
        <div className="space-y-6">
          {Object.entries(baseColors)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([family, familyNode]) => {
              const familyPath = `base.color.${family}`;
              const rows = flattenTokenTree(familyNode, familyPath)
                .map((row) => ({
                  path: row.path,
                  shortPath: stripPathPrefix(row.path, familyPath),
                  value: tokenValueToString(row.value),
                }))
                .filter((row) => isColorValue(row.value));

              return (
                <div key={family} className="space-y-3">
                  <h3 className="text-lg font-semibold capitalize text-foreground">{family}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {rows.map((row) => (
                      <article key={row.path} className="space-y-2 rounded-lg border border-border bg-background p-3">
                        <div className="h-12 rounded-md border border-border" style={{ backgroundColor: row.value }} />
                        <p className="text-xs font-medium text-foreground">{row.path}</p>
                        <ValueCode value={row.value} />
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </Section>

      <Section title="Semantic Colors" description="Theme contract values shown side by side for light and dark modes.">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-surface-muted text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Token Path</th>
                <th className="px-3 py-2 font-semibold">Light</th>
                <th className="px-3 py-2 font-semibold">Dark</th>
              </tr>
            </thead>
            <tbody>
              {semanticRows.map((row) => (
                <tr key={row.path} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="font-mono text-xs text-foreground">{row.path}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-8 rounded border border-border" style={{ backgroundColor: row.light }} />
                      <ValueCode value={row.light} />
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-8 rounded border border-border" style={{ backgroundColor: row.dark }} />
                      <ValueCode value={row.dark} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Typography" description="Font family, size, weight, line-height, and letter-spacing primitives.">
        <div className="grid gap-4 lg:grid-cols-2">
          {typographySections.map((section) => {
            const rows = flattenTokenTree(section.data, section.prefix).map((row) => ({
              path: row.path,
              label: stripPathPrefix(row.path, section.prefix),
              value: tokenValueToString(row.value),
            }));

            return (
              <div key={section.prefix} className="rounded-lg border border-border bg-background p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">{section.label}</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.path} className="border-t border-border first:border-t-0">
                        <td className="py-2 pr-3 align-top text-xs font-medium text-muted-foreground">{row.path}</td>
                        <td className="py-2 text-right">
                          <ValueCode value={row.value} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Spacing Scale" description="Spacing tokens with proportional bar previews.">
        <div className="space-y-2">
          {toSpaceRows(baseSpace).map(([key, value]) => (
            <div key={`base.space.${key}`} className="grid grid-cols-[140px_1fr_220px] items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
              <span className="font-mono text-xs text-muted-foreground">{`base.space.${key}`}</span>
              <div className="h-3 rounded bg-primary/25" style={{ width: `${getSpaceBarWidth(value)}px` }} />
              <div className="text-right">
                <ValueCode value={value} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius Scale" description="Border radius primitives with shape previews.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {toSortedEntries(baseRadius).map(([key, value]) => (
            <article key={`base.radius.${key}`} className="space-y-2 rounded-lg border border-border bg-background p-3">
              <div className="h-12 border border-border bg-surface-raised" style={{ borderRadius: value }} />
              <p className="text-xs font-medium text-foreground">{`base.radius.${key}`}</p>
              <ValueCode value={value} />
            </article>
          ))}
        </div>
      </Section>

      <Section title="Shadows" description="Shadow primitives rendered on neutral surfaces.">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {toSortedEntries(baseShadow).map(([key, value]) => (
            <article key={`base.shadow.${key}`} className="space-y-3 rounded-lg border border-border bg-background p-4">
              <div className="rounded-md border border-border bg-surface p-5 text-xs text-muted-foreground" style={{ boxShadow: value }}>
                shadow preview
              </div>
              <p className="text-xs font-medium text-foreground">{`base.shadow.${key}`}</p>
              <ValueCode value={value} />
            </article>
          ))}
        </div>
      </Section>

      <Section title="Motion" description="Duration and easing primitives used by interactive components.">
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Durations", data: asRecord(baseMotion.duration, "base.motion.duration"), prefix: "base.motion.duration" },
            { title: "Easing", data: asRecord(baseMotion.easing, "base.motion.easing"), prefix: "base.motion.easing" },
          ].map((section) => (
            <div key={section.prefix} className="rounded-lg border border-border bg-background p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{section.title}</h3>
              <table className="w-full text-sm">
                <tbody>
                  {flattenTokenTree(section.data, section.prefix).map((row) => (
                    <tr key={row.path} className="border-t border-border first:border-t-0">
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{row.path}</td>
                      <td className="py-2 text-right">
                        <ValueCode value={tokenValueToString(row.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Other Foundations" description="Border widths, opacity, breakpoints, and z-index scales.">
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Border Width", data: baseBorderWidth, prefix: "base.border.width" },
            { title: "Opacity", data: baseOpacity, prefix: "base.opacity" },
            { title: "Breakpoints", data: baseBreakpoint, prefix: "base.breakpoint" },
            { title: "Z-Index", data: baseZIndex, prefix: "base.zIndex" },
          ].map((section) => (
            <div key={section.prefix} className="rounded-lg border border-border bg-background p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">{section.title}</h3>
              <table className="w-full text-sm">
                <tbody>
                  {flattenTokenTree(section.data, section.prefix).map((row) => (
                    <tr key={row.path} className="border-t border-border first:border-t-0">
                      <td className="py-2 pr-3 text-xs text-muted-foreground">{row.path}</td>
                      <td className="py-2 text-right">
                        <ValueCode value={tokenValueToString(row.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Design Tokens" })).toBeInTheDocument();
    await expect(canvas.getByText("base.color.neutral.50")).toBeInTheDocument();
    await expect(canvas.getByText("semantic.color.action.primary.bg")).toBeInTheDocument();
  },
};
