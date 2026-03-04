import { useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxMulti,
  ComboboxSeparator,
  ComboboxTrigger,
} from "@fodmap/ui";

const meta = {
  title: "Composed/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  argTypes: {
    defaultOpen: {
      description: "Sets initial popover open state in uncontrolled mode.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    open: {
      description: "Controls popover open state.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "undefined" } },
    },
    defaultValue: {
      description: "Initial selected value in uncontrolled single mode.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    value: {
      description: "Controlled selected value in single mode.",
      control: { type: "text" },
      table: { defaultValue: { summary: "undefined" } },
    },
    modal: {
      description: "Whether the popover should behave as a modal layer.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    onOpenChange: {
      description: "Callback invoked when open state changes.",
    },
    onValueChange: {
      description: "Callback invoked when selected value changes.",
    },
    children: {
      description:
        "Combobox composition using trigger, content, and command slots.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    modal: false,
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Combobox>;

export default meta;

type Story = StoryObj<typeof meta>;

function SingleFixture(args: Story["args"]) {
  return (
    <div className="flex min-h-72 items-center justify-center">
      <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
        <Combobox {...args}>
          <ComboboxTrigger aria-label="Choix de l option" />
          <ComboboxContent>
            <ComboboxInput placeholder="Rechercher un aliment" />
            <ComboboxList>
              <ComboboxEmpty>Aucun resultat</ComboboxEmpty>
              <ComboboxGroup heading="Fruits">
                <ComboboxItem value="pomme">Pomme</ComboboxItem>
                <ComboboxItem value="banane">Banane</ComboboxItem>
                <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
              </ComboboxGroup>
              <ComboboxSeparator />
              <ComboboxGroup heading="Legumes">
                <ComboboxItem value="carotte">Carotte</ComboboxItem>
                <ComboboxItem value="courgette">Courgette</ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}

export const SingleDefault: Story = {
  render: (args) => <SingleFixture {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Choix de l option" });

    await expect(
      canvasElement.querySelector("[data-slot='combobox']"),
    ).toHaveAttribute("data-slot", "combobox");

    await expect(trigger).toHaveAttribute("data-slot", "combobox-trigger");
    await expect(trigger.className).toContain("border-input");
    await expect(trigger.className).not.toContain("focus-visible:ring-ring/50");

    await userEvent.click(trigger);

    const content = await waitFor(() => {
      const node = document.body.querySelector(
        "[data-slot='combobox-content']",
      );
      if (!node) {
        throw new Error("Combobox content not mounted yet.");
      }
      return node as HTMLElement;
    });

    await expect(content.className).toContain("bg-popover");
    await expect(content.className).toContain("text-popover-foreground");

    const input = document.body.querySelector("[data-slot='combobox-input']");
    const list = document.body.querySelector("[data-slot='combobox-list']");
    const group = document.body.querySelector("[data-slot='combobox-group']");
    const item = document.body.querySelector("[data-slot='combobox-item']");
    const separator = document.body.querySelector(
      "[data-slot='combobox-separator']",
    );

    await expect(input).toHaveAttribute("data-slot", "combobox-input");
    await expect(list).toHaveAttribute("data-slot", "combobox-list");
    await expect(group).toHaveAttribute("data-slot", "combobox-group");
    await expect(item).toHaveAttribute("data-slot", "combobox-item");
    await expect(separator).toHaveAttribute("data-slot", "combobox-separator");

    await userEvent.click(within(document.body).getByText("Banane"));

    await waitFor(() => {
      if (document.body.querySelector("[data-slot='combobox-content']")) {
        throw new Error("Combobox content should be closed after selection.");
      }
    });
  },
};

function SingleControlledFixture(args: Story["args"]) {
  const [value, setValue] = useState("pomme");

  return (
    <div className="flex min-h-72 items-center justify-center">
      <div className="w-full max-w-xl space-y-3 rounded-(--radius) border border-border bg-card p-4">
        <Combobox
          {...args}
          onValueChange={(nextValue) => {
            setValue(nextValue);
            args?.onValueChange?.(nextValue);
          }}
          value={value}
        >
          <ComboboxTrigger aria-label="Choix controle" />
          <ComboboxContent>
            <ComboboxInput placeholder="Rechercher" />
            <ComboboxList>
              <ComboboxItem value="pomme">Pomme</ComboboxItem>
              <ComboboxItem value="banane">Banane</ComboboxItem>
              <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p className="text-sm text-muted-foreground">Valeur: {value}</p>
      </div>
    </div>
  );
}

export const SingleControlled: Story = {
  render: (args) => <SingleControlledFixture {...args} />,
};

function MultiFixture() {
  return (
    <div className="flex min-h-72 items-center justify-center">
      <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
        <ComboboxMulti>
          <ComboboxTrigger aria-label="Choix multiple" />
          <ComboboxContent>
            <ComboboxInput placeholder="Rechercher un aliment" />
            <ComboboxList>
              <ComboboxEmpty>Aucun resultat</ComboboxEmpty>
              <ComboboxGroup heading="Fruits">
                <ComboboxItem value="pomme">Pomme</ComboboxItem>
                <ComboboxItem value="banane">Banane</ComboboxItem>
                <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </ComboboxMulti>
      </div>
    </div>
  );
}

export const MultiDefault: Story = {
  render: () => <MultiFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox", { name: "Choix multiple" });

    await expect(
      canvasElement.querySelector("[data-slot='combobox-multi']"),
    ).toHaveAttribute("data-slot", "combobox-multi");

    await userEvent.click(trigger);
    await waitFor(() => {
      const item = document.body.querySelector("[data-slot='combobox-item']");
      if (!item) {
        throw new Error("Combobox item not mounted yet.");
      }
    });

    await userEvent.click(within(document.body).getByText("Pomme"));

    await waitFor(() => {
      if (document.body.querySelector("[data-slot='combobox-content']")) {
        throw new Error("Combobox content should close after first selection.");
      }
    });

    await userEvent.click(trigger);
    await waitFor(() => {
      const item = document.body.querySelector("[data-slot='combobox-item']");
      if (!item) {
        throw new Error("Combobox item not mounted on second open.");
      }
    });

    await userEvent.click(within(document.body).getByText("Banane"));

    await waitFor(() => {
      if (document.body.querySelector("[data-slot='combobox-content']")) {
        throw new Error(
          "Combobox content should close after second selection.",
        );
      }
    });

    await expect(trigger).toHaveTextContent("Pomme +1");
  },
};

function MultiControlledFixture() {
  const [value, setValue] = useState<string[]>(["pomme"]);

  return (
    <div className="flex min-h-72 items-center justify-center">
      <div className="w-full max-w-xl space-y-3 rounded-(--radius) border border-border bg-card p-4">
        <ComboboxMulti onValueChange={setValue} value={value}>
          <ComboboxTrigger aria-label="Choix multiple controle" />
          <ComboboxContent>
            <ComboboxInput placeholder="Rechercher" />
            <ComboboxList>
              <ComboboxItem value="pomme">Pomme</ComboboxItem>
              <ComboboxItem value="banane">Banane</ComboboxItem>
              <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </ComboboxMulti>
        <p className="text-sm text-muted-foreground">
          Valeurs: {value.join(", ")}
        </p>
      </div>
    </div>
  );
}

export const MultiControlled: Story = {
  render: () => <MultiControlledFixture />,
};

export const WithDisabledItems: Story = {
  render: () => (
    <div className="flex min-h-72 items-center justify-center">
      <div className="w-full max-w-xl rounded-(--radius) border border-border bg-card p-4">
        <Combobox>
          <ComboboxTrigger aria-label="Etat des options" />
          <ComboboxContent>
            <ComboboxInput placeholder="Rechercher" />
            <ComboboxList>
              <ComboboxGroup heading="Actions">
                <ComboboxItem disabled value="support-premium">
                  Support premium indisponible
                </ComboboxItem>
                <ComboboxItem value="profil">Profil</ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  ...SingleDefault,
  args: {
    ...SingleDefault.args,
    onOpenChange: fn(),
    onValueChange: fn(),
  },
  globals: {
    theme: "dark",
  },
};
