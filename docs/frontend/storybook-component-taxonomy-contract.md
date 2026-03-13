# Storybook Component Taxonomy Contract

## Scope

This document defines the canonical taxonomy contract for component stories under:

- `apps/storybook/stories/**/*.stories.tsx`

It does not apply to:

- `apps/storybook/stories/foundations/*`
- `apps/storybook/stories/reporting/*`

## Taxonomy Lanes

The Storybook title prefixes are strict and canonical:

- `Primitives/Adapter/*`
- `Primitives/Foundation/*`
- `Composed/*`
- `Utilities/*`

The source of truth for category + title mapping is:

- `apps/storybook/stories/component-taxonomy.json`

## Component-to-Lane Matrix

### Primitives/Adapter

`accordion`, `alert-dialog`, `aspect-ratio`, `avatar`, `checkbox`, `collapsible`, `context-menu`, `dialog`, `drawer`, `dropdown-menu`, `hover-card`, `input-otp`, `label`, `menubar`, `navigation-menu`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `slider`, `sonner`, `switch`, `tabs`, `toggle`, `toggle-group`, `tooltip`

### Primitives/Foundation

`alert`, `badge`, `breadcrumb`, `button`, `button-group`, `callout`, `card`, `chip`, `dot`, `empty`, `input`, `item`, `kbd`, `native-select`, `pagination`, `score-bar`, `skeleton`, `spinner`, `stepper`, `table`, `textarea`, `typography`

### Composed

`calendar`, `carousel`, `combobox`, `command`, `date-picker`, `field`, `input-group`, `toast`

### Utilities

`portal`, `visually-hidden`

## Validation Contract

The taxonomy checker must enforce:

1. Every implementation component in `packages/ui/src/components/ui/{adapter,foundation,composed,utilities}/*.tsx` (excluding tests) is mapped in `component-taxonomy.json`.
2. No taxonomy entry points to a non-existent component.
3. Every mapped component story file exists.
4. Every mapped component story title exactly matches the mapped title.
5. No unmapped component story exists outside the excluded `foundations/*` and `reporting/*` directories.

`storyFile` values in `component-taxonomy.json` are paths relative to `apps/storybook/stories`.

Run locally:

```bash
pnpm --filter @fodmap/storybook stories:taxonomy:check
```

`@fodmap/storybook` typecheck includes taxonomy validation:

```bash
pnpm --filter @fodmap/storybook typecheck
```

## Story ID Compatibility

Story titles changed to enforce taxonomy. Story IDs are therefore intentionally changed as part of this migration. No deep-link compatibility layer is provided.
