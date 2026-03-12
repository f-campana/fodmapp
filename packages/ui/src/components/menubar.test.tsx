import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";

describe("Menubar", () => {
  function openMenuByTriggerName(name: string) {
    const trigger = screen.getByRole("menuitem", { name });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    fireEvent.click(trigger);
    return trigger;
  }

  function renderMenubar(props?: React.ComponentProps<typeof Menubar>) {
    return render(
      <Menubar {...props}>
        <MenubarMenu>
          <MenubarTrigger>Fichier</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Mon compte</MenubarLabel>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarItem>
                Profil
                <MenubarShortcut>P</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>Parametres</MenubarItem>
              <MenubarItem disabled>Support</MenubarItem>
            </MenubarGroup>
            <MenubarSub>
              <MenubarSubTrigger>Parametres avances</MenubarSubTrigger>
              <MenubarPortal>
                <MenubarSubContent>
                  <MenubarItem>Regles de substitution</MenubarItem>
                </MenubarSubContent>
              </MenubarPortal>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
  }

  it("opens and closes from trigger in uncontrolled mode", async () => {
    renderMenubar();

    openMenuByTriggerName("Fichier");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeTruthy();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderMenubar();

    openMenuByTriggerName("Fichier");

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='menubar-content']");
      if (!node) {
        throw new Error("menubar content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeNull();
    });
  });

  it("supports keyboard navigation in root menu", async () => {
    renderMenubar();

    const trigger = screen.getByRole("menuitem", { name: "Fichier" });

    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown", code: "ArrowDown" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeTruthy();
    });

    const firstItem = screen.getByRole("menuitem", { name: /Profil/ });

    fireEvent.keyDown(firstItem, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(firstItem, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(firstItem, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeNull();
    });
  });

  it("opens submenu with ArrowRight and closes with ArrowLeft/Escape", async () => {
    renderMenubar();

    openMenuByTriggerName("Fichier");

    const subTrigger = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Parametres avances" });
    });

    subTrigger.focus();
    fireEvent.keyDown(subTrigger, { key: "ArrowRight", code: "ArrowRight" });

    const subContent = await waitFor(() => {
      const node = document.querySelector("[data-slot='menubar-sub-content']");
      if (!node) {
        throw new Error("menubar submenu content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(subContent, { key: "ArrowLeft", code: "ArrowLeft" });
    fireEvent.keyDown(subContent, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-sub-content']"),
      ).toBeNull();
    });
  });

  it("toggles checkbox item state and callback semantics", async () => {
    function CheckboxExample() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <span data-state-text={checked ? "active" : "inactive"} />
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Affichage</MenubarTrigger>
              <MenubarContent>
                <MenubarCheckboxItem
                  checked={checked}
                  onCheckedChange={(next) => setChecked(next === true)}
                >
                  Activer les notifications
                </MenubarCheckboxItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </>
      );
    }

    const { container } = render(<CheckboxExample />);

    openMenuByTriggerName("Affichage");

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
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Methode</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup
                value={value}
                onValueChange={(next) => {
                  setValue(next);
                  onValueChange(next);
                }}
              >
                <MenubarRadioItem value="profil">Profil</MenubarRadioItem>
                <MenubarRadioItem value="expert">Mode expert</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    }

    render(<RadioExample />);

    openMenuByTriggerName("Methode");

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
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Support</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled onSelect={onSelect}>
              Support prioritaire
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    openMenuByTriggerName("Support");

    const disabledItem = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Support prioritaire" });
    });

    fireEvent.click(disabledItem);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders expected slots across root, menu, submenu, and item indicators", async () => {
    const { container } = renderMenubar();

    openMenuByTriggerName("Fichier");

    const subTrigger = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Parametres avances" });
    });

    fireEvent.keyDown(subTrigger, { key: "ArrowRight", code: "ArrowRight" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-sub-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='menubar']")).toBeTruthy();
    expect(container.querySelector("[data-slot='menubar-menu']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='menubar-trigger']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='menubar-portal']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='menubar-content']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='menubar-group']")).toBeTruthy();
    expect(document.querySelector("[data-slot='menubar-item']")).toBeTruthy();
    expect(document.querySelector("[data-slot='menubar-label']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='menubar-separator']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='menubar-shortcut']"),
    ).toBeTruthy();
    expect(document.querySelector("[data-slot='menubar-sub']")).toBeTruthy();
    expect(
      document.querySelector("[data-slot='menubar-sub-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='menubar-sub-content']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts", async () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Classes</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Profil</MenubarItem>
            <MenubarSub open>
              <MenubarSubTrigger>Sous-menu</MenubarSubTrigger>
              <MenubarPortal>
                <MenubarSubContent>
                  <MenubarCheckboxItem checked>Actif</MenubarCheckboxItem>
                  <MenubarRadioGroup value="a">
                    <MenubarRadioItem value="a">Option A</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarPortal>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    openMenuByTriggerName("Classes");

    const content = await waitFor(() => {
      return document.querySelector(
        "[data-slot='menubar-content']",
      ) as HTMLElement | null;
    });

    const subContent = document.querySelector(
      "[data-slot='menubar-sub-content']",
    ) as HTMLElement | null;
    const item = document.querySelector(
      "[data-slot='menubar-item']",
    ) as HTMLElement | null;
    const subTrigger = document.querySelector(
      "[data-slot='menubar-sub-trigger']",
    ) as HTMLElement | null;
    const checkboxItem = document.querySelector(
      "[data-slot='menubar-checkbox-item']",
    ) as HTMLElement | null;
    const trigger = screen.getByRole("menuitem", { name: "Classes" });

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
    expect(trigger.className).toContain("cursor-pointer");
    expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    expect(trigger.className).not.toContain("focus-visible:ring-ring/50");
    expect(
      document.querySelector("[data-slot='menubar-item-indicator']"),
    ).toBeTruthy();
  });

  it("supports asChild trigger and item", async () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger asChild>
            <button type="button">Menu asChild</button>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem asChild>
              <a href="#profil">Ouvrir le profil</a>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    const trigger = openMenuByTriggerName("Menu asChild");
    const itemLink = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Ouvrir le profil" });
    });

    expect(trigger).toHaveAttribute("data-slot", "menubar-trigger");
    expect(itemLink).toHaveAttribute("data-slot", "menubar-item");
  });

  it("merges className on content, item, label, separator and shortcut", async () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Menu classes</MenubarTrigger>
          <MenubarContent className="contenu-personnalise">
            <MenubarLabel className="label-personnalise">
              Mon espace
            </MenubarLabel>
            <MenubarSeparator className="separateur-personnalise" />
            <MenubarItem className="item-personnalise">
              Profil
              <MenubarShortcut className="raccourci-personnalise">
                Ctrl+P
              </MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    openMenuByTriggerName("Menu classes");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeTruthy();
    });

    expect(
      document.querySelector("[data-slot='menubar-content']")?.className ?? "",
    ).toContain("contenu-personnalise");
    expect(
      document.querySelector("[data-slot='menubar-label']")?.className ?? "",
    ).toContain("label-personnalise");
    expect(
      document.querySelector("[data-slot='menubar-separator']")?.className ??
        "",
    ).toContain("separateur-personnalise");
    expect(
      document.querySelector("[data-slot='menubar-item']")?.className ?? "",
    ).toContain("item-personnalise");
    expect(
      document.querySelector("[data-slot='menubar-shortcut']")?.className ?? "",
    ).toContain("raccourci-personnalise");
  });

  it("forwards refs to trigger, content, and item", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger asChild ref={triggerRef}>
            <button type="button">Menu refs</button>
          </MenubarTrigger>
          <MenubarContent ref={contentRef}>
            <MenubarItem ref={itemRef}>Profil</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    openMenuByTriggerName("Menu refs");

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Menu accessibilite</MenubarTrigger>
          <MenubarContent>
            <MenubarLabel>Options</MenubarLabel>
            <MenubarItem>Profil</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    openMenuByTriggerName("Menu accessibilite");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeTruthy();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
