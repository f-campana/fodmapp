# @fodmap/ui

Shared React UI foundation for the FODMAP platform.

## Exports

- Components: `Button`, `Input`, `Badge`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`, `Field`
- Utility: `cn`
- Stylesheet: `@fodmap/ui/styles.css`

## Build

```bash
pnpm --filter @fodmap/ui build
```

Outputs:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/styles.css`

## Quality checks

```bash
pnpm --filter @fodmap/ui typecheck
pnpm --filter @fodmap/ui test
```

## Theme contract

The stylesheet consumes shared design tokens and supports:

- system theme by default (no `data-theme` attribute)
- forced light mode with `data-theme="light"`
- forced dark mode with `data-theme="dark"`

## Component API notes

Wave-1 components follow shadcn-style APIs:

- `Button` variants: `default | destructive | outline | secondary | ghost | link`
- `Button` sizes: `default | sm | lg | icon`
- `Button` supports `asChild`
- `Input` uses native input props (`aria-invalid` for invalid state)
- `Badge` variants: `default | secondary | destructive | outline`
