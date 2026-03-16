import type { Meta, StoryObj } from "@storybook/react-vite";

import type { ReactNode } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@fodmapp/ui/navigation-menu";

import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function NavigationMenuAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-navigation-menu-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const defaultPlaygroundArgs = {
  dir: "ltr",
  orientation: "horizontal",
  onValueChange: fn(),
} as const;

const defaultShowcaseArgs = {
  dir: "ltr",
  orientation: "horizontal",
} as const;

const contentLinkClassName =
  "block w-full rounded-(--radius) px-3 py-3 text-sm font-medium transition-colors hover:bg-accent/40";

function NavigationPreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full rounded-(--radius) border border-border bg-card px-4 py-4 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Navigation produit
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Plateforme FODMAP
          </h3>
          <p className="max-w-xl text-sm text-muted-foreground">
            Regroupez les destinations principales sans perdre le contexte de la
            page active.
          </p>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

function NavigationResponsiveShell({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[19rem] rounded-(--radius) border border-border bg-card p-3 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Navigation compacte
        </p>
        <p className="text-sm text-muted-foreground">
          Les destinations longues restent lisibles dans une colonne etroite.
        </p>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

const meta = {
  title: "Primitives/Adapter/NavigationMenu",
  component: NavigationMenu,
  argTypes: {
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    orientation: {
      description: "Defines navigation axis orientation.",
      control: { type: "inline-radio" },
      options: ["horizontal", "vertical"],
      table: { defaultValue: { summary: "horizontal" } },
    },
    onValueChange: {
      description: "Callback fired whenever the active item changes.",
    },
    children: {
      description:
        "List, item, trigger, content, and optional indicator composition.",
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
        include: ["[data-navigation-menu-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

function PrimaryNavigation(
  args: Story["args"],
  options?: {
    includeIndicator?: boolean;
    linkSlot?: string;
  },
) {
  return (
    <NavigationPreviewShell>
      <NavigationMenu
        className="w-full max-w-xl flex-col items-start justify-start [&>[data-slot='navigation-menu-viewport-position']]:static [&>[data-slot='navigation-menu-viewport-position']]:mt-2 [&>[data-slot='navigation-menu-viewport-position']]:w-full [&>[data-slot='navigation-menu-viewport-position']]:justify-start"
        {...args}
      >
        <NavigationMenuList className="w-full justify-start">
          <NavigationMenuItem value="produits">
            <NavigationMenuTrigger data-slot="custom-navigation-menu-trigger">
              Produits
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-full gap-1 p-2 md:w-[420px] lg:w-[520px] lg:grid-cols-2">
                <li>
                  {options?.linkSlot ? (
                    <NavigationMenuLink asChild>
                      <a
                        className={contentLinkClassName}
                        data-slot={options.linkSlot}
                        href="#calculateur"
                      >
                        Calculateur FODMAP
                      </a>
                    </NavigationMenuLink>
                  ) : (
                    <NavigationMenuLink asChild>
                      <a className={contentLinkClassName} href="#calculateur">
                        Calculateur FODMAP
                      </a>
                    </NavigationMenuLink>
                  )}
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <a className={contentLinkClassName} href="#substitutions">
                      Substitutions
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="ressources">
            <NavigationMenuTrigger>Ressources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-full gap-1 p-2 md:w-[340px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a className={contentLinkClassName} href="#guides">
                      Guides pratiques
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        {options?.includeIndicator ? <NavigationMenuIndicator /> : null}
      </NavigationMenu>
    </NavigationPreviewShell>
  );
}

function ResponsiveStressNavigation() {
  return (
    <NavigationResponsiveShell>
      <NavigationMenu
        className="w-full max-w-[19rem] flex-col items-stretch justify-start [&>[data-slot='navigation-menu-viewport-position']]:static [&>[data-slot='navigation-menu-viewport-position']]:mt-2 [&>[data-slot='navigation-menu-viewport-position']]:w-full [&>[data-slot='navigation-menu-viewport-position']]:justify-stretch"
        defaultValue="planning"
        orientation="vertical"
      >
        <NavigationMenuList className="w-full flex-col items-stretch justify-start">
          <NavigationMenuItem className="w-full" value="planning">
            <NavigationMenuTrigger className="w-full justify-between text-left whitespace-normal">
              Planning hebdomadaire detaille
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[17.5rem] max-w-full">
                <ul className="flex w-full flex-col gap-1 p-2">
                  <li className="w-full">
                    <NavigationMenuLink asChild>
                      <a
                        className={contentLinkClassName}
                        href="#planning-jour-par-jour"
                      >
                        Vue jour par jour
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li className="w-full">
                    <NavigationMenuLink asChild>
                      <a
                        className={contentLinkClassName}
                        href="#planning-equipes"
                      >
                        Coordination des equipes
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem className="w-full" value="substitutions">
            <NavigationMenuTrigger className="w-full justify-between text-left whitespace-normal">
              Substitutions a reverifier avant service
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="w-[17.5rem] max-w-full">
                <ul className="flex w-full flex-col gap-1 p-2">
                  <li className="w-full">
                    <NavigationMenuLink asChild>
                      <a
                        className={contentLinkClassName}
                        href="#substitutions-prioritaires"
                      >
                        Substitutions prioritaires
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <li className="w-full">
                    <NavigationMenuLink asChild>
                      <a
                        className={contentLinkClassName}
                        href="#service-sensible"
                      >
                        Service sensible
                      </a>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </NavigationResponsiveShell>
  );
}

export const Playground: Story = {
  render: (args) => (
    <NavigationMenuAuditFrame maxWidth="3xl">
      {PrimaryNavigation(args)}
    </NavigationMenuAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NavigationMenuAuditFrame maxWidth="3xl">
      {PrimaryNavigation(defaultShowcaseArgs)}
    </NavigationMenuAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NavigationMenuAuditFrame maxWidth="3xl" surface>
      {PrimaryNavigation(defaultShowcaseArgs)}
    </NavigationMenuAuditFrame>
  ),
};

export const WithIndicator: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NavigationMenuAuditFrame maxWidth="3xl">
      {PrimaryNavigation(defaultShowcaseArgs, { includeIndicator: true })}
    </NavigationMenuAuditFrame>
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
    docs: {
      disable: true,
    },
  },
  render: (args) => (
    <NavigationMenuAuditFrame maxWidth="3xl">
      {PrimaryNavigation(args, {
        includeIndicator: true,
        linkSlot: "custom-navigation-menu-link",
      })}
    </NavigationMenuAuditFrame>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='navigation-menu']");
    const list = canvasElement.querySelector(
      "[data-slot='navigation-menu-list']",
    );
    const trigger = canvas.getByRole("button", { name: "Produits" });

    await expect(root).toHaveAttribute("data-slot", "navigation-menu");
    await expect(list).toHaveAttribute("data-slot", "navigation-menu-list");
    await expect(trigger).toHaveAttribute(
      "data-slot",
      "navigation-menu-trigger",
    );
    await expect(
      canvasElement.querySelector(
        "[data-slot='custom-navigation-menu-trigger']",
      ),
    ).toBeNull();
    await expect(trigger.className).toContain("cursor-pointer");
    await expect(trigger.className).toContain("text-sm");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    const content = await waitFor(() => {
      const node = canvasElement.querySelector(
        "[data-slot='navigation-menu-content']",
      );
      if (!node) {
        throw new Error("NavigationMenu content is not mounted yet.");
      }

      return node as HTMLElement;
    });

    await expect(args.onValueChange).toHaveBeenCalledWith("produits");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toHaveAttribute(
      "id",
      trigger.getAttribute("aria-controls") ?? "",
    );

    const customLink = within(content).getByRole("link", {
      name: "Calculateur FODMAP",
    });
    await expect(customLink).toHaveAttribute(
      "data-slot",
      "custom-navigation-menu-link",
    );
    await expect(
      within(content).getByRole("link", { name: "Substitutions" }).className,
    ).toContain("text-sm");

    await userEvent.keyboard("{Escape}");
    await waitFor(() => {
      if (trigger.getAttribute("aria-expanded") !== "false") {
        throw new Error(
          "NavigationMenu trigger is still expanded after Escape.",
        );
      }
    });
    await waitFor(() => {
      if (document.activeElement !== trigger) {
        throw new Error("NavigationMenu trigger has not regained focus yet.");
      }
    });
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    controls: { disable: true },
    a11y: {
      config: {
        rules: [{ id: "aria-hidden-focus", enabled: false }],
      },
    },
    docs: {
      disable: true,
    },
  },
  render: () => (
    <NavigationMenuAuditFrame centeredMinHeight={72} maxWidth="md">
      <ResponsiveStressNavigation />
    </NavigationMenuAuditFrame>
  ),
};
