import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu", () => {
  function openMenuByTriggerName(name: string) {
    const trigger = screen.getByRole("button", { name });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    return trigger;
  }

  function renderDropdownMenu(
    props?: React.ComponentProps<typeof DropdownMenu>,
  ) {
    return render(
      <DropdownMenu {...props}>
        <DropdownMenuTrigger>Ouvrir les options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              Profil
              <DropdownMenuShortcut>P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>Parametres</DropdownMenuItem>
            <DropdownMenuItem disabled>Support</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Parametres avances</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Regles de substitution</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
  }

  it("opens and closes from trigger in uncontrolled mode", async () => {
    renderDropdownMenu();

    openMenuByTriggerName("Ouvrir les options");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-content']"),
      ).toBeTruthy();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-content']"),
      ).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderDropdownMenu();

    openMenuByTriggerName("Ouvrir les options");

    const content = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='dropdown-menu-content']",
      );
      if (!node) {
        throw new Error("dropdown menu content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-content']"),
      ).toBeNull();
    });
  });

  it("supports keyboard navigation in root menu", async () => {
    renderDropdownMenu();

    const trigger = screen.getByRole("button", { name: "Ouvrir les options" });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-content']"),
      ).toBeTruthy();
    });

    const firstItem = screen.getByRole("menuitem", { name: /Profil/ });

    fireEvent.keyDown(firstItem, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(firstItem, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(firstItem, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-content']"),
      ).toBeNull();
    });
  });

  it("opens submenu with ArrowRight and closes with ArrowLeft/Escape", async () => {
    renderDropdownMenu();

    openMenuByTriggerName("Ouvrir les options");

    const subTrigger = await waitFor(() => {
      const node = screen.getByRole("menuitem", {
        name: "Parametres avances",
      });
      return node;
    });

    subTrigger.focus();
    fireEvent.keyDown(subTrigger, { key: "ArrowRight", code: "ArrowRight" });

    const subContent = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='dropdown-menu-sub-content']",
      );
      if (!node) {
        throw new Error("dropdown submenu content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(subContent, { key: "ArrowLeft", code: "ArrowLeft" });
    fireEvent.keyDown(subContent, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-sub-content']"),
      ).toBeNull();
    });
  });

  it("toggles checkbox item state and callback semantics", async () => {
    function CheckboxExample() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <span data-state-text={checked ? "active" : "inactive"} />
          <DropdownMenu>
            <DropdownMenuTrigger>Options de notification</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={checked}
                onCheckedChange={(next) => setChecked(next === true)}
              >
                Activer les notifications
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    }

    const { container } = render(<CheckboxExample />);

    openMenuByTriggerName("Options de notification");

    const item = await waitFor(() => {
      return screen.getByRole("menuitemcheckbox", {
        name: "Activer les notifications",
      });
    });

    expect(item).toHaveAttribute("aria-checked", "false");

    fireEvent.click(item);

    await waitFor(() => {
      const state = container.querySelector("[data-state-text]");
      expect(state).toHaveAttribute("data-state-text", "active");
    });
  });

  it("updates radio group selection and callback semantics", async () => {
    const onValueChange = vi.fn();

    function RadioExample() {
      const [value, setValue] = useState("profil");
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Methode d'affichage</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup
              value={value}
              onValueChange={(next) => {
                setValue(next);
                onValueChange(next);
              }}
            >
              <DropdownMenuRadioItem value="profil">
                Profil
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="expert">
                Mode expert
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    render(<RadioExample />);

    openMenuByTriggerName("Methode d'affichage");

    const expert = await waitFor(() => {
      return screen.getByRole("menuitemradio", { name: "Mode expert" });
    });

    fireEvent.click(expert);

    expect(onValueChange).toHaveBeenCalledWith("expert");
    await waitFor(() => {
      expect(expert).toHaveAttribute("aria-checked", "true");
    });
  });

  it("does not select disabled item", async () => {
    const onSelect = vi.fn();

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu support</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={onSelect}>
            Support prioritaire
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    openMenuByTriggerName("Menu support");

    const disabledItem = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Support prioritaire" });
    });

    fireEvent.click(disabledItem);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders expected slots across root, submenu, and item indicators", async () => {
    const { container } = renderDropdownMenu();

    openMenuByTriggerName("Ouvrir les options");

    const subTrigger = await waitFor(() =>
      screen.getByRole("menuitem", { name: "Parametres avances" }),
    );

    fireEvent.keyDown(subTrigger, { key: "ArrowRight", code: "ArrowRight" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-sub-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='dropdown-menu']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='dropdown-menu-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-portal']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-content']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-group']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-item']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-label']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-separator']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-shortcut']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-sub']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-sub-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='dropdown-menu-sub-content']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Profil</DropdownMenuItem>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>Sous-menu</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuCheckboxItem checked>
                  Actif
                </DropdownMenuCheckboxItem>
                <DropdownMenuRadioGroup value="a">
                  <DropdownMenuRadioItem value="a">
                    Option A
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const content = document.querySelector(
      "[data-slot='dropdown-menu-content']",
    ) as HTMLElement | null;
    const subContent = document.querySelector(
      "[data-slot='dropdown-menu-sub-content']",
    ) as HTMLElement | null;
    const item = document.querySelector(
      "[data-slot='dropdown-menu-item']",
    ) as HTMLElement | null;
    const subTrigger = document.querySelector(
      "[data-slot='dropdown-menu-sub-trigger']",
    ) as HTMLElement | null;
    const checkboxItem = document.querySelector(
      "[data-slot='dropdown-menu-checkbox-item']",
    ) as HTMLElement | null;

    expect(content?.className ?? "").toContain("bg-popover");
    expect(content?.className ?? "").toContain("text-popover-foreground");
    expect(content?.className ?? "").toContain("data-[state=open]:animate-in");

    expect(subContent?.className ?? "").toContain("bg-popover");
    expect(subContent?.className ?? "").toContain("text-popover-foreground");
    expect(subContent?.className ?? "").toContain(
      "data-[state=open]:zoom-in-95",
    );

    expect(item?.className ?? "").toContain("focus:bg-accent");
    expect(item?.className ?? "").toContain("focus:text-accent-foreground");
    expect(item?.className ?? "").toContain("cursor-pointer");

    expect(subTrigger?.className ?? "").toContain(
      "data-[state=open]:bg-accent",
    );
    expect(subTrigger?.className ?? "").toContain(
      "data-[state=open]:text-accent-foreground",
    );
    expect(subTrigger?.className ?? "").toContain("cursor-pointer");

    expect(checkboxItem?.className ?? "").toContain("cursor-pointer");
    expect(checkboxItem?.className ?? "").toContain(
      "data-[disabled]:pointer-events-none",
    );
    expect(
      document.querySelector("[data-slot='dropdown-menu-item-indicator']"),
    ).toBeTruthy();
  });

  it("supports asChild trigger and item", async () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Menu asChild</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <a href="#profil">Ouvrir le profil</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = openMenuByTriggerName("Menu asChild");
    const itemLink = await waitFor(() =>
      screen.getByRole("menuitem", { name: "Ouvrir le profil" }),
    );

    expect(trigger).toHaveAttribute("data-slot", "dropdown-menu-trigger");
    expect(itemLink).toHaveAttribute("data-slot", "dropdown-menu-item");
  });

  it("merges className on content, item, label, separator and shortcut", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Menu classes</DropdownMenuTrigger>
        <DropdownMenuContent className="contenu-personnalise">
          <DropdownMenuLabel className="label-personnalise">
            Mon espace
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="separateur-personnalise" />
          <DropdownMenuItem className="item-personnalise">
            Profil
            <DropdownMenuShortcut className="raccourci-personnalise">
              Ctrl+P
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(
      document.querySelector("[data-slot='dropdown-menu-content']")
        ?.className ?? "",
    ).toContain("contenu-personnalise");
    expect(
      document.querySelector("[data-slot='dropdown-menu-label']")?.className ??
        "",
    ).toContain("label-personnalise");
    expect(
      document.querySelector("[data-slot='dropdown-menu-separator']")
        ?.className ?? "",
    ).toContain("separateur-personnalise");
    expect(
      document.querySelector("[data-slot='dropdown-menu-item']")?.className ??
        "",
    ).toContain("item-personnalise");
    expect(
      document.querySelector("[data-slot='dropdown-menu-shortcut']")
        ?.className ?? "",
    ).toContain("raccourci-personnalise");
  });

  it("forwards refs to trigger, content, and item", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger ref={triggerRef}>Menu refs</DropdownMenuTrigger>
        <DropdownMenuContent ref={contentRef}>
          <DropdownMenuItem ref={itemRef}>Profil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Menu accessibilite</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Options</DropdownMenuLabel>
          <DropdownMenuItem>Profil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
