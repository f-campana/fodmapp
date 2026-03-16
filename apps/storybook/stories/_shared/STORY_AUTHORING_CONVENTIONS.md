# Story Authoring Conventions

Use this contract for primitive and adapter stories.

## Goals

- Keep stories simple to read and easy to copy.
- Keep behavior deterministic in local runs and CI.
- Keep docs snippets and story code aligned with real usage.

## Structure

- Export one `Playground` story as the only full-controls entry point.
- Keep scenario stories fixed and intent-focused.
- Disable controls on fixed stories with `fixedStoryParameters`.
- Add a story-local audit wrapper and scope `parameters.a11y.context.include` to it.
- Add one `InteractionChecks` story for behavior/a11y contract checks.
- Hide `InteractionChecks` from docs with `parameters.docs.disable = true`.
- Add one `ResponsiveStress` story for narrow-width and long-content checks.
- Hide `ResponsiveStress` from docs with `parameters.docs.disable = true`.

## Canonical Story Set

- `Playground`: the only controls-enabled story.
- `Default`: baseline product usage.
- `OnSurface`: only when the component is realistically used inside a card/panel.
- State stories (for example `Disabled`, `Multiple`, `Vertical`) only when they represent real decisions for product teams.
- `InteractionChecks`: engineering-only semantic and behavior contract checks.
- `ResponsiveStress`: engineering-only stress fixture with long copy and narrow width.

## Simplicity Rules

- Do not use generators or generic story factories.
- Prefer direct story markup over helper layers.
- Use small local helpers only when they remove obvious duplication.
- Keep helper scope local to a single story file.

## Determinism Rules

- Do not use random values, current date/time, or async network calls in stories.
- Keep all text/content and default args static.
- For interaction checks, assert semantic outcomes first:
  - ARIA state changes
  - role relationships
  - focus movement
- Keep class assertions minimal and limited to intentional public contract tokens.

## Docs Rules

- Use consumer-facing code snippets in docs.
- Do not expose story harness internals in docs snippets.
- If a contract has exceptions (for example `asChild` slot override), document it explicitly.
- Keep docs sections ordered as:
  - when to use / when not to use
  - behavior modes or variants
  - composition patterns
  - accessibility contract
  - validation (automatic and manual)
  - responsive notes

## Minimal Story Template

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { expect, userEvent, within } from "storybook/test";

import { Component } from "@fodmapp/ui/<component-leaf>";
import { StoryFrame, type StoryFrameProps } from "../../../_shared/story-frame";

function ComponentAuditFrame({
  children,
  ...props
}: StoryFrameProps & { children: ReactNode }) {
  return (
    <div data-component-audit-root="">
      <StoryFrame {...props}>{children}</StoryFrame>
    </div>
  );
}

const fixedStoryParameters = {
  controls: { disable: true },
} as const;

const meta = {
  title: "Primitives/Adapter/Component",
  component: Component,
  args: {},
  parameters: {
    controls: { expanded: true },
    layout: "padded",
    a11y: {
      test: "error",
      context: {
        include: ["[data-component-audit-root]"],
      },
    },
  },
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <ComponentAuditFrame maxWidth="xl">
      <Component {...args} />
    </ComponentAuditFrame>
  ),
};

export const Default: Story = {
  parameters: fixedStoryParameters,
  render: () => (
    <ComponentAuditFrame maxWidth="xl">
      <Component />
    </ComponentAuditFrame>
  ),
};

export const InteractionChecks: Story = {
  parameters: {
    controls: { disable: true },
    docs: { disable: true },
  },
  render: () => (
    <ComponentAuditFrame maxWidth="xl">
      <Component />
    </ComponentAuditFrame>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button");
    await userEvent.click(trigger);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  },
};
```
