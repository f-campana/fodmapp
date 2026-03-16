import { type ComponentProps, type ReactNode, useId, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Slider } from "@fodmapp/ui/slider";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function SliderAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-slider-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultValue: [40],
  min: 0,
  max: 100,
  step: 5,
  disabled: false,
  onValueChange: fn(),
};

const meta = {
  title: "Primitives/Adapter/Slider",
  component: Slider,
  argTypes: {
    defaultValue: {
      description: "Single-thumb value array. Pass exactly one numeric entry.",
      control: "object",
      table: { defaultValue: { summary: "[40]" } },
    },
    min: {
      description: "Minimum value for the horizontal range.",
      control: { type: "number", min: 0, max: 100 },
      table: { defaultValue: { summary: "0" } },
    },
    max: {
      description: "Maximum value for the horizontal range.",
      control: { type: "number", min: 1, max: 100 },
      table: { defaultValue: { summary: "100" } },
    },
    step: {
      description: "Keyboard and pointer step size.",
      control: { type: "number", min: 1, max: 25 },
      table: { defaultValue: { summary: "5" } },
    },
    disabled: {
      description: "Disables pointer and keyboard interaction.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onValueChange: {
      description: "Callback fired with the current single-thumb value array.",
    },
    className: {
      description: "Additional classes merged with the slider root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-slider-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<typeof meta>;
type SliderStoryArgs = Story["args"];

function SliderField({
  args,
  description,
  label,
  sliderProps,
}: {
  args?: SliderStoryArgs;
  description: string;
  label: string;
  sliderProps?: {
    "data-slot"?: string;
    className?: ComponentProps<typeof Slider>["className"];
  };
}) {
  const {
    defaultValue = [40],
    max = 100,
    min = 0,
    onValueChange,
    ...sliderArgs
  } = args ?? {};
  const initialValue = defaultValue[0] ?? min;
  const resetKey = `${min}-${max}-${defaultValue.join(",")}`;

  return (
    <SliderFieldState
      description={description}
      initialValue={initialValue}
      key={resetKey}
      label={label}
      max={max}
      min={min}
      onValueChange={onValueChange}
      sliderArgs={sliderArgs}
      sliderProps={sliderProps}
    />
  );
}

function SliderFieldState({
  description,
  initialValue,
  label,
  max,
  min,
  onValueChange,
  sliderArgs,
  sliderProps,
}: {
  description: string;
  initialValue: number;
  label: string;
  max: number;
  min: number;
  onValueChange?: ComponentProps<typeof Slider>["onValueChange"];
  sliderArgs: Omit<ComponentProps<typeof Slider>, "max" | "min" | "value">;
  sliderProps?: {
    "data-slot"?: string;
    className?: ComponentProps<typeof Slider>["className"];
  };
}) {
  const [currentValue, setCurrentValue] = useState(initialValue);
  const labelId = useId();

  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground" id={labelId}>
            {label}
          </p>
          <span className="text-sm font-medium text-foreground">
            {currentValue}%
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2 px-1">
        <Slider
          {...sliderArgs}
          {...sliderProps}
          aria-labelledby={labelId}
          max={max}
          min={min}
          value={[currentValue]}
          onValueChange={(nextValue) => {
            const next = nextValue[0] ?? min;
            setCurrentValue(next);
            onValueChange?.(nextValue);
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{min}%</span>
          <span>{max}%</span>
        </div>
      </div>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => (
    <SliderAuditFrame maxWidth="md">
      <SliderField
        args={args}
        description="Adjust the tolerated intensity before this substitution is hidden from the daily view."
        label="Tolerance threshold"
      />
    </SliderAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <SliderAuditFrame maxWidth="md">
      <SliderField
        args={defaultPlaygroundArgs}
        description="Adjust the tolerated intensity before this substitution is hidden from the daily view."
        label="Tolerance threshold"
      />
    </SliderAuditFrame>
  ),
};

export const Disabled: Story = {
  args: {
    ...defaultPlaygroundArgs,
    defaultValue: [55],
    disabled: true,
    onValueChange: fn(),
  },
  parameters: fixedStoryParameters,
  render: (args) => (
    <SliderAuditFrame maxWidth="md">
      <SliderField
        args={args}
        description="This threshold is locked while the care plan is under review."
        label="Locked threshold"
      />
    </SliderAuditFrame>
  ),
};

export const DarkMode: Story = {
  ...Default,
  parameters: fixedStoryParameters,
  globals: {
    theme: "dark",
  },
};

export const InteractionChecks: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onValueChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: (args) => (
    <SliderAuditFrame maxWidth="md">
      <SliderField
        args={args}
        description="Check keyboard movement, slot markers, and the visible value readout."
        label="Tolerance threshold"
        sliderProps={{ "data-slot": "custom-slider" }}
      />
    </SliderAuditFrame>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const thumb = canvas.getByRole("slider", { name: "Tolerance threshold" });
    const root = thumb.closest("[data-slot='slider']");

    await expect(root).toHaveAttribute("data-slot", "slider");
    await expect(
      root?.querySelector("[data-slot='slider-track']"),
    ).toBeTruthy();
    await expect(
      root?.querySelector("[data-slot='slider-range']"),
    ).toBeTruthy();
    await expect(thumb).toHaveAttribute("data-slot", "slider-thumb");
    await expect(
      canvasElement.querySelector("[data-slot='custom-slider']"),
    ).toBeNull();
    await expect(thumb).toHaveAttribute("aria-valuenow", "40");
    await expect(thumb.className).toContain("focus-visible:ring-ring-soft");
    await expect(thumb.className).toContain("data-[disabled]:opacity-50");

    thumb.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith([45]);
    await expect(thumb).toHaveAttribute("aria-valuenow", "45");

    await userEvent.keyboard("{ArrowLeft}");
    await expect(args.onValueChange).toHaveBeenLastCalledWith([40]);
    await expect(thumb).toHaveAttribute("aria-valuenow", "40");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <SliderAuditFrame maxWidth="sm">
      <SliderField
        args={{
          ...defaultPlaygroundArgs,
          defaultValue: [65],
          max: 120,
          onValueChange: fn(),
        }}
        description="Keep the thumb, range, and readout legible when the supporting copy needs to explain how symptom severity is translated into a daily threshold on mobile."
        label="Tolerance threshold for compact daily recommendations"
      />
    </SliderAuditFrame>
  ),
};
