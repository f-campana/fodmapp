# Foundations Storybook Review Findings

Date: 2026-02-24
Scope: `apps/storybook/stories/foundations/*`
Reviewer: Codex

## Context
This review covers implementation quality across:
- shared foundations rendering layer (`token-docs.components.tsx`, `token-docs.css`, `token-docs.helpers.ts`)
- foundation stories (`color`, `typography`, `motion-effects`, `spacing-layout`)
- behavior and play-test coverage currently present in story files

The intent is to preserve current visual direction while identifying correctness, accessibility, reliability, and maintainability gaps that should be resolved in a follow-up session.

## Findings Summary
- P1: 1
- P2: 2
- P3: 2

## Detailed Findings

### [P1] Desktop copy actions are effectively keyboard-inaccessible
Severity: High

Evidence:
- `fd-tokendocs-copy` is hidden with `visibility: hidden`, `width: 0`, and `pointer-events: none` by default.
- Reveal state is driven by hover/focus-within on cell wrappers.
- In desktop rows, there is no guaranteed focusable element that can create `focus-within` before reaching the copy button itself.

References:
- `apps/storybook/stories/foundations/token-docs.css:451`
- `apps/storybook/stories/foundations/token-docs.css:469`
- `apps/storybook/stories/foundations/token-docs.css:494`
- `apps/storybook/stories/foundations/token-docs.components.tsx:138`

Risk:
- Keyboard users may not discover or access copy controls reliably.
- Accessibility regression despite acceptable mouse/touch behavior.

Recommendation:
- Keep copy controls in the tab order while visually hidden (opacity/transform only, avoid `visibility: hidden`).
- Reveal on row/cell `:focus-within` and on button `:focus-visible`.
- Add a keyboard play-test that tabs to a copy button and asserts interactive state.

---

### [P2] Jump-link scrolling can race when users click multiple jump chips quickly
Severity: Medium

Evidence:
- Each jump click starts an independent requestAnimationFrame settle loop.
- There is no cancellation or staleness guard for older loops.

References:
- `apps/storybook/stories/foundations/color.stories.tsx:338`
- `apps/storybook/stories/foundations/color.stories.tsx:354`
- `apps/storybook/stories/foundations/color.stories.tsx:374`

Risk:
- Older loop can complete after a newer click and scroll to wrong section.
- Perceived instability in navigation.

Recommendation:
- Introduce a monotonic request token/ref for jump actions.
- Ignore/cancel stale RAF callbacks when a newer jump request exists.
- Add interaction test with rapid sequential jump clicks and deterministic final target assertion.

---

### [P2] Jump scrolling ignores reduced-motion preference
Severity: Medium

Evidence:
- Jump uses `scrollIntoView({ behavior: "smooth" })` unconditionally.

Reference:
- `apps/storybook/stories/foundations/color.stories.tsx:370`

Risk:
- Violates user accessibility settings (`prefers-reduced-motion: reduce`).

Recommendation:
- Use `window.matchMedia("(prefers-reduced-motion: reduce)")`.
- Choose `behavior: "auto"` when reduced motion is requested.

---

### [P3] Mount-time forced scroll reset is broad and can override valid navigation state
Severity: Low-Medium

Evidence:
- `useTokenDocsResetScrollOnMount()` always calls `window.scrollTo({ top: 0 })` on mount.
- Hook is applied in all reference stories.

References:
- `apps/storybook/stories/foundations/token-docs.components.tsx:34`
- `apps/storybook/stories/foundations/color.stories.tsx:604`
- `apps/storybook/stories/foundations/typography.stories.tsx:240`
- `apps/storybook/stories/foundations/motion-effects.stories.tsx:370`
- `apps/storybook/stories/foundations/spacing-layout.stories.tsx:294`

Risk:
- Overrides browser/Storybook restoration or hash/deep-link intent.
- Can feel "jumpy" for history navigation.

Recommendation:
- Gate this behavior (for example: only when no hash and no explicit restore context).
- Prefer one-time per story-visit logic rather than unconditional mount behavior.

---

### [P3] Play-tests are still missing key behavior and accessibility assertions
Severity: Low-Medium

Evidence:
- Current tests focus on structural presence and expanded/collapsed state.
- No explicit assertions for:
  - keyboard copy accessibility flow
  - reduced-motion branch behavior
  - jump-scroll final viewport placement determinism

References:
- `apps/storybook/stories/foundations/color.stories.tsx:748`
- `apps/storybook/stories/foundations/spacing-layout.stories.tsx:390`
- `apps/storybook/stories/foundations/motion-effects.stories.tsx:464`
- `apps/storybook/stories/foundations/typography.stories.tsx:287`

Risk:
- Regressions can pass CI until they become visible in manual QA.

Recommendation:
- Expand play-tests with focused interaction checks for keyboard and scrolling behavior.
- Keep assertions deterministic (avoid timing-fragile opacity checks unless polled with tolerances).

## Recommended Resolution Order
1. Fix P1 keyboard access for copy controls.
2. Add jump-request cancellation/staleness handling.
3. Add reduced-motion-compliant jump behavior.
4. Narrow scope of mount scroll reset.
5. Add targeted tests for the above.

## Acceptance Criteria For Follow-Up Session
- Copy actions are reachable and usable via keyboard on desktop.
- Rapid jump-link clicking always lands on the last requested target.
- Jump behavior honors reduced-motion preferences.
- Reference stories do not auto-scroll unexpectedly while still avoiding first-render drift.
- Play-tests cover keyboard copy path and jump determinism.

