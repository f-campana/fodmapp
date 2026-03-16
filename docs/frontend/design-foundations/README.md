# Design Foundations

## Purpose

This subtree is the canonical home for cross-cutting frontend design-system rules.
Use it for guidance that applies across multiple components or apps.
Keep live component examples, API details, and edge-state demos in Storybook component docs.

## Core rules

- Storybook remains the home for component contract, examples, and implementation-oriented usage.
- `docs/frontend/design-foundations/*` is for reusable system rules that should not be duplicated across component docs.
- Keep guidance semantic and behavioral; do not recreate token galleries, showcase/reference trios, or large visual dumps.
- Prefer a small number of durable rules over exhaustive inventories of design-token values.

## Recommended usage

- Start here when you need the system rule behind a component decision rather than the component API itself.
- Read `component-mapping.md` when you know the component family and need the relevant foundation rule quickly.
- Link to these docs from future component docs when a rule would otherwise be repeated verbatim.

## Anti-patterns

- Do not treat this subtree as a replacement Storybook.
- Do not add raw palette matrices, typography playgrounds, or demo-heavy pages.
- Do not move component-specific behavior or example code out of Storybook and into these docs.

## Accessibility implications

- Cross-cutting rules here should make accessibility expectations easier to discover before implementation.
- Component-specific accessibility behavior must still be proven and documented in Storybook component docs.

## Related components

- `Primitives/Foundation/*`
- `Primitives/Adapter/*`
- `Composed/*`
- `Utilities/*`

## Related docs

- [docs/README.md](../../README.md)
- [docs/frontend/strategy.md](../strategy.md)
- [docs/frontend/storybook-component-taxonomy-contract.md](../storybook-component-taxonomy-contract.md)
- [docs/frontend/tailwind-v4-token-architecture.md](../tailwind-v4-token-architecture.md)
