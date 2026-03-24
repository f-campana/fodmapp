# Tailwind v4 Token Architecture

Status: Accepted direction, pending implementation cleanup  
Audience: Contributor or engineer; Reviewer or auditor  
Scope: Styling package boundaries for Tailwind-based apps and `@fodmapp/ui`  
Related docs: [docs/frontend/strategy.md](./strategy.md), [docs/architecture/decision-register.md](../architecture/decision-register.md), [packages/ui/README.md](../../packages/ui/README.md)  
Last reviewed: 2026-03-17

## Summary

Keep three distinct layers with explicit ownership:

1. `@fodmapp/design-tokens`: raw token source only.
2. `@fodmapp/tailwind-config`: canonical Tailwind foundation for app consumers.
3. `@fodmapp/ui`: compiled component package with explicit, documented CSS surfaces.

The current baseline is close to this model, but not cleanly there yet. In particular,
consumer apps still rely on `@fodmapp/ui` to pull in parts of the Tailwind foundation
indirectly. That coupling should be removed before more frontend work builds on it.

## Current State

### What is already correct

- `@fodmapp/design-tokens` is the canonical source of semantic and raw tokens.
- `@fodmapp/tailwind-config` already acts as the semantic Tailwind bridge by:
  - importing Tailwind v4
  - importing token CSS from `@fodmapp/design-tokens`
  - mapping `--fd-*` variables into semantic Tailwind aliases via `@theme inline`
- `@fodmapp/ui` already consumes semantic Tailwind classes instead of hardcoded colors.
- consumer apps build and render successfully against the current package graph.

### What is still unclear

- apps can work without importing `@fodmapp/tailwind-config` directly because `@fodmapp/ui`
  currently imports the adapter internally
- apps may import `@fodmapp/design-tokens/css` directly even though the adapter already does
  that job
- `@fodmapp/ui/app.css` mixes multiple roles:
  - Tailwind foundation import
  - font loading
  - base element styles
  - component CSS surface
- the name `app.css` does not tell consumers whether it is a base theme file, a narrow bundle,
  or the full UI stylesheet

This ambiguity is tolerable in the short term but is not a stable contract for additional apps.

## Accepted Package Contract

### `@fodmapp/design-tokens`

Purpose:

- own semantic and raw tokens (color, typography, spacing, radius, motion, shadows)

Outputs:

- machine-readable tokens (TS/JSON/native)
- CSS variable bundle for light/dark themes

Rules:

- raw source only
- no Tailwind utility generation
- no component classes
- apps should not import `@fodmapp/design-tokens/css` directly when they already consume the
  Tailwind adapter

### `@fodmapp/tailwind-config`

Purpose:

- be the canonical styling foundation for Tailwind-based app consumers

Contents:

- generated `shared-styles.css` with:
  - Tailwind v4 import
  - `@fodmapp/design-tokens/css` import
  - semantic runtime aliases
  - semantic Tailwind theme slot mapping

Rules:

- thin adapter only
- no component bundle responsibility
- no app-specific layout or product copy
- every Tailwind-based app should import this package directly

### `@fodmapp/ui`

Purpose:

- ship the React component package
- ship explicit optional CSS surfaces for those components

Rules:

- compiled JS and type output stay in place
- no hidden ownership of the Tailwind foundation
- CSS exports must be explicit about what they contain
- CSS exports should not be named or structured in a way that implies “magic app setup”

## Why `@fodmapp/ui` Stays Compiled

`@fodmapp/ui` should keep shipping compiled JS and type declarations.

Reasons:

- it is a real package boundary, not just a source folder
- apps, Storybook, and future consumers need a stable public API
- every consumer should not need to know how to transpile UI source internals
- package-level RSC/client boundaries are easier to reason about when the package contract is
  explicit and built

The current ambiguity is about CSS ownership, not about whether the UI package should exist as a
compiled package.

## CSS Delivery Options Considered

### Option A — one prebuilt full UI stylesheet

Apps import:

```css
@import "@fodmapp/tailwind-config/shared-styles.css";
@import "@fodmapp/ui/full.css";
```

Pros:

- simplest consumer setup
- explicit boundary
- easy to document and validate

Cons:

- ships unused CSS for components an app does not render
- bundle size grows with the full UI surface

Use when:

- simplicity matters more than bundle minimization

### Option B — segmented prebuilt UI stylesheets

Apps import only the surfaces they need, for example:

```css
@import "@fodmapp/tailwind-config/shared-styles.css";
@import "@fodmapp/ui/forms.css";
@import "@fodmapp/ui/actions.css";
```

Pros:

- explicit contract
- smaller than one full bundle
- cleaner package boundary than app-compiling UI

Cons:

- more package maintenance
- bundle taxonomy must stay coherent over time

Use when:

- multiple apps consume different parts of the UI library and CSS waste matters

### Option C — apps compile UI CSS themselves

Apps import the Tailwind foundation directly and configure Tailwind to scan both app code and UI
component sources or built outputs.

Pros:

- potentially smallest generated CSS
- one styling pipeline owned by the app

Cons:

- tighter coupling between app build configuration and UI internals
- more brittle consumer setup
- harder package contract for Storybook or external consumers
- more operational complexity for every consuming app

Use when:

- the repo intentionally chooses app-owned CSS generation as a first-class build model

### Option D — per-component CSS next to each component

This is not the preferred direction for the current stack.

Reasons:

- the UI library is authored with Tailwind utility classes, not component-scoped CSS modules
- per-component CSS generation would add build complexity and duplicated utility output
- the complexity is high for limited practical benefit at the current repo scale

## Accepted Direction

The accepted direction is a phased approach:

### Phase 1 — contract cleanup

- apps import `@fodmapp/tailwind-config/shared-styles.css` directly
- apps stop importing `@fodmapp/design-tokens/css` directly
- `@fodmapp/ui` keeps compiled JS/types
- `@fodmapp/ui` no longer hides the Tailwind foundation behind a CSS export
- `@fodmapp/ui/app.css` is deprecated or renamed because its current meaning is ambiguous
- app-owned concerns such as font loading and product-level base layout styles move to app code,
  not UI package CSS

### Phase 2 — choose CSS surface granularity

The repo may start with one explicit full UI stylesheet for speed, then later split to segmented
bundles if bundle size or app surface divergence justifies the maintenance cost.

Current leaning:

- short-term: one explicit full UI stylesheet is acceptable if it is foundation-free and clearly
  named
- medium-term: segmented UI stylesheets are the preferred end state if multiple apps need different
  subsets of the UI layer

## Consumer Rules

For Tailwind-based apps in this repo:

1. import `@fodmapp/tailwind-config/shared-styles.css` directly
2. do not import `@fodmapp/design-tokens/css` directly unless the app has a specific non-Tailwind
   need that cannot be served through the adapter
3. import UI CSS explicitly and only when the app consumes UI components
4. do not rely on `@fodmapp/ui` CSS to initialize the app-wide Tailwind foundation
5. keep app-specific global styles, fonts, and page layout ownership in the app itself

## Current Layout

```text
packages/
  design-tokens/
    src/generated/tokens.css
    src/generated/tokens.json
    src/generated/tokens.js
    src/generated/tokens.d.ts
  tailwind-config/
    shared-styles.css
    src/semantic-slot-map.mjs
  ui/
    src/components/*
    src/styles/*
    dist/*
```

## External Research References

- Tailwind v4 theme variables and cross-project sharing:
  - [tailwindcss.com/docs/customizing-spacing](https://tailwindcss.com/docs/customizing-spacing/)
- Turborepo shared Tailwind package guidance:
  - [turborepo.com/docs/guides/tools/tailwind](https://turborepo.com/docs/guides/tools/tailwind)
- shadcn/ui monorepo requirements and Tailwind v4 config behavior:
  - [ui.shadcn.com/docs/monorepo](https://ui.shadcn.com/docs/monorepo)
  - [ui.shadcn.com/docs/components-json](https://ui.shadcn.com/docs/components-json)
  - [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)

## Comparison To Existing External Reference

External examples are useful for pattern inspiration, but should not be copied as-is. This repo has
its own constraints:

- multiple app consumers
- explicit design-token ownership
- mixed server/client rendering concerns
- a need for documented package boundaries rather than implicit CSS side effects
