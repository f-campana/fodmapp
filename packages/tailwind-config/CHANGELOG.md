# @fodmap/tailwind-config

## 0.2.2

### Patch Changes

- Updated dependencies [[`b3bd589`](https://github.com/f-campana/Fodmap/commit/b3bd58900fe16c3c2432b8f43136db03bffd1403)]:
  - @fodmap/design-tokens@0.2.2

## 0.2.1

### Patch Changes

- Updated dependencies [[`f9bcf60`](https://github.com/f-campana/Fodmap/commit/f9bcf60c668f1b27b240ccd5bc0aa8687a0eca52)]:
  - @fodmap/design-tokens@0.2.1

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

- Updated dependencies [a1efeb5]
- Updated dependencies [7528be8]
- Updated dependencies [7528be8]
  - @fodmap/design-tokens@0.2.0
