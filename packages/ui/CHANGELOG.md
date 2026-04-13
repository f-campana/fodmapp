# @fodmapp/ui

## 3.13.3

### Patch Changes

- [#224](https://github.com/f-campana/fodmapp/pull/224) [`13e0cb8`](https://github.com/f-campana/fodmapp/commit/13e0cb8bbcf31bcb53dda1edc73e2898831f6e4e) Thanks [@f-campana](https://github.com/f-campana)! - Harden the Batch G form composites by tightening Calendar, DatePicker, InputOTP, Field, and InputGroup contracts, migrating their stories into the nested Storybook structure, and adding curated docs plus stronger interaction and accessibility coverage.

- [#239](https://github.com/f-campana/fodmapp/pull/239) [`6efb34b`](https://github.com/f-campana/fodmapp/commit/6efb34b21aee2c2fffadd09027da12cd38ebbf7c) Thanks [@f-campana](https://github.com/f-campana)! - Add the first live app product slice for foods, swaps, and safe-harbor browsing, and split `@fodmapp/ui` into explicit server and client entrypoints for App Router-safe consumption.

- [#226](https://github.com/f-campana/fodmapp/pull/226) [`0a7f8fa`](https://github.com/f-campana/fodmapp/commit/0a7f8faa21cdcd0e69f2ddd7b57c01fb7050845a) Thanks [@f-campana](https://github.com/f-campana)! - Remediate the Batch J foundation input and action primitives by hardening button and native select styling contracts, strengthening button group docs and tests, and tightening the input and native select Storybook guidance.

- [#222](https://github.com/f-campana/fodmapp/pull/222) [`6f0857e`](https://github.com/f-campana/fodmapp/commit/6f0857e89e7a713eebc8c0479272fc40b54e57f9) Thanks [@f-campana](https://github.com/f-campana)! - Align the light primitive and utility Storybook/test surface by migrating AspectRatio, Avatar, Label, Separator, Portal, and VisuallyHidden into the nested story structure and tightening their low-complexity contract tests.

- [#321](https://github.com/f-campana/fodmapp/pull/321) [`233b84a`](https://github.com/f-campana/fodmapp/commit/233b84a997bf59cf341d5d1da0d7093b95d72ade) Thanks [@dependabot](https://github.com/apps/dependabot)! - Align the build-tooling workspace with TypeScript 6 by adding DTS compiler overrides for the affected packages and updating the workspace dependency set.

- [#352](https://github.com/f-campana/fodmapp/pull/352) [`789358c`](https://github.com/f-campana/fodmapp/commit/789358c5d88008d5474b1ea8dd1fb41d9083c2d4) Thanks [@f-campana](https://github.com/f-campana)! - Stabilize the web app's public and account surfaces by fixing shared card/button rendering issues, clarifying runtime-auth deployment failures, and improving catalog fallback trust states.

- [#223](https://github.com/f-campana/fodmapp/pull/223) [`0ecfdc2`](https://github.com/f-campana/fodmapp/commit/0ecfdc2806da4445f7ef69b9119ab2ec60aef026) Thanks [@f-campana](https://github.com/f-campana)! - Upgrade the Batch H feedback composites by refining Command and Carousel contracts, migrating Command, Toast, Sonner, and Carousel into nested Storybook stories, and adding truthful docs plus stronger interaction and accessibility coverage.

- [#219](https://github.com/f-campana/fodmapp/pull/219) [`3b13957`](https://github.com/f-campana/fodmapp/commit/3b13957832be7d9637caa21f5d4e474bc9b2dc4d) Thanks [@f-campana](https://github.com/f-campana)! - Harden the Batch F state-control adapters and Storybook coverage by stabilizing slot hooks, adding alert-dialog portal mounting support, fixing slider accessible labeling and disabled styling, and tightening tests/docs for alert-dialog, slider, switch, toggle, and toggle-group.

- [#227](https://github.com/f-campana/fodmapp/pull/227) [`c8564dd`](https://github.com/f-campana/fodmapp/commit/c8564dd2c7e251274775102796b6ee158b1c4975) Thanks [@f-campana](https://github.com/f-campana)! - Harden the Batch L foundation navigation and status components by tightening semantics, aligning loading and score contracts, migrating stories into the nested Storybook structure, and expanding responsive and accessibility coverage.

- [#241](https://github.com/f-campana/fodmapp/pull/241) [`0d7a072`](https://github.com/f-campana/fodmapp/commit/0d7a07269c88f0c78563000dc607292167b4b147) Thanks [@f-campana](https://github.com/f-campana)! - Refactor the shared UI and reporting package surfaces for better tree shaking, move consumers to leaf imports, split UI CSS into app and full-library entry points, and add local bundle analysis tooling for the app, Storybook, and static sites.

- [#238](https://github.com/f-campana/fodmapp/pull/238) [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a) Thanks [@f-campana](https://github.com/f-campana)! - Rename the internal workspace package scope from `@fodmap/*` to `@fodmapp/*` and align tooling, docs, and release metadata with the settled project name.

- [#213](https://github.com/f-campana/fodmapp/pull/213) [`1e7289e`](https://github.com/f-campana/fodmapp/commit/1e7289eed1de289a0f4729ad88eacee24dd1f6f6) Thanks [@f-campana](https://github.com/f-campana)! - Make menubar horizontal overflow keyboard reachable and align the responsive Storybook stress case with that accessibility contract.

- [#209](https://github.com/f-campana/fodmapp/pull/209) [`978dd90`](https://github.com/f-campana/fodmapp/commit/978dd9028e4c14a016fdbd4f70beccf6f63637d3) Thanks [@f-campana](https://github.com/f-campana)! - Polish Accordion and selection-control finishing touches by making Storybook controls drive key default stories, improving adapter hover/open-state affordances, tightening spacing and border rhythm, and refining French story copy. Also split Markdown/MDX linting into a dedicated ESLint config layer for clearer ownership.

- [#233](https://github.com/f-campana/fodmapp/pull/233) [`4ad9a9d`](https://github.com/f-campana/fodmapp/commit/4ad9a9db356322e8bd4bd8a080cbae9645d796ba) Thanks [@f-campana](https://github.com/f-campana)! - Align foundation display primitives with baseline component behavior by making Chip stories actually toggle, keeping Dot out of the accessibility tree when visible copy already names it, removing Badge hover drift from the read-only contract, and making Item titles wrap without implied heading semantics.

- [#229](https://github.com/f-campana/fodmapp/pull/229) [`c23babd`](https://github.com/f-campana/fodmapp/commit/c23babdd8dab58d8dc07698eace0f575defb6230) Thanks [@f-campana](https://github.com/f-campana)! - Upgrade the Batch K foundation content components by tightening Alert, Callout, Card, Empty, and Table contracts, improving their tests, moving stories into nested Storybook locations, and adding concise docs where the usage guidance is meaningful.

- Updated dependencies [[`1ae3b04`](https://github.com/f-campana/fodmapp/commit/1ae3b04658170422018cf490f4aa0e3cc6e60c08), [`6006bfb`](https://github.com/f-campana/fodmapp/commit/6006bfbb2d6c74f1c9a381412fde3c36ae531d3a)]:
  - @fodmapp/tailwind-config@0.2.6

## 3.13.2

### Patch Changes

- [#185](https://github.com/f-campana/fodmapp/pull/185) [`d1014e3`](https://github.com/f-campana/fodmapp/commit/d1014e384c3c5237332af28c9a72564fd36febfc) Thanks [@f-campana](https://github.com/f-campana)! - Reorganize `@fodmap/ui` implementation files into lane folders (`adapter`, `foundation`, `composed`, `utilities`) while keeping public exports stable, and align Storybook taxonomy validation/docs with the new implementation layout contract.

## 3.13.1

### Patch Changes

- Updated dependencies []:
  - @fodmap/tailwind-config@0.2.5

## 3.13.0

### Minor Changes

- [#169](https://github.com/f-campana/Fodmap/pull/169) [`570a2b8`](https://github.com/f-campana/Fodmap/commit/570a2b8456b2cf4593cfdab14efd8311edec6133) Thanks [@f-campana](https://github.com/f-campana)! - Add the composed `DatePicker` primitive and Sonner-backed `Toast` helper API, including tests, Storybook coverage, and contract-check updates.

## 3.12.0

### Minor Changes

- [#167](https://github.com/f-campana/Fodmap/pull/167) [`4b6c99e`](https://github.com/f-campana/Fodmap/commit/4b6c99eff3cdc1fa3a01040f6f625873b4b7f036) Thanks [@f-campana](https://github.com/f-campana)! - Add reference-gate Combobox primitives (`Combobox` and `ComboboxMulti`) with compound slots, tests, and Storybook coverage.

- [#163](https://github.com/f-campana/Fodmap/pull/163) [`97111e2`](https://github.com/f-campana/Fodmap/commit/97111e218b14ad5caf8285f08a2c7916ea44c538) Thanks [@f-campana](https://github.com/f-campana)! - feat(ui): add command reference primitive with tests and Storybook stories.

- [#165](https://github.com/f-campana/Fodmap/pull/165) [`d677f5f`](https://github.com/f-campana/Fodmap/commit/d677f5f24cb17d6c2129bc3ac68eee5214701357) Thanks [@f-campana](https://github.com/f-campana)! - feat(ui): add batch F external primitives (calendar carousel drawer resizable sonner).

## 3.11.0

### Minor Changes

- [#161](https://github.com/f-campana/Fodmap/pull/161) [`26f89e7`](https://github.com/f-campana/Fodmap/commit/26f89e713cabfb3a4a6715f75ed1b95860a8d4db) Thanks [@f-campana](https://github.com/f-campana)! - Add batch E forms primitives in `@fodmap/ui`: `Accordion`, `InputGroup`, and `InputOTP` with full compound exports and semantic style contracts.

  Add Storybook coverage and interaction assertions for the new form primitives in `@fodmap/storybook`.

## 3.10.0

### Minor Changes

- [#159](https://github.com/f-campana/Fodmap/pull/159) [`3038044`](https://github.com/f-campana/Fodmap/commit/30380442388ac8f46cdd13ff97266a2bf6313507) Thanks [@f-campana](https://github.com/f-campana)! - Add the reference-gate Select primitive to `@fodmap/ui` with full shadcn-parity surface, tests, and Storybook coverage.

## 3.9.0

### Minor Changes

- [#157](https://github.com/f-campana/Fodmap/pull/157) [`d90543c`](https://github.com/f-campana/Fodmap/commit/d90543c9ccbbfddc42fa60748c21746c2e5af474) Thanks [@f-campana](https://github.com/f-campana)! - Add the Batch D menu primitives: ContextMenu, Menubar, and NavigationMenu.
  This release includes full component surfaces, tests, Storybook stories, and style contract checks.

## 3.8.0

### Minor Changes

- [#155](https://github.com/f-campana/Fodmap/pull/155) [`4452a07`](https://github.com/f-campana/Fodmap/commit/4452a07e881e5b89902e4a786a5c8162f5a97c7e) Thanks [@f-campana](https://github.com/f-campana)! - Add DropdownMenu reference primitive with full shadcn-parity compound surface,
  unit tests, and Storybook stories for the Batch D reference gate rollout.

## 3.7.0

### Minor Changes

- [#153](https://github.com/f-campana/Fodmap/pull/153) [`45c9849`](https://github.com/f-campana/Fodmap/commit/45c98496d4cf902c6652760ed7933dc19303de6b) Thanks [@f-campana](https://github.com/f-campana)! - Add batch C overlay primitives: AlertDialog, Sheet, Popover, and HoverCard.

## 3.6.0

### Minor Changes

- [#151](https://github.com/f-campana/Fodmap/pull/151) [`3a21931`](https://github.com/f-campana/Fodmap/commit/3a21931680f8a9e0d7cdc71f8a7ccc9d9d7e17bb) Thanks [@f-campana](https://github.com/f-campana)! - Add the Dialog reference primitive set (Dialog root, trigger, portal, overlay, content, close, header/body/footer, title, description) with unit tests, Storybook coverage, and contract checks.

## 3.5.0

### Minor Changes

- [#149](https://github.com/f-campana/Fodmap/pull/149) [`53d85d5`](https://github.com/f-campana/Fodmap/commit/53d85d527e8b34fbbe86266419ad1133dcf2c9c4) Thanks [@f-campana](https://github.com/f-campana)! - Add batch B Radix wrappers set 2 (`Collapsible`, `ScrollArea`, `Slider`, `Tabs`, `Toggle`, `ToggleGroup`, `Tooltip`) with tests and Storybook coverage.

## 3.4.0

### Minor Changes

- [#147](https://github.com/f-campana/Fodmap/pull/147) [`c4ee358`](https://github.com/f-campana/Fodmap/commit/c4ee358e1f9658c75d5438da38466c129832d7d3) Thanks [@f-campana](https://github.com/f-campana)! - Add Batch B Radix wrappers set 1 to `@fodmap/ui`: `AspectRatio`, `Avatar`, `Label`, `Separator`, `Progress`, `Checkbox`, `Switch`, and `RadioGroup`, with tests and Storybook coverage.

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
