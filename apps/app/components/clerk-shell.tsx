"use client";

import { ClerkProvider } from "@clerk/nextjs";

import type { ReactNode } from "react";

export interface ClerkShellProps {
  enabled: boolean;
  children: ReactNode;
}

export function ClerkShell({ enabled, children }: ClerkShellProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  return <ClerkProvider>{children}</ClerkProvider>;
}
