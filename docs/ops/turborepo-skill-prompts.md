# Turborepo Skill Invocation Guide

## Skill Files

- Official baseline: `skills/turborepo-official/SKILL.md`
- Scale overlay: `skills/turborepo-scale-patterns/SKILL.md`
- Fodmapp custom overlay: `skills/turborepo-fodmapp-custom/SKILL.md`

## Activation Note

These files are versioned in-repo. If a Codex session does not list them as available skills,
install/sync them into `$CODEX_HOME/skills` first, then use the profile shortcuts below.

## Turbo 2.8.x Constraint Note

In Turbo `2.8.x`, `--affected` cannot be combined with `--filter` in the same command.
For this repository, prefer PR path-gating in CI (`pr-scope`) while keeping explicit `--filter` task commands.

## Profile Shortcuts

1. Official baseline: `$turborepo`
2. Scale patterns: `$turborepo-scale-patterns`
3. Fodmapp policy+domain overlay (default): `$turborepo-fodmapp-custom`

## Copy/Paste Prompt Templates

### 1) Official Turborepo Mechanics

```text
Use $turborepo.
Goal: <what to change in turbo.json/package scripts/CI>.
Constraints: <no broad refactor / keep current package manager / etc>.
Deliver:
1) exact file edits
2) commands run
3) risks/tradeoffs
```

### 2) Large Monorepo Optimization

```text
Use $turborepo-scale-patterns.
Context: medium/large monorepo; preserve existing style unless I ask migration.
Goal: <optimize filters/caching/task graph/CI runtime>.
Constraints: minimal diff, no opportunistic pipeline->tasks migration.
Deliver:
1) pattern selected and why
2) precise edits
3) before/after execution impact
```

### 3) Fodmapp Policy + Domain Guardrails (Default)

```text
Use $turborepo-fodmapp-custom.
Task: <repo change>.
Phase 3 touched: <yes/no>. If yes, enforce Phase 3 contract.
Required:
- follow branch/commit/PR conventions
- run ./.github/scripts/quality-gate.sh
- report changed files, validations, residual risk
Deliver exactly those reporting sections.
```

## Findings-First Weekly Audit Prompt (No Edits)

```text
Use $turborepo-fodmapp-custom.
Audit our Turborepo structure, scripts, and setup end-to-end.
Scope: turbo.json, package scripts, workspace config, CI workflows, caching/env/filtering.
First pass: findings only (no edits), ranked by severity with file evidence.
Then propose a minimal-diff remediation plan and validation commands.
```

## High-Signal One-Liners

1. `Use $turborepo to add a type-check task with correct outputs/env and wire scripts.`
2. `Use $turborepo-scale-patterns to reduce CI scope with safe --filter strategies, minimal diff only.`
3. `Use $turborepo-fodmapp-custom to update swap activation flow while enforcing snapshot lock + reporting checklist.`

## Weekly Automation (Recommended)

Use Codex automation as the easiest path first. Keep OpenClaw as optional orchestration later.

Suggested recurring automation payload:

```text
Name: Weekly Turbo Audit
Schedule: every Monday at 09:00 local time
Workspace: /Users/fabiencampana/Documents/fodmapp
Prompt:
Run a findings-first Turborepo audit for this repo using $turborepo-fodmapp-custom.
If unavailable, fallback to $turborepo-scale-patterns.
Scope turbo.json, package scripts, workspace config, and CI workflows.
No edits.
Return sections: findings by severity, minimal remediation plan, validation commands, residual risk.
```

## OpenClaw vs Codex Automation

- Start with Codex automation: fastest setup, native to your current workflow.
- Add OpenClaw later if you want:
  - cross-repo scheduling
  - richer notification routing
  - orchestration across multiple tools/agents
