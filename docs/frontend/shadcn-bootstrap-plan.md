# Shadcn UI Bootstrap Plan

## Goal

Use shadcn/ui to accelerate initial component delivery, then progressively specialize for FODMAP product needs.

## Bootstrap Scope (Foundation)

1. Configure monorepo-ready `components.json` for UI workspace and consuming app workspace.
2. Start with minimal primitives:

- `Button`
- `Input`
- `Badge`
- `Card`
- `Field`

3. Add Storybook stories for default and edge states.
4. Add unit and a11y tests for each primitive.

## Technical Conventions

- Tailwind v4 + CSS variable theming.
- `class-variance-authority`, `clsx`, `tailwind-merge` for variant ergonomics.
- Keep components headless where possible; avoid product-specific copy.
- Ensure keyboard/focus behavior and ARIA relationships from first commit.

## Dark Mode And Theme Direction

- Support light/dark tokens from day one.
- Keep warm editorial baseline aligned with French market tone.
- Use semantic token names (`surface`, `text-primary`, `accent`, `warning`) instead of direct color names.

## Exit Criteria

- `@fodmapp/ui` build/typecheck/test green.
- Storybook build and interaction checks green.
- Component docs exist for all primitives.
- No ETL/schema/API behavior changes in same PR.
