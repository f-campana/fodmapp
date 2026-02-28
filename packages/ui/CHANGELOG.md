# @fodmap/ui

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
