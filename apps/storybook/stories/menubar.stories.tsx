import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, waitFor, within } from "storybook/test";

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

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function MenubarAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-menubar-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function MenubarStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <MenubarAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </MenubarAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  dir: "ltr",
  loop: true,
} as const;

const meta = {
  title: "Primitives/Adapter/Menubar",
  component: Menubar,
  argTypes: {
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    loop: {
      description:
        "Loops keyboard navigation when reaching the first or last trigger.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "true" } },
    },
    children: {
      description: "Menu, trigger, and content composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-menubar-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;

type Story = StoryObj<typeof meta>;

function WorkspaceMenubar(
  args: Story["args"],
  portalContainer: HTMLDivElement | null,
  options?: {
    triggerSlot?: string;
    itemSlot?: string;
    useLocalPortal?: boolean;
  },
) {
  const contentProps =
    options?.useLocalPortal && portalContainer
      ? { container: portalContainer }
      : {};

  return (
    <Menubar {...args}>
      <MenubarMenu>
        {options?.triggerSlot ? (
          <MenubarTrigger asChild>
            <button data-slot={options.triggerSlot} type="button">
              Fichier
            </button>
          </MenubarTrigger>
        ) : (
          <MenubarTrigger>Fichier</MenubarTrigger>
        )}
        <MenubarContent {...contentProps}>
          <MenubarLabel>Mon compte</MenubarLabel>
          <MenubarSeparator />
          <MenubarGroup>
            <MenubarItem>
              Profil
              <MenubarShortcut>P</MenubarShortcut>
            </MenubarItem>
            {options?.itemSlot ? (
              <MenubarItem asChild>
                <a data-slot={options.itemSlot} href="#profil">
                  Ouvrir le profil
                </a>
              </MenubarItem>
            ) : (
              <MenubarItem>
                Parametres
                <MenubarShortcut>,</MenubarShortcut>
              </MenubarItem>
            )}
          </MenubarGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function PreferencesMenubar(args: Story["args"]) {
  return (
    <Menubar {...args}>
      <MenubarMenu>
        <MenubarTrigger>Affichage</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem checked>
            Activer les notifications
          </MenubarCheckboxItem>
          <MenubarCheckboxItem>Activer les alertes rapides</MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarLabel inset>Methode d'affichage</MenubarLabel>
          <MenubarRadioGroup value="resume">
            <MenubarRadioItem value="resume">Resume</MenubarRadioItem>
            <MenubarRadioItem value="detail">Detaille</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function SubmenuMenubar(args: Story["args"]) {
  return (
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
  );
}

function ResponsiveStressMenubar() {
  return (
    <Menubar className="w-full">
      <MenubarMenu>
        <MenubarTrigger>Tableau de bord hebdomadaire detaille</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>
          Ajustements de substitution a reverifier
        </MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Preparation en plusieurs etapes</MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  );
}

export const Playground: Story = {
  render: (args) => (
    <MenubarStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => WorkspaceMenubar(args, portalContainer)}
    </MenubarStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <MenubarStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        WorkspaceMenubar(defaultPlaygroundArgs, portalContainer)
      }
    </MenubarStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <MenubarStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        WorkspaceMenubar(defaultPlaygroundArgs, portalContainer)
      }
    </MenubarStoryCanvas>
  ),
};

export const CheckboxAndRadio: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <MenubarAuditFrame centeredMinHeight={72} maxWidth="md">
      <PreferencesMenubar {...defaultPlaygroundArgs} />
    </MenubarAuditFrame>
  ),
};

export const Submenu: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <MenubarAuditFrame centeredMinHeight={72} maxWidth="md">
      <SubmenuMenubar {...defaultPlaygroundArgs} />
    </MenubarAuditFrame>
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
    docs: {
      disable: true,
    },
  },
  render: (args) => (
    <MenubarStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        WorkspaceMenubar(args, portalContainer, {
          triggerSlot: "custom-menubar-trigger",
          itemSlot: "custom-menubar-item",
          useLocalPortal: true,
        })
      }
    </MenubarStoryCanvas>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='menubar']");
    const trigger = canvas.getByRole("menuitem", { name: "Fichier" });

    await expect(root).toHaveAttribute("data-slot", "menubar");
    await expect(
      canvasElement.querySelector("[data-slot='menubar-menu']"),
    ).toHaveAttribute("data-slot", "menubar-menu");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "custom-menubar-trigger",
    );
    await expect(
      canvasElement.querySelector("[data-slot='menubar-trigger']"),
    ).toBeNull();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    trigger.focus();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector("[data-slot='menubar-content']");
      if (!node) {
        throw new Error("Menubar content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(
      canvasElement.querySelector("[data-slot='menubar-portal']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const defaultItem = within(content).getByRole("menuitem", {
      name: /^Profil/,
    });
    const customItem = within(content).getByRole("menuitem", {
      name: "Ouvrir le profil",
    });

    await expect(defaultItem).toHaveAttribute("data-slot", "menubar-item");
    await expect(customItem).toHaveAttribute(
      "data-slot",
      "custom-menubar-item",
    );

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Menubar focus has not moved into the content.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='menubar-content']")) {
        throw new Error("Menubar content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("Menubar trigger has not regained focus yet.");
      }
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <MenubarAuditFrame maxWidth="sm">
      <ResponsiveStressMenubar />
    </MenubarAuditFrame>
  ),
};
