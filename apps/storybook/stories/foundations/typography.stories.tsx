import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  playTypographyReference,
  playTypographyShowcase,
} from "./typography.play";
import { TypographyReferenceStory } from "./typography.reference";
import { TypographyShowcaseStory } from "./typography.showcase";

const meta = {
  title: "Foundations/Tokens/Typography",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: () => <TypographyShowcaseStory />,
  play: playTypographyShowcase,
};

export const Reference: Story = {
  render: () => <TypographyReferenceStory />,
  play: playTypographyReference,
};
