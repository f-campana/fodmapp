import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();

describe("Select", () => {
  function openSelect() {
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });
    return trigger;
  }

  function renderSelect(props?: React.ComponentProps<typeof Select>) {
    return render(
      <Select {...props}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Options</SelectLabel>
            <SelectSeparator />
            <SelectItem value="profil">Profil</SelectItem>
            <SelectItem value="mode-expert">Mode expert</SelectItem>
            <SelectItem disabled value="support">
              Support prioritaire
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );
  }

  it("opens and closes from trigger in uncontrolled mode", async () => {
    renderSelect();

    openSelect();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='select-content']"),
      ).toBeTruthy();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(document.querySelector("[data-slot='select-content']")).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderSelect();

    openSelect();

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='select-content']");
      if (!node) {
        throw new Error("select content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='select-content']")).toBeNull();
    });
  });

  it("supports keyboard navigation and selection", async () => {
    const onValueChange = vi.fn();

    renderSelect({ onValueChange });

    const trigger = screen.getByRole("combobox");

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='select-content']"),
      ).toBeTruthy();
    });

    const firstItem = screen.getByRole("option", { name: "Profil" });
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(firstItem, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(firstItem, { key: "Enter", code: "Enter" });

    expect(onValueChange).toHaveBeenCalled();
  });

  it("updates controlled value via onValueChange", async () => {
    const onValueChange = vi.fn();

    function ControlledExample() {
      const [value, setValue] = useState("profil");
      return (
        <>
          <span data-value={value} />
          <Select
            onValueChange={(next) => {
              setValue(next);
              onValueChange(next);
            }}
            value={value}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une option" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="profil">Profil</SelectItem>
                <SelectItem value="mode-expert">Mode expert</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    openSelect();

    const expert = await waitFor(() => {
      return screen.getByRole("option", { name: "Mode expert" });
    });

    fireEvent.click(expert);

    expect(onValueChange).toHaveBeenCalledWith("mode-expert");

    await waitFor(() => {
      const state = container.querySelector("[data-value]");
      expect(state).toHaveAttribute("data-value", "mode-expert");
    });
  });

  it("does not select disabled item", async () => {
    const onValueChange = vi.fn();

    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem disabled value="support">
              Support prioritaire
            </SelectItem>
            <SelectItem value="profil">Profil</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    openSelect();

    const disabledItem = await waitFor(() => {
      return screen.getByRole("option", { name: "Support prioritaire" });
    });

    fireEvent.click(disabledItem);

    expect(onValueChange).not.toHaveBeenCalledWith("support");
  });

  it("exposes placeholder state when no value is selected", () => {
    renderSelect();

    const trigger = screen.getByRole("combobox");

    expect(trigger).toHaveAttribute("data-placeholder", "");
  });

  it("renders expected slots across root, content, viewport, and indicators", async () => {
    const { container } = render(
      <Select defaultValue="profil">
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Options</SelectLabel>
            <SelectSeparator />
            {Array.from({ length: 24 }, (_, index) => {
              const value = `option-${index + 1}`;
              return (
                <SelectItem key={value} value={value}>
                  Option {index + 1}
                </SelectItem>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    openSelect();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='select-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='select']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='select-trigger']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='select-value']")).toBeTruthy();
    expect(document.querySelector("[data-slot='select-portal']")).toBeTruthy();
    expect(document.querySelector("[data-slot='select-content']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='select-viewport']"),
    ).toHaveAttribute("tabindex", "0");
    expect(document.querySelector("[data-slot='select-label']")).toBeTruthy();
    expect(document.querySelector("[data-slot='select-group']")).toBeTruthy();
    expect(document.querySelector("[data-slot='select-item']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='select-separator']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='select-icon']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='select-item-indicator']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts on trigger, content, and item", async () => {
    const { container } = renderSelect();

    openSelect();

    const trigger = container.querySelector(
      "[data-slot='select-trigger']",
    ) as HTMLElement | null;
    const content = await waitFor(() => {
      return document.querySelector(
        "[data-slot='select-content']",
      ) as HTMLElement | null;
    });
    const item = document.querySelector(
      "[data-slot='select-item']",
    ) as HTMLElement | null;

    expect(trigger?.className ?? "").toContain("border-input");
    expect(trigger?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(trigger?.className ?? "").toContain(
      "data-[placeholder]:text-muted-foreground",
    );

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:animate-in");
    expect(content?.className ?? "").toContain(
      "data-[side=right]:slide-in-from-left-2",
    );

    expect(item?.className ?? "").toContain("focus:bg-accent");
    expect(item?.className ?? "").toContain("focus:text-accent-foreground");
  });

  it("merges className on trigger, content, item, label, and separator", async () => {
    const { container } = render(
      <Select>
        <SelectTrigger className="declencheur-personnalise">
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent className="contenu-personnalise">
          <SelectGroup>
            <SelectLabel className="label-personnalise">Options</SelectLabel>
            <SelectSeparator className="separateur-personnalise" />
            <SelectItem className="item-personnalise" value="profil">
              Profil
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    openSelect();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='select-content']"),
      ).toBeTruthy();
    });

    const trigger = container.querySelector(
      "[data-slot='select-trigger']",
    ) as HTMLElement | null;
    const content = document.querySelector("[data-slot='select-content']");
    const item = document.querySelector("[data-slot='select-item']");
    const label = document.querySelector("[data-slot='select-label']");
    const separator = document.querySelector("[data-slot='select-separator']");

    expect(trigger?.className ?? "").toContain("declencheur-personnalise");
    expect(content?.className ?? "").toContain("contenu-personnalise");
    expect(item?.className ?? "").toContain("item-personnalise");
    expect(label?.className ?? "").toContain("label-personnalise");
    expect(separator?.className ?? "").toContain("separateur-personnalise");
  });

  it("forwards refs to trigger, content, and item", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    render(
      <Select>
        <SelectTrigger ref={triggerRef}>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent ref={contentRef}>
          <SelectGroup>
            <SelectItem ref={itemRef} value="profil">
              Profil
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    openSelect();

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="profil">Profil</SelectItem>
            <SelectItem value="mode-expert">Mode expert</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

    openSelect();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='select-content']"),
      ).toBeTruthy();
    });

    expect(
      await axe(document.querySelector("[data-slot='select-viewport']")!),
    ).toHaveNoViolations();
  });

  it("exposes scroll button slots from dedicated components", () => {
    const upElement = SelectScrollUpButton({}) as {
      props: { className: string };
    };
    const downElement = SelectScrollDownButton({}) as {
      props: { className: string };
    };

    expect(upElement.props.className).toContain("text-muted-foreground");
    expect(downElement.props.className).toContain("text-muted-foreground");
  });
});
