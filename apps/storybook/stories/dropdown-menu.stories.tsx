import { type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

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

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function DropdownMenuAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-dropdown-menu-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function DropdownMenuStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <DropdownMenuAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </DropdownMenuAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  defaultOpen: false,
  modal: true,
  dir: "ltr",
  onOpenChange: fn(),
} as const;

const triggerClassName =
  "inline-flex cursor-pointer items-center rounded-(--radius) border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40";

function DropdownMenuActionRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-(--radius) border border-border bg-card px-4 py-4 shadow-sm">
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Actions rapides
        </p>
        <h3 className="text-sm font-semibold text-foreground">Mon espace</h3>
        <p className="text-sm text-muted-foreground">
          Gardez les raccourcis du compte actif a portee de main.
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const meta = {
  title: "Primitives/Adapter/DropdownMenu",
  component: DropdownMenu,
  argTypes: {
    defaultOpen: {
      description: "Sets the initial open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls open state when managed externally.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    modal: {
      description: "Keeps outside interaction inert while the menu is open.",
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
      description: "Callback fired whenever the open state changes.",
    },
    children: {
      description: "Trigger and content composition.",
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
        include: ["[data-dropdown-menu-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

function AccountDropdownMenu(
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
  const triggerProps = options?.triggerSlot
    ? { "data-slot": options.triggerSlot }
    : {};

  return (
    <DropdownMenu {...args}>
      <DropdownMenuActionRow>
        {options?.triggerSlot ? (
          <DropdownMenuTrigger asChild>
            <button
              className={triggerClassName}
              type="button"
              {...triggerProps}
            >
              Ouvrir les options
            </button>
          </DropdownMenuTrigger>
        ) : (
          <DropdownMenuTrigger className={triggerClassName}>
            Ouvrir les options
          </DropdownMenuTrigger>
        )}
      </DropdownMenuActionRow>
      <DropdownMenuContent {...contentProps}>
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            Profil
            <DropdownMenuShortcut>P</DropdownMenuShortcut>
          </DropdownMenuItem>
          {options?.itemSlot ? (
            <DropdownMenuItem asChild>
              <a data-slot={options.itemSlot} href="#profil">
                Ouvrir le profil
              </a>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem>
              Parametres
              <DropdownMenuShortcut>,</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PreferencesDropdownMenu(args: Story["args"]) {
  return (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger className={triggerClassName}>
        Preferences d'affichage
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
          <DropdownMenuRadioItem value="detail">Detaille</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubmenuDropdownMenu(args: Story["args"]) {
  return (
    <DropdownMenu {...args}>
      <DropdownMenuTrigger className={triggerClassName}>
        Outils avances
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
  );
}

export const Playground: Story = {
  render: (args) => (
    <DropdownMenuStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => AccountDropdownMenu(args, portalContainer)}
    </DropdownMenuStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DropdownMenuStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        AccountDropdownMenu(defaultPlaygroundArgs, portalContainer)
      }
    </DropdownMenuStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DropdownMenuStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        AccountDropdownMenu(defaultPlaygroundArgs, portalContainer)
      }
    </DropdownMenuStoryCanvas>
  ),
};

export const CheckboxAndRadio: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DropdownMenuAuditFrame centeredMinHeight={72} maxWidth="md">
      <PreferencesDropdownMenu {...defaultPlaygroundArgs} />
    </DropdownMenuAuditFrame>
  ),
};

export const Submenu: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <DropdownMenuAuditFrame centeredMinHeight={72} maxWidth="md">
      <SubmenuDropdownMenu {...defaultPlaygroundArgs} />
    </DropdownMenuAuditFrame>
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
    onOpenChange: fn(),
  },
  parameters: {
    controls: { disable: true },
    docs: {
      disable: true,
    },
  },
  render: (args) => (
    <DropdownMenuStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        AccountDropdownMenu(args, portalContainer, {
          triggerSlot: "custom-dropdown-menu-trigger",
          itemSlot: "custom-dropdown-menu-item",
          useLocalPortal: true,
        })
      }
    </DropdownMenuStoryCanvas>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='dropdown-menu']");
    const trigger = canvas.getByRole("button", { name: "Ouvrir les options" });

    await expect(root).toHaveAttribute("data-slot", "dropdown-menu");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "custom-dropdown-menu-trigger",
    );
    await expect(
      canvasElement.querySelector("[data-slot='dropdown-menu-trigger']"),
    ).toBeNull();
    await expect(trigger.className).toContain("cursor-pointer");
    await expect(trigger.className).toContain("text-sm");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector(
        "[data-slot='dropdown-menu-content']",
      );
      if (!node) {
        throw new Error("DropdownMenu content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(
      canvasElement.querySelector("[data-slot='dropdown-menu-portal']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const defaultItem = within(content).getByRole("menuitem", {
      name: /^Profil/,
    });
    const customItem = within(content).getByRole("menuitem", {
      name: "Ouvrir le profil",
    });

    await expect(defaultItem).toHaveAttribute(
      "data-slot",
      "dropdown-menu-item",
    );
    await expect(defaultItem.className).toContain("cursor-pointer");
    await expect(defaultItem.className).toContain("text-sm");
    await expect(customItem).toHaveAttribute(
      "data-slot",
      "custom-dropdown-menu-item",
    );

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Dropdown menu focus has not moved into the content.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='dropdown-menu-content']")) {
        throw new Error("DropdownMenu content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("DropdownMenu trigger has not regained focus yet.");
      }
    });

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
};
