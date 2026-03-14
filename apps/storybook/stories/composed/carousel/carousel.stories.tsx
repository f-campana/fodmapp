import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function CarouselAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-carousel-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  "aria-label": "Plan de repas de la semaine",
  orientation: "horizontal",
  opts: { align: "start" },
} as const;

const mealSlides = [
  {
    day: "Lundi",
    note: "Petit-dejeuner",
    summary: "Porridge a l avoine avec fraises et graines de chia",
  },
  {
    day: "Mardi",
    note: "Dejeuner",
    summary: "Bol de riz, courgettes grillees et huile infusee a l ail",
  },
  {
    day: "Mercredi",
    note: "Collation",
    summary: "Yaourt sans lactose, kiwi et noix de pecan",
  },
  {
    day: "Jeudi",
    note: "Diner",
    summary: "Saumon, pommes de terre roties et jeunes pousses",
  },
  {
    day: "Vendredi",
    note: "Batch prep",
    summary: "Base de quinoa et legumes pour les portions du week-end",
  },
] as const;

type CarouselStoryArgs = ComponentProps<typeof Carousel>;

function MealPlanCarousel({
  args,
  compact = false,
  dataSlots = false,
  itemClassName,
  rootClassName,
  showSelection = false,
}: {
  args?: CarouselStoryArgs;
  compact?: boolean;
  dataSlots?: boolean;
  itemClassName?: string;
  rootClassName?: string;
  showSelection?: boolean;
}) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [selected, setSelected] = useState(1);
  const { className, orientation = "horizontal", ...carouselArgs } = args ?? {};

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

  const defaultItemClassName =
    orientation === "vertical"
      ? "basis-full"
      : compact
        ? "sm:basis-full"
        : "sm:basis-1/2 lg:basis-1/3";

  return (
    <div className="space-y-3">
      <div
        className={
          orientation === "vertical"
            ? "w-full px-6 py-12 sm:px-8"
            : "w-full px-10 sm:px-12"
        }
      >
        <Carousel
          {...carouselArgs}
          className={[
            "mx-auto w-full",
            orientation === "vertical" ? "h-[28rem] max-w-sm" : "max-w-3xl",
            className,
            rootClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          data-slot={dataSlots ? "carousel-personnalise" : undefined}
          orientation={orientation}
          setApi={setApi}
        >
          <CarouselContent
            data-slot={dataSlots ? "contenu-personnalise" : undefined}
          >
            {mealSlides.map((slide, index) => (
              <CarouselItem
                className={[defaultItemClassName, itemClassName]
                  .filter(Boolean)
                  .join(" ")}
                data-slot={dataSlots ? "item-personnalise" : undefined}
                key={slide.day}
              >
                <article className="flex h-full min-h-56 flex-col justify-between rounded-(--radius) border border-border bg-card p-5">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      {slide.day}
                    </p>
                    <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                      {slide.note}
                    </p>
                  </div>
                  <p className="text-base leading-relaxed text-foreground">
                    {slide.summary}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Slide {index + 1}
                  </p>
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            data-slot={dataSlots ? "precedent-personnalise" : undefined}
          />
          <CarouselNext
            data-slot={dataSlots ? "suivant-personnalise" : undefined}
          />
        </Carousel>
      </div>
      {showSelection ? (
        <p className="text-sm text-muted-foreground">
          Diapositive active: {selected}
        </p>
      ) : null}
    </div>
  );
}

const meta = {
  title: "Composed/Carousel",
  component: Carousel,
  argTypes: {
    "aria-label": {
      description: "Accessible label applied to the carousel region.",
      control: { type: "text" },
      table: { defaultValue: { summary: "Plan de repas de la semaine" } },
    },
    orientation: {
      description: "Axis used for arrow-key and button navigation.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    opts: {
      description: "Embla options object forwarded to the carousel hook.",
      control: { type: "object" },
      table: { defaultValue: { summary: "{ align: 'start' }" } },
    },
    plugins: {
      description: "Embla plugins array.",
      control: false,
      table: { type: { summary: "EmblaPluginType[]" } },
    },
    setApi: {
      description: "Callback fired with the Embla API instance.",
      control: false,
      table: { type: { summary: "(api: CarouselApi) => void" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-carousel-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;

type Story = StoryObj<typeof meta>;
type StoryArgs = Story["args"];
type StoryPlayContext = Parameters<NonNullable<Story["play"]>>[0];

export const Playground: Story = {
  render: (args: StoryArgs) => (
    <CarouselAuditFrame maxWidth="3xl">
      <MealPlanCarousel args={args} showSelection />
    </CarouselAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CarouselAuditFrame maxWidth="3xl">
      <MealPlanCarousel args={defaultPlaygroundArgs} />
    </CarouselAuditFrame>
  ),
};

export const Vertical: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CarouselAuditFrame maxWidth="md">
      <MealPlanCarousel
        args={{
          ...defaultPlaygroundArgs,
          "aria-label": "Plan de repas vertical",
          orientation: "vertical",
        }}
      />
    </CarouselAuditFrame>
  ),
};

export const ControlledApi: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CarouselAuditFrame maxWidth="3xl">
      <MealPlanCarousel args={defaultPlaygroundArgs} showSelection />
    </CarouselAuditFrame>
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
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <CarouselAuditFrame maxWidth="3xl">
      <MealPlanCarousel
        args={defaultPlaygroundArgs}
        dataSlots
        itemClassName="basis-full sm:basis-full"
        showSelection
      />
    </CarouselAuditFrame>
  ),
  play: async ({ canvasElement }: StoryPlayContext) => {
    const canvas = within(canvasElement);
    const root = canvas.getByRole("region", {
      name: "Plan de repas de la semaine",
    });

    await expect(root).toHaveAttribute("data-slot", "carousel");
    await expect(root).toHaveAttribute("tabindex", "0");
    await expect(
      canvasElement.querySelector("[data-slot='carousel-viewport']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='carousel-viewport']")
        ?.className ?? "",
    ).toContain("cursor-grab");
    await expect(
      canvasElement.querySelector("[data-slot='carousel-content']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='carousel-item']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='carousel-previous']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='carousel-next']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='carousel-personnalise']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='contenu-personnalise']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='item-personnalise']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='precedent-personnalise']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='suivant-personnalise']"),
    ).toBeNull();

    await userEvent.tab();
    await expect(root).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");

    await waitFor(async () => {
      await expect(
        canvas.getByText("Diapositive active: 2"),
      ).toBeInTheDocument();
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <CarouselAuditFrame maxWidth="sm">
      <MealPlanCarousel
        args={{
          ...defaultPlaygroundArgs,
          "aria-label": "Plan compact",
        }}
        compact
        itemClassName="sm:basis-full"
      />
    </CarouselAuditFrame>
  ),
};
