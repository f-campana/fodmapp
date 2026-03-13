# @fodmap/storybook

## Unreleased

### Internal

- Add optional local-only Agentation integration for Storybook UI refinement.

  Enable with:
  `STORYBOOK_ENABLE_AGENTATION=true pnpm --filter @fodmap/storybook storybook`

  Default behavior remains disabled unless the flag is explicitly set.

## 0.1.26

### Patch Changes

- [#185](https://github.com/f-campana/fodmapp/pull/185) [`d1014e3`](https://github.com/f-campana/fodmapp/commit/d1014e384c3c5237332af28c9a72564fd36febfc) Thanks [@f-campana](https://github.com/f-campana)! - Reorganize `@fodmap/ui` implementation files into lane folders (`adapter`, `foundation`, `composed`, `utilities`) while keeping public exports stable, and align Storybook taxonomy validation/docs with the new implementation layout contract.

- Updated dependencies [[`d1014e3`](https://github.com/f-campana/fodmapp/commit/d1014e384c3c5237332af28c9a72564fd36febfc)]:
  - @fodmap/ui@3.13.2

## 0.1.25

### Patch Changes

- [#180](https://github.com/f-campana/fodmapp/pull/180) [`8c80992`](https://github.com/f-campana/fodmapp/commit/8c8099252642b5e98eb89c3d7e7e11558996173e) Thanks [@f-campana](https://github.com/f-campana)! - Harden Storybook component taxonomy by introducing explicit adapter/foundation/composed/utility title lanes, adding missing utility stories, and enforcing title/component mapping consistency through a CI-checked taxonomy validator.

## 0.1.24

### Patch Changes

- [#171](https://github.com/f-campana/Fodmap/pull/171) [`630b4ba`](https://github.com/f-campana/Fodmap/commit/630b4ba6e1854ae7f87d3b604f6f93e9776f6097) Thanks [@f-campana](https://github.com/f-campana)! - Add missing brand light color tokens and semantic light remaps, enforce base brand light/dark parity during token generation, and extend Storybook foundations coverage/documentation for semantic non-color tokens.

- [#173](https://github.com/f-campana/Fodmap/pull/173) [`0f508e8`](https://github.com/f-campana/Fodmap/commit/0f508e8a3bed6eece8bb9b7042c0159d8161d538) Thanks [@f-campana](https://github.com/f-campana)! - Refactor foundations stories into modular data/reference/showcase/play files, split token documentation styles into domain CSS partials, and remove dead foundations helper exports/selectors while preserving behavior.

- [#172](https://github.com/f-campana/Fodmap/pull/172) [`2fd8c29`](https://github.com/f-campana/Fodmap/commit/2fd8c2913e03b56ec2ae3ec953e4c429843243eb) Thanks [@f-campana](https://github.com/f-campana)! - Refactor foundations color stories into separated data/reference/showcase/play modules and migrate color to shared row builders, shared class name utility, and shared accordion group state hook.

- Updated dependencies [[`630b4ba`](https://github.com/f-campana/Fodmap/commit/630b4ba6e1854ae7f87d3b604f6f93e9776f6097)]:
  - @fodmap/design-tokens@0.3.0
  - @fodmap/reporting@0.1.8
  - @fodmap/ui@3.13.1

## 0.1.23

### Patch Changes

- [#169](https://github.com/f-campana/Fodmap/pull/169) [`570a2b8`](https://github.com/f-campana/Fodmap/commit/570a2b8456b2cf4593cfdab14efd8311edec6133) Thanks [@f-campana](https://github.com/f-campana)! - Add the composed `DatePicker` primitive and Sonner-backed `Toast` helper API, including tests, Storybook coverage, and contract-check updates.

- Updated dependencies [[`570a2b8`](https://github.com/f-campana/Fodmap/commit/570a2b8456b2cf4593cfdab14efd8311edec6133)]:
  - @fodmap/ui@3.13.0

## 0.1.22

### Patch Changes

- [#167](https://github.com/f-campana/Fodmap/pull/167) [`4b6c99e`](https://github.com/f-campana/Fodmap/commit/4b6c99eff3cdc1fa3a01040f6f625873b4b7f036) Thanks [@f-campana](https://github.com/f-campana)! - Add reference-gate Combobox primitives (`Combobox` and `ComboboxMulti`) with compound slots, tests, and Storybook coverage.

- [#163](https://github.com/f-campana/Fodmap/pull/163) [`97111e2`](https://github.com/f-campana/Fodmap/commit/97111e218b14ad5caf8285f08a2c7916ea44c538) Thanks [@f-campana](https://github.com/f-campana)! - feat(ui): add command reference primitive with tests and Storybook stories.

- [#165](https://github.com/f-campana/Fodmap/pull/165) [`d677f5f`](https://github.com/f-campana/Fodmap/commit/d677f5f24cb17d6c2129bc3ac68eee5214701357) Thanks [@f-campana](https://github.com/f-campana)! - feat(ui): add batch F external primitives (calendar carousel drawer resizable sonner).

- Updated dependencies [[`4b6c99e`](https://github.com/f-campana/Fodmap/commit/4b6c99eff3cdc1fa3a01040f6f625873b4b7f036), [`97111e2`](https://github.com/f-campana/Fodmap/commit/97111e218b14ad5caf8285f08a2c7916ea44c538), [`d677f5f`](https://github.com/f-campana/Fodmap/commit/d677f5f24cb17d6c2129bc3ac68eee5214701357)]:
  - @fodmap/ui@3.12.0

## 0.1.21

### Patch Changes

- [#161](https://github.com/f-campana/Fodmap/pull/161) [`26f89e7`](https://github.com/f-campana/Fodmap/commit/26f89e713cabfb3a4a6715f75ed1b95860a8d4db) Thanks [@f-campana](https://github.com/f-campana)! - Add batch E forms primitives in `@fodmap/ui`: `Accordion`, `InputGroup`, and `InputOTP` with full compound exports and semantic style contracts.

  Add Storybook coverage and interaction assertions for the new form primitives in `@fodmap/storybook`.

- Updated dependencies [[`26f89e7`](https://github.com/f-campana/Fodmap/commit/26f89e713cabfb3a4a6715f75ed1b95860a8d4db)]:
  - @fodmap/ui@3.11.0

## 0.1.20

### Patch Changes

- [#159](https://github.com/f-campana/Fodmap/pull/159) [`3038044`](https://github.com/f-campana/Fodmap/commit/30380442388ac8f46cdd13ff97266a2bf6313507) Thanks [@f-campana](https://github.com/f-campana)! - Add the reference-gate Select primitive to `@fodmap/ui` with full shadcn-parity surface, tests, and Storybook coverage.

- Updated dependencies [[`3038044`](https://github.com/f-campana/Fodmap/commit/30380442388ac8f46cdd13ff97266a2bf6313507)]:
  - @fodmap/ui@3.10.0

## 0.1.19

### Patch Changes

- [#157](https://github.com/f-campana/Fodmap/pull/157) [`d90543c`](https://github.com/f-campana/Fodmap/commit/d90543c9ccbbfddc42fa60748c21746c2e5af474) Thanks [@f-campana](https://github.com/f-campana)! - Add the Batch D menu primitives: ContextMenu, Menubar, and NavigationMenu.
  This release includes full component surfaces, tests, Storybook stories, and style contract checks.
- Updated dependencies [[`d90543c`](https://github.com/f-campana/Fodmap/commit/d90543c9ccbbfddc42fa60748c21746c2e5af474)]:
  - @fodmap/ui@3.9.0

## 0.1.18

### Patch Changes

- [#155](https://github.com/f-campana/Fodmap/pull/155) [`4452a07`](https://github.com/f-campana/Fodmap/commit/4452a07e881e5b89902e4a786a5c8162f5a97c7e) Thanks [@f-campana](https://github.com/f-campana)! - Add DropdownMenu reference primitive with full shadcn-parity compound surface,
  unit tests, and Storybook stories for the Batch D reference gate rollout.
- Updated dependencies [[`4452a07`](https://github.com/f-campana/Fodmap/commit/4452a07e881e5b89902e4a786a5c8162f5a97c7e)]:
  - @fodmap/ui@3.8.0

## 0.1.17

### Patch Changes

- [#153](https://github.com/f-campana/Fodmap/pull/153) [`45c9849`](https://github.com/f-campana/Fodmap/commit/45c98496d4cf902c6652760ed7933dc19303de6b) Thanks [@f-campana](https://github.com/f-campana)! - Add batch C overlay primitives: AlertDialog, Sheet, Popover, and HoverCard.

- Updated dependencies [[`45c9849`](https://github.com/f-campana/Fodmap/commit/45c98496d4cf902c6652760ed7933dc19303de6b)]:
  - @fodmap/ui@3.7.0

## 0.1.16

### Patch Changes

- [#151](https://github.com/f-campana/Fodmap/pull/151) [`3a21931`](https://github.com/f-campana/Fodmap/commit/3a21931680f8a9e0d7cdc71f8a7ccc9d9d7e17bb) Thanks [@f-campana](https://github.com/f-campana)! - Add the Dialog reference primitive set (Dialog root, trigger, portal, overlay, content, close, header/body/footer, title, description) with unit tests, Storybook coverage, and contract checks.

- Updated dependencies [[`3a21931`](https://github.com/f-campana/Fodmap/commit/3a21931680f8a9e0d7cdc71f8a7ccc9d9d7e17bb)]:
  - @fodmap/ui@3.6.0

## 0.1.15

### Patch Changes

- [#149](https://github.com/f-campana/Fodmap/pull/149) [`53d85d5`](https://github.com/f-campana/Fodmap/commit/53d85d527e8b34fbbe86266419ad1133dcf2c9c4) Thanks [@f-campana](https://github.com/f-campana)! - Add batch B Radix wrappers set 2 (`Collapsible`, `ScrollArea`, `Slider`, `Tabs`, `Toggle`, `ToggleGroup`, `Tooltip`) with tests and Storybook coverage.

- Updated dependencies [[`53d85d5`](https://github.com/f-campana/Fodmap/commit/53d85d527e8b34fbbe86266419ad1133dcf2c9c4)]:
  - @fodmap/ui@3.5.0

## 0.1.14

### Patch Changes

- [#147](https://github.com/f-campana/Fodmap/pull/147) [`c4ee358`](https://github.com/f-campana/Fodmap/commit/c4ee358e1f9658c75d5438da38466c129832d7d3) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch B Radix wrappers set 1 to `@fodmap/ui`: `AspectRatio`, `Avatar`, `Label`, `Separator`, `Progress`, `Checkbox`, `Switch`, and `RadioGroup`, with tests and Storybook coverage.

- Updated dependencies [[`c4ee358`](https://github.com/f-campana/Fodmap/commit/c4ee358e1f9658c75d5438da38466c129832d7d3)]:
  - @fodmap/ui@3.4.0

## 0.1.13

### Patch Changes

- [#145](https://github.com/f-campana/Fodmap/pull/145) [`2b7105a`](https://github.com/f-campana/Fodmap/commit/2b7105a767df8c673e62298a4d4f53834aa3b826) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch A custom primitives for `@fodmap/ui`: `Stepper`, `Callout`, `Dot`, `Chip`, and `ScoreBar` with full tests and Storybook coverage.

  Also update Storybook primitives docs and operational worktree tracking for the batch transition.

- [#144](https://github.com/f-campana/Fodmap/pull/144) [`15a192b`](https://github.com/f-campana/Fodmap/commit/15a192be2d16a1cc90f38261259f64bf1f9c3b84) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch A primitives set 2 for `@fodmap/ui`: Button Group, Empty, Item, Native Select, Pagination, Table, and Textarea with full tests and Storybook coverage.

  Also improve Skeleton story visibility in Storybook using a contrasted preview surface while keeping the Skeleton component contract unchanged.

- Updated dependencies [[`2b7105a`](https://github.com/f-campana/Fodmap/commit/2b7105a767df8c673e62298a4d4f53834aa3b826), [`15a192b`](https://github.com/f-campana/Fodmap/commit/15a192be2d16a1cc90f38261259f64bf1f9c3b84)]:
  - @fodmap/ui@3.3.0

## 0.1.12

### Patch Changes

- [#142](https://github.com/f-campana/Fodmap/pull/142) [`ea84a38`](https://github.com/f-campana/Fodmap/commit/ea84a3894c8ab0dd2e623e2ee9cfffb4351317e6) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch A primitives set 1 to `@fodmap/ui` (`Alert`, `Breadcrumb`, `Kbd`,
  `Skeleton`, `Spinner`, `Typography`) with full tests, stories, and public
  exports, plus Storybook docs parity updates for the new primitives.
- Updated dependencies [[`ea84a38`](https://github.com/f-campana/Fodmap/commit/ea84a3894c8ab0dd2e623e2ee9cfffb4351317e6)]:
  - @fodmap/ui@3.2.0

## 0.1.11

### Patch Changes

- [#140](https://github.com/f-campana/Fodmap/pull/140) [`ccc8e7d`](https://github.com/f-campana/Fodmap/commit/ccc8e7d7c56fd80365cec22d133b7414382aab26) Thanks [@f-campana](https://github.com/f-campana)! - Align primitive stories (`Badge`, `Card`, `Field`, `Input`) with the Button
  storybook contract by adding complete `argTypes` metadata, expanded controls,
  and stronger semantic/token/data-slot play assertions.

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
