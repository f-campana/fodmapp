import { createRef, useState } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  async function waitForMenubarContent(scope: ParentNode = document) {
    return waitFor(() => {
      const node = scope.querySelector("[data-slot='menubar-content']");
      if (!node) {
        throw new Error("menubar content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  function renderMenubar(
    props?: React.ComponentProps<typeof Menubar>,
    contentProps?: Partial<React.ComponentProps<typeof MenubarContent>>,
  ) {
    return render(
      <Menubar {...props}>
        <MenubarMenu>
          <MenubarTrigger>Fichier</MenubarTrigger>
          <MenubarContent {...contentProps}>
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
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );
  }

  it("keeps slot markers stable in default composition", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger data-slot="custom-trigger">Fichier</MenubarTrigger>
          <MenubarContent
            container={portalContainer}
            data-slot="custom-content"
          >
            <MenubarLabel data-slot="custom-label">Mon compte</MenubarLabel>
            <MenubarSeparator data-slot="custom-separator" />
            <MenubarGroup data-slot="custom-group">
              <MenubarItem data-slot="custom-item">
                Profil
                <MenubarShortcut data-slot="custom-shortcut">P</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
            <MenubarSub open>
              <MenubarSubTrigger data-slot="custom-sub-trigger">
                Parametres avances
              </MenubarSubTrigger>
              <MenubarPortal container={portalContainer}>
                <MenubarSubContent data-slot="custom-sub-content">
                  <MenubarCheckboxItem checked data-slot="custom-checkbox-item">
                    Notifications
                  </MenubarCheckboxItem>
                  <MenubarRadioGroup
                    data-slot="custom-radio-group"
                    value="expert"
                  >
                    <MenubarRadioItem
                      data-slot="custom-radio-item"
                      value="expert"
                    >
                      Mode expert
                    </MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarSubContent>
              </MenubarPortal>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await userEvent.click(screen.getByRole("menuitem", { name: "Fichier" }));
    await waitForMenubarContent(portalContainer);

    expect(container.querySelector("[data-slot='menubar']")).toBeTruthy();
    expect(container.querySelector("[data-slot='menubar-menu']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='menubar-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-label']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-separator']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-group']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-item']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-shortcut']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-sub']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-sub-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-sub-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-checkbox-item']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-radio-group']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='menubar-radio-item']"),
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

  it("opens from keyboard, closes on Escape, and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderMenubar();

    const trigger = screen.getByRole("menuitem", { name: "Fichier" });

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");

    await waitForMenubarContent();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(document.activeElement?.getAttribute("role")).toBe("menuitem");
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='menubar-content']"),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it("allows trigger and item slot override when using asChild", async () => {
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger asChild>
            <button data-slot="custom-trigger" type="button">
              Fichier enfant
            </button>
          </MenubarTrigger>
          <MenubarContent>
            <MenubarItem asChild>
              <a data-slot="custom-item" href="#profil">
                Ouvrir le profil
              </a>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Fichier enfant" }),
    );
    await waitForMenubarContent();

    expect(
      screen.getByRole("menuitem", { name: "Fichier enfant" }),
    ).toHaveAttribute("data-slot", "custom-trigger");
    expect(
      screen.getByRole("menuitem", { name: "Ouvrir le profil" }),
    ).toHaveAttribute("data-slot", "custom-item");
    expect(document.querySelector("[data-slot='menubar-trigger']")).toBeNull();
    expect(document.querySelector("[data-slot='menubar-item']")).toBeNull();
  });

  it("updates checkbox and radio callbacks", async () => {
    const onValueChange = vi.fn();

    function SelectionExample() {
      const [checked, setChecked] = useState(false);
      const [value, setValue] = useState("profil");

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
                <MenubarSeparator />
                <MenubarRadioGroup
                  onValueChange={(next) => {
                    setValue(next);
                    onValueChange(next);
                  }}
                  value={value}
                >
                  <MenubarRadioItem value="profil">Profil</MenubarRadioItem>
                  <MenubarRadioItem value="expert">
                    Mode expert
                  </MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </>
      );
    }

    render(<SelectionExample />);

    await userEvent.click(screen.getByRole("menuitem", { name: "Affichage" }));

    const checkbox = await screen.findByRole("menuitemcheckbox", {
      name: "Activer les notifications",
    });
    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(document.querySelector("[data-state-text='active']")).toBeTruthy();
    });

    await userEvent.click(screen.getByRole("menuitem", { name: "Affichage" }));

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

    await userEvent.click(screen.getByRole("menuitem", { name: "Support" }));

    const item = await screen.findByRole("menuitem", {
      name: "Support prioritaire",
    });
    await userEvent.click(item);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps semantic classes and merges className on exposed compounds", async () => {
    render(
      <Menubar className="racine-personnalisee">
        <MenubarMenu>
          <MenubarTrigger className="trigger-personnalise">
            Menu classes
          </MenubarTrigger>
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

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Menu classes" }),
    );

    const content = await waitForMenubarContent();
    const trigger = screen.getByRole("menuitem", { name: "Menu classes" });
    const item = screen.getByRole("menuitem", { name: /Profil/ });

    expect(
      document.querySelector("[data-slot='menubar']")?.className ?? "",
    ).toContain("racine-personnalisee");
    expect(
      document.querySelector("[data-slot='menubar']")?.className ?? "",
    ).toContain("overflow-x-auto");
    expect(trigger.className).toContain("trigger-personnalise");
    expect(trigger.className).toContain("focus-visible:ring-ring-soft");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain("data-[state=open]:animate-in");
    expect(content.className).toContain("contenu-personnalise");
    expect(item.className).toContain("focus:bg-accent");
    expect(item.className).toContain("focus:text-accent-foreground");
    expect(item.className).toContain("item-personnalise");
    expect(
      document.querySelector("[data-slot='menubar-label']")?.className ?? "",
    ).toContain("label-personnalise");
    expect(
      document.querySelector("[data-slot='menubar-separator']")?.className ??
        "",
    ).toContain("separateur-personnalise");
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
          <MenubarTrigger ref={triggerRef}>Refs</MenubarTrigger>
          <MenubarContent ref={contentRef}>
            <MenubarItem ref={itemRef}>Profil</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await userEvent.click(screen.getByRole("menuitem", { name: "Refs" }));
    await waitForMenubarContent();

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
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Menu accessibilite</MenubarTrigger>
          <MenubarContent container={portalContainer}>
            <MenubarItem>Profil</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
      { container: auditRoot },
    );

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Menu accessibilite" }),
    );
    await waitForMenubarContent(portalContainer);

    expect(await axe(auditRoot)).toHaveNoViolations();
  });
});
