import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  playMotionEffectsReference,
  playMotionEffectsShowcase,
} from "./motion-effects.play";
import { MotionReferenceStory } from "./motion-effects.reference";
import { MotionEffectsShowcaseStory } from "./motion-effects.showcase";

const meta = {
  title: "Foundations/Tokens/Motion & Effects",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => <MotionEffectsShowcaseStory />,
  play: playMotionEffectsShowcase,
};

export const Reference: Story = {
  render: () => <MotionReferenceStory />,
  play: playMotionEffectsReference,
};
