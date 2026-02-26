# Fodmap Collaboration Contract

## Branch/Commit/PR Rules

1. Use short-lived branches from `main`.
2. Keep commits in Conventional Commit format.
3. Keep PR titles semantic (Conventional Commit style).
4. Keep PR scope small and focused.

## Required Validation Before Merge Request

Run:

```bash
./.github/scripts/quality-gate.sh
```

Then wait for CI completion. Once green, ask before merge.

## Safety Rules

1. Do not rewrite history on shared branches unless explicitly requested.
2. Do not run destructive git commands without explicit approval.
3. Do not commit secrets or credentials.
