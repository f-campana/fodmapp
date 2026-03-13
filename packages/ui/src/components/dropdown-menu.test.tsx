import { createRef, useState } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  function renderDropdownMenu(
    props?: React.ComponentProps<typeof DropdownMenu>,
    contentProps?: Partial<React.ComponentProps<typeof DropdownMenuContent>>,
  ) {
    return render(
      <DropdownMenu {...props}>
        <DropdownMenuTrigger>Ouvrir les options</DropdownMenuTrigger>
        <DropdownMenuContent {...contentProps}>
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
        </DropdownMenuContent>
      </DropdownMenu>,
    );
  }

  async function waitForDropdownMenuContent(scope: ParentNode = document) {
    return waitFor(() => {
      const node = scope.querySelector("[data-slot='dropdown-menu-content']");
      if (!node) {
        throw new Error("dropdown menu content not mounted yet");
      }

      return node as HTMLElement;
    });
  }

  it("keeps slot markers stable in default composition", async () => {
    const portalContainer = document.createElement("div");
    document.body.append(portalContainer);

    const { container } = render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger data-slot="custom-trigger">
          Ouvrir les options
        </DropdownMenuTrigger>
        <DropdownMenuContent
          container={portalContainer}
          data-slot="custom-content"
        >
          <DropdownMenuLabel data-slot="custom-label">
            Mon compte
          </DropdownMenuLabel>
          <DropdownMenuSeparator data-slot="custom-separator" />
          <DropdownMenuGroup data-slot="custom-group">
            <DropdownMenuItem data-slot="custom-item">
              Profil
              <DropdownMenuShortcut data-slot="custom-shortcut">
                P
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger data-slot="custom-sub-trigger">
              Parametres avances
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal container={portalContainer}>
              <DropdownMenuSubContent data-slot="custom-sub-content">
                <DropdownMenuCheckboxItem
                  checked
                  data-slot="custom-checkbox-item"
                >
                  Notifications
                </DropdownMenuCheckboxItem>
                <DropdownMenuRadioGroup
                  data-slot="custom-radio-group"
                  value="expert"
                >
                  <DropdownMenuRadioItem
                    data-slot="custom-radio-item"
                    value="expert"
                  >
                    Mode expert
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await waitForDropdownMenuContent(portalContainer);

    expect(container.querySelector("[data-slot='dropdown-menu']")).toBeTruthy();
    expect(
      container.querySelector("[data-slot='dropdown-menu-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-portal']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-label']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-separator']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-group']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-item']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-shortcut']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-sub']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-sub-trigger']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-sub-content']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector(
        "[data-slot='dropdown-menu-checkbox-item']",
      ),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-radio-group']"),
    ).toBeTruthy();
    expect(
      portalContainer.querySelector("[data-slot='dropdown-menu-radio-item']"),
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
    renderDropdownMenu();

    const trigger = screen.getByRole("button", { name: "Ouvrir les options" });

    trigger.focus();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");

    await waitForDropdownMenuContent();

    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await waitFor(() => {
      expect(document.activeElement?.getAttribute("role")).toBe("menuitem");
    });

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='dropdown-menu-content']"),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("allows trigger and item slot override when using asChild", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <button data-slot="custom-trigger" type="button">
            Ouvrir via enfant
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem asChild>
            <a data-slot="custom-item" href="#profil">
              Ouvrir le profil
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await waitForDropdownMenuContent();

    expect(
      document.querySelector("[data-slot='custom-trigger']"),
    ).toHaveTextContent("Ouvrir via enfant");
    expect(
      screen.getByRole("menuitem", { name: "Ouvrir le profil" }),
    ).toHaveAttribute("data-slot", "custom-item");
    expect(
      document.querySelector("[data-slot='dropdown-menu-trigger']"),
    ).toBeNull();
    expect(
      document.querySelector("[data-slot='dropdown-menu-item']"),
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
          <DropdownMenu>
            <DropdownMenuTrigger>Preferences</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem
                checked={checked}
                onCheckedChange={(next) => setChecked(next === true)}
              >
                Activer les notifications
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                onValueChange={(next) => {
                  setValue(next);
                  onValueChange(next);
                }}
                value={value}
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
        </>
      );
    }

    render(<SelectionExample />);

    await userEvent.click(screen.getByRole("button", { name: "Preferences" }));

    const checkbox = await screen.findByRole("menuitemcheckbox", {
      name: "Activer les notifications",
    });
    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(document.querySelector("[data-state-text='active']")).toBeTruthy();
    });

    await userEvent.click(screen.getByRole("button", { name: "Preferences" }));

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
      <DropdownMenu>
        <DropdownMenuTrigger>Menu support</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={onSelect}>
            Support prioritaire
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Menu support" }));

    const item = await screen.findByRole("menuitem", {
      name: "Support prioritaire",
    });
    await userEvent.click(item);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps semantic classes and merges className on exposed compounds", async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger className="trigger-personnalise">
          Menu classes
        </DropdownMenuTrigger>
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

    const content = await waitForDropdownMenuContent();
    const trigger = document.querySelector(
      "[data-slot='dropdown-menu-trigger']",
    ) as HTMLElement | null;
    const item = screen.getByRole("menuitem", { name: /Profil/ });

    expect(trigger?.className ?? "").toContain("trigger-personnalise");
    expect(content.className).toContain("bg-popover");
    expect(content.className).toContain("text-popover-foreground");
    expect(content.className).toContain("data-[state=open]:animate-in");
    expect(content.className).toContain("contenu-personnalise");
    expect(item.className).toContain("focus:bg-accent");
    expect(item.className).toContain("focus:text-accent-foreground");
    expect(item.className).toContain("item-personnalise");
    expect(
      document.querySelector("[data-slot='dropdown-menu-label']")?.className ??
        "",
    ).toContain("label-personnalise");
    expect(
      document.querySelector("[data-slot='dropdown-menu-separator']")
        ?.className ?? "",
    ).toContain("separateur-personnalise");
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

    await waitForDropdownMenuContent();

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
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Menu accessibilite</DropdownMenuTrigger>
        <DropdownMenuContent container={portalContainer}>
          <DropdownMenuLabel>Options</DropdownMenuLabel>
          <DropdownMenuItem>Profil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
      { container: auditRoot },
    );

    await waitForDropdownMenuContent(portalContainer);

    fireEvent.mouseMove(auditRoot);
    expect(await axe(auditRoot)).toHaveNoViolations();
  });
});
