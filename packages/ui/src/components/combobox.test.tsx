import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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

function renderSingle(props?: React.ComponentProps<typeof Combobox>) {
  return render(
    <Combobox {...props}>
      <ComboboxTrigger aria-label="Choix de l option" />
      <ComboboxContent>
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
    </Combobox>,
  );
}

function renderMulti(props?: React.ComponentProps<typeof ComboboxMulti>) {
  return render(
    <ComboboxMulti {...props}>
      <ComboboxTrigger aria-label="Choix multiple" />
      <ComboboxContent>
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
    </ComboboxMulti>,
  );
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

    renderSingle({ onValueChange });

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Banane"));

    expect(onValueChange).toHaveBeenCalledWith("banane");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeNull();
    });

    expect(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    ).toHaveTextContent("Banane");
  });

  it("keeps selected value unchanged when reselecting in single mode", async () => {
    const onValueChange = vi.fn();

    renderSingle({ onValueChange, value: "pomme" });

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("option", { name: "Pomme" }));

    expect(onValueChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeNull();
    });
  });

  it("supports keyboard navigation and Enter selection", async () => {
    const onValueChange = vi.fn();

    renderSingle({ onValueChange });

    const trigger = screen.getByRole("combobox", { name: "Choix de l option" });

    fireEvent.click(trigger);

    const input = await waitFor(() => {
      const node = document.querySelector("[data-slot='combobox-input']");
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
          <Combobox onValueChange={setValue} value={value}>
            <ComboboxTrigger aria-label="Choix controle" />
            <ComboboxContent>
              <ComboboxInput placeholder="Rechercher" />
              <ComboboxList>
                <ComboboxItem value="pomme">Pomme</ComboboxItem>
                <ComboboxItem value="banane">Banane</ComboboxItem>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    fireEvent.click(screen.getByRole("combobox", { name: "Choix controle" }));

    await waitFor(() => {
      expect(screen.getByText("Banane")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Banane"));

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
          <ComboboxMulti onValueChange={setValue} value={value}>
            <ComboboxTrigger aria-label="Choix multiple" />
            <ComboboxContent>
              <ComboboxInput placeholder="Rechercher" />
              <ComboboxList>
                <ComboboxItem value="pomme">Pomme</ComboboxItem>
                <ComboboxItem value="banane">Banane</ComboboxItem>
                <ComboboxItem value="kiwi">Kiwi</ComboboxItem>
              </ComboboxList>
            </ComboboxContent>
          </ComboboxMulti>
        </>
      );
    }

    const { container } = render(<MultiControlledExample />);

    fireEvent.click(screen.getByRole("combobox", { name: "Choix multiple" }));

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Pomme" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("option", { name: "Pomme" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeNull();
    });

    fireEvent.click(screen.getByRole("combobox", { name: "Choix multiple" }));

    await waitFor(() => {
      expect(screen.getByText("Banane")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Banane"));

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

    renderMulti({ onValueChange, value: ["pomme"] });

    fireEvent.click(screen.getByRole("combobox", { name: "Choix multiple" }));

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Pomme" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("option", { name: "Pomme" }));

    expect(onValueChange).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeNull();
    });
  });

  it("does not select disabled items", async () => {
    const onValueChange = vi.fn();

    renderSingle({ onValueChange });

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(screen.getByText("Fraise indisponible")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Fraise indisponible"));

    expect(onValueChange).not.toHaveBeenCalledWith("fraise");
  });

  it("shows empty state when filtering has no match", async () => {
    renderSingle();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    const input = await waitFor(() => {
      const node = document.querySelector("[data-slot='combobox-input']");
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
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeTruthy();
    });

    const trigger = container.querySelector(
      "[data-slot='combobox-trigger']",
    ) as HTMLElement | null;
    const content = document.querySelector(
      "[data-slot='combobox-content']",
    ) as HTMLElement | null;
    const item = document.querySelector(
      "[data-slot='combobox-item']",
    ) as HTMLElement | null;

    expect(container.querySelector("[data-slot='combobox']")).toBeTruthy();
    expect(document.querySelector("[data-slot='combobox-portal']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='combobox-input-wrapper']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='combobox-input']")).toBeTruthy();
    expect(document.querySelector("[data-slot='combobox-list']")).toBeTruthy();
    expect(document.querySelector("[data-slot='combobox-group']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='combobox-separator']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='combobox-item-indicator']"),
    ).toBeTruthy();

    expect(trigger?.className ?? "").toContain("border-input");
    expect(trigger?.className ?? "").toContain("focus-visible:ring-ring-soft");
    expect(trigger?.className ?? "").not.toContain(
      "focus-visible:ring-ring/50",
    );

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");

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

    const { container } = render(
      <Combobox defaultOpen>
        <ComboboxTrigger
          className="declencheur-personnalise"
          ref={triggerRef}
        />
        <ComboboxContent className="contenu-personnalise">
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
      </Combobox>,
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector(".declencheur-personnalise")).toBeTruthy();
    expect(document.querySelector(".contenu-personnalise")).toBeTruthy();
    expect(document.querySelector(".saisie-personnalisee")).toBeTruthy();
    expect(document.querySelector(".liste-personnalisee")).toBeTruthy();
    expect(document.querySelector(".item-personnalise")).toBeTruthy();

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    renderSingle();

    fireEvent.click(
      screen.getByRole("combobox", { name: "Choix de l option" }),
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='combobox-content']"),
      ).toBeTruthy();
    });

    const results = await axe(
      document.querySelector("[data-slot='combobox-portal']")!,
    );

    expect(results).toHaveNoViolations();
  });
});
