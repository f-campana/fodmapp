---
"@fodmap/design-tokens": minor
"@fodmap/tailwind-config": minor
"@fodmap/ui": minor
---

Introduce shared design tokens and Tailwind adapter packages, and rewire `@fodmap/ui` to consume the shared token contract.

- add `@fodmap/design-tokens` with generated CSS/JSON/JS token artifacts
- add `@fodmap/tailwind-config` as a thin Tailwind v4 adapter
- switch Storybook and UI styling to system-default theme behavior with explicit light/dark overrides
