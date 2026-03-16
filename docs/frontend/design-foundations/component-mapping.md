# Component Mapping

## Purpose

Map the cross-cutting design foundations guidance to the actual component families in Storybook and `@fodmapp/ui`.

## Core rules

- Use this page as the bridge between system rules and component-specific docs.
- Foundation rules should narrow decisions before implementation; component docs should confirm the concrete contract.
- When a component family spans multiple concerns, start with the dominant rule rather than trying to apply every foundation equally.

## Recommended usage

- Start with the family that matches your task, then follow the linked foundation pages before opening the component story.
- Use Storybook to confirm behavior and example code after you have the relevant rule context.
- Prefer linking component docs back to these foundation pages when the same rationale would otherwise be repeated.

## Anti-patterns

- Do not use this page as a substitute for actual component stories.
- Do not restate every prop or behavior contract here.
- Do not treat the mapping as rigid precedence when a component legitimately spans multiple foundations.

## Accessibility implications

- The mapping should make it easier to find the relevant accessibility baseline before implementation starts.
- Component-specific accessibility details still need to be verified in the component docs and tests.

## Related components

- Inputs and actions: `Button`, `ButtonGroup`, `Input`, `NativeSelect`, `Textarea`
  - primary rules: [color.md](./color.md), [spacing.md](./spacing.md), [accessibility-baselines.md](./accessibility-baselines.md)
- Content and layout: `Alert`, `Callout`, `Card`, `Empty`, `Table`
  - primary rules: [color.md](./color.md), [spacing.md](./spacing.md), [typography.md](./typography.md)
- Display primitives: `Badge`, `Chip`, `Dot`, `Kbd`, `Item`, `Typography`
  - primary rules: [color.md](./color.md), [typography.md](./typography.md)
- Navigation and status: `Breadcrumb`, `Pagination`, `Stepper`, `ScoreBar`, `Skeleton`, `Spinner`
  - primary rules: [spacing.md](./spacing.md), [typography.md](./typography.md), [accessibility-baselines.md](./accessibility-baselines.md)
- Overlays and disclosure: `Dialog`, `Drawer`, `Sheet`, `Popover`, `Accordion`, `Collapsible`, `Tabs`
  - primary rules: [motion.md](./motion.md), [spacing.md](./spacing.md), [accessibility-baselines.md](./accessibility-baselines.md)
- Menus and layered navigation: `ContextMenu`, `DropdownMenu`, `Menubar`, `NavigationMenu`, `Select`, `Combobox`
  - primary rules: [spacing.md](./spacing.md), [motion.md](./motion.md), [accessibility-baselines.md](./accessibility-baselines.md)

## Related docs

- [README.md](./README.md)
- [docs/frontend/storybook-component-taxonomy-contract.md](../storybook-component-taxonomy-contract.md)
- [docs/frontend/strategy.md](../strategy.md)
