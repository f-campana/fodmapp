# @fodmapp/reporting

## 0.1.9

### Patch Changes

- [#321](https://github.com/f-campana/fodmapp/pull/321) [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade) Thanks [@dependabot](https://github.com/apps/dependabot)! - Align the build-tooling workspace with TypeScript 6 by adding DTS compiler overrides for the affected packages and updating the workspace dependency set.

- [#241](https://github.com/f-campana/fodmapp/pull/241) [`0d7a072`](https://github.com/f-campana/fodmapp/commit/0d7a07269c88f0c78563000dc607292167b4b147) Thanks [@f-campana](https://github.com/f-campana)! - Refactor the shared UI and reporting package surfaces for better tree shaking, move consumers to leaf imports, split UI CSS into app and full-library entry points, and add local bundle analysis tooling for the app, Storybook, and static sites.

- [#238](https://github.com/f-campana/fodmapp/pull/238) [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a) Thanks [@f-campana](https://github.com/f-campana)! - Rename the internal workspace package scope from `@fodmap/*` to `@fodmapp/*` and align tooling, docs, and release metadata with the settled project name.

- Updated dependencies [[`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a)]:
  - @fodmapp/design-tokens@0.3.1

## 0.1.8

### Patch Changes

- Updated dependencies [[`630b4ba`](https://github.com/f-campana/Fodmap/commit/630b4ba6e1854ae7f87d3b604f6f93e9776f6097)]:
  - @fodmap/design-tokens@0.3.0

## 0.1.7

### Patch Changes

- [#134](https://github.com/f-campana/Fodmap/pull/134) [`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0) Thanks [@f-campana](https://github.com/f-campana)! - Expand the semantic color contract (validation, outline/ghost actions, status subtle, and data roles), migrate UI primitives to strict token-only classes, and adopt reporting/app/research updates to remove remaining hardcoded/alpha color patterns.

- Updated dependencies [[`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0)]:
  - @fodmap/design-tokens@0.2.4

## 0.1.6

### Patch Changes

- [#104](https://github.com/f-campana/Fodmap/pull/104) [`e072c1c`](https://github.com/f-campana/Fodmap/commit/e072c1c75eff6126b42314bbfee05c523357aa40) Thanks [@f-campana](https://github.com/f-campana)! - Finalize Phase 4 reporting delivery hardening:
  - load deterministic stage contract snapshots for reporting full-lane extraction
  - harden now-set collector semantics and fixture hash provenance checks
  - align reporting render CLI logging with lint rules
  - refresh reporting and storybook/research reporting integration sources after lint/format convergence

## 0.1.5

### Patch Changes

- [#97](https://github.com/f-campana/Fodmap/pull/97) [`1779d31`](https://github.com/f-campana/Fodmap/commit/1779d31fe4a036dc325a89964400512ad1f7f388) Thanks [@f-campana](https://github.com/f-campana)! - Migrate scientific SVG rendering colors to semantic/reporting CSS variables, keep deterministic theme fallbacks in reporting styles, add a regression check that blocks raw hex literals in the scientific renderer, and align the UI style contract with the accessible focus-ring selector.

## 0.1.4

### Patch Changes

- Updated dependencies [[`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852)]:
  - @fodmap/design-tokens@0.2.3

## 0.1.3

### Patch Changes

- Updated dependencies [[`b3bd589`](https://github.com/f-campana/Fodmap/commit/b3bd58900fe16c3c2432b8f43136db03bffd1403)]:
  - @fodmap/design-tokens@0.2.2

## 0.1.2

### Patch Changes

- Updated dependencies [[`f9bcf60`](https://github.com/f-campana/Fodmap/commit/f9bcf60c668f1b27b240ccd5bc0aa8687a0eca52)]:
  - @fodmap/design-tokens@0.2.1

## 0.1.1

### Patch Changes

- Updated dependencies [a1efeb5]
- Updated dependencies [7528be8]
- Updated dependencies [7528be8]
  - @fodmap/design-tokens@0.2.0
