# ESLint Policy and LLM-Shaping Governance

## Policy contract

Scope for the repository:

- `packages/eslint-config/base.js`: applies to all JS/TS code.
- `packages/eslint-config/next.js`: applies only to `apps/app/**/*`.
- `packages/eslint-config/llm.js`: optional LLM quality layer, enabled via `eslint.llm.config.mjs`.
- `packages/eslint-config/markdown.js`: Markdown/MDX lint layer. In root config it is intentionally scoped to `apps/storybook/stories/**/*.{md,mdx}`.

Root entry points:

- `eslint.config.mjs`
- `eslint.llm.config.mjs`

## Stage rollout

1. Stage 1 (baseline): low-friction correctness/readability defaults in `base.js`.
2. Stage 2 (balanced): maintainability and async safety warnings in `base.js`, CI fails on warnings.
3. Stage 3 (Markdown/MDX): enable via `@fodmapp/eslint-config/markdown` and scope intentionally in root config.
4. Stage 4 (LLM-shaping): enable via `lint:llm` / `eslint.llm.config.mjs` + `@fodmapp/eslint-config/llm`.

## Rule intent

- Keep CI strict on warnings: `pnpm lint:ci`.
- `pnpm lint:llm` is the explicit path for agent-generated/LLM-heavy code.
- Prefer fixing findings over silencing rules; downgrade only with explicit justification in PR notes.
- Rule-driven prompting should map to concrete IDs (for example `react/jsx-key`, `react-hooks/exhaustive-deps`, `id-denylist`).

## Operational checklist

- For each stage PR:
  - capture first failing baseline output,
  - classify each finding as “fix code” or “temporary warning tolerance”,
  - unblock only when risk and migration strategy are explicit.
- Stage 3 should start limited and expand once output quality stabilizes.
