import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  function openContextMenu(name: string) {
    const trigger = screen.getByRole("button", { name });
    trigger.focus();
    fireEvent.pointerDown(trigger, { button: 2, ctrlKey: false });
    fireEvent.contextMenu(trigger);
    return trigger;
  }

  async function waitForContextMenuContent(scope: ParentNode = document) {
    return waitFor(() => {
      const node = scope.querySelector("[data-slot='context-menu-content']");
      if (!node) {
        throw new Error("context menu content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable in default composition", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <ContextMenu>
        <ContextMenuTrigger data-slot="custom-trigger">
          Zone contextuelle
        </ContextMenuTrigger>
        <ContextMenuContent
          container={portalContainer}
          data-slot="custom-content"
        >
          <ContextMenuLabel data-slot="custom-label">
            Mon compte
          </ContextMenuLabel>
          <ContextMenuSeparator data-slot="custom-separator" />
          <ContextMenuGroup data-slot="custom-group">
            <ContextMenuItem data-slot="custom-item">
              Profil
              <ContextMenuShortcut data-slot="custom-shortcut">
                P
              </ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSub open>
            <ContextMenuSubTrigger data-slot="custom-sub-trigger">
              Parametres avances
            </ContextMenuSubTrigger>
            <ContextMenuPortal container={portalContainer}>
              <ContextMenuSubContent data-slot="custom-sub-content">
                <ContextMenuCheckboxItem
                  checked
                  data-slot="custom-checkbox-item"
                >
                  Notifications
                </ContextMenuCheckboxItem>
                <ContextMenuRadioGroup
                  data-slot="custom-radio-group"
                  value="expert"
                >
                  <ContextMenuRadioItem
                    data-slot="custom-radio-item"
                    value="expert"
                  >
                    Mode expert
                  </ContextMenuRadioItem>
                </ContextMenuRadioGroup>
              </ContextMenuSubContent>
            </ContextMenuPortal>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );

    const trigger = screen.getByText("Zone contextuelle");
    fireEvent.pointerDown(trigger, { button: 2, ctrlKey: false });
    fireEvent.contextMenu(trigger);
    await waitForContextMenuContent(portalContainer);

    expect(container.querySelector("[data-slot='context-menu']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='context-menu-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-label']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-separator']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-group']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-item']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-shortcut']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-sub']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-sub-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-sub-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-checkbox-item']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-radio-group']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='context-menu-radio-item']"),
    ).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-content']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-label']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-separator']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-group']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-item']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-shortcut']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-sub-trigger']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-sub-content']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-checkbox-item']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-radio-group']"),
    ).toBeNull();
    expect(
      portalContainer.querySelector("[data-slot='custom-radio-item']"),
    ).toBeNull();
  });

  it("opens from right click, closes on Escape, and returns focus to the trigger", async () => {
    const user = userEvent.setup();

    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone contextuelle</button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>Profil</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    const trigger = openContextMenu("Zone contextuelle");

    await waitForContextMenuContent();

    await waitFor(() => {
      expect(["menu", "menuitem"]).toContain(
        document.activeElement?.getAttribute("role"),
      );
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='context-menu-content']"),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("allows trigger and item slot override when using asChild", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Zone asChild
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem asChild>
            <a data-slot="custom-item" href="#profil">
              Ouvrir le profil
            </a>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );

    openContextMenu("Zone asChild");
    await waitForContextMenuContent();

    expect(
      document.querySelector("[data-slot='custom-trigger']"),
    ).toHaveTextContent("Zone asChild");
    expect(
      screen.getByRole("menuitem", { name: "Ouvrir le profil" }),
    ).toHaveAttribute("data-slot", "custom-item");
    expect(
      document.querySelector("[data-slot='context-menu-trigger']"),
    ).toBeNull();
    expect(
      document.querySelector("[data-slot='context-menu-item']"),
    ).toBeNull();
  });

  it("updates checkbox and radio callbacks", async () => {
    const onValueChange = vi.fn();

    function SelectionExample() {
      const [checked, setChecked] = useState(false);
      const [value, setValue] = useState("profil");

      return (
        <>
          <span data-state-text={checked ? "active" : "inactive"} />
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <button type="button">Zone methode</button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuCheckboxItem
                checked={checked}
                onCheckedChange={(next) => setChecked(next === true)}
              >
                Activer les notifications
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuRadioGroup
                onValueChange={(next) => {
                  setValue(next);
                  onValueChange(next);
                }}
                value={value}
              >
                <ContextMenuRadioItem value="profil">
                  Profil
                </ContextMenuRadioItem>
                <ContextMenuRadioItem value="expert">
                  Mode expert
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuContent>
          </ContextMenu>
        </>
      );
    }

    render(<SelectionExample />);

    openContextMenu("Zone methode");

    const checkbox = await screen.findByRole("menuitemcheckbox", {
      name: "Activer les notifications",
    });
    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(document.querySelector("[data-state-text='active']")).toBeTruthy();
    });

    openContextMenu("Zone methode");

    const radio = screen.getByRole("menuitemradio", { name: "Mode expert" });
    await userEvent.click(radio);

    expect(onValueChange).toHaveBeenCalledWith("expert");
    await waitFor(() => {
      expect(radio).toHaveAttribute("aria-checked", "true");
    });
  });

  it("does not select disabled items", async () => {
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

    const item = await screen.findByRole("menuitem", {
      name: "Support prioritaire",
    });
    await userEvent.click(item);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps semantic classes and merges className on exposed compounds", async () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger asChild className="trigger-personnalise">
          <button type="button">Zone classes</button>
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

    const trigger = openContextMenu("Zone classes");
    const content = await waitForContextMenuContent();
    const item = screen.getByRole("menuitem", { name: /Profil/ });

    expect(trigger.className).toContain("trigger-personnalise");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain("data-[state=open]:animate-in");
    expect(content.className).toContain("contenu-personnalise");
    expect(item.className).toContain("focus:bg-accent");
    expect(item.className).toContain("focus:text-accent-foreground");
    expect(item.className).toContain("item-personnalise");
    expect(
      document.querySelector("[data-slot='context-menu-label']")?.className ??
        "",
    ).toContain("label-personnalise");
    expect(
      document.querySelector("[data-slot='context-menu-separator']")
        ?.className ?? "",
    ).toContain("separateur-personnalise");
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
    await waitForContextMenuContent();

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const auditRoot = document.createElement("main");
    const portalContainer = document.createElement("div");
    auditRoot.append(portalContainer);
    document.body.append(auditRoot);

    render(
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button type="button">Zone accessibilite</button>
        </ContextMenuTrigger>
        <ContextMenuContent container={portalContainer}>
          <ContextMenuItem>Profil</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
      { container: auditRoot },
    );

    openContextMenu("Zone accessibilite");
    await waitForContextMenuContent(portalContainer);

    expect(await axe(auditRoot)).toHaveNoViolations();
  });
});
