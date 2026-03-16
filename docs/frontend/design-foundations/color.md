# Color Foundations

## Purpose

Define how semantic color roles should be used across the product without recreating the old Storybook token reference surface.

## Core rules

- Prefer semantic roles such as canvas, surface, text, border, accent, and status over palette names.
- Use color to support hierarchy and state, not to invent extra emphasis layers.
- Keep text and interactive states contrast-safe in both light and dark themes.
- Status colors should communicate meaning consistently across alerts, badges, callouts, and related components.

## Recommended usage

- Use canvas and surface roles to establish page and container hierarchy before applying accent color.
- Reserve accent color for high-signal actions, selected states, and focused emphasis that needs to stand out.
- Use muted text and border roles for supporting structure, not for primary calls to action.
- Apply status color only when the UI is actually communicating success, warning, error, or info semantics.

## Anti-patterns

- Do not bind component meaning to raw palette families such as "blue-500" or "red-600".
- Do not use accent or status color as decoration when no semantic state exists.
- Do not stack multiple competing surface treatments in the same local region without a hierarchy reason.
- Do not rely on color alone when state needs text, icon, or structural reinforcement.

## Accessibility implications

- Text, icon, and border combinations must remain readable in both themes and at reduced contrast sensitivity.
- Status color should support meaning, not carry it alone.
- Focus visibility must remain distinguishable from surrounding surface and border color.

## Related components

- `Button`, `Badge`, `Chip`
- `Alert`, `Callout`, `Card`, `Empty`
- `Input`, `NativeSelect`, `Textarea`
- `Pagination`, `Stepper`, `ScoreBar`

## Related docs

- [README.md](./README.md)
- [component-mapping.md](./component-mapping.md)
- [docs/frontend/tailwind-v4-token-architecture.md](../tailwind-v4-token-architecture.md)
