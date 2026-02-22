# @fodmap/design-tokens

Canonical design token source for FODMAP frontend packages.

## Scope

- Owns base and semantic token definitions.
- Produces deterministic generated artifacts committed in `src/generated`.
- Exposes token contract for CSS, JSON, and JS/TS consumers.

## Generated outputs

- `src/generated/tokens.css`
- `src/generated/tokens.json`
- `src/generated/tokens.js`
- `src/generated/tokens.d.ts`

## Commands

```bash
pnpm --filter @fodmap/design-tokens tokens:generate
pnpm --filter @fodmap/design-tokens tokens:check
```

`tokens:check` regenerates outputs and fails if `src/generated` is stale.
