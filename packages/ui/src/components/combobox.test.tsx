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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxMulti,
  ComboboxSeparator,
  ComboboxTrigger,
} from "./combobox";

window.HTMLElement.prototype.hasPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.setPointerCapture = vi.fn();

function ComboboxTestHarness({
  children,
}: {
  children: (portalContainer: HTMLDivElement | null) => ReactNode;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
    null,
  );

  return <div ref={setPortalContainer}>{children(portalContainer)}</div>;
}

function renderComboboxWithPortal(
  renderChildren: (portalContainer: HTMLDivElement | null) => ReactNode,
) {
  return render(
    <ComboboxTestHarness>
      {(portalContainer) => renderChildren(portalContainer)}
    </ComboboxTestHarness>,
  );
}

function renderSingle(props?: React.ComponentProps<typeof Combobox>) {
  return renderComboboxWithPortal((portalContainer) => (
    <Combobox {...props}>
      <ComboboxTrigger aria-label="Choix de l option" />
      <ComboboxContent container={portalContainer}>
        <ComboboxInput placeholder="Rechercher une option" />
        <ComboboxList>
          <ComboboxEmpty>Aucun resultat</ComboboxEmpty>
          <ComboboxGroup heading="Fruits">
            <ComboboxItem value="pomme">Pomme</ComboboxItem>
            <ComboboxItem value="banane">Banane</ComboboxItem>
            <ComboboxItem disabled value="fraise">
              Fraise indisponible
            </ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup heading="Legumes">
            <ComboboxItem value="carotte">Carotte</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  ));
}

function renderMulti(props?: React.ComponentProps<typeof ComboboxMulti>) {
  return renderComboboxWithPortal((portalContainer) => (
    <ComboboxMulti {...props}>
      <ComboboxTrigger aria-label="Choix multiple" />
      <ComboboxContent container={portalContainer}>
        <ComboboxInput placeholder="Rechercher" />
        <ComboboxList>
          <ComboboxEmpty>Aucun resultat</ComboboxEmpty>
          <ComboboxGroup heading="Fruits">
            <ComboboxItem value="pomme">Pomme</ComboboxItem>
            <ComboboxItem value="banane">Banane</ComboboxItem>
            <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </ComboboxContent>
    </ComboboxMulti>
  ));
}

function getComboboxPortal(container: HTMLElement) {
  return container.querySelector("[data-slot='combobox-portal']");
}

function getComboboxContent(container: HTMLElement) {
  return container.querySelector("[data-slot='combobox-content']");
}

function getComboboxInput(container: HTMLElement) {
  return container.querySelector("[data-slot='combobox-input']");
}

function getComboboxOption(container: HTMLElement, name: string) {
  return within(container).getByRole("option", { name });
}

function queryComboboxOption(container: HTMLElement, name: string) {
  return within(container).queryByRole("option", { name });
}

describe("Combobox", () => {
  it("renders root markers for single and multiple variants", () => {
    const { container: singleContainer } = renderSingle();

    expect(
      singleContainer.querySelector("[data-slot='combobox']"),
    ).toBeTruthy();

    const { container: multiContainer } = renderMulti();

    expect(
      multiContainer.querySelector("[data-slot='combobox-multi']"),
    ).toBeTruthy();
  });

  it("opens, selects an item, and closes in single mode", async () => {
    const onValueChange = vi.fn();

    const { container } = renderSingle({ onValueChange });

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeTruthy();
    });

    fireEvent.click(getComboboxOption(container, "Banane"));

    expect(onValueChange).toHaveBeenCalledWith("banane");

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeNull();
    });

    expect(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    ).toHaveTextContent("Banane");
  });

  it("keeps selected value unchanged when reselecting in single mode", async () => {
    const onValueChange = vi.fn();

    const { container } = renderSingle({ onValueChange, value: "pomme" });

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeTruthy();
    });

    fireEvent.click(getComboboxOption(container, "Pomme"));

    expect(onValueChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeNull();
    });
  });

  it("supports keyboard navigation and Enter selection", async () => {
    const onValueChange = vi.fn();

    const { container } = renderSingle({ onValueChange });

    const trigger = screen.getByRole("combobox", { name: "Choix de l option" });

    fireEvent.click(trigger);

    const input = await waitFor(() => {
      const node = getComboboxInput(container);
      if (!node) {
        throw new Error("Combobox input not mounted yet");
      }
      return node as HTMLElement;
    });

    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onValueChange).toHaveBeenCalled();
  });

  it("updates controlled value in single mode", async () => {
    function ControlledExample() {
      const [value, setValue] = useState("pomme");

      return (
        <>
          <span data-value={value} />
          <ComboboxTestHarness>
            {(portalContainer) => (
              <Combobox onValueChange={setValue} value={value}>
                <ComboboxTrigger aria-label="Choix controle" />
                <ComboboxContent container={portalContainer}>
                  <ComboboxInput placeholder="Rechercher" />
                  <ComboboxList>
                    <ComboboxItem value="pomme">Pomme</ComboboxItem>
                    <ComboboxItem value="banane">Banane</ComboboxItem>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            )}
          </ComboboxTestHarness>
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    fireEvent.click(screen.getByRole("combobox", { name: "Choix controle" }));

    await waitFor(() => {
      expect(queryComboboxOption(container, "Banane")).toBeInTheDocument();
    });

    fireEvent.click(getComboboxOption(container, "Banane"));

    await waitFor(() => {
      expect(container.querySelector("[data-value]")).toHaveAttribute(
        "data-value",
        "banane",
      );
    });
  });

  it("appends values and closes after each selection in multiple mode", async () => {
    function MultiControlledExample() {
      const [value, setValue] = useState<string[]>([]);

      return (
        <>
          <span data-value={value.join(",")} />
          <ComboboxTestHarness>
            {(portalContainer) => (
              <ComboboxMulti onValueChange={setValue} value={value}>
                <ComboboxTrigger aria-label="Choix multiple" />
                <ComboboxContent container={portalContainer}>
                  <ComboboxInput placeholder="Rechercher" />
                  <ComboboxList>
                    <ComboboxItem value="pomme">Pomme</ComboboxItem>
                    <ComboboxItem value="banane">Banane</ComboboxItem>
                    <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
                  </ComboboxList>
                </ComboboxContent>
              </ComboboxMulti>
            )}
          </ComboboxTestHarness>
        </>
      );
    }

    const { container } = render(<MultiControlledExample />);

    fireEvent.click(screen.getByRole("combobox", { name: "Choix multiple" }));

    await waitFor(() => {
      expect(queryComboboxOption(container, "Pomme")).toBeInTheDocument();
    });

    fireEvent.click(getComboboxOption(container, "Pomme"));

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeNull();
    });

    fireEvent.click(screen.getByRole("combobox", { name: "Choix multiple" }));

    await waitFor(() => {
      expect(queryComboboxOption(container, "Banane")).toBeInTheDocument();
    });

    fireEvent.click(getComboboxOption(container, "Banane"));

    await waitFor(() => {
      expect(container.querySelector("[data-value]")).toHaveAttribute(
        "data-value",
        "pomme,banane",
      );
    });

    expect(
      screen.getByRole("combobox", { name: "Choix multiple" }),
    ).toHaveTextContent("Pomme +1");
  });

  it("keeps selected values unchanged when reselecting in multiple mode", async () => {
    const onValueChange = vi.fn();

    const { container } = renderMulti({ onValueChange, value: ["pomme"] });

    fireEvent.click(screen.getByRole("combobox", { name: "Choix multiple" }));

    await waitFor(() => {
      expect(queryComboboxOption(container, "Pomme")).toBeInTheDocument();
    });

    fireEvent.click(getComboboxOption(container, "Pomme"));

    expect(onValueChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeNull();
    });
  });

  it("does not select disabled items", async () => {
    const onValueChange = vi.fn();

    const { container } = renderSingle({ onValueChange });

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(
        queryComboboxOption(container, "Fraise indisponible"),
      ).toBeInTheDocument();
    });

    fireEvent.click(getComboboxOption(container, "Fraise indisponible"));

    expect(onValueChange).not.toHaveBeenCalledWith("fraise");
  });

  it("shows empty state when filtering has no match", async () => {
    const { container } = renderSingle();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    const input = await waitFor(() => {
      const node = getComboboxInput(container);
      if (!node) {
        throw new Error("Combobox input not mounted yet");
      }
      return node as HTMLInputElement;
    });

    fireEvent.change(input, { target: { value: "zzz" } });

    await waitFor(() => {
      expect(screen.getByText("Aucun resultat")).toBeInTheDocument();
    });
  });

  it("applies slot and semantic class contracts", async () => {
    const { container } = renderSingle();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeTruthy();
    });

    const trigger = container.querySelector(
      "[data-slot='combobox-trigger']",
    ) as HTMLElement | null;
    const content = getComboboxContent(container) as HTMLElement | null;
    const item = container.querySelector(
      "[data-slot='combobox-item']",
    ) as HTMLElement | null;

    expect(container.querySelector("[data-slot='combobox']")).toBeTruthy();
    expect(getComboboxPortal(container)).toBeTruthy();
    expect(
      container.querySelector("[data-slot='combobox-input-wrapper']"),
    ).toBeTruthy();
    expect(getComboboxInput(container)).toBeTruthy();
    expect(container.querySelector("[data-slot='combobox-list']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='combobox-group']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='combobox-separator']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='combobox-item-indicator']"),
    ).toBeTruthy();

    expect(trigger?.className ?? "").toContain("border-input");
    expect(trigger?.className ?? "").toContain("cursor-pointer");
    expect(trigger?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(trigger?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");

    expect(item?.className ?? "").toContain("cursor-pointer");
    expect(item?.className ?? "").toContain("data-[selected=true]:bg-accent");
    expect(item?.className ?? "").toContain(
      "data-[disabled=true]:pointer-events-none",
    );
  });

  it("merges className and supports refs", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const inputRef = createRef<HTMLInputElement>();
    const listRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    const { container } = renderComboboxWithPortal((portalContainer) => (
      <Combobox defaultOpen>
        <ComboboxTrigger
          className="declencheur-personnalise"
          ref={triggerRef}
        />
        <ComboboxContent
          className="contenu-personnalise"
          container={portalContainer}
        >
          <ComboboxInput
            className="saisie-personnalisee"
            placeholder="Rechercher"
            ref={inputRef}
          />
          <ComboboxList className="liste-personnalisee" ref={listRef}>
            <ComboboxItem
              className="item-personnalise"
              ref={itemRef}
              value="pomme"
            >
              Pomme
            </ComboboxItem>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    ));

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeTruthy();
    });

    expect(container.querySelector(".declencheur-personnalise")).toBeTruthy();
    expect(container.querySelector(".contenu-personnalise")).toBeTruthy();
    expect(container.querySelector(".saisie-personnalisee")).toBeTruthy();
    expect(container.querySelector(".liste-personnalisee")).toBeTruthy();
    expect(container.querySelector(".item-personnalise")).toBeTruthy();

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderSingle();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(getComboboxContent(container)).toBeTruthy();
    });

    const results = await axe(getComboboxPortal(container)!);

    expect(results).toHaveNoViolations();
  });
});
