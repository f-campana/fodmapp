# Agentation Storybook Integration Plan

Last updated: 2026-03-04
Worktree: `/Users/fabiencampana/Documents/Fodmap-worktrees/ui-agentation-storybook-plan`
Branch: `codex/ui-agentation-storybook-plan`

## 1. Goal

Introduce an opt-in Agentation feedback loop for Storybook UI refinement so we can capture exact element-level issues and accelerate small iterative fixes on `@fodmap/ui` components.

## 2. Why now

Current local state supports this workflow:

- `@fodmap/ui` has broad component coverage and a mature test surface.
- `@fodmap/storybook` has broad story coverage and is already part of CI (`storybook:build` + `storybook:test`).
- UI work is now in refinement mode (small visual/interaction issues), where structured annotation improves handoff precision.

## 3. Research Findings

### 3.1 Repository fit

- `apps/storybook` is React 19 + Storybook 10 and already imports `@fodmap/ui/styles.css` from `.storybook/preview.ts`.
- Storybook currently uses a11y addon and Playwright-backed runner in CI.
- Integration should stay in `apps/storybook` only; `packages/ui` runtime package should remain free of review tooling.

### 3.2 Agentation package facts

- Package: `agentation@2.2.1`.
- Peer requirements: React `>=18`, React DOM `>=18` (compatible with React 19).
- Main component export: `Agentation` (alias of `PageFeedbackToolbarCSS`).
- Useful props for our use case:
  - `copyToClipboard`
  - `endpoint` (optional, for MCP sync)
  - `sessionId`, `onSessionCreated`
  - event hooks (`onAnnotationAdd`, `onSubmit`, etc.)
- Default behavior supports local-first flow when `endpoint` is omitted.

### 3.3 MCP option

- Optional companion package: `agentation-mcp`.
- Useful only if we want live acknowledge/resolve loops from MCP clients.
- Can be deferred; copy/paste mode alone already improves refinement workflow.

### 3.4 Risk and compliance findings

- `agentation` and `agentation-mcp` are licensed under `PolyForm-Shield-1.0.0`.
- This is the primary non-technical blocker; we should explicitly confirm legal/product acceptance before implementation.
- If MCP is enabled later, default endpoint must remain localhost-only and opt-in to avoid accidental external data flow.

### 3.5 Storybook environment contract

- Storybook exposes env vars prefixed with `STORYBOOK_` in browser code.
- With Vite builder, `VITE_` prefixed vars are also supported.
- For this repository, use `STORYBOOK_` names to keep intent explicit and framework-neutral if builder changes later.

### 3.6 Agentation vs MCP Playwright fit

- Agentation: in-browser annotation toolbar with element-specific context; strongest fit for manual UI refinement and quick fix loops.
- MCP Playwright: browser automation/control server for agents; strongest fit for scripted validation, navigation, and reproducible interaction checks.
- Recommendation: make Agentation phase 1 for review ergonomics, then optionally add MCP Playwright-based automation scripts as phase 2 for regression sweeps.

## 4. Recommended Scope (Phase 1)

Implement **Storybook-only, opt-in, no-MCP** integration first.

### In scope

- Add `agentation` as a dev dependency in `apps/storybook`.
- Add a Storybook preview decorator that conditionally mounts `<Agentation />`.
- Gate with env flag(s), default off:
  - `STORYBOOK_ENABLE_AGENTATION` (`false` by default)
  - `STORYBOOK_AGENTATION_ENDPOINT` (optional; empty by default)
- Add short usage notes for the team in `apps/storybook` docs/changelog.

### Out of scope (Phase 1)

- No runtime dependency in `packages/ui`.
- No MCP/webhook setup in CI or shared remote environments.
- No automatic “watch mode” workflows.

## 5. Proposed Implementation Design

### 5.1 Integration point

- File: `apps/storybook/.storybook/preview.ts`
- Add a decorator that wraps `Story` output and conditionally renders `Agentation`.
- Keep existing theme decorator and a11y settings unchanged.

### 5.2 Safety defaults

- Agentation disabled by default in all Storybook environments.
- Enable only when explicitly requested in local session:
  - Example: `STORYBOOK_ENABLE_AGENTATION=true pnpm --filter @fodmap/storybook storybook`
- If endpoint is unset, component remains local-only (clipboard/localStorage flow).

### 5.3 Optional MCP path (Phase 2)

- Local-only manual flow:
  - start `agentation-mcp` server on localhost
  - set `STORYBOOK_AGENTATION_ENDPOINT=http://localhost:4747`
- No required repo-level server scripts in phase 1.

## 6. Validation Plan

Run after implementation:

1. `pnpm --filter @fodmap/storybook storybook:typecheck`
2. `pnpm --filter @fodmap/storybook storybook:build`
3. `pnpm --filter @fodmap/storybook storybook:test`
4. Manual smoke:
   - Storybook starts with Agentation disabled by default.
   - Setting `STORYBOOK_ENABLE_AGENTATION=true` shows toolbar.
   - Annotation copy output works.
   - Existing stories and keyboard interactions still work.

## 7. Risks and Mitigations

1. License risk (`PolyForm-Shield-1.0.0`)
   - Mitigation: explicit go/no-go confirmation before dependency addition.
2. Overlay interference with visual/manual QA
   - Mitigation: default-off + single env flag.
3. Accidental remote data sync via endpoint
   - Mitigation: phase 1 excludes endpoint by default; phase 2 localhost-only guidance.
4. Developer friction
   - Mitigation: keep setup one-command, optional, and documented.

## 8. Decision Gates Before Implementation

1. Confirm license acceptance for `agentation`.
2. Confirm phase-1 scope (copy/paste only, no MCP required).
3. Confirm default-off policy for all Storybook builds, including preview deploys.
4. Confirm whether MCP Playwright automation is desired in the same initiative or deferred to a follow-up worktree.

## 9. Expected Change Set (Phase 1)

- `apps/storybook/package.json`
- `apps/storybook/.storybook/preview.ts`
- `apps/storybook/CHANGELOG.md` (or a dedicated short usage note file)
