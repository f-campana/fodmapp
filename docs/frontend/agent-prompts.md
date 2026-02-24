# Agent Prompt Pack (Frontend)

These prompts are copy-ready for parallel frontend execution.

## Prompt 1: Token Architect

```text
You are defining the initial token system for a French-market FODMAP product.

Constraints:
- Tailwind v4, CSS-variable first.
- Semantic tokens first (surface/text/border/accent/status), not raw colors in components.
- Light and dark themes required.
- FR-first editorial tone.

Deliver:
1) token taxonomy and naming rules,
2) package file structure,
3) sample token definitions,
4) migration notes for future additions.

Output as a PR-ready spec document and implementation checklist.
```

## Prompt 2: UI Primitive Engineer

```text
Build shared primitives in @fodmap/ui using shadcn/ui patterns and CVA.

Initial components:
- Button
- Input
- Badge
- Card
- Field

Requirements:
- Tailwind v4 classes using semantic tokens only
- accessibility-first behavior
- typed props
- no product-specific business logic

Deliver:
- components
- tests (unit + a11y)
- stories (default + edge states)
- index exports and usage examples
```

## Prompt 3: Storybook And Test Engineer

```text
Set up Storybook app for @fodmap/ui and implement test coverage.

Requirements:
- stories for all primitives
- a11y addon checks
- interaction tests
- deterministic CI commands

Deliver:
- Storybook config
- stories with play assertions
- CI command list and expected outputs
```

## Prompt 4: API Integration Engineer (Mock-First)

```text
Build frontend data layer contracts from OpenAPI-generated types.

Inputs:
- api/openapi/v0.yaml
- packages/types generated outputs

Requirements:
- define zod schemas for client-side validation where needed
- create hooks/queries/state abstractions
- support mock adapters for local UI development
- keep transport concerns isolated from UI components

Deliver:
- data contract module
- example query hooks
- mock fixtures
- integration tests
```

## Prompt 5: Page/Block Composer

```text
Compose reusable blocks and page shells with mocked data using @fodmap/ui.

Requirements:
- mobile and desktop quality
- FR-first copy placeholders
- accessibility and keyboard support
- design consistency with token system

Deliver:
- block catalog
- page shell prototypes
- story coverage and responsive behavior notes
```
