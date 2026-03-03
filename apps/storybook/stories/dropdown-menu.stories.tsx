import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  expect,
  fireEvent,
  fn,
  userEvent,
  waitFor,
  within,
} from "storybook/test";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial open state for uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls open state in controlled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    modal: {
      description: "Whether outside interactions are blocked while open.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    children: {
      description: "DropdownMenuTrigger and DropdownMenuContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    modal: true,
    dir: "ltr",
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-40 items-center justify-center">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Ouvrir les options
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Profil
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              Parametres
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='dropdown-menu']");
    const trigger = canvas.getByRole("button", { name: "Ouvrir les options" });

    await expect(root).toHaveAttribute("data-slot", "dropdown-menu");
    await expect(trigger).toHaveAttribute("data-slot", "dropdown-menu-trigger");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='dropdown-menu-content']",
      );
      if (!node) {
        throw new Error("DropdownMenu content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector(
      "[data-slot='dropdown-menu-portal']",
    );
    const firstItem = document.body.querySelector(
      "[data-slot='dropdown-menu-item']",
    ) as HTMLElement | null;
    const label = document.body.querySelector(
      "[data-slot='dropdown-menu-label']",
    );
    const separator = document.body.querySelector(
      "[data-slot='dropdown-menu-separator']",
    );
    const shortcut = document.body.querySelector(
      "[data-slot='dropdown-menu-shortcut']",
    );

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "dropdown-menu-portal");
    await expect(content).toHaveAttribute("data-slot", "dropdown-menu-content");
    await expect(label).toHaveAttribute("data-slot", "dropdown-menu-label");
    await expect(separator).toHaveAttribute(
      "data-slot",
      "dropdown-menu-separator",
    );
    await expect(shortcut).toHaveAttribute(
      "data-slot",
      "dropdown-menu-shortcut",
    );

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(content.className).toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    await expect(firstItem?.className ?? "").toContain("focus:bg-accent");
    await expect(firstItem?.className ?? "").toContain(
      "focus:text-accent-foreground",
    );
    await expect(firstItem?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );

    await fireEvent.keyDown(content, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      if (document.body.querySelector("[data-slot='dropdown-menu-content']")) {
        throw new Error("DropdownMenu content is still mounted.");
      }
    });
  },
};

export const CheckboxAndRadio: Story = {
  render: (args) => (
    <div className="flex min-h-40 items-center justify-center">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Preferences d'affichage
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>
            Activer les notifications
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>
            Activer les alertes rapides
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel inset>Methode d'affichage</DropdownMenuLabel>
          <DropdownMenuRadioGroup value="resume">
            <DropdownMenuRadioItem value="resume">Resume</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="detail">
              Detaille
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
};

export const Submenu: Story = {
  render: (args) => (
    <div className="flex min-h-40 items-center justify-center">
      <DropdownMenu {...args}>
        <DropdownMenuTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-3 py-2 text-sm font-medium"
            type="button"
          >
            Outils avances
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Tableau principal</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Parametres avances</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Regles de substitution</DropdownMenuItem>
                <DropdownMenuItem>Options de score</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Outils avances" });
    await userEvent.click(trigger);

    const subTrigger = await waitFor(() =>
      document.body.querySelector("[data-slot='dropdown-menu-sub-trigger']"),
    );

    await expect(subTrigger).toHaveAttribute(
      "data-slot",
      "dropdown-menu-sub-trigger",
    );
    await expect((subTrigger as HTMLElement).className).toContain(
      "data-[state=open]:bg-accent",
    );

    await fireEvent.keyDown(document.body, { key: "Escape", code: "Escape" });
    await waitFor(() => {
      if (document.body.querySelector("[data-slot='dropdown-menu-content']")) {
        throw new Error("DropdownMenu content is still mounted.");
      }
    });
  },
};

export const DarkMode: Story = {
  ...Default,
  args: {
    ...Default.args,
    onOpenChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
