# @fodmapp/tailwind-config

Shared Tailwind v4 styling foundation for FODMAPP apps and packages.

## Exports

- `@fodmapp/tailwind-config/foundation.css`
- `@fodmapp/tailwind-config/shared-styles.css`

### Which one to import

- `foundation.css`: canonical app-facing import for Tailwind-based consumers in this repo
- `shared-styles.css`: low-level adapter surface used by internal package styling

Apps should import `foundation.css` directly.

## Commands

```bash
pnpm --filter @fodmapp/tailwind-config styles:generate
pnpm --filter @fodmapp/tailwind-config styles:check
```

`shared-styles.css` and `foundation.css` are generated from `src/semantic-slot-map.mjs`.
Do not hand-edit either generated stylesheet.

## Responsibilities

- `shared-styles.css`:
  - imports Tailwind v4
  - imports `@fodmapp/design-tokens/css`
  - defines shared `@theme inline` mappings and dark variant selector
  - provides shadcn-compatible color slots (`primary`, `secondary`, `card`, `popover`, `muted`, `accent`, `destructive`, `input`, `ring`) mapped to semantic tokens
- `foundation.css`:
  - is a generated app-facing variant of the same semantic token mappings
  - gives app consumers a stable, explicit entrypoint without making them depend on the lower-level adapter name
  - uses a plain `@import "tailwindcss";` so app bundlers can consume it directly

This package stays intentionally thin and does not duplicate token values.
