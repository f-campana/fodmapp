# @fodmap/storybook

## 0.1.10

### Patch Changes

- [#138](https://github.com/f-campana/Fodmap/pull/138) [`82583ee`](https://github.com/f-campana/Fodmap/commit/82583eeffc3f00491aa58697332542caa16dfe67) Thanks [@f-campana](https://github.com/f-campana)! - PR-01 foundation rollout for the UI library contract:
  - migrate existing `@fodmap/ui` primitives to React 19 named-function pattern (no `forwardRef`, no explicit `displayName`) and add missing `data-slot` hooks
  - add shared utilities (`Portal`, `VisuallyHidden`) and core hooks (`useControllableState`, `useMediaQuery`, `useMobile`, `useDebounce`, `useCopyToClipboard`, `useLocale`) with tests and public exports
  - harden style/source contract checks to enforce token/focus conventions and ban forbidden patterns
  - update Storybook stories and workspace dependencies to align with the new foundation contract

- Updated dependencies [[`82583ee`](https://github.com/f-campana/Fodmap/commit/82583eeffc3f00491aa58697332542caa16dfe67)]:
  - @fodmap/ui@3.1.0

## 0.1.9

### Patch Changes

- [#134](https://github.com/f-campana/Fodmap/pull/134) [`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0) Thanks [@f-campana](https://github.com/f-campana)! - Expand the semantic color contract (validation, outline/ghost actions, status subtle, and data roles), migrate UI primitives to strict token-only classes, and adopt reporting/app/research updates to remove remaining hardcoded/alpha color patterns.

- Updated dependencies [[`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0)]:
  - @fodmap/design-tokens@0.2.4
  - @fodmap/ui@3.0.0
  - @fodmap/reporting@0.1.7

## 0.1.8

### Patch Changes

- [#127](https://github.com/f-campana/Fodmap/pull/127) [`77c73ce`](https://github.com/f-campana/Fodmap/commit/77c73cef2ecd1959dd71d0b2cdf39378e1231e6b) Thanks [@f-campana](https://github.com/f-campana)! - Refresh the shared `Button` primitive with new variant/size behavior, Tailwind v4 canonical classes, and improved focus handling (`outline-hidden`).

  `ButtonProps` is no longer exported from package entrypoints; consume button prop types from `React.ComponentProps<typeof Button>` instead.

  Update Storybook button stories and interaction checks to reflect the new button contract.

- Updated dependencies [[`77c73ce`](https://github.com/f-campana/Fodmap/commit/77c73cef2ecd1959dd71d0b2cdf39378e1231e6b)]:
  - @fodmap/ui@2.0.0

## 0.1.7

### Patch Changes

- [#104](https://github.com/f-campana/Fodmap/pull/104) [`e072c1c`](https://github.com/f-campana/Fodmap/commit/e072c1c75eff6126b42314bbfee05c523357aa40) Thanks [@f-campana](https://github.com/f-campana)! - Finalize Phase 4 reporting delivery hardening:
  - load deterministic stage contract snapshots for reporting full-lane extraction
  - harden now-set collector semantics and fixture hash provenance checks
  - align reporting render CLI logging with lint rules
  - refresh reporting and storybook/research reporting integration sources after lint/format convergence

- Updated dependencies [[`e072c1c`](https://github.com/f-campana/Fodmap/commit/e072c1c75eff6126b42314bbfee05c523357aa40)]:
  - @fodmap/reporting@0.1.6

## 0.1.6

### Patch Changes

- Updated dependencies [[`1779d31`](https://github.com/f-campana/Fodmap/commit/1779d31fe4a036dc325a89964400512ad1f7f388)]:
  - @fodmap/reporting@0.1.5
  - @fodmap/ui@1.0.4

## 0.1.5

### Patch Changes

- [#96](https://github.com/f-campana/Fodmap/pull/96) [`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852) Thanks [@f-campana](https://github.com/f-campana)! - Add accessible control color roles and runtime slots (`focus.ringAccessible` and `border.control`), enforce semantic parity and contrast guardrails in token generation, migrate shared primitives to the new focus ring slot, and extend Storybook token/runtime assertions for the updated contract.

- Updated dependencies [[`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852)]:
  - @fodmap/design-tokens@0.2.3
  - @fodmap/ui@1.0.3
  - @fodmap/reporting@0.1.4

## 0.1.4

### Patch Changes

- Updated dependencies [[`b3bd589`](https://github.com/f-campana/Fodmap/commit/b3bd58900fe16c3c2432b8f43136db03bffd1403)]:
  - @fodmap/design-tokens@0.2.2
  - @fodmap/reporting@0.1.3
  - @fodmap/ui@1.0.2

## 0.1.3

### Patch Changes

- Updated dependencies [[`f9bcf60`](https://github.com/f-campana/Fodmap/commit/f9bcf60c668f1b27b240ccd5bc0aa8687a0eca52)]:
  - @fodmap/design-tokens@0.2.1
  - @fodmap/reporting@0.1.2
  - @fodmap/ui@1.0.1

## 0.1.2

### Patch Changes

- [#78](https://github.com/f-campana/Fodmap/pull/78) [`fb83339`](https://github.com/f-campana/Fodmap/commit/fb83339941df16335dcd8d38e3d141c40f78e284) Thanks [@f-campana](https://github.com/f-campana)! - chore: harden changeset governance gate and use GitHub changelog plugin for Changesets

## 0.1.1

### Patch Changes

- Updated dependencies [a1efeb5]
- Updated dependencies [7528be8]
- Updated dependencies [7528be8]
- Updated dependencies [412419b]
  - @fodmap/design-tokens@0.2.0
  - @fodmap/ui@1.0.0
  - @fodmap/reporting@0.1.1
