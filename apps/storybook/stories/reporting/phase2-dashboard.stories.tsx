import React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import "@fodmap/reporting/styles.css";

import { renderDashboardFragment } from "@fodmap/reporting/dashboard";
import { parseReportingRun } from "@fodmap/reporting/validate";

import baselineRun from "../../../../etl/phase2/reporting/contracts/baselines/now/p01_p02_p03_q02_q03_q04_e03_e04.v1.json";

function DashboardPreview(): React.ReactElement {
  const run = parseReportingRun(baselineRun);
  const fragment = renderDashboardFragment(run, {
    title: "Reporting contractuel Phase 2",
    subtitle: "Storybook fixture",
  });
  return (
    <div
      style={{
        width: "min(1240px, 100%)",
        margin: "0 auto",
        padding: "24px",
        background: "var(--color-bg)",
      }}
      dangerouslySetInnerHTML={{ __html: fragment }}
    />
  );
}

const meta = {
  title: "Reporting/Phase2 Dashboard",
  component: DashboardPreview,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DashboardPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <DashboardPreview />,
};
