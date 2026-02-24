# Tailwind v4 Token Architecture

## Decision

Use both packages with clear responsibilities:

1. `packages/design-tokens`: canonical token source.
2. `packages/tailwind-config`: shared Tailwind v4 CSS adapter consumed by apps/UI.

This is preferred over choosing only one package type.

## Why This Model

- Tailwind v4 is CSS-first with `@theme` variables and supports sharing theme variables across projects via CSS imports.
- Turborepo guidance for Tailwind v4 uses a shared CSS package for reuse.
- shadcn/ui monorepo guidance for Tailwind v4 expects `components.json` with empty Tailwind config path and CSS-variable theming.

## Package Contracts

## `packages/design-tokens`

Purpose:
- Own semantic and raw tokens (color, type, spacing, radius, shadow, motion).

Outputs:
- machine-readable tokens (JSON/TS)
- CSS variable bundle (light/dark)

Rules:
- no component classes
- no app logic
- semver bump when token contract changes

## `packages/tailwind-config`

Purpose:
- Provide shared Tailwind v4 entry CSS for apps/packages.

Contents:
- `shared-styles.css` with:
  - `@import "tailwindcss";`
  - token CSS import from `@fodmap/design-tokens`
  - optional shared utilities/components layers

Rules:
- thin adapter only
- avoid duplicating token values here

## `packages/ui`

Purpose:
- shadcn-based primitives and composed UI components.

Rules:
- consume semantic token classes/variables only
- component variants with CVA
- no hardcoded palette literals in components

## Suggested Initial Layout

```text
packages/
  design-tokens/
    src/tokens/*
    src/build/*
    dist/css/variables.css
    dist/json/tokens.json
  tailwind-config/
    package.json
    shared-styles.css
  ui/
    src/components/*
    src/styles/index.css
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

The external `hubwise` example at:

- `packages/design-tokens`
- `packages/ui`

is useful as pattern inspiration (token build outputs, shadcn component organization), but should not be copied as-is because it reflects a different design domain and dependency profile.
