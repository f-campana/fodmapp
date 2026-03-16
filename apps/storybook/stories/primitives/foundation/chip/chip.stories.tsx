import {
  type ComponentProps,
  type ReactNode,
  useEffect,
  useState,
} from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Chip } from "@fodmapp/ui/chip";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ChipAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-chip-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  variant: "default",
  selected: false,
  removable: false,
  disabled: false,
  children: "Sans lactose",
  removeLabel: "Retirer le filtre Sans lactose",
  onSelect: fn(),
  onRemove: fn(),
} as const;

const meta = {
  title: "Primitives/Foundation/Chip",
  component: Chip,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description: "Chooses the visual tone for an interactive chip.",
      control: { type: "radio" },
      options: ["default", "secondary", "outline"],
      table: { defaultValue: { summary: "default" } },
    },
    selected: {
      description: "Exposes pressed state on the main chip button.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    removable: {
      description: "Adds a second button dedicated to removing the chip.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disabled: {
      description: "Disables the trigger and optional remove button.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    removeLabel: {
      description: "Accessible name applied to the remove button.",
      control: "text",
      table: { defaultValue: { summary: '"Retirer le filtre Sans lactose"' } },
    },
    children: {
      description: "Visible chip label rendered inside the trigger.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      description: "Additional classes merged with the chip root.",
      control: "text",
      table: { defaultValue: { summary: "undefined" } },
    },
    onSelect: {
      description: "Called when the main chip button is activated.",
    },
    onRemove: {
      description: "Called when the remove button is activated.",
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    docs: {
      description: {
        component:
          "Chip is an interactive filter or token with one main action. Use Badge for read-only status and only enable removal when the separate dismiss affordance really exists.",
      },
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-chip-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;
type ChipExampleArgs = Partial<ComponentProps<typeof Chip>>;

function FilterChipCard({ args }: { args?: ChipExampleArgs }) {
  return (
    <div className="space-y-4 rounded-(--radius) border border-border bg-card p-4">
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Recipe filters
        </p>
        <h3 className="text-sm font-semibold text-foreground">
          Narrow the dinner list
        </h3>
        <p className="text-sm leading-5 text-muted-foreground">
          Chips stay interactive so people can add, toggle, or remove active
          filters without confusing them with passive status labels.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip {...args} />
        <span className="text-sm text-muted-foreground">12 recettes</span>
      </div>
    </div>
  );
}

function InteractiveFilterChipCard({ args }: { args?: ChipExampleArgs }) {
  const {
    selected = false,
    removable = false,
    onSelect,
    onRemove,
    ...restArgs
  } = args ?? {};
  const [pressed, setPressed] = useState(selected);

  useEffect(() => {
    setPressed(selected);
  }, [selected]);

  return (
    <FilterChipCard
      args={{
        ...restArgs,
        removable,
        selected: pressed,
        onSelect: () => {
          setPressed((current) => !current);
          onSelect?.();
        },
        onRemove: () => {
          onRemove?.();
        },
      }}
    />
  );
}

export const Playground: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Toggle pressed, removable, and disabled states in the same filter context rather than in an abstract chip grid.",
      },
    },
  },
  render: (args) => (
    <ChipAuditFrame maxWidth="md">
      <InteractiveFilterChipCard args={args} />
    </ChipAuditFrame>
  ),
};

export const Default: Story = {
  args: {
    ...defaultPlaygroundArgs,
    onSelect: fn(),
    onRemove: fn(),
  },
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Default unselected chip used as an interactive filter in a compact toolbar.",
      },
    },
  },
  render: (args) => (
    <ChipAuditFrame maxWidth="md">
      <InteractiveFilterChipCard args={args} />
    </ChipAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Sans lactose" });

    await userEvent.click(trigger);

    await expect(trigger).toHaveAttribute("aria-pressed", "true");
    await expect(args.onSelect).toHaveBeenCalledTimes(1);
  },
};

export const Removable: Story = {
  args: {
    ...defaultPlaygroundArgs,
    removable: true,
    selected: true,
    children: "Sans lactose",
    onSelect: fn(),
    onRemove: fn(),
  },
  parameters: {
    ...fixedStoryParameters,
    docs: {
      description: {
        story:
          "Removable edge case showing the separate dismiss button alongside the pressed chip trigger.",
      },
    },
  },
  render: (args) => (
    <ChipAuditFrame maxWidth="md">
      <InteractiveFilterChipCard args={args} />
    </ChipAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const remove = canvas.getByRole("button", {
      name: "Retirer le filtre Sans lactose",
    });

    await userEvent.click(remove);

    await expect(args.onRemove).toHaveBeenCalledTimes(1);
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};
