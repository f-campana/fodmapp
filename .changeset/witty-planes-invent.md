---
"@fodmap/ui": minor
"@fodmap/storybook": patch
---

PR-01 foundation rollout for the UI library contract:

- migrate existing `@fodmap/ui` primitives to React 19 named-function pattern (no `forwardRef`, no explicit `displayName`) and add missing `data-slot` hooks
- add shared utilities (`Portal`, `VisuallyHidden`) and core hooks (`useControllableState`, `useMediaQuery`, `useMobile`, `useDebounce`, `useCopyToClipboard`, `useLocale`) with tests and public exports
- harden style/source contract checks to enforce token/focus conventions and ban forbidden patterns
- update Storybook stories and workspace dependencies to align with the new foundation contract
