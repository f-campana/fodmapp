import { useEffect, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      description: "Carousel axis orientation.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    opts: {
      description: "Embla options object.",
      control: { type: "object" },
      table: { defaultValue: { summary: "undefined" } },
    },
    plugins: {
      description: "Embla plugins array.",
      control: false,
      table: { type: { summary: "EmblaPluginType[]" } },
    },
    setApi: {
      description: "Callback invoked with the Embla API instance.",
      control: false,
      table: { type: { summary: "(api: CarouselApi) => void" } },
    },
    children: {
      description: "Carousel content and controls.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    orientation: "horizontal",
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;

function Slides() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <CarouselItem key={index}>
          <div className="flex h-36 items-center justify-center rounded-(--radius) border border-border bg-card text-sm font-medium">
            Carte {index + 1}
          </div>
        </CarouselItem>
      ))}
    </>
  );
}

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <Carousel {...args} className="w-full max-w-xl">
        <CarouselContent>
          <Slides />
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector("[data-slot='carousel']");
    const content = canvasElement.querySelector(
      "[data-slot='carousel-content']",
    );
    const item = canvasElement.querySelector("[data-slot='carousel-item']");
    const previous = canvasElement.querySelector(
      "[data-slot='carousel-previous']",
    );
    const next = canvasElement.querySelector("[data-slot='carousel-next']");

    await expect(root).toHaveAttribute("data-slot", "carousel");
    await expect(content).toHaveAttribute("data-slot", "carousel-content");
    await expect(item).toHaveAttribute("data-slot", "carousel-item");
    await expect(previous).toHaveAttribute("data-slot", "carousel-previous");
    await expect(next).toHaveAttribute("data-slot", "carousel-next");

    await expect((previous as HTMLElement).className).not.toContain(
      "focus-visible:ring-ring/50",
    );

    const canvas = within(canvasElement);
    const nextButton = canvas.getByRole("button", { name: "Slide suivant" });
    if (!nextButton.hasAttribute("disabled")) {
      await userEvent.click(nextButton);
    }
  },
};

export const Vertical: Story = {
  args: {
    orientation: "vertical",
  },
  render: (args) => (
    <div className="flex min-h-96 items-center justify-center">
      <Carousel {...args} className="h-80 w-full max-w-xs">
        <CarouselContent>
          <Slides />
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

function ControlledApiExample(args: Story["args"]) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(1);

  useEffect(() => {
    if (!api) {
      return;
    }

    const sync = () => {
      setSelected(api.selectedScrollSnap() + 1);
    };

    sync();
    api.on("select", sync);

    return () => {
      api.off("select", sync);
    };
  }, [api]);

  return (
    <div className="space-y-3">
      <Carousel {...args} className="w-full max-w-xl" setApi={setApi}>
        <CarouselContent>
          <Slides />
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <p className="text-sm text-muted-foreground">
        Diapositive active: {selected}
      </p>
    </div>
  );
}

export const ControlledApi: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <ControlledApiExample {...args} />
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  globals: {
    theme: "dark",
  },
};
