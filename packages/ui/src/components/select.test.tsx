import { createRef, type ReactNode, useState } from "react";

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

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

function SelectTestHarness({
  children,
}: {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return <div ref={setPortalContainer}>{children(portalContainer)}</div>;
}

describe("Select", () => {
  function openSelect() {
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });
    return trigger;
  }

  function renderSelectWithPortal(
    renderChildren: (portalContainer: HTMLDivElement | null) => ReactNode,
  ) {
    return render(
      <SelectTestHarness>{(portalContainer) => renderChildren(portalContainer)}</SelectTestHarness>,
    );
  }

  function renderSelect(props?: React.ComponentProps<typeof Select>) {
    return renderSelectWithPortal((portalContainer) => (
      <Select {...props}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
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
      </Select>
    ));
  }

  function getSelectPortal(container: HTMLElement) {
    return container.querySelector("[data-slot='select-portal']");
  }

  function getSelectContent(container: HTMLElement) {
    return container.querySelector("[data-slot='select-content']");
  }

  function getSelectViewport(container: HTMLElement) {
    return container.querySelector("[data-slot='select-viewport']");
  }

  function getSelectItem(container: HTMLElement) {
    return container.querySelector("[data-slot='select-item']");
  }

  function getSelectOption(container: HTMLElement, name: string) {
    return within(container).getByRole("option", { name });
  }

  function querySelectOption(container: HTMLElement, name: string) {
    return within(container).queryByRole("option", { name });
  }

  function renderDisabledItemSelect(
    onValueChange: ReturnType<typeof vi.fn>,
  ) {
    return renderSelectWithPortal((portalContainer) => (
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
          <SelectGroup>
            <SelectItem disabled value="support">
              Support prioritaire
            </SelectItem>
            <SelectItem value="profil">Profil</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ));
  }

  it("opens and closes from trigger in uncontrolled mode", async () => {
    const { container } = renderSelect();

    openSelect();

    await waitFor(() => {
      expect(getSelectContent(container)).toBeTruthy();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(getSelectContent(container)).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    const { container } = renderSelect();

    openSelect();

    const content = await waitFor(() => {
      const node = getSelectContent(container);
      if (!node) {
        throw new Error("select content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(getSelectContent(container)).toBeNull();
    });
  });

  it("supports keyboard navigation and selection", async () => {
    const onValueChange = vi.fn();

    const { container } = renderSelect({ onValueChange });

    const trigger = screen.getByRole("combobox");

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });

    await waitFor(() => {
      expect(getSelectContent(container)).toBeTruthy();
    });

    const firstItem = getSelectOption(container, "Profil");
    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(firstItem, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(firstItem, { key: "Enter", code: "Enter" });

    expect(onValueChange).toHaveBeenCalled();
  });

  it("updates controlled value via onValueChange", async () => {
    const onValueChange = vi.fn();

    function ControlledExampleWithPortal({
      onValueChange: handleValueChange,
      portalContainer,
    }: {
      onValueChange: (value: string) => void;
      portalContainer: HTMLDivElement | null;
    }) {
      const [value, setValue] = useState("profil");

      return (
        <>
          <span data-value={value} />
          <Select
            onValueChange={(next) => {
              setValue(next);
              handleValueChange(next);
            }}
            value={value}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir une option" />
            </SelectTrigger>
            <SelectContent container={portalContainer}>
              <SelectGroup>
                <SelectItem value="profil">Profil</SelectItem>
                <SelectItem value="mode-expert">Mode expert</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </>
      );
    }

    const { container } = render(
      <SelectTestHarness>
        {(portalContainer) => (
          <ControlledExampleWithPortal
            onValueChange={onValueChange}
            portalContainer={portalContainer}
          />
        )}
      </SelectTestHarness>,
    );

    openSelect();

    const expert = await waitFor(() =>
      querySelectOption(container, "Mode expert"),
    );

    expect(expert).toBeTruthy();
    fireEvent.click(expert!);

    expect(onValueChange).toHaveBeenCalledWith("mode-expert");

    await waitFor(() => {
      const state = container.querySelector("[data-value]");
      expect(state).toHaveAttribute("data-value", "mode-expert");
    });
  });

  it("does not select disabled item", async () => {
    const onValueChange = vi.fn();

    const { container } = renderDisabledItemSelect(onValueChange);

    openSelect();

    const disabledItem = await waitFor(() =>
      querySelectOption(container, "Support prioritaire"),
    );

    fireEvent.click(disabledItem);

    expect(onValueChange).not.toHaveBeenCalledWith("support");
  });

  it("exposes placeholder state when no value is selected", () => {
    renderSelect();

    const trigger = screen.getByRole("combobox");

    expect(trigger).toHaveAttribute("data-placeholder", "");
  });

  it("renders expected slots across root, content, viewport, and indicators", async () => {
    const { container } = renderSelectWithPortal((portalContainer) => (
      <Select defaultValue="profil">
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
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
      </Select>
    ));

    openSelect();

    await waitFor(() => {
      expect(getSelectContent(container)).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='select']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='select-trigger']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='select-value']")).toBeTruthy();
    expect(getSelectPortal(container)).toBeTruthy();
    expect(getSelectContent(container)).toBeTruthy();
    expect(getSelectViewport(container)).toHaveAttribute("tabindex", "0");
    expect(getSelectViewport(container)).toHaveAttribute("role", "group");
    expect(container.querySelector("[data-slot='select-label']")).toBeTruthy();
    expect(container.querySelector("[data-slot='select-group']")).toBeTruthy();
    expect(getSelectItem(container)).toBeTruthy();
    expect(
      container.querySelector("[data-slot='select-separator']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='select-icon']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='select-item-indicator']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts on trigger, content, and item", async () => {
    const { container } = renderSelect();

    openSelect();

    const trigger = container.querySelector(
      "[data-slot='select-trigger']",
    ) as HTMLElement | null;
    const content = await waitFor(
      () => getSelectContent(container) as HTMLElement | null,
    );
    const item = getSelectItem(container) as HTMLElement | null;

    expect(trigger?.className ?? "").toContain("border-input");
    expect(trigger?.className ?? "").toContain("cursor-pointer");
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
    expect(item?.className ?? "").toContain("cursor-pointer");
  });

  it("merges className on trigger, content, item, label, and separator", async () => {
    const { container } = renderSelectWithPortal((portalContainer) => (
      <Select>
        <SelectTrigger className="declencheur-personnalise">
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent
          className="contenu-personnalise"
          container={portalContainer}
        >
          <SelectGroup>
            <SelectLabel className="label-personnalise">Options</SelectLabel>
            <SelectSeparator className="separateur-personnalise" />
            <SelectItem className="item-personnalise" value="profil">
              Profil
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ));

    openSelect();

    await waitFor(() => {
      expect(getSelectContent(container)).toBeTruthy();
    });

    const trigger = container.querySelector(
      "[data-slot='select-trigger']",
    ) as HTMLElement | null;
    const content = getSelectContent(container);
    const item = getSelectItem(container);
    const label = container.querySelector("[data-slot='select-label']");
    const separator = container.querySelector("[data-slot='select-separator']");

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

    renderSelectWithPortal((portalContainer) => (
      <Select>
        <SelectTrigger ref={triggerRef}>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent container={portalContainer} ref={contentRef}>
          <SelectGroup>
            <SelectItem ref={itemRef} value="profil">
              Profil
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ));

    openSelect();

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderSelectWithPortal((portalContainer) => (
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
          <SelectGroup>
            <SelectItem value="profil">Profil</SelectItem>
            <SelectItem value="mode-expert">Mode expert</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    ));

    openSelect();

    await waitFor(() => {
      expect(getSelectContent(container)).toBeTruthy();
    });

    expect(await axe(getSelectPortal(container)!)).toHaveNoViolations();
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
