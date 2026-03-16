# Typography Foundations

## Purpose

Define the shared text hierarchy and role expectations that components and app surfaces should follow.

## Core rules

- Treat typography as a semantic hierarchy first and a styling layer second.
- Use a small set of text roles consistently: heading, body, helper, label, caption, and code-like content.
- Optimize for readability before expressiveness in product surfaces.
- Do not invent new text styles when an existing role already fits the content.

## Recommended usage

- Use heading levels to communicate structure, not just visual size.
- Keep body copy readable and stable across cards, forms, empty states, and longer explanatory content.
- Use labels and helper text to support interaction and comprehension, not to decorate controls.
- Reserve code-like or keyboard text treatment for actual commands, shortcuts, identifiers, or inline system references.

## Anti-patterns

- Do not use heading styles for non-structural emphasis only.
- Do not shrink helper or caption text until it becomes fragile on mobile screens.
- Do not mix too many font sizes or weights inside a single component.
- Do not rely on color changes alone to express text hierarchy.

## Accessibility implications

- Text hierarchy should remain understandable for zoomed and narrow-screen layouts.
- Label, helper, and error text must remain legible enough to support form completion.
- Visual emphasis should not depend solely on low-contrast size or weight changes.

## Related components

- `Typography`, `Kbd`, `Label`
- `Button`, `Input`, `NativeSelect`, `Textarea`
- `Alert`, `Callout`, `Card`, `Empty`
- `Breadcrumb`, `Pagination`, `Stepper`

## Related docs

- [README.md](./README.md)
- [component-mapping.md](./component-mapping.md)
- [docs/frontend/tailwind-v4-token-architecture.md](../tailwind-v4-token-architecture.md)
