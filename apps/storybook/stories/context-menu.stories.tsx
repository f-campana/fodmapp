import { type ReactNode, useState } from "react";

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

import { StoryFrame, type StoryFrameProps } from "./story-frame";

function ContextMenuAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-context-menu-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

function ContextMenuStoryCanvas({
  children,
  ...props
}: Omit<StoryFrameProps, "children"> & {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return (
    <ContextMenuAuditFrame {...props}>
      <div className="w-full" ref={setPortalContainer}>
        {children(portalContainer)}
      </div>
    </ContextMenuAuditFrame>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  modal: true,
  dir: "ltr",
  onOpenChange: fn(),
} as const;

const triggerClassName =
  "inline-flex cursor-pointer items-center rounded-(--radius) border border-border bg-card px-4 py-3 text-sm font-medium";

const meta = {
  title: "Primitives/Adapter/ContextMenu",
  component: ContextMenu,
  argTypes: {
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
        include: ["[data-context-menu-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

function WorkspaceContextMenu(
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
    <ContextMenu {...args}>
      <ContextMenuTrigger asChild>
        <button
          className={triggerClassName}
          data-slot={options?.triggerSlot}
          type="button"
        >
          Zone contextuelle
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent {...contentProps}>
        <ContextMenuLabel>Mon compte</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuItem>
            Profil
            <ContextMenuShortcut>P</ContextMenuShortcut>
          </ContextMenuItem>
          {options?.itemSlot ? (
            <ContextMenuItem asChild>
              <a data-slot={options.itemSlot} href="#profil">
                Ouvrir le profil
              </a>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem>
              Parametres
              <ContextMenuShortcut>,</ContextMenuShortcut>
            </ContextMenuItem>
          )}
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function PreferencesContextMenu(args: Story["args"]) {
  return (
    <ContextMenu {...args}>
      <ContextMenuTrigger asChild>
        <button className={triggerClassName} type="button">
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
  );
}

function SubmenuContextMenu(args: Story["args"]) {
  return (
    <ContextMenu {...args}>
      <ContextMenuTrigger asChild>
        <button className={triggerClassName} type="button">
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
  );
}

export const Playground: Story = {
  render: (args) => (
    <ContextMenuStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) => WorkspaceContextMenu(args, portalContainer)}
    </ContextMenuStoryCanvas>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ContextMenuStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        WorkspaceContextMenu(defaultPlaygroundArgs, portalContainer)
      }
    </ContextMenuStoryCanvas>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ContextMenuStoryCanvas centeredMinHeight={72} maxWidth="md" surface>
      {(portalContainer) =>
        WorkspaceContextMenu(defaultPlaygroundArgs, portalContainer)
      }
    </ContextMenuStoryCanvas>
  ),
};

export const CheckboxAndRadio: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ContextMenuAuditFrame centeredMinHeight={72} maxWidth="md">
      <PreferencesContextMenu {...defaultPlaygroundArgs} />
    </ContextMenuAuditFrame>
  ),
};

export const Submenu: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ContextMenuAuditFrame centeredMinHeight={72} maxWidth="md">
      <SubmenuContextMenu {...defaultPlaygroundArgs} />
    </ContextMenuAuditFrame>
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
    <ContextMenuStoryCanvas centeredMinHeight={72} maxWidth="md">
      {(portalContainer) =>
        WorkspaceContextMenu(args, portalContainer, {
          triggerSlot: "custom-context-menu-trigger",
          itemSlot: "custom-context-menu-item",
          useLocalPortal: true,
        })
      }
    </ContextMenuStoryCanvas>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='context-menu']");
    const trigger = canvas.getByRole("button", { name: "Zone contextuelle" });

    await expect(root).toHaveAttribute("data-slot", "context-menu");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "custom-context-menu-trigger",
    );
    await expect(
      canvasElement.querySelector("[data-slot='context-menu-trigger']"),
    ).toBeNull();

    trigger.focus();
    await expect(trigger).toHaveFocus();
    await fireEvent.pointerDown(trigger, { button: 2, ctrlKey: false });
    await fireEvent.contextMenu(trigger);

    const content = await waitFor(() => {
      const node = canvasElement.querySelector(
        "[data-slot='context-menu-content']",
      );
      if (!node) {
        throw new Error("ContextMenu content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(
      canvasElement.querySelector("[data-slot='context-menu-portal']"),
    ).toBeTruthy();
    await expect(canvasElement.contains(content)).toBe(true);

    const defaultItem = within(content).getByRole("menuitem", {
      name: /^Profil/,
    });
    const customItem = within(content).getByRole("menuitem", {
      name: "Ouvrir le profil",
    });

    await expect(defaultItem).toHaveAttribute("data-slot", "context-menu-item");
    await expect(customItem).toHaveAttribute(
      "data-slot",
      "custom-context-menu-item",
    );

    await waitFor(() => {
      if (!content.contains(document.activeElement)) {
        throw new Error("Context menu focus has not moved into the content.");
      }
    });

    await userEvent.keyboard("{Escape}");

    await waitFor(() => {
      if (canvasElement.querySelector("[data-slot='context-menu-content']")) {
        throw new Error("ContextMenu content is still mounted after Escape.");
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("ContextMenu trigger has not regained focus yet.");
      }
    });
  },
};
