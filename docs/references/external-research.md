# External Research References

This file records the references used to support frontend architecture decisions.

## Official Sources

1. Tailwind CSS v4 theme variables and token sharing model:

- [https://tailwindcss.com/docs/customizing-spacing/](https://tailwindcss.com/docs/customizing-spacing/)

2. Tailwind CSS preflight behavior (base layer implications):

- [https://tailwindcss.com/docs/preflight/](https://tailwindcss.com/docs/preflight/)

3. Turborepo shared Tailwind package guidance:

- [https://turborepo.com/docs/guides/tools/tailwind](https://turborepo.com/docs/guides/tools/tailwind)

4. shadcn/ui monorepo workflow:

- [https://ui.shadcn.com/docs/monorepo](https://ui.shadcn.com/docs/monorepo)

5. shadcn/ui `components.json` contract:

- [https://ui.shadcn.com/docs/components-json](https://ui.shadcn.com/docs/components-json)

6. shadcn/ui Tailwind v4 notes:

- [https://ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4)

## Local Reference Repos Reviewed

1. `packages/design-tokens`

- Relevant because it demonstrates token source + transformed outputs (`dist/css`, `dist/json`) and typed exports.

2. `packages/ui`

- Relevant because it demonstrates shadcn-based component organization in a monorepo package.
- Caution: dependency set and design domain differ from FODMAP needs; reuse patterns, not direct code copy.

## Key Synthesis

- Tailwind v4 favors CSS-first token definition and sharing.
- In monorepo setups, a shared Tailwind package and a dedicated token source package are complementary.
- shadcn/ui works well as a velocity accelerator when component scope and design contracts are tightly controlled.
