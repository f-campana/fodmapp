import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import tokens from "@fodmap/design-tokens";

import { MetricCard, TokenDocsPage, TokenSection } from "./token-docs.components";
import { asRecord, countTokenLeaves } from "./token-docs.helpers";

const base = asRecord(tokens.base, "base");
const themes = asRecord(tokens.themes, "themes");
const lightTheme = asRecord(themes.light, "themes.light");
const darkTheme = asRecord(themes.dark, "themes.dark");
const semanticLight = asRecord(lightTheme.semantic, "themes.light.semantic");
const semanticDark = asRecord(darkTheme.semantic, "themes.dark.semantic");

const baseDomainEntries = [
  { label: "Color", node: asRecord(base.color, "base.color") },
  { label: "Typography", node: asRecord(base.typography, "base.typography") },
  { label: "Spacing", node: asRecord(base.space, "base.space") },
  { label: "Radius", node: asRecord(base.radius, "base.radius") },
  { label: "Shadow", node: asRecord(base.shadow, "base.shadow") },
  { label: "Motion", node: asRecord(base.motion, "base.motion") },
  { label: "Border", node: asRecord(base.border, "base.border") },
  { label: "Opacity", node: asRecord(base.opacity, "base.opacity") },
  { label: "Breakpoints", node: asRecord(base.breakpoint, "base.breakpoint") },
  { label: "Z-Index", node: asRecord(base.zIndex, "base.zIndex") },
];

const semanticDomainEntries = [{ label: "Semantic", node: semanticLight }];

const meta = {
  title: "Foundations/Tokens/Overview",
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
      title="Token Foundations"
      subtitle="Technical documentation for base and semantic token contracts consumed from @fodmap/design-tokens."
    >
      <TokenSection
        title="Architecture"
        description="Tokens are organized as base primitives and semantic aliases layered by theme."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Base Leaves"
            value={String(countTokenLeaves(base))}
            description="Primitive leaves spanning color, typography, spacing, motion, and structural scales."
          />
          <MetricCard
            label="Semantic Leaves (Light)"
            value={String(countTokenLeaves(semanticLight))}
            description="Theme-aware semantic leaves consumed by UI and Storybook."
          />
          <MetricCard
            label="Semantic Leaves (Dark)"
            value={String(countTokenLeaves(semanticDark))}
            description="Dark mode semantic contract aligned with system and explicit overrides."
          />
          <MetricCard
            label="Theme Modes"
            value="3"
            description="System default plus explicit light and dark via Storybook toolbar."
          />
        </div>
      </TokenSection>

      <TokenSection
        title="Documentation Pages"
        description="Navigate the focused pages below for dense token inspection by domain."
      >
        <ul className="grid gap-2 text-sm text-foreground">
          <li>
            <a className="inline-flex rounded px-2 py-1 text-primary hover:bg-surface-muted hover:underline" href="?path=/story/foundations-tokens-color--reference">
              Foundations/Tokens/Color
            </a>
          </li>
          <li>
            <a className="inline-flex rounded px-2 py-1 text-primary hover:bg-surface-muted hover:underline" href="?path=/story/foundations-tokens-typography--reference">
              Foundations/Tokens/Typography
            </a>
          </li>
          <li>
            <a className="inline-flex rounded px-2 py-1 text-primary hover:bg-surface-muted hover:underline" href="?path=/story/foundations-tokens-spacing-layout--reference">
              Foundations/Tokens/Spacing & Layout
            </a>
          </li>
          <li>
            <a className="inline-flex rounded px-2 py-1 text-primary hover:bg-surface-muted hover:underline" href="?path=/story/foundations-tokens-motion-effects--reference">
              Foundations/Tokens/Motion & Effects
            </a>
          </li>
        </ul>
      </TokenSection>

      <TokenSection
        title="Domain Coverage"
        description="Leaf counts by domain to quickly assess breadth and documentation completeness."
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-2 rounded border border-border bg-background p-3">
            <h3 className="font-sans text-sm font-semibold">Base Domains</h3>
            <div className="space-y-1">
              {baseDomainEntries.map((entry) => (
                <div key={entry.label} className="grid grid-cols-[1fr_auto] gap-2 border-b border-border py-1 text-xs last:border-b-0">
                  <span className="text-muted-foreground">{entry.label}</span>
                  <span className="font-mono text-foreground">{countTokenLeaves(entry.node)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2 rounded border border-border bg-background p-3">
            <h3 className="font-sans text-sm font-semibold">Semantic Domains</h3>
            <div className="space-y-1">
              {semanticDomainEntries.map((entry) => (
                <div key={entry.label} className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-border py-1 text-xs last:border-b-0">
                  <span className="text-muted-foreground">{entry.label}</span>
                  <span className="font-mono text-foreground">L:{countTokenLeaves(entry.node)}</span>
                  <span className="font-mono text-foreground">D:{countTokenLeaves(semanticDark)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TokenSection>
    </TokenDocsPage>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Token Foundations" })).toBeInTheDocument();
    await expect(canvas.getByText("Foundations/Tokens/Color")).toBeInTheDocument();
  },
};
