import { type ComponentType, type ReactNode, useState } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "storybook/test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@fodmapp/ui/input-group";

import { StoryFrame, type StoryFrameProps } from "../../_shared/story-frame";

function InputGroupAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-input-group-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

type InputGroupStoryArgs = {
  disabled: boolean;
  invalid: boolean;
  placeholder: string;
};

const defaultPlaygroundArgs = {
  disabled: false,
  invalid: false,
  placeholder: "mon-profil",
} satisfies InputGroupStoryArgs;

function URLInputGroup({
  args,
  addonLabel,
  dataSlot,
  inputDataSlot,
  textDataSlot,
}: {
  args?: InputGroupStoryArgs;
  addonLabel: string;
  dataSlot?: string;
  inputDataSlot?: string;
  textDataSlot?: string;
}) {
  return (
    <InputGroup data-slot={dataSlot}>
      <InputGroupText data-slot={textDataSlot}>https://</InputGroupText>
      <InputGroupInput
        aria-invalid={args?.invalid}
        data-slot={inputDataSlot}
        disabled={args?.disabled}
        placeholder={args?.placeholder}
      />
      <InputGroupAddon>{addonLabel}</InputGroupAddon>
    </InputGroup>
  );
}

function ActionInputGroup({
  buttonDataSlot,
  dataSlot,
  inputDataSlot,
}: {
  buttonDataSlot?: string;
  dataSlot?: string;
  inputDataSlot?: string;
}) {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-3">
      <InputGroup data-slot={dataSlot}>
        <InputGroupAddon>Code</InputGroupAddon>
        <InputGroupInput data-slot={inputDataSlot} placeholder="12345" />
        <InputGroupButton
          data-slot={buttonDataSlot}
          onClick={() => setCount((value) => value + 1)}
        >
          Valider
        </InputGroupButton>
      </InputGroup>
      <p className="text-sm text-muted-foreground" data-click-count={count}>
        Validations: {count}
      </p>
    </div>
  );
}

const meta = {
  title: "Composed/InputGroup",
  component: InputGroup as ComponentType<InputGroupStoryArgs>,
  argTypes: {
    disabled: {
      description: "Disables the input inside the default URL composition.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    invalid: {
      description:
        "Applies the invalid state to the input inside the default URL composition.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    placeholder: {
      description:
        "Placeholder text used by the input in the default URL composition.",
      control: { type: "text" },
      table: { defaultValue: { summary: "mon-profil" } },
    },
  },
  args: defaultPlaygroundArgs,
  parameters: {
    controls: {
      expanded: true,
      include: ["disabled", "invalid", "placeholder"],
    },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-input-group-audit-root]"],
      },
    },
  },
} satisfies Meta<InputGroupStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <InputGroupAuditFrame maxWidth="md">
      <div className="space-y-3">
        <URLInputGroup args={args} addonLabel=".fodmap.app" />
        <p className="text-sm text-muted-foreground">
          Use this playground as a scenario harness for the default URL
          composition.
        </p>
      </div>
    </InputGroupAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <InputGroupAuditFrame maxWidth="md">
      <div className="space-y-3">
        <URLInputGroup args={defaultPlaygroundArgs} addonLabel=".fodmap.app" />
        <p className="text-sm text-muted-foreground">
          Leading and trailing text stay attached to the same input without
          splitting the control into separate fields.
        </p>
      </div>
    </InputGroupAuditFrame>
  ),
};

export const OnSurface: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <InputGroupAuditFrame maxWidth="md" surface>
      <div className="space-y-3">
        <ActionInputGroup />
        <p className="text-sm text-muted-foreground">
          This surfaced composition keeps a single grouped control while adding
          a trailing action button.
        </p>
      </div>
    </InputGroupAuditFrame>
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
    docs: { disable: true },
  },
  render: () => (
    <InputGroupAuditFrame maxWidth="md">
      <ActionInputGroup
        buttonDataSlot="custom-button"
        dataSlot="custom-group"
        inputDataSlot="custom-input"
      />
    </InputGroupAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole("group");
    const input = canvas.getByPlaceholderText("12345");
    const button = canvas.getByRole("button", { name: "Valider" });

    await expect(group).toHaveAttribute("data-slot", "input-group");
    await expect(input).toHaveAttribute("data-slot", "input-group-input");
    await expect(button).toHaveAttribute("data-slot", "input-group-button");
    await expect(
      canvasElement.querySelector("[data-slot='custom-group']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='custom-input']"),
    ).toBeNull();
    await expect(
      canvasElement.querySelector("[data-slot='custom-button']"),
    ).toBeNull();

    await expect(group.className).toContain("border-input");
    await expect(group.className).toContain("overflow-hidden");
    await expect(group.className).toContain("focus-within:ring-ring-soft");
    await expect(button.className).toContain("cursor-pointer");
    await expect(button.className).toContain("focus-visible:ring-ring-soft");

    await userEvent.click(input);
    await expect(input).toHaveFocus();

    await userEvent.click(button);

    await expect(
      canvasElement.querySelector("[data-click-count]"),
    ).toHaveAttribute("data-click-count", "1");
  },
};

export const ResponsiveStress: Story = {
  parameters: {
    ...fixedStoryParameters,
    docs: { disable: true },
  },
  render: () => (
    <InputGroupAuditFrame maxWidth="sm">
      <div className="space-y-3">
        <div className="w-full max-w-[16rem]">
          <URLInputGroup
            args={{
              ...defaultPlaygroundArgs,
              placeholder: "journal-clinique-tres-detaille",
            }}
            addonLabel=".centre-de-suivi-fodmap.fr"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Keep borders, seams, and long supporting text coherent when the
          leading and trailing content grows on compact widths.
        </p>
      </div>
    </InputGroupAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector(
      "[data-slot='input-group']",
    ) as HTMLDivElement | null;
    const input = canvasElement.querySelector(
      "[data-slot='input-group-input']",
    ) as HTMLInputElement | null;

    if (!group || !input) {
      throw new Error("Responsive input group nodes are missing.");
    }

    const groupRect = group.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
    await expect(input.className).toContain("min-w-[5.5rem]");

    if (inputRect.width < 72) {
      throw new Error(
        "InputGroup input collapsed below the compact-width threshold.",
      );
    }

    if (groupRect.width > 260) {
      throw new Error(
        "Responsive stress harness is wider than the compact-width target.",
      );
    }
  },
};
