import type { Meta, StoryObj } from "@storybook/react-vite";

import { playColorReference, playColorShowcase } from "./color.play";
import { ColorReferenceStory } from "./color.reference";
import { ColorShowcaseStory } from "./color.showcase";

const meta = {
  title: "Foundations/Tokens/Color",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => <ColorShowcaseStory />,
  play: playColorShowcase,
};

export const Reference: Story = {
  render: () => <ColorReferenceStory />,
  play: playColorReference,
};
