# @fodmapp/types

Generated TypeScript types for the v0 API contract.

Source of truth:

- `api/openapi/v0.yaml`

Generate:

```bash
pnpm --filter @fodmapp/types openapi:generate
```

Check generated file is up to date:

```bash
pnpm --filter @fodmapp/types openapi:check
```

This package should remain generated-only for API schema types.

Runtime imports are intentionally unsupported. Consume this package with TypeScript type-only imports.
