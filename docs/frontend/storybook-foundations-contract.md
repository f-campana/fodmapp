# Storybook Foundations Contract

## Scope

This document defines the maintenance contract for foundations token stories in
`apps/storybook/stories/foundations`.

Related contract:

- `docs/frontend/storybook-component-taxonomy-contract.md`

Covered stories:

- `color.stories.tsx`
- `typography.stories.tsx`
- `spacing-layout.stories.tsx`
- `motion-effects.stories.tsx`

## Story Structure Contract

Each foundations story must expose:

- `Showcase`: visual-first exploratory view.
- `Reference`: deterministic token path/value tables for implementation and QA.
- `play` assertions for critical rendering and interaction behavior.

Shared primitives:

- Layout/components: `token-docs.components.tsx`
- Token shaping/sorting helpers: `token-docs.helpers.ts`
- Shared styling surface: `token-docs.css` (or split successors)

## Token Coverage Matrix

### Color story

- Base color families (`base.color.*`)
- Semantic color values (`themes.{light,dark}.semantic.color.*`)

### Typography story

- Base typography (`base.typography.*`)
- Semantic typography families:
  - `semantic.typography.font.family.body`
  - `semantic.typography.font.family.display`

### Spacing & Layout story

- Base space/radius/border/opacity/breakpoint/z-index
- Semantic radius:
  - `semantic.radius.control`
  - `semantic.radius.container`
  - `semantic.radius.pill`
- Semantic space:
  - `semantic.space.controlX`
  - `semantic.space.controlY`
  - `semantic.space.section`

### Motion & Effects story

- Base motion + base shadow
- Semantic motion:
  - `semantic.motion.interactiveDuration`
  - `semantic.motion.interactiveEasing`

## Theme and Pairing Contract

- Semantic references are surfaced for both light and dark themes.
- Base brand light/dark pairs must stay symmetric. Token generation must fail on
  one-sided `*Light`/`*Dark` brand keys.

## Update Checklist

When adding or changing tokens:

1. Update token source files under `packages/design-tokens/src/tokens`.
2. Regenerate artifacts in `packages/design-tokens/src/generated`.
3. Update relevant foundations `Reference` sections to include new paths.
4. Update `play` assertions to guarantee path presence and non-empty values.
5. Validate with:
   - `pnpm --filter @fodmap/design-tokens tokens:check`
   - `pnpm exec eslint apps/storybook/stories/foundations/**/*.ts apps/storybook/stories/foundations/**/*.tsx`

## Known Baseline Constraint (March 3, 2026)

`@fodmap/storybook` workspace-wide typecheck/build currently fail on unrelated
non-foundations stories due missing exports from `@fodmap/ui`.
