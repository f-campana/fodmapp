import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/cn";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "font-serif text-4xl leading-tight tracking-tight text-foreground md:text-5xl",
      h2: "font-serif text-3xl leading-tight tracking-tight text-foreground md:text-4xl",
      h3: "font-serif text-2xl leading-snug tracking-tight text-foreground md:text-3xl",
      h4: "font-sans text-xl leading-snug font-semibold text-foreground md:text-2xl",
      p: "text-base leading-7 text-foreground",
      blockquote: "border-l-2 border-border pl-6 text-foreground italic",
      code: "rounded-sm bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground",
      lead: "text-xl leading-8 text-muted-foreground",
      muted: "text-sm leading-6 text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
});

const elementByVariant = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  p: "p",
  blockquote: "blockquote",
  code: "code",
  lead: "p",
  muted: "p",
} as const;

export interface TypographyProps
  extends
    React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  asChild?: boolean;
}

function Typography({
  className,
  variant = "p",
  asChild = false,
  ...props
}: TypographyProps) {
  const Comp = asChild ? Slot : elementByVariant[variant ?? "p"];

  return (
    <Comp
      data-slot="typography"
      data-variant={variant}
      className={cn(typographyVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Typography, typographyVariants };
