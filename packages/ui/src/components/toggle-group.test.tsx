import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import { ToggleGroup, ToggleGroupItem } from "./toggle-group";

describe("ToggleGroup", () => {
  it("supports single selection mode with stable default slot markers", async () => {
    const user = userEvent.setup();

    render(
      <ToggleGroup
        type="single"
        defaultValue="a"
        aria-label="Preferences"
        data-slot="custom-group"
      >
        <ToggleGroupItem value="a" aria-label="Option A" data-slot="custom-a">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByRole("radio", { name: "Option A" });
    const optionB = screen.getByRole("radio", { name: "Option B" });
    const root = optionA.closest("[data-slot='toggle-group']");

    expect(root).toHaveAttribute("data-slot", "toggle-group");
    expect(root).not.toHaveAttribute("data-slot", "custom-group");
    expect(optionA).toHaveAttribute("data-slot", "toggle-group-item");
    expect(optionA).not.toHaveAttribute("data-slot", "custom-a");
    expect(optionA).toHaveAttribute("data-state", "on");
    expect(optionB).toHaveAttribute("data-state", "off");

    await user.click(optionB);

    expect(optionB).toHaveAttribute("data-state", "on");
    expect(optionA).toHaveAttribute("data-state", "off");
  });

  it("supports multiple selection mode", async () => {
    const user = userEvent.setup();

    render(
      <ToggleGroup type="multiple" defaultValue={["a"]} aria-label="Filtres">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByRole("button", { name: "Option A" });
    const optionB = screen.getByRole("button", { name: "Option B" });

    await user.click(optionB);

    expect(optionA).toHaveAttribute("data-state", "on");
    expect(optionB).toHaveAttribute("data-state", "on");
  });

  it("allows clearing the active option in single selection mode", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <ToggleGroup
        type="single"
        defaultValue="a"
        aria-label="Preferences"
        onValueChange={onValueChange}
      >
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByRole("radio", { name: "Option A" });

    expect(optionA).toHaveAttribute("data-state", "on");
    expect(optionA).toHaveAttribute("aria-checked", "true");

    await user.click(optionA);

    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(optionA).toHaveAttribute("data-state", "off");
    expect(optionA).toHaveAttribute("aria-checked", "false");
  });

  it("moves focus with arrow keys without changing single selection", async () => {
    const user = userEvent.setup();

    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Navigation">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionA = screen.getByRole("radio", { name: "Option A" });
    const optionB = screen.getByRole("radio", { name: "Option B" });

    optionA.focus();
    await user.keyboard("{ArrowRight}");

    expect(optionB).toHaveFocus();
    expect(optionA).toHaveAttribute("data-state", "on");
    expect(optionB).toHaveAttribute("data-state", "off");
    expect(optionA).toHaveAttribute("aria-checked", "true");
    expect(optionB).toHaveAttribute("aria-checked", "false");
  });

  it("does not activate disabled items", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <ToggleGroup
        type="single"
        onValueChange={onValueChange}
        aria-label="Choix"
      >
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B" disabled>
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const optionB = screen.getByRole("radio", { name: "Option B" });

    expect(optionB).toBeDisabled();

    await user.click(optionB);

    expect(onValueChange).not.toHaveBeenCalledWith("b");
  });

  it("renders orientation metadata on the group root", () => {
    render(
      <ToggleGroup
        type="single"
        orientation="vertical"
        aria-label="Orientation"
      >
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const item = screen.getByRole("radio", { name: "Option A" });
    const root = item.closest("[data-slot='toggle-group']");

    expect(root).toHaveAttribute("data-orientation", "vertical");
  });

  it("allows item slot override when using asChild", () => {
    render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Composition">
        <ToggleGroupItem asChild value="a" aria-label="Option A">
          <button data-slot="custom-item" type="button">
            Option A
          </button>
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(screen.getByRole("radio", { name: "Option A" })).toHaveAttribute(
      "data-slot",
      "custom-item",
    );
    expect(
      document.querySelector("[data-slot='toggle-group-item']"),
    ).toBeNull();
  });

  it("merges className on the root", () => {
    render(
      <ToggleGroup type="single" className="mon-groupe" aria-label="Classe">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    const root = screen
      .getByRole("radio", { name: "Option A" })
      .closest("[data-slot='toggle-group']");

    expect(root?.className ?? "").toContain("mon-groupe");
  });

  it("forwards ref to the group root", () => {
    const ref = createRef<HTMLDivElement>();

    render(
      <ToggleGroup ref={ref} type="single" aria-label="Reference">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ToggleGroup type="single" defaultValue="a" aria-label="Accessibilite">
        <ToggleGroupItem value="a" aria-label="Option A">
          A
        </ToggleGroupItem>
        <ToggleGroupItem value="b" aria-label="Option B">
          B
        </ToggleGroupItem>
      </ToggleGroup>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
