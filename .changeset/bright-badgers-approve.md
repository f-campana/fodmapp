---
"@fodmap/ui": major
"@fodmap/storybook": patch
---

Refresh the shared `Button` primitive with new variant/size behavior, Tailwind v4 canonical classes, and improved focus handling (`outline-hidden`).

`ButtonProps` is no longer exported from package entrypoints; consume button prop types from `React.ComponentProps<typeof Button>` instead.

Update Storybook button stories and interaction checks to reflect the new button contract.
