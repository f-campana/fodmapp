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
} from "@fodmap/ui";

import { StoryFrame, type StoryFrameProps } from "./story-frame";

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

const triggerCardClassName =
  "block rounded-(--radius) border border-border p-3 text-sm";

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
    <NavigationMenu className="w-full max-w-xl justify-start" {...args}>
      <NavigationMenuList className="w-full justify-start">
        <NavigationMenuItem value="produits">
          <NavigationMenuTrigger data-slot="custom-navigation-menu-trigger">
            Produits
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-4 md:w-[420px] lg:w-[520px] lg:grid-cols-2">
              <li>
                {options?.linkSlot ? (
                  <NavigationMenuLink asChild>
                    <a data-slot={options.linkSlot} href="#calculateur">
                      Calculateur FODMAP
                    </a>
                  </NavigationMenuLink>
                ) : (
                  <NavigationMenuLink asChild>
                    <a className={triggerCardClassName} href="#calculateur">
                      Calculateur FODMAP
                    </a>
                  </NavigationMenuLink>
                )}
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <a className={triggerCardClassName} href="#substitutions">
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
            <ul className="grid gap-2 p-4 md:w-[340px]">
              <li>
                <NavigationMenuLink asChild>
                  <a className={triggerCardClassName} href="#guides">
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
  );
}

function ResponsiveStressNavigation() {
  return (
    <NavigationMenu
      className="w-full max-w-sm items-start justify-start"
      orientation="vertical"
    >
      <NavigationMenuList className="w-full flex-col items-stretch justify-start">
        <NavigationMenuItem className="w-full" value="planning">
          <NavigationMenuTrigger className="w-full justify-between whitespace-normal">
            Planning hebdomadaire detaille
          </NavigationMenuTrigger>
          <NavigationMenuContent className="md:static">
            <div className="rounded-(--radius) border border-border bg-card p-4 text-sm">
              Repartissez les decisions importantes sur plusieurs repas pour
              garder une lecture simple sur mobile.
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem className="w-full" value="substitutions">
          <NavigationMenuTrigger className="w-full justify-between whitespace-normal">
            Substitutions a reverifier avant service
          </NavigationMenuTrigger>
          <NavigationMenuContent className="md:static">
            <div className="rounded-(--radius) border border-border bg-card p-4 text-sm">
              Gardez les points les plus sensibles visibles sans imposer une
              largeur fixe.
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
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
      {PrimaryNavigation(defaultPlaygroundArgs)}
    </NavigationMenuAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NavigationMenuAuditFrame maxWidth="3xl" surface>
      {PrimaryNavigation(defaultPlaygroundArgs)}
    </NavigationMenuAuditFrame>
  ),
};

export const WithIndicator: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <NavigationMenuAuditFrame maxWidth="3xl">
      {PrimaryNavigation(defaultPlaygroundArgs, { includeIndicator: true })}
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
    docs: {
      disable: true,
    },
  },
  render: () => (
    <NavigationMenuAuditFrame maxWidth="sm">
      <ResponsiveStressNavigation />
    </NavigationMenuAuditFrame>
  ),
};
