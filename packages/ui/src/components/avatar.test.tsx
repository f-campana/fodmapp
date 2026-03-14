import { createRef } from "react";

import { render, screen } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

describe("Avatar", () => {
  it("renders fallback content", () => {
    render(
      <Avatar>
        <AvatarFallback>CF</AvatarFallback>
      </Avatar>,
    );

    const fallback = screen.getByText("CF");
    expect(fallback).toHaveAttribute("data-slot", "avatar-fallback");
    expect(fallback.closest("[data-slot='avatar']")).toHaveAttribute(
      "data-slot",
      "avatar",
    );
  });

  it("renders image props with a stable slot hook after the image loads", async () => {
    const OriginalImage = window.Image;

    class LoadedImageMock extends EventTarget {
      complete = false;
      crossOrigin: string | null = null;
      naturalWidth = 0;
      referrerPolicy = "";
      #src = "";

      get src() {
        return this.#src;
      }

      set src(value: string) {
        this.#src = value;
        this.complete = true;
        this.naturalWidth = 64;
        queueMicrotask(() => {
          this.dispatchEvent(new Event("load"));
        });
      }
    }

    window.Image = LoadedImageMock as unknown as typeof window.Image;

    try {
      render(
        <Avatar>
          <AvatarImage
            alt="Profile photo"
            src="https://example.com/profile.jpg"
          />
          <AvatarFallback>PF</AvatarFallback>
        </Avatar>,
      );

      const image = await screen.findByRole("img", { name: "Profile photo" });

      expect(image).toHaveAttribute("data-slot", "avatar-image");
      expect(image).toHaveAttribute("src", "https://example.com/profile.jpg");
      expect(image.closest("[data-slot='avatar']")).toHaveAttribute(
        "data-slot",
        "avatar",
      );
    } finally {
      window.Image = OriginalImage;
    }
  });

  it("keeps fallback visible when image is not yet loaded", () => {
    render(
      <Avatar>
        <AvatarImage
          alt="Profile photo"
          src="https://example.com/profile.jpg"
        />
        <AvatarFallback>PF</AvatarFallback>
      </Avatar>,
    );

    const fallback = screen.getByText("PF");
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
