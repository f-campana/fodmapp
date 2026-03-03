import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Menubar",
  component: Menubar,
  tags: ["autodocs"],
  argTypes: {
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    loop: {
      description:
        "Loops keyboard navigation when reaching first or last trigger.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    children: {
      description: "Composed MenubarMenu, MenubarTrigger and MenubarContent.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    dir: "ltr",
    loop: true,
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Menubar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-52 items-center justify-center">
      <Menubar {...args}>
        <MenubarMenu>
          <MenubarTrigger>Fichier</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Mon compte</MenubarLabel>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem>
                Profil
                <MenubarShortcut>⇧⌘P</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Parametres
                <MenubarShortcut>⌘,</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='menubar']");
    const trigger = canvas.getByRole("menuitem", { name: "Fichier" });

    await expect(root).toHaveAttribute("data-slot", "menubar");
    await expect(
      canvasElement.querySelector("[data-slot='menubar-menu']"),
    ).toHaveAttribute("data-slot", "menubar-menu");
    await expect(trigger).toHaveAttribute("data-slot", "menubar-trigger");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='menubar-content']");
      if (!node) {
        throw new Error("Menubar content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector("[data-slot='menubar-portal']");

    await expect(portal).toHaveAttribute("data-slot", "menubar-portal");
    await expect(content).toHaveAttribute("data-slot", "menubar-content");

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");

    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const CheckboxAndRadio: Story = {
  render: (args) => (
    <div className="flex min-h-52 items-center justify-center">
      <Menubar {...args}>
        <MenubarMenu>
          <MenubarTrigger>Affichage</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked>
              Activer les notifications
            </MenubarCheckboxItem>
            <MenubarCheckboxItem>
              Activer les alertes rapides
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarLabel inset>Methode d'affichage</MenubarLabel>
            <MenubarRadioGroup value="resume">
              <MenubarRadioItem value="resume">Resume</MenubarRadioItem>
              <MenubarRadioItem value="detail">Detaille</MenubarRadioItem>
            </MenubarRadioGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
};

export const Submenu: Story = {
  render: (args) => (
    <div className="flex min-h-52 items-center justify-center">
      <Menubar {...args}>
        <MenubarMenu>
          <MenubarTrigger>Outils</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Tableau principal</MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>Parametres avances</MenubarSubTrigger>
              <MenubarPortal>
                <MenubarSubContent>
                  <MenubarItem>Regles de substitution</MenubarItem>
                  <MenubarItem>Options de score</MenubarItem>
                </MenubarSubContent>
              </MenubarPortal>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("menuitem", { name: "Outils" });
    await userEvent.click(trigger);

    const subTrigger = await waitFor(() =>
      document.body.querySelector("[data-slot='menubar-sub-trigger']"),
    );

    await fireEvent.keyDown(subTrigger as HTMLElement, {
      key: "ArrowRight",
      code: "ArrowRight",
    });

    await expect(subTrigger).toHaveAttribute(
      "data-slot",
      "menubar-sub-trigger",
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
  },
  globals: {
    theme: "dark",
  },
};
