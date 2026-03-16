# Motion Foundations

## Purpose

Define when motion is appropriate in the design system and how it should behave across components and app surfaces.

## Core rules

- Motion should explain state change, hierarchy, or continuity; it should not exist as decoration alone.
- Keep durations short and consistent enough that transitions feel intentional rather than dramatic.
- Reduced-motion preferences must be honored anywhere motion could otherwise animate spatial change.
- Repeated motion patterns should feel system-level, not component-specific experiments.

## Recommended usage

- Use motion to clarify overlays opening and closing, panels expanding, or content changing state.
- Prefer subtle transitions for hover and focus treatments; keep stronger motion for meaningful layout or visibility changes.
- Use direction and timing consistently when related components behave similarly.
- Treat page-level or section-level motion as optional enhancement, not core meaning.

## Anti-patterns

- Do not animate for visual flair when no state change needs explanation.
- Do not stack multiple motion effects on the same interaction.
- Do not use long, bouncy, or attention-seeking transitions in core productivity flows.
- Do not assume smooth scrolling or animated reveal is acceptable when reduced motion is requested.

## Accessibility implications

- Reduced-motion behavior is a first-class requirement, not an optional enhancement.
- Motion should not obscure focus state, interactive timing, or content availability.
- Important state changes should remain understandable even with animation disabled.

## Related components

- `Dialog`, `Drawer`, `Sheet`, `Popover`
- `Accordion`, `Collapsible`, `Tabs`
- `Tooltip`, `HoverCard`
- `Carousel`, `Sonner`, `Toast`

## Related docs

- [README.md](./README.md)
- [accessibility-baselines.md](./accessibility-baselines.md)
- [component-mapping.md](./component-mapping.md)
