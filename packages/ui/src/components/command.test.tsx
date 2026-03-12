import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe("Command", () => {
  function renderCommand(props?: React.ComponentProps<typeof Command>) {
    return render(
      <Command {...props}>
        <CommandInput placeholder="Rechercher une action" />
        <CommandList>
          <CommandEmpty>Aucun resultat</CommandEmpty>
          <CommandGroup heading="Actions rapides">
            <CommandItem value="profil">Profil</CommandItem>
            <CommandItem value="parametres">Parametres</CommandItem>
            <CommandItem disabled value="support">
              Support prioritaire
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navigation">
            <CommandItem value="dashboard">
              Tableau de bord
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
  }

  it("renders base command surface and slots", () => {
    const { container } = renderCommand();

    expect(container.querySelector("[data-slot='command']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='command-input-wrapper']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='command-input']")).toBeTruthy();
    expect(container.querySelector("[data-slot='command-list']")).toBeTruthy();
    expect(container.querySelector("[data-slot='command-group']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='command-group-heading']"),
    ).toBeTruthy();
    expect(container.querySelector("[data-slot='command-item']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='command-separator']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='command-shortcut']"),
    ).toBeTruthy();
  });

  it("opens and closes CommandDialog with Escape", async () => {
    render(
      <CommandDialog defaultOpen>
        <CommandInput placeholder="Rechercher" />
        <CommandList>
          <CommandItem value="profil">Profil</CommandItem>
        </CommandList>
      </CommandDialog>,
    );

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='command-dialog']"),
      ).toBeTruthy();
      expect(
        document.querySelector("[data-slot='dialog-content']"),
      ).toBeTruthy();
    });

    const dialogContent = document.querySelector(
      "[data-slot='dialog-content']",
    ) as HTMLElement | null;

    fireEvent.keyDown(dialogContent ?? document.body, {
      key: "Escape",
      code: "Escape",
    });

    await waitFor(() => {
      expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    });
  });

  it("supports keyboard navigation and Enter selection", () => {
    const onSelect = vi.fn();

    render(
      <Command>
        <CommandInput placeholder="Rechercher" />
        <CommandList>
          <CommandItem onSelect={onSelect} value="profil">
            Profil
          </CommandItem>
          <CommandItem value="parametres">Parametres</CommandItem>
        </CommandList>
      </Command>,
    );

    const input = screen.getByPlaceholderText("Rechercher");

    input.focus();
    fireEvent.keyDown(input, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSelect).toHaveBeenCalled();
  });

  it("updates controlled value through onValueChange", async () => {
    function ControlledExample() {
      const [value, setValue] = useState("profil");

      return (
        <>
          <span data-value={value} />
          <Command onValueChange={setValue} value={value}>
            <CommandInput placeholder="Rechercher" />
            <CommandList>
              <CommandItem value="profil">Profil</CommandItem>
              <CommandItem value="mode-expert">Mode expert</CommandItem>
            </CommandList>
          </Command>
        </>
      );
    }

    const { container } = render(<ControlledExample />);

    fireEvent.click(screen.getByText("Mode expert"));

    await waitFor(() => {
      const state = container.querySelector("[data-value]");
      expect(state).toHaveAttribute("data-value", "mode-expert");
    });
  });

  it("does not select disabled item", () => {
    const onSelect = vi.fn();

    render(
      <Command>
        <CommandInput placeholder="Rechercher" />
        <CommandList>
          <CommandItem disabled onSelect={onSelect} value="support">
            Support prioritaire
          </CommandItem>
        </CommandList>
      </Command>,
    );

    fireEvent.click(screen.getByText("Support prioritaire"));

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows empty state when there is no match", async () => {
    render(
      <Command>
        <CommandInput placeholder="Rechercher" />
        <CommandList>
          <CommandEmpty>Aucun resultat</CommandEmpty>
          <CommandItem value="profil">Profil</CommandItem>
        </CommandList>
      </Command>,
    );

    const input = screen.getByPlaceholderText("Rechercher");

    fireEvent.change(input, { target: { value: "zzz" } });

    await waitFor(() => {
      expect(screen.getByText("Aucun resultat")).toBeInTheDocument();
    });
  });

  it("applies semantic class contracts on root, group, and items", () => {
    const { container } = renderCommand();

    const root = container.querySelector("[data-slot='command']");
    const group = container.querySelector("[data-slot='command-group']");
    const item = container.querySelector("[data-slot='command-item']");

    expect(root?.className ?? "").toContain("bg-popover");
    expect(root?.className ?? "").toContain("text-popover-foreground");

    expect(group?.className ?? "").toContain("[&_[cmdk-group-heading]]:px-2");
    expect(group?.className ?? "").toContain(
      "[&_[cmdk-group-heading]]:text-xs",
    );

    expect(item?.className ?? "").toContain("data-[selected=true]:bg-accent");
    expect(item?.className ?? "").toContain("cursor-pointer");
    expect(item?.className ?? "").toContain(
      "data-[selected=true]:text-accent-foreground",
    );
    expect(item?.className ?? "").toContain(
      "data-[disabled=true]:pointer-events-none",
    );
    expect(item?.className ?? "").toContain("data-[disabled=true]:opacity-50");
  });

  it("merges className on command slots", () => {
    const { container } = render(
      <Command className="commande-personnalisee">
        <CommandInput
          className="saisie-personnalisee"
          placeholder="Rechercher"
        />
        <CommandList className="liste-personnalisee">
          <CommandGroup className="groupe-personnalise" heading="Actions">
            <CommandItem className="item-personnalise" value="profil">
              Profil
              <CommandShortcut className="raccourci-personnalise">
                ⌘P
              </CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator className="separateur-personnalise" />
        </CommandList>
      </Command>,
    );

    expect(container.querySelector(".commande-personnalisee")).toBeTruthy();
    expect(container.querySelector(".saisie-personnalisee")).toBeTruthy();
    expect(container.querySelector(".liste-personnalisee")).toBeTruthy();
    expect(container.querySelector(".groupe-personnalise")).toBeTruthy();
    expect(container.querySelector(".item-personnalise")).toBeTruthy();
    expect(container.querySelector(".separateur-personnalise")).toBeTruthy();
    expect(container.querySelector(".raccourci-personnalise")).toBeTruthy();
  });

  it("supports refs for command, input, list, and item", () => {
    const commandRef = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const listRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    render(
      <Command ref={commandRef}>
        <CommandInput placeholder="Rechercher" ref={inputRef} />
        <CommandList ref={listRef}>
          <CommandItem ref={itemRef} value="profil">
            Profil
          </CommandItem>
        </CommandList>
      </Command>,
    );

    expect(commandRef.current).toBeInstanceOf(HTMLDivElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Command>
        <CommandInput placeholder="Rechercher une action" />
        <CommandList>
          <CommandEmpty>Aucun resultat</CommandEmpty>
          <CommandItem value="profil">Profil</CommandItem>
          <CommandItem value="parametres">Parametres</CommandItem>
        </CommandList>
      </Command>,
    );

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
