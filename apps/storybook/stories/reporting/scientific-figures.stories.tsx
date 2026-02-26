import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  parseReportingRun,
  renderScientificSvgBundle,
  SCIENTIFIC_FIGURE_ORDER,
} from "@fodmap/reporting";
import baselineRun from "../../../../etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json";

function ScientificFiguresPreview(): React.ReactElement {
  const run = parseReportingRun(baselineRun);
  const bundle = renderScientificSvgBundle(run, {});
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        width: "min(1240px, 100%)",
        margin: "0 auto",
        padding: 24,
        background: "var(--color-bg)",
      }}
    >
      {SCIENTIFIC_FIGURE_ORDER.map((file) => (
        <article
          key={file}
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              fontFamily: "var(--fd-base-typography-font-family-mono)",
              fontSize: 12,
              background: "var(--color-surface-muted)",
              color: "var(--color-text-muted)",
            }}
          >
            {file}
          </div>
          <div dangerouslySetInnerHTML={{ __html: bundle[file] }} />
        </article>
      ))}
    </div>
  );
}

const meta = {
  title: "Reporting/Scientific Figures",
  component: ScientificFiguresPreview,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ScientificFiguresPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ScientificFiguresPreview />,
};
