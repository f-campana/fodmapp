import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "@fodmap/ui";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      description:
        "Sets the visual style. Default is solid primary; destructive uses a subtle tinted pattern that auto-adapts to light/dark themes.",
      control: { type: "radio" },
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
      table: { defaultValue: { summary: "default" } },
    },
    size: {
      description:
        "Controls height, padding, and icon sizing. Icon padding adjusts automatically via data-icon attributes on child SVGs.",
      control: { type: "radio" },
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
      ],
      table: { defaultValue: { summary: "default" } },
    },
    disabled: {
      description:
        "Prevents interaction and applies reduced opacity. Remains in the accessibility tree.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    asChild: {
      description:
        "Delegates rendering to the child element via Radix Slot. Enables polymorphic usage — e.g. rendering as an anchor or Next.js Link.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    children: {
      description:
        "Content displayed inside the button — label, icon, or both.",
      control: "text",
      table: { type: { summary: "ReactNode" } },
    },
    onClick: {
      description: "Callback invoked when the button is clicked.",
    },
    className: {
      description:
        "Additional CSS classes merged with variant classes via cn(). Consumer classes take precedence for conflicting properties.",
      control: "text",
      table: { type: { summary: "string" } },
    },
    type: {
      description:
        "HTML button type. Defaults to 'button' (not 'submit') to prevent accidental form submission. Omitted when asChild is true.",
      control: { type: "radio" },
      options: ["button", "submit", "reset"],
      table: { defaultValue: { summary: "button" } },
    },
  },
  args: {
    children: "Appliquer",
    variant: "default",
    size: "default",
    disabled: false,
    asChild: false,
    onClick: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const Primary: Story = {
  args: {
    variant: "default",
    children: "Appliquer",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Appliquer" });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalled();

    // Token migration assertions: hover token, two-layer focus
    await expect(button.className).toContain("hover:bg-primary-hover");
    await expect(button.className).toContain("focus-visible:border-ring");
    await expect(button.className).toContain("focus-visible:ring-ring-soft");

    // No opacity hacks for hover or focus
    await expect(button.className).not.toContain("hover:bg-primary/80");
    await expect(button.className).not.toContain("hover:bg-primary/90");
    await expect(button.className).not.toContain("focus-visible:ring-ring/50");

    // Data attributes present
    await expect(button).toHaveAttribute("data-slot", "button");
    await expect(button).toHaveAttribute("data-variant", "default");
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Comparer",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Comparer" });
    await expect(button.className).toContain("hover:bg-secondary-hover");
    await expect(button.className).not.toContain("hover:bg-secondary/80");
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Détails",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Détails" });
    await expect(button.className).toContain("border-outline-border");
    await expect(button.className).toContain("bg-outline");
    await expect(button.className).toContain("text-outline-foreground");
    await expect(button.className).toContain("hover:bg-outline-hover");
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Supprimer",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Supprimer" });
    // Token-based subtle pattern
    await expect(button.className).toContain("bg-destructive-subtle");
    await expect(button.className).toContain(
      "text-destructive-subtle-foreground",
    );
    await expect(button.className).toContain(
      "hover:bg-destructive-subtle-hover",
    );
    await expect(button.className).toContain(
      "focus-visible:ring-destructive-subtle-ring",
    );
    // No opacity modifiers
    await expect(button.className).not.toContain("bg-destructive/10");
    await expect(button.className).not.toContain(
      "focus-visible:ring-destructive-subtle-border/30",
    );
    await expect(button.className).not.toContain("text-destructive-foreground");
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Fermer",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Fermer" });
    await expect(button.className).toContain("text-ghost-foreground");
    await expect(button.className).toContain("hover:bg-ghost-hover");
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Voir plus",
  },
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const SizeExtraSmall: Story = {
  args: {
    size: "xs",
    children: "Très petit",
  },
};

export const SizeSmall: Story = {
  args: {
    size: "sm",
    children: "Petit",
  },
};

export const SizeDefault: Story = {
  args: {
    size: "default",
    children: "Standard",
  },
};

export const SizeLarge: Story = {
  args: {
    size: "lg",
    children: "Grand",
  },
};

export const SizeIcon: Story = {
  args: {
    size: "icon",
    children: "✕",
    "aria-label": "Fermer",
  },
};

export const SizeIconExtraSmall: Story = {
  args: {
    size: "icon-xs",
    children: "✕",
    "aria-label": "Fermer (très petit)",
  },
};

export const SizeIconSmall: Story = {
  args: {
    size: "icon-sm",
    children: "✕",
    "aria-label": "Fermer (petit)",
  },
};

export const SizeIconLarge: Story = {
  args: {
    size: "icon-lg",
    children: "✕",
    "aria-label": "Fermer (grand)",
  },
};

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Indisponible",
    onClick: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Indisponible" });
    await expect(button).toBeDisabled();
    button.click();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const AsChildAnchor: Story = {
  args: {
    asChild: true,
    children: undefined,
  },
  render: (args) => (
    <Button {...args} asChild>
      <a href="/ingredients">Voir les ingrédients</a>
    </Button>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole("link", { name: "Voir les ingrédients" });
    await expect(link).toHaveAttribute("href", "/ingredients");
    await expect(link).not.toHaveAttribute("type");
    await expect(link).toHaveAttribute("data-slot", "button");
  },
};

// ---------------------------------------------------------------------------
// Dark mode
// ---------------------------------------------------------------------------

export const DarkModePrimary: Story = {
  args: { children: "Confirmer" },
  globals: { theme: "dark" },
};

export const DarkModeSecondary: Story = {
  args: { variant: "secondary", children: "Comparer" },
  globals: { theme: "dark" },
};

export const DarkModeDestructive: Story = {
  args: { variant: "destructive", children: "Supprimer" },
  globals: { theme: "dark" },
};

export const DarkModeOutline: Story = {
  args: { variant: "outline", children: "Détails" },
  globals: { theme: "dark" },
};

export const DarkModeGhost: Story = {
  args: { variant: "ghost", children: "Fermer" },
  globals: { theme: "dark" },
};
