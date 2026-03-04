import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@fodmap/ui";

const meta = {
  title: "Composed/Command",
  component: Command,
  tags: ["autodocs"],
  argTypes: {
    label: {
      description: "Accessible label announced to assistive technologies.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultValue: {
      description: "Initial selected value in uncontrolled mode.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    value: {
      description: "Controlled selected value.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    shouldFilter: {
      description: "Turns built-in filtering on or off.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    loop: {
      description: "Loops keyboard selection from last to first item.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    disablePointerSelection: {
      description: "Disables pointer-based item selection.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    vimBindings: {
      description: "Enables ctrl+n/j/p/k bindings.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    onValueChange: {
      description: "Callback invoked when the selected item value changes.",
    },
    children: {
      description: "Command composition with input, list, groups, and items.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    shouldFilter: true,
    loop: false,
    disablePointerSelection: false,
    vimBindings: true,
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Command>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
        <Command {...args}>
          <CommandInput placeholder="Rechercher une action" />
          <CommandList>
            <CommandEmpty>Aucun resultat</CommandEmpty>
            <CommandGroup heading="Actions rapides">
              <CommandItem value="profil">
                Ouvrir le profil
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem value="parametres">
                Modifier les parametres
              </CommandItem>
            </CommandGroup>
            <CommandSeparator hidden />
            <CommandGroup heading="Navigation">
              <CommandItem value="dashboard">
                Aller au tableau de bord
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const root = canvasElement.querySelector("[data-slot='command']");
    const inputWrapper = canvasElement.querySelector(
      "[data-slot='command-input-wrapper']",
    );
    const input = canvas.getByPlaceholderText("Rechercher une action");
    const list = canvasElement.querySelector("[data-slot='command-list']");
    const group = canvasElement.querySelector("[data-slot='command-group']");
    const item = canvasElement.querySelector("[data-slot='command-item']");
    const separator = canvasElement.querySelector(
      "[data-slot='command-separator']",
    );
    const shortcut = canvasElement.querySelector(
      "[data-slot='command-shortcut']",
    );

    await expect(root).toHaveAttribute("data-slot", "command");
    await expect(inputWrapper).toHaveAttribute(
      "data-slot",
      "command-input-wrapper",
    );
    await expect(input).toHaveAttribute("data-slot", "command-input");
    await expect(list).toHaveAttribute("data-slot", "command-list");
    await expect(group).toHaveAttribute("data-slot", "command-group");
    await expect(item).toHaveAttribute("data-slot", "command-item");
    await expect(separator).toHaveAttribute("data-slot", "command-separator");
    await expect(shortcut).toHaveAttribute("data-slot", "command-shortcut");

    await expect(root?.className ?? "").toContain("bg-popover");
    await expect(root?.className ?? "").toContain("text-popover-foreground");

    await expect(item?.className ?? "").toContain(
      "data-[selected=true]:bg-accent",
    );
    await expect(item?.className ?? "").toContain(
      "data-[disabled=true]:pointer-events-none",
    );
    await expect(item?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
};

function DialogExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-80 items-center justify-center">
      <button
        className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
        onClick={() => setOpen(true)}
        type="button"
      >
        Ouvrir la palette
      </button>
      <CommandDialog onOpenChange={setOpen} open={open}>
        <CommandInput placeholder="Rechercher une commande" />
        <CommandList>
          <CommandEmpty>Aucun resultat</CommandEmpty>
          <CommandGroup heading="Navigation">
            <CommandItem value="journal">Journal alimentaire</CommandItem>
            <CommandItem value="substitutions">Substitutions</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

export const Dialog: Story = {
  render: () => <DialogExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Ouvrir la palette" });

    await userEvent.click(trigger);

    await waitFor(() => {
      const marker = document.body.querySelector(
        "[data-slot='command-dialog']",
      );
      if (!marker) {
        throw new Error("Command dialog marker not mounted.");
      }
    });

    const dialogMarker = document.body.querySelector(
      "[data-slot='command-dialog']",
    );
    const dialogContent = document.body.querySelector(
      "[data-slot='dialog-content']",
    );
    const dialogInput = document.body.querySelector(
      "[data-slot='command-input']",
    );

    await expect(dialogMarker).toHaveAttribute("data-slot", "command-dialog");
    await expect(dialogContent).toHaveAttribute("data-slot", "dialog-content");
    await expect(dialogInput).toHaveAttribute("data-slot", "command-input");
  },
};

function ControlledExample(args: Story["args"]) {
  const [value, setValue] = useState("profil");

  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="w-full max-w-xl space-y-3 rounded-(--radius) border border-border bg-card p-4">
        <Command
          {...args}
          onValueChange={(next) => {
            setValue(next);
            args?.onValueChange?.(next);
          }}
          value={value}
        >
          <CommandInput placeholder="Rechercher" />
          <CommandList>
            <CommandItem value="profil">Profil</CommandItem>
            <CommandItem value="mode-expert">Mode expert</CommandItem>
          </CommandList>
        </Command>
        <p className="text-sm text-muted-foreground">Valeur: {value}</p>
      </div>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledExample {...args} />,
};

export const WithDisabledItems: Story = {
  render: (args) => (
    <div className="flex min-h-80 items-center justify-center">
      <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
        <Command {...args}>
          <CommandInput placeholder="Rechercher une action" />
          <CommandList>
            <CommandGroup heading="Etat du compte">
              <CommandItem disabled value="support">
                Support prioritaire indisponible
              </CommandItem>
              <CommandItem value="profil">Profil</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  ...Default,
  args: {
    ...Default.args,
    onValueChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
