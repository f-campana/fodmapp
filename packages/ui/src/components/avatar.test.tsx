import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

describe("Avatar", () => {
  it("renders fallback content", () => {
    render(
      <Avatar>
        <AvatarFallback>FC</AvatarFallback>
      </Avatar>,
    );

    const fallback = screen.getByText("FC");
    expect(fallback).toHaveAttribute("data-slot", "avatar-fallback");
    expect(fallback.closest("[data-slot='avatar']")).toHaveAttribute(
      "data-slot",
      "avatar",
    );
  });

  it("keeps fallback visible when image is not yet loaded", () => {
    render(
      <Avatar>
        <AvatarImage
          alt="Photo de profil"
          src="https://example.com/profil.jpg"
        />
        <AvatarFallback>FP</AvatarFallback>
      </Avatar>,
    );

    const fallback = screen.getByText("FP");
    expect(fallback).toHaveAttribute("data-slot", "avatar-fallback");
    expect(fallback.closest("[data-slot='avatar']")).toHaveAttribute(
      "data-slot",
      "avatar",
    );
  });

  it("merges className", () => {
    render(
      <Avatar className="mon-avatar">
        <AvatarFallback>AA</AvatarFallback>
      </Avatar>,
    );

    expect(
      screen.getByText("AA").closest("[data-slot='avatar']")?.className,
    ).toContain("mon-avatar");
  });

  it("forwards ref to the avatar root", () => {
    const ref = createRef<HTMLSpanElement>();

    render(
      <Avatar ref={ref}>
        <AvatarFallback>RF</AvatarFallback>
      </Avatar>,
    );

    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
