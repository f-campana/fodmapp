# @fodmap/ui

## 3.3.0

### Minor Changes

- [#145](https://github.com/f-campana/Fodmap/pull/145) [`2b7105a`](https://github.com/f-campana/Fodmap/commit/2b7105a767df8c673e62298a4d4f53834aa3b826) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch A custom primitives for `@fodmap/ui`: `Stepper`, `Callout`, `Dot`, `Chip`, and `ScoreBar` with full tests and Storybook coverage.

  Also update Storybook primitives docs and operational worktree tracking for the batch transition.

- [#144](https://github.com/f-campana/Fodmap/pull/144) [`15a192b`](https://github.com/f-campana/Fodmap/commit/15a192be2d16a1cc90f38261259f64bf1f9c3b84) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch A primitives set 2 for `@fodmap/ui`: Button Group, Empty, Item, Native Select, Pagination, Table, and Textarea with full tests and Storybook coverage.

  Also improve Skeleton story visibility in Storybook using a contrasted preview surface while keeping the Skeleton component contract unchanged.

## 3.2.0

### Minor Changes

- [#142](https://github.com/f-campana/Fodmap/pull/142) [`ea84a38`](https://github.com/f-campana/Fodmap/commit/ea84a3894c8ab0dd2e623e2ee9cfffb4351317e6) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch A primitives set 1 to `@fodmap/ui` (`Alert`, `Breadcrumb`, `Kbd`,
  `Skeleton`, `Spinner`, `Typography`) with full tests, stories, and public
  exports, plus Storybook docs parity updates for the new primitives.

## 3.1.0

### Minor Changes

- [#138](https://github.com/f-campana/Fodmap/pull/138) [`82583ee`](https://github.com/f-campana/Fodmap/commit/82583eeffc3f00491aa58697332542caa16dfe67) Thanks [@f-campana](https://github.com/f-campana)! - PR-01 foundation rollout for the UI library contract:
  - migrate existing `@fodmap/ui` primitives to React 19 named-function pattern (no `forwardRef`, no explicit `displayName`) and add missing `data-slot` hooks
  - add shared utilities (`Portal`, `VisuallyHidden`) and core hooks (`useControllableState`, `useMediaQuery`, `useMobile`, `useDebounce`, `useCopyToClipboard`, `useLocale`) with tests and public exports
  - harden style/source contract checks to enforce token/focus conventions and ban forbidden patterns
  - update Storybook stories and workspace dependencies to align with the new foundation contract

## 3.0.0

### Major Changes

- [#134](https://github.com/f-campana/Fodmap/pull/134) [`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0) Thanks [@f-campana](https://github.com/f-campana)! - Expand the semantic color contract (validation, outline/ghost actions, status subtle, and data roles), migrate UI primitives to strict token-only classes, and adopt reporting/app/research updates to remove remaining hardcoded/alpha color patterns.

### Patch Changes

- Updated dependencies [[`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0)]:
  - @fodmap/tailwind-config@0.2.4

## 2.0.0

### Major Changes

- [#127](https://github.com/f-campana/Fodmap/pull/127) [`77c73ce`](https://github.com/f-campana/Fodmap/commit/77c73cef2ecd1959dd71d0b2cdf39378e1231e6b) Thanks [@f-campana](https://github.com/f-campana)! - Refresh the shared `Button` primitive with new variant/size behavior, Tailwind v4 canonical classes, and improved focus handling (`outline-hidden`).

  `ButtonProps` is no longer exported from package entrypoints; consume button prop types from `React.ComponentProps<typeof Button>` instead.

  Update Storybook button stories and interaction checks to reflect the new button contract.

## 1.0.4

### Patch Changes

- [#97](https://github.com/f-campana/Fodmap/pull/97) [`1779d31`](https://github.com/f-campana/Fodmap/commit/1779d31fe4a036dc325a89964400512ad1f7f388) Thanks [@f-campana](https://github.com/f-campana)! - Migrate scientific SVG rendering colors to semantic/reporting CSS variables, keep deterministic theme fallbacks in reporting styles, add a regression check that blocks raw hex literals in the scientific renderer, and align the UI style contract with the accessible focus-ring selector.

## 1.0.3

### Patch Changes

- [#96](https://github.com/f-campana/Fodmap/pull/96) [`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852) Thanks [@f-campana](https://github.com/f-campana)! - Add accessible control color roles and runtime slots (`focus.ringAccessible` and `border.control`), enforce semantic parity and contrast guardrails in token generation, migrate shared primitives to the new focus ring slot, and extend Storybook token/runtime assertions for the updated contract.

- Updated dependencies [[`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852)]:
  - @fodmap/tailwind-config@0.2.3

## 1.0.2

### Patch Changes

- Updated dependencies []:
  - @fodmap/tailwind-config@0.2.2

## 1.0.1

### Patch Changes

- Updated dependencies []:
  - @fodmap/tailwind-config@0.2.1

## 1.0.0

### Major Changes

- 7528be8: Migrate wave-1 UI primitives to shadcn source components and align shared token mappings.
  - replace `Button`, `Input`, `Badge`, and `Card` internals with shadcn-style source components
  - adopt shadcn-native public APIs for migrated primitives (breaking for `@fodmap/ui`)
  - add shadcn-compatible Tailwind token slots in `@fodmap/tailwind-config`
  - improve light-theme status contrast for info/success semantic tokens in `@fodmap/design-tokens`

### Minor Changes

- 7528be8: Introduce shared design tokens and Tailwind adapter packages, and rewire `@fodmap/ui` to consume the shared token contract.
  - add `@fodmap/design-tokens` with generated CSS/JSON/JS token artifacts
  - add `@fodmap/tailwind-config` as a thin Tailwind v4 adapter
  - switch Storybook and UI styling to system-default theme behavior with explicit light/dark overrides

### Patch Changes

- 412419b: Add governance and contributor-facing updates that enforce changeset requirements for package/app changes, including:
  - PR validation gate to fail package/app changes without an accompanying `.changeset` file.
  - Release automation workflow to generate versioning PRs from queued changesets.
  - Contributor checklist and workspace-local quality gate hardening for release preparation.

- Updated dependencies [7528be8]
- Updated dependencies [7528be8]
  - @fodmap/tailwind-config@0.2.0
