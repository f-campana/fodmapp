import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
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
      description: "Callback invoked when active item value changes.",
      table: { type: { summary: "(value: string) => void" } },
    },
    children: {
      description: "Composed navigation menu primitives.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    dir: "ltr",
    orientation: "horizontal",
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
    a11y: {
      config: {
        rules: [{ id: "aria-hidden-focus", enabled: false }],
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-56 items-start justify-center pt-8">
      <NavigationMenu {...args}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[420px] lg:w-[520px] lg:grid-cols-2">
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-(--radius) border border-border p-3 text-sm"
                      href="#calculateur"
                    >
                      Calculateur FODMAP
                    </a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-(--radius) border border-border p-3 text-sm"
                      href="#substitutions"
                    >
                      Substitutions
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Ressources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[340px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-(--radius) border border-border p-3 text-sm"
                      href="#guides"
                    >
                      Guides pratiques
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
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

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='navigation-menu-content']",
      );
      if (!node) {
        throw new Error("NavigationMenu content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const viewport = canvasElement.querySelector(
      "[data-slot='navigation-menu-viewport']",
    );
    const viewportPosition = canvasElement.querySelector(
      "[data-slot='navigation-menu-viewport-position']",
    );

    await expect(content.className).toContain(
      "data-[motion^=from-]:animate-in",
    );
    await expect(content.className).toContain("data-[motion^=to-]:animate-out");
    await expect(content.className).toContain(
      "data-[motion=from-end]:slide-in-from-right-2",
    );
    await expect(content.className).toContain(
      "data-[motion=to-start]:slide-out-to-left-2",
    );

    await expect(viewportPosition).toHaveAttribute(
      "data-slot",
      "navigation-menu-viewport-position",
    );
    await expect(viewport).toHaveAttribute(
      "data-slot",
      "navigation-menu-viewport",
    );
    await expect((viewport as HTMLElement).className).toContain("bg-popover");
    await expect((viewport as HTMLElement).className).toContain(
      "text-popover-foreground",
    );

    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
  },
};

export const WithViewport: Story = {
  render: (args) => (
    <div className="flex min-h-56 items-start justify-center pt-8">
      <NavigationMenu {...args}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Documentation</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[380px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-(--radius) border border-border p-3 text-sm"
                      href="#api"
                    >
                      API
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuIndicator />
        <NavigationMenuViewport />
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Documentation" });

    await userEvent.click(trigger);

    const indicator = await waitFor(() => {
      const node = canvasElement.querySelector(
        "[data-slot='navigation-menu-indicator']",
      );
      if (!node) {
        throw new Error("NavigationMenu indicator is not mounted yet.");
      }
      return node as HTMLElement;
    });

    await expect(indicator.className).toContain(
      "data-[state=visible]:animate-in",
    );
    await expect(indicator.className).toContain("data-[state=hidden]:fade-out");
  },
};

export const MultiItem: Story = {
  render: (args) => (
    <div className="flex min-h-56 items-start justify-center pt-8">
      <NavigationMenu {...args}>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[300px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-(--radius) border border-border p-3 text-sm"
                      href="#produits"
                    >
                      Catalogue
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Entreprise</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[300px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a
                      className="block rounded-(--radius) border border-border p-3 text-sm"
                      href="#equipe"
                    >
                      Equipe
                    </a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Entreprise" }));

    await waitFor(() => {
      const link = document.body.querySelector("a[href='#equipe']");
      if (!link) {
        throw new Error("Expected entreprise menu link to be mounted.");
      }
    });

    const triggerClasses = navigationMenuTriggerStyle();
    await expect(triggerClasses).toContain("data-[active]:bg-accent");
    await expect(triggerClasses).toContain("data-[state=open]:bg-accent");
  },
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
