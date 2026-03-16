import { type ComponentProps, type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { Button } from "@fodmapp/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@fodmapp/ui/command";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function CommandAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-command-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  label: "Palette clinique",
  shouldFilter: true,
  loop: false,
  disablePointerSelection: false,
  vimBindings: true,
  onValueChange: fn(),
} as const;

type CommandStoryArgs = ComponentProps<typeof Command>;

function CommandPalette({
  args,
  compact = false,
  dataSlots = false,
  showSelection = false,
}: {
  args?: CommandStoryArgs;
  compact?: boolean;
  dataSlots?: boolean;
  showSelection?: boolean;
}) {
  const [selected, setSelected] = useState("Aucune");

  return (
    <div className="space-y-3">
      <Command
        {...args}
        className="rounded-(--radius) border border-border bg-card shadow-xs"
        data-slot={dataSlots ? "commande-personnalisee" : undefined}
        onValueChange={(nextValue: string) => {
          setSelected(nextValue);
          args?.onValueChange?.(nextValue);
        }}
      >
        <CommandInput
          data-slot={dataSlots ? "saisie-personnalisee" : undefined}
          placeholder="Rechercher une action"
        />
        <CommandList data-slot={dataSlots ? "liste-personnalisee" : undefined}>
          <CommandEmpty>Aucun resultat</CommandEmpty>
          <CommandGroup
            data-slot={dataSlots ? "groupe-plan" : undefined}
            heading="Plan du jour"
          >
            <CommandItem
              className="items-start"
              data-slot={dataSlots ? "item-plan" : undefined}
              keywords={["repas", "suivi"]}
              value="journal-midi"
            >
              <span className="min-w-0 flex-1 leading-snug">
                Ouvrir le journal du midi
              </span>
              <CommandShortcut
                className="pt-0.5"
                data-slot={dataSlots ? "raccourci-plan" : undefined}
              >
                ⌘J
              </CommandShortcut>
            </CommandItem>
            <CommandItem className="items-start" value="courses-sans-ail">
              <span className="min-w-0 flex-1 leading-snug">
                Mettre a jour la liste de courses sans ail
              </span>
              <CommandShortcut className="pt-0.5">⌘L</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Revues">
            <CommandItem
              className="items-start"
              keywords={["rapport"]}
              value="weekly-review"
            >
              <span className="min-w-0 flex-1 leading-snug">
                Revue hebdomadaire des symptomes
              </span>
              <CommandShortcut className="pt-0.5">⌘R</CommandShortcut>
            </CommandItem>
            <CommandItem
              className={compact ? "items-start" : undefined}
              value="portion-oignon-vert"
            >
              <span className="min-w-0 flex-1 leading-snug">
                Verifier la portion d oignon vert avant validation
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
      {showSelection ? (
        <p className="text-sm text-muted-foreground">Selection: {selected}</p>
      ) : null}
    </div>
  );
}

function CommandDialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-72 items-center justify-center">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Ouvrir la palette
      </Button>
      <CommandDialog
        onOpenChange={setOpen}
        open={open}
        title="Palette substitutions"
      >
        <CommandInput placeholder="Rechercher une commande" />
        <CommandList>
          <CommandEmpty>Aucun resultat</CommandEmpty>
          <CommandGroup heading="Substitutions">
            <CommandItem value="lait-sans-lactose">
              Remplacer le lait du petit-dejeuner
            </CommandItem>
            <CommandItem value="ail-infuse">
              Verifier l option ail infusee
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

const meta = {
  title: "Composed/Command",
  component: Command,
  argTypes: {
    label: {
      description: "Accessible label used by the command combobox.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    shouldFilter: {
      description:
        "Keeps cmdk filtering enabled. Disable it only when you render filtered results yourself.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    loop: {
      description: "Loops keyboard selection from the last item to the first.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disablePointerSelection: {
      description: "Disables pointer-based item selection.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    vimBindings: {
      description: "Enables ctrl+n/j/p/k bindings from cmdk.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    onValueChange: {
      description: "Callback fired when the selected item value changes.",
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-command-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof meta>;
type StoryArgs = Story["args"];
type StoryPlayContext = Parameters<NonNullable<Story["play"]>>[0];

export const Playground: Story = {
  render: (args: StoryArgs) => (
    <CommandAuditFrame maxWidth="xl">
      <CommandPalette args={args} showSelection />
    </CommandAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CommandAuditFrame maxWidth="xl" surface>
      <CommandPalette args={defaultPlaygroundArgs} />
    </CommandAuditFrame>
  ),
};

export const DialogPalette: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <CommandAuditFrame centeredMinHeight={72} maxWidth="md">
      <CommandDialogExample />
    </CommandAuditFrame>
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
  render: (args: StoryArgs) => (
    <CommandAuditFrame maxWidth="xl">
      <CommandPalette args={args} dataSlots showSelection />
    </CommandAuditFrame>
  ),
  play: async ({ canvasElement }: StoryPlayContext) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='command']");
    const input = canvas.getByRole("combobox", { name: "Palette clinique" });
    const journalItem = canvas
      .getByText("Ouvrir le journal du midi")
      .closest("[data-slot='command-item']");
    const list = canvasElement.querySelector("[data-slot='command-list']");
    const groups = Array.from(
      canvasElement.querySelectorAll("[data-slot='command-group']"),
    );

    await expect(root).toHaveAttribute("data-slot", "command");
    await expect(root).toHaveClass("bg-card");
    await expect(input).toHaveAttribute("data-slot", "command-input");
    await expect(list).toHaveAttribute("data-slot", "command-list");
    await expect(
      canvasElement.querySelector("[data-slot='command-item']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='command-shortcut']"),
    ).toBeTruthy();
    await expect(
      canvasElement.querySelector("[data-slot='commande-personnalisee']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='saisie-personnalisee']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='liste-personnalisee']"),
    ).toBeNull();

    await userEvent.keyboard("{ArrowDown}");
    await waitFor(async () => {
      await expect(journalItem).toHaveAttribute("data-selected", "true");
    });

    await userEvent.clear(input);
    await userEvent.type(input, "weekly");

    await waitFor(async () => {
      await expect(
        canvas.getByText("Revue hebdomadaire des symptomes"),
      ).toBeVisible();
      await expect(groups[0]).toHaveAttribute("hidden");
      await expect(groups[1]).not.toHaveAttribute("hidden");
    });

    await userEvent.clear(input);
    await userEvent.type(input, "zzz");

    await expect(canvas.getByText("Aucun resultat")).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, "journal");

    await waitFor(async () => {
      await expect(canvas.getByText("Ouvrir le journal du midi")).toBeVisible();
      await expect(canvas.queryByText("Aucun resultat")).toBeNull();
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <CommandAuditFrame maxWidth="sm">
      <CommandPalette
        args={{
          ...defaultPlaygroundArgs,
          label: "Palette mobile",
          onValueChange: fn(),
        }}
        compact
      />
    </CommandAuditFrame>
  ),
};
