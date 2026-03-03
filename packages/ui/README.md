# @fodmap/ui

Shared React UI foundation for the FODMAP platform.

## Exports

- Components: `Alert`, `AlertTitle`, `AlertDescription`, `AlertDialog`, `AlertDialogTrigger`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`, `AspectRatio`, `Avatar`, `AvatarImage`, `AvatarFallback`, `Badge`, `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`, `Button`, `ButtonGroup`, `Callout`, `CalloutIcon`, `CalloutTitle`, `CalloutDescription`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`, `Checkbox`, `Chip`, `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`, `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogClose`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `Dot`, `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuGroup`, `DropdownMenuPortal`, `DropdownMenuSub`, `DropdownMenuRadioGroup`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `ContextMenu`, `ContextMenuTrigger`, `ContextMenuGroup`, `ContextMenuPortal`, `ContextMenuSub`, `ContextMenuRadioGroup`, `ContextMenuSubTrigger`, `ContextMenuSubContent`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `Empty`, `EmptyIcon`, `EmptyTitle`, `EmptyDescription`, `EmptyActions`, `Field`, `HoverCard`, `HoverCardTrigger`, `HoverCardPortal`, `HoverCardContent`, `HoverCardArrow`, `Input`, `Item`, `ItemGroup`, `ItemHeader`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemSeparator`, `Kbd`, `KbdGroup`, `Label`, `Menubar`, `MenubarMenu`, `MenubarTrigger`, `MenubarGroup`, `MenubarPortal`, `MenubarSub`, `MenubarRadioGroup`, `MenubarSubTrigger`, `MenubarSubContent`, `MenubarContent`, `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioItem`, `MenubarLabel`, `MenubarSeparator`, `MenubarShortcut`, `NativeSelect`, `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuViewport`, `NavigationMenuIndicator`, `navigationMenuTriggerStyle`, `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`, `Popover`, `PopoverTrigger`, `PopoverAnchor`, `PopoverPortal`, `PopoverContent`, `PopoverArrow`, `Progress`, `RadioGroup`, `RadioGroupItem`, `ScrollArea`, `ScrollBar`, `ScoreBar`, `Separator`, `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`, `Sheet`, `SheetTrigger`, `SheetPortal`, `SheetOverlay`, `SheetContent`, `SheetClose`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`, `Skeleton`, `Slider`, `Spinner`, `Stepper`, `StepperStep`, `StepperSeparator`, `StepperLabel`, `StepperDescription`, `Switch`, `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Textarea`, `Toggle`, `ToggleGroup`, `ToggleGroupItem`, `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`, `Typography`
- Utilities: `VisuallyHidden`, `Portal`
- Hooks: `useControllableState`, `useMediaQuery`, `useMobile`, `useDebounce`, `useCopyToClipboard`, `useLocale`
- Utility: `cn`
- Stylesheet: `@fodmap/ui/styles.css`

## Build

```bash
pnpm --filter @fodmap/ui build
```

Outputs:

- `dist/index.js`
- `dist/index.d.ts`
- `dist/styles.css`

## Quality checks

```bash
pnpm --filter @fodmap/ui typecheck
pnpm --filter @fodmap/ui test
pnpm --filter @fodmap/ui styles:check
```

## Theme contract

The stylesheet consumes shared design tokens and supports:

- system theme by default (no `data-theme` attribute)
- forced light mode with `data-theme="light"`
- forced dark mode with `data-theme="dark"`

`@fodmap/ui/styles.css` is a component contract stylesheet only.
Storybook-only utility classes must not be required or shipped by this package.

## Component API notes

Wave-1 components follow shadcn-style APIs:

- `Button` variants: `default | destructive | outline | secondary | ghost | link`
- `Button` sizes: `default | sm | lg | icon`
- `Button` supports `asChild`
- `Input` uses native input props (`aria-invalid` for invalid state)
- `Badge` variants: `default | secondary | destructive | outline`
- All components follow React 19 pattern (named functions, no `forwardRef`, no explicit `displayName`)

Destructive button styling uses semantic subtle tokens (no opacity-modified
background classes):

- `bg-destructive-subtle`
- `text-destructive-subtle-foreground`
- `hover:bg-destructive-subtle-hover`
- `focus-visible:border-destructive-subtle-border`
- `focus-visible:ring-destructive-subtle-ring`

Outline/ghost and invalid states also use semantic color slots (no dark-prefixed
runtime overrides and no color alpha class modifiers):

- Outline: `border-outline-border bg-outline text-outline-foreground hover:bg-outline-hover`
- Ghost: `text-ghost-foreground hover:bg-ghost-hover`
- Invalid: `aria-invalid:border-validation-error-border aria-invalid:ring-validation-error-ring-soft`
