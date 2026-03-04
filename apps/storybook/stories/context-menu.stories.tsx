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
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Adapter/ContextMenu",
  component: ContextMenu,
  tags: ["autodocs"],
  argTypes: {
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
      description: "ContextMenuTrigger and ContextMenuContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    modal: true,
    dir: "ltr",
    onOpenChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
    a11y: {
      config: {
        rules: [{ id: "aria-hidden-focus", enabled: false }],
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-52 items-center justify-center">
      <ContextMenu {...args}>
        <ContextMenuTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-4 py-3 text-sm font-medium"
            type="button"
          >
            Ouvrir le menu contextuel
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Mon compte</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Profil
              <ContextMenuShortcut>⇧⌘P</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Parametres
              <ContextMenuShortcut>⌘,</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='context-menu']");
    const trigger = canvas.getByRole("button", {
      name: "Ouvrir le menu contextuel",
    });

    await expect(root).toHaveAttribute("data-slot", "context-menu");
    await expect(trigger).toHaveAttribute("data-slot", "context-menu-trigger");

    await fireEvent.contextMenu(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='context-menu-content']",
      );
      if (!node) {
        throw new Error("ContextMenu content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector(
      "[data-slot='context-menu-portal']",
    );
    const firstItem = document.body.querySelector(
      "[data-slot='context-menu-item']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "context-menu-portal");
    await expect(content).toHaveAttribute("data-slot", "context-menu-content");

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(content.className).toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    await expect(firstItem?.className ?? "").toContain("focus:bg-accent");
    await expect(firstItem?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );
  },
};

export const CheckboxAndRadio: Story = {
  render: (args) => (
    <div className="flex min-h-52 items-center justify-center">
      <ContextMenu {...args}>
        <ContextMenuTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-4 py-3 text-sm font-medium"
            type="button"
          >
            Preferences d'affichage
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuCheckboxItem checked>
            Activer les notifications
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem>
            Activer les alertes rapides
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel inset>Methode d'affichage</ContextMenuLabel>
          <ContextMenuRadioGroup value="resume">
            <ContextMenuRadioItem value="resume">Resume</ContextMenuRadioItem>
            <ContextMenuRadioItem value="detail">Detaille</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  ),
};

export const Submenu: Story = {
  render: (args) => (
    <div className="flex min-h-52 items-center justify-center">
      <ContextMenu {...args}>
        <ContextMenuTrigger asChild>
          <button
            className="rounded-(--radius) border border-border bg-card px-4 py-3 text-sm font-medium"
            type="button"
          >
            Outils avances
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Tableau principal</ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Parametres avances</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuItem>Regles de substitution</ContextMenuItem>
                <ContextMenuItem>Options de score</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Outils avances" });
    await fireEvent.contextMenu(trigger);

    const subTrigger = await waitFor(() =>
      document.body.querySelector("[data-slot='context-menu-sub-trigger']"),
    );

    await userEvent.hover(subTrigger as HTMLElement);

    await expect(subTrigger).toHaveAttribute(
      "data-slot",
      "context-menu-sub-trigger",
    );
    await expect((subTrigger as HTMLElement).className).toContain(
      "data-[state=open]:bg-accent",
    );
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
