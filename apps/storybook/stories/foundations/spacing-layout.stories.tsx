import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  playSpacingLayoutReference,
  playSpacingLayoutShowcase,
} from "./spacing-layout.play";
import { SpacingLayoutReferenceStory } from "./spacing-layout.reference";
import { SpacingLayoutShowcaseStory } from "./spacing-layout.showcase";

const meta = {
  title: "Foundations/Tokens/Spacing & Layout",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => <SpacingLayoutShowcaseStory />,
  play: playSpacingLayoutShowcase,
};

export const Reference: Story = {
  render: () => <SpacingLayoutReferenceStory />,
  play: playSpacingLayoutReference,
};
