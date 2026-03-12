import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";

describe("ContextMenu", () => {
  function openContextMenu(triggerLabel: string) {
    const trigger = screen.getByRole("button", { name: triggerLabel });
    fireEvent.pointerDown(trigger, { button: 2, ctrlKey: false });
    fireEvent.contextMenu(trigger);
    return trigger;
  }

  function renderContextMenu(props?: React.ComponentProps<typeof ContextMenu>) {
    return render(
      <ContextMenu {...props}>
        <ContextMenuTrigger asChild>
          <button type="button">Zone contextuelle</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Mon compte</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem>
              Profil
              <ContextMenuShortcut>P</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Parametres</ContextMenuItem>
            <ContextMenuItem disabled>Support</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSub>
            <ContextMenuSubTrigger>Parametres avances</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuItem>Regles de substitution</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );
  }

  it("opens from right click and closes on outside click", async () => {
    renderContextMenu();

    openContextMenu("Zone contextuelle");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeTruthy();
    });

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeNull();
    });
  });

  it("closes on Escape", async () => {
    renderContextMenu();

    openContextMenu("Zone contextuelle");

    const content = await waitFor(() => {
      const node = document.querySelector("[data-slot='context-menu-content']");
      if (!node) {
        throw new Error("context menu content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(content, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeNull();
    });
  });

  it("supports keyboard navigation in root menu", async () => {
    renderContextMenu();

    openContextMenu("Zone contextuelle");

    const firstItem = await waitFor(() => {
      return screen.getByRole("menuitem", { name: /Profil/ });
    });

    firstItem.focus();
    fireEvent.keyDown(firstItem, { key: "ArrowDown", code: "ArrowDown" });
    fireEvent.keyDown(firstItem, { key: "ArrowUp", code: "ArrowUp" });
    fireEvent.keyDown(firstItem, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeNull();
    });
  });

  it("opens submenu with ArrowRight and closes with ArrowLeft/Escape", async () => {
    renderContextMenu();

    openContextMenu("Zone contextuelle");

    const subTrigger = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Parametres avances" });
    });

    subTrigger.focus();
    fireEvent.keyDown(subTrigger, { key: "ArrowRight", code: "ArrowRight" });

    const subContent = await waitFor(() => {
      const node = document.querySelector(
        "[data-slot='context-menu-sub-content']",
      );
      if (!node) {
        throw new Error("context submenu content not mounted yet");
      }
      return node as HTMLElement;
    });

    fireEvent.keyDown(subContent, { key: "ArrowLeft", code: "ArrowLeft" });
    fireEvent.keyDown(subContent, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-sub-content']"),
      ).toBeNull();
    });
  });

  it("toggles checkbox item state and callback semantics", async () => {
    function CheckboxExample() {
      const [checked, setChecked] = useState(false);
      return (
        <>
          <span data-state-text={checked ? "active" : "inactive"} />
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button type="button">Zone notifications</button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuCheckboxItem
                checked={checked}
                onCheckedChange={(next) => setChecked(next === true)}
              >
                Activer les notifications
              </ContextMenuCheckboxItem>
            </ContextMenuContent>
          </ContextMenu>
        </>
      );
    }

    const { container } = render(<CheckboxExample />);

    openContextMenu("Zone notifications");

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
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button type="button">Zone methode</button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup
              value={value}
              onValueChange={(next) => {
                setValue(next);
                onValueChange(next);
              }}
            >
              <ContextMenuRadioItem value="profil">Profil</ContextMenuRadioItem>
              <ContextMenuRadioItem value="expert">
                Mode expert
              </ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    render(<RadioExample />);

    openContextMenu("Zone methode");

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
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone support</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem disabled onSelect={onSelect}>
            Support prioritaire
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    openContextMenu("Zone support");

    const disabledItem = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Support prioritaire" });
    });

    fireEvent.click(disabledItem);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("renders expected slots across root, submenu, and item indicators", async () => {
    const { container } = renderContextMenu();

    openContextMenu("Zone contextuelle");

    const subTrigger = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Parametres avances" });
    });

    fireEvent.keyDown(subTrigger, { key: "ArrowRight", code: "ArrowRight" });

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-sub-content']"),
      ).toBeTruthy();
    });

    expect(container.querySelector("[data-slot='context-menu']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='context-menu-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-portal']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-content']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-group']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-item']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-label']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-separator']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-shortcut']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-sub']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-sub-trigger']"),
    ).toBeTruthy();
    expect(
      document.querySelector("[data-slot='context-menu-sub-content']"),
    ).toBeTruthy();
  });

  it("applies semantic class contracts", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone classes</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Profil</ContextMenuItem>
          <ContextMenuSub open>
            <ContextMenuSubTrigger>Sous-menu</ContextMenuSubTrigger>
            <ContextMenuPortal>
              <ContextMenuSubContent>
                <ContextMenuCheckboxItem checked>Actif</ContextMenuCheckboxItem>
                <ContextMenuRadioGroup value="a">
                  <ContextMenuRadioItem value="a">
                    Option A
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );

    openContextMenu("Zone classes");

    const content = await waitFor(() => {
      return document.querySelector(
        "[data-slot='context-menu-content']",
      ) as HTMLElement | null;
    });

    const subContent = document.querySelector(
      "[data-slot='context-menu-sub-content']",
    ) as HTMLElement | null;
    const item = document.querySelector(
      "[data-slot='context-menu-item']",
    ) as HTMLElement | null;
    const subTrigger = document.querySelector(
      "[data-slot='context-menu-sub-trigger']",
    ) as HTMLElement | null;
    const checkboxItem = document.querySelector(
      "[data-slot='context-menu-checkbox-item']",
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
      document.querySelector("[data-slot='context-menu-item-indicator']"),
    ).toBeTruthy();
  });

  it("supports asChild trigger and item", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone asChild</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem asChild>
            <a href="#profil">Ouvrir le profil</a>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    const trigger = openContextMenu("Zone asChild");
    const itemLink = await waitFor(() => {
      return screen.getByRole("menuitem", { name: "Ouvrir le profil" });
    });

    expect(trigger).toHaveAttribute("data-slot", "context-menu-trigger");
    expect(itemLink).toHaveAttribute("data-slot", "context-menu-item");
  });

  it("merges className on content, item, label, separator and shortcut", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone classes merge</button>
        </ContextMenuTrigger>
        <ContextMenuContent className="contenu-personnalise">
          <ContextMenuLabel className="label-personnalise">
            Mon espace
          </ContextMenuLabel>
          <ContextMenuSeparator className="separateur-personnalise" />
          <ContextMenuItem className="item-personnalise">
            Profil
            <ContextMenuShortcut className="raccourci-personnalise">
              Ctrl+P
            </ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    openContextMenu("Zone classes merge");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeTruthy();
    });

    expect(
      document.querySelector("[data-slot='context-menu-content']")?.className ??
        "",
    ).toContain("contenu-personnalise");
    expect(
      document.querySelector("[data-slot='context-menu-label']")?.className ??
        "",
    ).toContain("label-personnalise");
    expect(
      document.querySelector("[data-slot='context-menu-separator']")
        ?.className ?? "",
    ).toContain("separateur-personnalise");
    expect(
      document.querySelector("[data-slot='context-menu-item']")?.className ??
        "",
    ).toContain("item-personnalise");
    expect(
      document.querySelector("[data-slot='context-menu-shortcut']")
        ?.className ?? "",
    ).toContain("raccourci-personnalise");
  });

  it("forwards refs to trigger, content, and item", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();

    render(
      <ContextMenu>
        <ContextMenuTrigger asChild ref={triggerRef}>
          <button type="button">Zone refs</button>
        </ContextMenuTrigger>
        <ContextMenuContent ref={contentRef}>
          <ContextMenuItem ref={itemRef}>Profil</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    openContextMenu("Zone refs");

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
      expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("has no obvious a11y violations", async () => {
    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone accessibilite</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuLabel>Options</ContextMenuLabel>
          <ContextMenuItem>Profil</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    openContextMenu("Zone accessibilite");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeTruthy();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
