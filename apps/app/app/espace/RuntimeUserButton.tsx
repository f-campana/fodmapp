"use client";

import { UserButton } from "@clerk/nextjs";

export default function RuntimeUserButton() {
  return (
    <div className="flex justify-end">
      <UserButton />
    </div>
  );
}
