import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { BarcodeManualInput } from "@fodmap/barcode-web";
import { Button } from "@fodmap/ui";

interface StoryHarnessProps {
  disabled?: boolean;
  label?: string;
  submitLabel?: string;
  placeholder?: string;
  initialValue?: string;
}

function StoryHarness(props: StoryHarnessProps) {
  const [lastSubmitted, setLastSubmitted] = React.useState<string>("none");
  const [submitCount, setSubmitCount] = React.useState<number>(0);

  function handleSubmit(normalizedCode: string): void {
    setLastSubmitted(normalizedCode);
    setSubmitCount((current) => current + 1);
  }

  function resetResult(): void {
    setLastSubmitted("none");
    setSubmitCount(0);
  }

  return (
    <div
      className="w-[420px]"
      style={{
        display: "grid",
        gap: "1rem",
      }}
    >
      <BarcodeManualInput
        onSubmit={handleSubmit}
        disabled={props.disabled}
        label={props.label}
        submitLabel={props.submitLabel}
        placeholder={props.placeholder}
        initialValue={props.initialValue}
      />
      <section
        aria-label="submission-panel"
        className="space-y-2 rounded-lg border border-border p-3 text-sm"
        style={{ marginTop: "0.5rem" }}
      >
        <p>
          Last submitted normalized code: <strong data-testid="last-submitted">{lastSubmitted}</strong>
        </p>
        <p>
          Submission count: <strong data-testid="submission-count">{submitCount}</strong>
        </p>
        <Button type="button" variant="outline" size="sm" onClick={resetResult} className="h-11 px-4">
          Reset result
        </Button>
      </section>
    </div>
  );
}

const meta = {
  title: "Features/Barcode/Manual Input",
  component: BarcodeManualInput,
  tags: ["autodocs"],
  args: {
    onSubmit: () => undefined,
    label: "Enter barcode",
    submitLabel: "Lookup",
    placeholder: "EAN/UPC",
  },
  render: (args) => <StoryHarness {...args} />,
} satisfies Meta<typeof BarcodeManualInput>;

export default meta;

type Story = StoryObj<typeof meta>;

async function typeAndSubmit(canvasElement: HTMLElement, value: string) {
  const canvas = within(canvasElement);
  const input = canvas.getByRole("textbox", { name: /enter barcode/i });
  await userEvent.clear(input);
  await userEvent.type(input, value);
  await userEvent.click(canvas.getByRole("button", { name: "Lookup" }));
  return { canvas, input };
}

export const EAN13HappyPath: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await typeAndSubmit(canvasElement, "4006381333931");
    await expect(canvas.getByTestId("last-submitted")).toHaveTextContent("4006381333931");
    await expect(canvas.getByTestId("submission-count")).toHaveTextContent("1");
  },
};

export const UPCANormalizesToEAN13: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await typeAndSubmit(canvasElement, "036000291452");
    await expect(canvas.getByTestId("last-submitted")).toHaveTextContent("0036000291452");
    await expect(canvas.getByTestId("submission-count")).toHaveTextContent("1");
  },
};

export const EAN8HappyPath: Story = {
  play: async ({ canvasElement }) => {
    const { canvas } = await typeAndSubmit(canvasElement, "55123457");
    await expect(canvas.getByTestId("last-submitted")).toHaveTextContent("55123457");
    await expect(canvas.getByTestId("submission-count")).toHaveTextContent("1");
  },
};

export const InvalidCheckDigit: Story = {
  play: async ({ canvasElement }) => {
    const { canvas, input } = await typeAndSubmit(canvasElement, "4006381333932");
    const alert = canvas.getByRole("alert");
    const errorId = alert.getAttribute("id");
    await expect(alert).toHaveTextContent("check digit");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(errorId).toBeTruthy();
    await expect(input).toHaveAttribute("aria-errormessage", errorId);
    await expect(canvas.getByTestId("last-submitted")).toHaveTextContent("none");
    await expect(canvas.getByTestId("submission-count")).toHaveTextContent("0");
  },
};

export const NonDigitFiltering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /enter barcode/i });
    await userEvent.type(input, "03A6-0002 91452");
    await expect(input).toHaveValue("036000291452");
  },
};

export const EmptySubmitShowsRequired: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: /enter barcode/i });
    await userEvent.click(canvas.getByRole("button", { name: "Lookup" }));
    const alert = canvas.getByRole("alert");
    const errorId = alert.getAttribute("id");
    await expect(alert).toHaveTextContent("Barcode is required");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(errorId).toBeTruthy();
    await expect(input).toHaveAttribute("aria-errormessage", errorId);
    await expect(canvas.getByTestId("last-submitted")).toHaveTextContent("none");
    await expect(canvas.getByTestId("submission-count")).toHaveTextContent("0");
  },
};

export const DisabledState: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("textbox", { name: /enter barcode/i })).toBeDisabled();
    await expect(canvas.getByRole("button", { name: "Lookup" })).toBeDisabled();
  },
};

export const DarkModeInvalid: Story = {
  ...InvalidCheckDigit,
  globals: {
    theme: "dark",
  },
};
