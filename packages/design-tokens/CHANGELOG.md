# @fodmapp/design-tokens

## 0.3.0

### Minor Changes

- [#171](https://github.com/f-campana/Fodmap/pull/171) [`630b4ba`](https://github.com/f-campana/Fodmap/commit/630b4ba6e1854ae7f87d3b604f6f93e9776f6097) Thanks [@f-campana](https://github.com/f-campana)! - Add missing brand light color tokens and semantic light remaps, enforce base brand light/dark parity during token generation, and extend Storybook foundations coverage/documentation for semantic non-color tokens.

## 0.2.4

### Patch Changes

- [#134](https://github.com/f-campana/Fodmap/pull/134) [`698bdcb`](https://github.com/f-campana/Fodmap/commit/698bdcbdaaecbcc2e0786b4fb97befad44602db0) Thanks [@f-campana](https://github.com/f-campana)! - Expand the semantic color contract (validation, outline/ghost actions, status subtle, and data roles), migrate UI primitives to strict token-only classes, and adopt reporting/app/research updates to remove remaining hardcoded/alpha color patterns.

## 0.2.3

### Patch Changes

- [#96](https://github.com/f-campana/Fodmap/pull/96) [`aa225ca`](https://github.com/f-campana/Fodmap/commit/aa225ca3e92b2f4ad23be0f93525d32a516c2852) Thanks [@f-campana](https://github.com/f-campana)! - Add accessible control color roles and runtime slots (`focus.ringAccessible` and `border.control`), enforce semantic parity and contrast guardrails in token generation, migrate shared primitives to the new focus ring slot, and extend Storybook token/runtime assertions for the updated contract.

## 0.2.2

### Patch Changes

- [#84](https://github.com/f-campana/Fodmap/pull/84) [`b3bd589`](https://github.com/f-campana/Fodmap/commit/b3bd58900fe16c3c2432b8f43136db03bffd1403) Thanks [@f-campana](https://github.com/f-campana)! - Normalize native token dimension output so `radius.full` is generated as a number (`9999`) instead of a string (`"9999px"`). This keeps the native token contract consistent for React Native consumers and aligns generated artifacts with lint/type expectations.

## 0.2.1

### Patch Changes

- [#92](https://github.com/f-campana/Fodmap/pull/92) [`f9bcf60`](https://github.com/f-campana/Fodmap/commit/f9bcf60c668f1b27b240ccd5bc0aa8687a0eca52) Thanks [@f-campana](https://github.com/f-campana)! - Track `FD_BUILD_TARGET` and `FD_OUTPUT_PATH` in Turborepo build hashing for `@fodmap/design-tokens` to prevent stale cache replays across target/output variants.

## 0.2.0

### Minor Changes

- 7528be8: Introduce shared design tokens and Tailwind adapter packages, and rewire `@fodmap/ui` to consume the shared token contract.
  - add `@fodmap/design-tokens` with generated CSS/JSON/JS token artifacts
  - add `@fodmap/tailwind-config` as a thin Tailwind v4 adapter
  - switch Storybook and UI styling to system-default theme behavior with explicit light/dark overrides

- 7528be8: Migrate wave-1 UI primitives to shadcn source components and align shared token mappings.
  - replace `Button`, `Input`, `Badge`, and `Card` internals with shadcn-style source components
  - adopt shadcn-native public APIs for migrated primitives (breaking for `@fodmap/ui`)
  - add shadcn-compatible Tailwind token slots in `@fodmap/tailwind-config`
  - improve light-theme status contrast for info/success semantic tokens in `@fodmap/design-tokens`

### Patch Changes

- a1efeb5: Migrate base color source tokens to DTCG `oklch` objects and emit `oklch(...)` values in generated CSS, JSON, and JS artifacts.

  Add preflight validation in token generation to enforce DTCG color shape, value ranges, canonical lowercase hex, and `oklch -> sRGB` roundtrip consistency.
