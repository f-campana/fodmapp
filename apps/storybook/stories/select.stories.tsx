import { useState } from "react";

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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@fodmap/ui";

const meta = {
  title: "Primitives/Select",
  component: Select,
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
    defaultValue: {
      description: "Sets initial selected value for uncontrolled mode.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    value: {
      description: "Controls selected value in controlled mode.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    dir: {
      description: "Reading direction used by keyboard navigation and layout.",
      control: { type: "inline-radio" },
      options: ["ltr", "rtl"],
      table: { defaultValue: { summary: "ltr" } },
    },
    disabled: {
      description: "Disables all user interactions.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    required: {
      description: "Marks the field as required for form submission.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    name: {
      description: "Form field name used during submission.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    onValueChange: {
      description: "Callback invoked when selected value changes.",
    },
    children: {
      description: "SelectTrigger and SelectContent composition.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    dir: "ltr",
    disabled: false,
    required: false,
    onOpenChange: fn(),
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
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex min-h-56 items-center justify-center">
      <div className="w-72">
        <Select {...args}>
          <SelectTrigger aria-label="Choix de l option">
            <SelectValue placeholder="Choisir une option" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Mon compte</SelectLabel>
              <SelectSeparator />
              <SelectItem value="profil">Profil</SelectItem>
              <SelectItem value="parametres">Parametres</SelectItem>
              <SelectItem value="mode-expert">Mode expert</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector("[data-slot='select']");
    const trigger = canvas.getByRole("combobox", { name: "Choix de l option" });

    await expect(root).toHaveAttribute("data-slot", "select");
    await expect(trigger).toHaveAttribute("data-slot", "select-trigger");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='select-content']");
      if (!node) {
        throw new Error("Select content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    const portal = document.body.querySelector("[data-slot='select-portal']");
    const viewport = document.body.querySelector(
      "[data-slot='select-viewport']",
    );
    const label = document.body.querySelector("[data-slot='select-label']");
    const separator = document.body.querySelector(
      "[data-slot='select-separator']",
    );
    const item = document.body.querySelector(
      "[data-slot='select-item']",
    ) as HTMLElement | null;

    await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    await expect(portal).toHaveAttribute("data-slot", "select-portal");
    await expect(viewport).toHaveAttribute("data-slot", "select-viewport");
    await expect(label).toHaveAttribute("data-slot", "select-label");
    await expect(separator).toHaveAttribute("data-slot", "select-separator");

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");
    await expect(content.className).toContain("data-[state=open]:animate-in");
    await expect(content.className).toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    await expect(trigger.className).toContain(
      "data-[placeholder]:text-muted-foreground",
    );
    await expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
    await expect(item?.className ?? "").toContain("focus:bg-accent");
  },
};

export const Grouped: Story = {
  render: (args) => (
    <div className="flex min-h-56 items-center justify-center">
      <div className="w-72">
        <Select {...args}>
          <SelectTrigger aria-label="Choix de la categorie">
            <SelectValue placeholder="Selectionner une categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Suivi</SelectLabel>
              <SelectItem value="journal">Journal alimentaire</SelectItem>
              <SelectItem value="scores">Scores personnels</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Analyse</SelectLabel>
              <SelectItem value="substitutions">Substitutions</SelectItem>
              <SelectItem value="rapport">Rapport expert</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

export const LongList: Story = {
  render: (args) => (
    <div className="flex min-h-56 items-center justify-center">
      <div className="w-72">
        <Select {...args}>
          <SelectTrigger aria-label="Choix de l ingredient">
            <SelectValue placeholder="Choisir un ingredient" />
          </SelectTrigger>
          <SelectContent className="max-h-44">
            <SelectGroup>
              <SelectLabel>Ingredients frequents</SelectLabel>
              <SelectSeparator />
              {Array.from({ length: 20 }, (_, index) => {
                const value = `ingredient-${index + 1}`;
                return (
                  <SelectItem key={value} value={value}>
                    Ingredient {index + 1}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", {
      name: "Choix de l ingredient",
    });

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector("[data-slot='select-content']");
      if (!node) {
        throw new Error("Select content is not mounted yet.");
      }
      return node as HTMLElement;
    });

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("max-h-44");

    const viewport = document.body.querySelector(
      "[data-slot='select-viewport']",
    ) as HTMLElement | null;

    if (viewport) {
      viewport.scrollTop = 10_000;
      await fireEvent.scroll(viewport);
    }

    const scrollDown = document.body.querySelector(
      "[data-slot='select-scroll-down-button']",
    );
    const scrollUp = document.body.querySelector(
      "[data-slot='select-scroll-up-button']",
    );

    if (scrollDown) {
      await expect(scrollDown).toHaveAttribute(
        "data-slot",
        "select-scroll-down-button",
      );
    }

    if (scrollUp) {
      await expect(scrollUp).toHaveAttribute(
        "data-slot",
        "select-scroll-up-button",
      );
    }
  },
};

function ControlledSelect(args: Story["args"]) {
  const [value, setValue] = useState("parametres");

  return (
    <div className="flex min-h-56 items-center justify-center">
      <div className="w-72 space-y-3">
        <Select
          {...args}
          onValueChange={(next) => {
            setValue(next);
            args?.onValueChange?.(next);
          }}
          value={value}
        >
          <SelectTrigger aria-label="Choix controle">
            <SelectValue placeholder="Choisir une option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profil">Profil</SelectItem>
            <SelectItem value="parametres">Parametres</SelectItem>
            <SelectItem value="mode-expert">Mode expert</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Valeur: {value}</p>
      </div>
    </div>
  );
}

export const Controlled: Story = {
  render: (args) => <ControlledSelect {...args} />,
};

export const DarkMode: Story = {
  ...Default,
  args: {
    ...Default.args,
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
