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

`src/generated` is the public artifact contract for this package.

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

## Destructive-Subtle Contract

The semantic destructive action set includes a dedicated subtle variant for
controls that render tinted backgrounds with destructive text:

- `semantic.color.action.destructive.bgSubtle`
- `semantic.color.action.destructive.bgSubtleHover`
- `semantic.color.action.destructive.fgSubtle`
- `semantic.color.action.destructive.borderSubtle`

Generation enforces contrast minimums for these pairs in both themes:

- `fgSubtle` on `bgSubtle` >= `4.5:1`
- `fgSubtle` on `bgSubtleHover` >= `4.5:1`
- `borderSubtle` on `bgSubtle` >= `3.0:1`
- `borderSubtle` on `bgSubtleHover` >= `3.0:1`

## Semantic Remediation Contract

This package also defines semantic-only color roles used to remove runtime
opacity/dark overrides from consumers:

- Validation: `semantic.color.validation.error.{border,ring,ringSoft,text}`
- Outline action: `semantic.color.action.outline.{bg,bgHover,border,fg}`
- Ghost action: `semantic.color.action.ghost.{bgHover,fg}`
- Destructive subtle focus: `semantic.color.action.destructive.ringSubtle`
- Status subtle surfaces:
  - `semantic.color.status.success.bgSubtle`
  - `semantic.color.status.danger.bgSubtle`
- Data visualization:
  - `semantic.color.data.{axis,grid,track}`

Additional enforced contrast checks include:

- `validation.error.text` on `background.canvas` >= `4.5:1`
- `validation.error.border` on `background.canvas` >= `3.0:1`
- `validation.error.ringSoft` on `background.canvas` >= `3.0:1`
- `action.outline.fg` on `action.outline.bg` >= `4.5:1`
- `action.outline.fg` on `action.outline.bgHover` >= `4.5:1`
- `action.outline.border` on `action.outline.bg` >= `3.0:1`
- `text.primary` on `status.success.bgSubtle` >= `4.5:1`
- `text.primary` on `status.danger.bgSubtle` >= `4.5:1`
- `action.destructive.ringSubtle` on `bgSubtle` and `bgSubtleHover` >= `3.0:1`
