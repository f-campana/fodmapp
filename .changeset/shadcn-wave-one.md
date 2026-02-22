---
"@fodmap/ui": major
"@fodmap/design-tokens": minor
"@fodmap/tailwind-config": minor
---

Migrate wave-1 UI primitives to shadcn source components and align shared token mappings.

- replace `Button`, `Input`, `Badge`, and `Card` internals with shadcn-style source components
- adopt shadcn-native public APIs for migrated primitives (breaking for `@fodmap/ui`)
- add shadcn-compatible Tailwind token slots in `@fodmap/tailwind-config`
- improve light-theme status contrast for info/success semantic tokens in `@fodmap/design-tokens`
