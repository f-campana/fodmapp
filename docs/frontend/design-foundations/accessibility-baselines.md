# Accessibility Baselines

## Purpose

Collect the cross-component accessibility rules that should be assumed by default before anyone reaches a specific component story or implementation.

## Core rules

- Keyboard reachability, labeling, focus visibility, and readable contrast are default expectations across the design system.
- Shared UI should remain usable at narrow widths, zoomed layouts, and reduced-motion settings.
- Semantic HTML and accessible names should carry the primary meaning whenever possible.
- Accessibility claims belong in component docs only when the behavior is implemented and test-backed.

## Recommended usage

- Start with the semantic element or ARIA role that matches the real interaction.
- Ensure every form control, action, and interactive region has a clear accessible name.
- Keep focus treatment visible across light and dark surfaces and across error or selected states.
- Use supporting text, iconography, and structure together when meaning would otherwise be ambiguous.

## Anti-patterns

- Do not rely on placeholder text as the only label.
- Do not hide interactive affordances behind hover-only behavior.
- Do not let responsive collapse remove keyboard access or reading order clarity.
- Do not document an accessibility behavior unless it is actually implemented and validated.

## Accessibility implications

- This page defines the baseline itself: focus, labels, keyboard, contrast, reduced motion, and target clarity all need to hold before component-specific nuance is considered.
- Deviations should be treated as bugs or explicit exceptions, not stylistic choices.

## Related components

- Form controls: `Input`, `NativeSelect`, `Textarea`, `Checkbox`, `RadioGroup`, `Switch`
- Overlays: `Dialog`, `Drawer`, `Sheet`, `Popover`, `Tooltip`
- Navigation: `Breadcrumb`, `Pagination`, `Tabs`, `NavigationMenu`
- Feedback: `Alert`, `Toast`, `Sonner`, `Callout`

## Related docs

- [README.md](./README.md)
- [motion.md](./motion.md)
- [component-mapping.md](./component-mapping.md)
- [docs/frontend/storybook-component-taxonomy-contract.md](../storybook-component-taxonomy-contract.md)
