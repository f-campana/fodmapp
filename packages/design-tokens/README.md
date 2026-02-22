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

Color values in generated outputs are serialized as `oklch(...)`.

## Color Source Schema

Base colors are stored as DTCG color objects in `src/tokens/base/color.json`:

```json
{
  "$type": "color",
  "$value": {
    "colorSpace": "oklch",
    "components": [0.6847, 0.1479, 237.32],
    "hex": "#0ea5e9"
  }
}
```

Rules:

- `colorSpace` must be `"oklch"`.
- `components` are `[L, C, H]` with precision `L: 4`, `C: 4`, `H: 2`.
- `hex` is required and must be lowercase `#rrggbb`.

## Preflight Validation

`tokens:generate` validates every base color token before Style Dictionary runs:

- DTCG object shape and `oklch` color space.
- Numeric ranges (`L` in `0..1`, `C >= 0`, `H` in `0..360`).
- Lowercase canonical `hex` format.
- Roundtrip equality: `oklch -> sRGB hex` must equal the provided `hex`.

Generation fails with the exact token path when validation errors are found.

## Commands

```bash
pnpm --filter @fodmap/design-tokens tokens:generate
pnpm --filter @fodmap/design-tokens tokens:check
```

`tokens:check` regenerates outputs and fails if `src/generated` is stale.
