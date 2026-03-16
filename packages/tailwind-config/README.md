# @fodmapp/tailwind-config

Shared Tailwind v4 adapter stylesheet for FODMAP packages/apps.

## Export

- `@fodmapp/tailwind-config/shared-styles.css`

## Commands

```bash
pnpm --filter @fodmapp/tailwind-config styles:generate
pnpm --filter @fodmapp/tailwind-config styles:check
```

`shared-styles.css` is generated from `src/semantic-slot-map.mjs`.
Do not hand-edit `shared-styles.css`.

## Responsibilities

- Imports Tailwind v4.
- Imports `@fodmapp/design-tokens/css`.
- Defines shared `@theme inline` mappings and dark variant selector.
- Provides shadcn-compatible color slots (`primary`, `secondary`, `card`, `popover`, `muted`, `accent`, `destructive`, `input`, `ring`) mapped to semantic tokens.

This package stays intentionally thin and does not duplicate token values.
