import * as React from "react";

import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "../../lib/cn";

export type AvatarProps = React.ComponentProps<typeof AvatarPrimitive.Root>;

function Avatar({ className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export type AvatarImageProps = React.ComponentProps<
  typeof AvatarPrimitive.Image
>;

function AvatarImage({ className, ...props }: AvatarImageProps) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

export type AvatarFallbackProps = React.ComponentProps<
  typeof AvatarPrimitive.Fallback
>;

function AvatarFallback({ className, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarFallback, AvatarImage };
