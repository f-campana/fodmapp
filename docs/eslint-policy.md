# ESLint Policy and LLM-Shaping Governance

## Policy contract

Scope for the repository:

- `/Users/fabiencampana/Documents/Fodmap-eslint-worktree/packages/eslint-config/base.js`: applies to all JS/TS code.
- `/Users/fabiencampana/Documents/Fodmap-eslint-worktree/packages/eslint-config/next.js`: applies only to `apps/app/**/*`.
- `/Users/fabiencampana/Documents/Fodmap-eslint-worktree/packages/eslint-config/llm.js`: optional LLM quality layer, enabled via `eslint.llm.config.mjs`.

Root entry points:

- `/Users/fabiencampana/Documents/Fodmap-eslint-worktree/eslint.config.mjs`
- `/Users/fabiencampana/Documents/Fodmap-eslint-worktree/eslint.llm.config.mjs`

## Stage rollout

1. Stage 1 (baseline): low-friction correctness/readability defaults in `base.js`.
2. Stage 2 (balanced): maintainability and async safety warnings in `base.js`, CI fails on warnings.
3. Stage 3 (LLM-shaping): enable via `lint:llm` / `eslint.llm.config.mjs` + `@fodmap/eslint-config/llm`.

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
