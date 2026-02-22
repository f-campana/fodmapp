# @fodmap/tailwind-config

Shared Tailwind v4 adapter stylesheet for FODMAP packages/apps.

## Export

- `@fodmap/tailwind-config/shared-styles.css`

## Responsibilities

- Imports Tailwind v4.
- Imports `@fodmap/design-tokens/css`.
- Defines shared `@theme inline` mappings and dark variant selector.
- Provides shadcn-compatible color slots (`primary`, `secondary`, `card`, `popover`, `muted`, `accent`, `destructive`, `input`, `ring`) mapped to semantic tokens.

This package stays intentionally thin and does not duplicate token values.
