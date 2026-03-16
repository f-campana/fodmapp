# Spacing Foundations

## Purpose

Define the spacing rules that keep layouts, controls, and content blocks coherent across apps and shared UI.

## Core rules

- Use the shared spacing scale intentionally; avoid arbitrary one-off gaps unless there is a documented exception.
- Distinguish layout spacing from inline control spacing.
- Prefer consistent stack, cluster, and grid rhythms over local hand-tuned offsets.
- Density changes should be deliberate at the component or screen level, not random per element.

## Recommended usage

- Use vertical stack spacing to communicate section hierarchy before adding borders or background changes.
- Keep inline spacing tight enough to preserve grouping, but not so tight that controls visually merge.
- Use grid spacing to align repeated content cards, tables, and overview summaries.
- Treat helper text, captions, and error messages as part of the component block they explain.

## Anti-patterns

- Do not mix multiple unrelated gap values in the same local component region.
- Do not compensate for weak layout structure by adding ad hoc margins on individual children.
- Do not collapse interactive controls until they feel visually fused.
- Do not let mobile layouts inherit desktop spacing unchanged when readability suffers.

## Accessibility implications

- Spacing affects readability, target separation, and scanability, especially on narrow screens.
- Adequate space between interactive elements reduces accidental activation.
- Help, error, and status text should remain visually attached to the control they describe.

## Related components

- `Card`, `Callout`, `Empty`, `Table`
- `ButtonGroup`, `InputGroup`, `Field`
- `Pagination`, `Stepper`
- `Accordion`, `Tabs`, `NavigationMenu`

## Related docs

- [README.md](./README.md)
- [component-mapping.md](./component-mapping.md)
- [docs/frontend/strategy.md](../strategy.md)
