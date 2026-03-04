import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "storybook/test";

import { Portal } from "@fodmap/ui";

const meta = {
  title: "Utilities/Portal",
  component: Portal,
  tags: ["autodocs"],
  args: {
    children: null,
    disabled: false,
  },
  argTypes: {
    disabled: {
      description:
        "When true, children render inline instead of using React portal.",
      control: { type: "boolean" },
      table: { defaultValue: { summary: "false" } },
    },
    container: {
      description: "Optional DOM container used as portal mount target.",
      control: false,
      table: {
        type: { summary: "Element | DocumentFragment | null" },
      },
    },
    children: {
      description: "Content rendered through the portal.",
      control: false,
      table: { type: { summary: "ReactNode" } },
    },
  },
  parameters: {
    controls: { expanded: true },
  },
} satisfies Meta<typeof Portal>;

export default meta;

type Story = StoryObj<typeof meta>;

function WithCustomContainer() {
  const [container, setContainer] = React.useState<Element | null>(null);

  return (
    <div className="space-y-2" data-slot="portal-demo-custom">
      <div data-testid="portal-target" ref={setContainer} />
      <Portal container={container}>
        <p data-testid="portal-content-custom">
          Contenu dans le conteneur personnalisé
        </p>
      </Portal>
    </div>
  );
}

export const DefaultToBody: Story = {
  render: () => (
    <Portal>
      <p data-testid="portal-content-body">Contenu portalisé vers body</p>
    </Portal>
  ),
};

export const CustomContainer: Story = {
  render: () => <WithCustomContainer />,
};

export const DisabledInline: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <Portal {...args}>
      <p data-testid="portal-content-inline">Contenu inline</p>
    </Portal>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      canvas.getByTestId("portal-content-inline"),
    ).toBeInTheDocument();
  },
};
