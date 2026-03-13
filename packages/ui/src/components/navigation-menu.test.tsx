import { createRef } from "react";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { axe } from "jest-axe";
import { describe, expect, it, vi } from "vitest";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "./navigation-menu";

describe("NavigationMenu", () => {
  function renderNavigationMenu(
    props?: React.ComponentProps<typeof NavigationMenu>,
  ) {
    return render(
      <NavigationMenu {...props}>
        <NavigationMenuList>
          <NavigationMenuItem value="produits">
            <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[420px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a href="#calculateur">Calculateur FODMAP</a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="ressources">
            <NavigationMenuTrigger>Ressources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[320px]">
                <li>
                  <NavigationMenuLink asChild>
                    <a href="#guides">Guides pratiques</a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
  }

  it("keeps slot markers stable in default composition", async () => {
    const { container } = render(
      <NavigationMenu
        className="racine-personnalisee"
        data-slot="custom-root"
        defaultValue="produits"
      >
        <NavigationMenuList data-slot="custom-list">
          <NavigationMenuItem data-slot="custom-item" value="produits">
            <NavigationMenuTrigger data-slot="custom-trigger">
              Produits
            </NavigationMenuTrigger>
            <NavigationMenuContent data-slot="custom-content">
              <ul className="grid gap-2 p-4 md:w-[420px]">
                <li>
                  <NavigationMenuLink
                    data-slot="custom-link"
                    href="#calculateur"
                  >
                    Calculateur FODMAP
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Produits" });

    await waitFor(() => {
      const contentId = trigger.getAttribute("aria-controls");
      if (!contentId || !document.getElementById(contentId)) {
        throw new Error("navigation menu content not linked yet");
      }
    });

    expect(
      container.querySelector("[data-slot='navigation-menu']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='navigation-menu-list']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='navigation-menu-item']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='navigation-menu-trigger']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='navigation-menu-content']"),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='navigation-menu-link']"),
    ).toBeTruthy();
    expect(
      container.querySelector(
        "[data-slot='navigation-menu-viewport-position']",
      ),
    ).toBeTruthy();
    expect(
      container.querySelector("[data-slot='navigation-menu-viewport']"),
    ).toBeTruthy();

    expect(container.querySelector("[data-slot='custom-root']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-list']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-item']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-content']")).toBeNull();
    expect(container.querySelector("[data-slot='custom-link']")).toBeNull();
  });

  it("allows link slot override when using asChild", async () => {
    render(
      <NavigationMenu defaultValue="produits">
        <NavigationMenuList>
          <NavigationMenuItem value="produits">
            <NavigationMenuTrigger data-slot="custom-trigger">
              Produits
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink asChild>
                <a data-slot="custom-link" href="#calculateur">
                  Calculateur FODMAP
                </a>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    const trigger = screen.getByRole("button", { name: "Produits" });

    await waitFor(() => {
      const contentId = trigger.getAttribute("aria-controls");
      if (!contentId || !document.getElementById(contentId)) {
        throw new Error("navigation menu content not linked yet");
      }
    });

    expect(trigger).toHaveAttribute("data-slot", "navigation-menu-trigger");
    expect(
      screen.getByRole("link", { name: "Calculateur FODMAP" }),
    ).toHaveAttribute("data-slot", "custom-link");
    expect(document.querySelector("[data-slot='custom-trigger']")).toBeNull();
    expect(
      document.querySelector("[data-slot='navigation-menu-link']"),
    ).toBeNull();
  });

  it("switches items and keeps semantic linkage", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderNavigationMenu({
      defaultValue: "produits",
      onValueChange,
    });

    const produits = screen.getByRole("button", { name: "Produits" });
    const ressources = screen.getByRole("button", { name: "Ressources" });

    expect(produits).toHaveAttribute("aria-expanded", "true");
    expect(ressources).toHaveAttribute("aria-expanded", "false");

    await user.click(ressources);

    expect(onValueChange).toHaveBeenCalledWith("ressources");
    expect(ressources).toHaveAttribute("aria-expanded", "true");
    expect(produits).toHaveAttribute("aria-expanded", "false");

    const panelId = ressources.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;

    expect(panel).toHaveAttribute("data-slot", "navigation-menu-content");
    expect(panel).toHaveAttribute("id", panelId ?? "");
  });

  it("supports keyboard navigation between triggers", async () => {
    const user = userEvent.setup();
    renderNavigationMenu({ defaultValue: "produits" });

    const produits = screen.getByRole("button", { name: "Produits" });
    const ressources = screen.getByRole("button", { name: "Ressources" });

    produits.focus();
    expect(document.activeElement).toBe(produits);

    await user.keyboard("{ArrowRight}");

    await waitFor(() => {
      expect(document.activeElement).toBe(ressources);
    });
  });

  it("keeps semantic classes and merges className on exposed compounds", () => {
    render(
      <NavigationMenu className="racine-personnalisee" defaultValue="produits">
        <NavigationMenuList className="liste-personnalisee">
          <NavigationMenuItem className="item-personnalise" value="produits">
            <NavigationMenuTrigger className="trigger-personnalise">
              Produits
            </NavigationMenuTrigger>
            <NavigationMenuContent className="contenu-personnalise">
              <NavigationMenuLink
                className="lien-personnalise"
                href="#calculateur"
              >
                Calculateur FODMAP
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    expect(
      document.querySelector("[data-slot='navigation-menu']")?.className ?? "",
    ).toContain("racine-personnalisee");
    expect(
      document.querySelector("[data-slot='navigation-menu-list']")?.className ??
        "",
    ).toContain("liste-personnalisee");
    expect(
      document.querySelector("[data-slot='navigation-menu-item']")?.className ??
        "",
    ).toContain("item-personnalise");
    expect(
      screen.getByRole("button", { name: "Produits" }).className,
    ).toContain("trigger-personnalise");
    expect(
      screen.getByRole("button", { name: "Produits" }).className,
    ).toContain("focus-visible:ring-ring-soft");
    expect(
      screen.getByRole("button", { name: "Produits" }).className,
    ).toContain("cursor-pointer");
    expect(
      document.querySelector("[data-slot='navigation-menu-content']")
        ?.className ?? "",
    ).toContain("contenu-personnalise");
    expect(
      document.querySelector("[data-slot='navigation-menu-content']")
        ?.className ?? "",
    ).toContain("data-[motion^=from-]:animate-in");
    expect(
      screen.getByRole("link", { name: "Calculateur FODMAP" }).className,
    ).toContain("lien-personnalise");
    expect(
      document.querySelector("[data-slot='navigation-menu-viewport-position']")
        ?.className ?? "",
    ).toContain("w-full");
  });

  it("renders indicator, viewport, and trigger style contracts", () => {
    const indicatorProps = NavigationMenuIndicator({}).props;
    const viewportProps = NavigationMenuViewport({}).props;

    expect(indicatorProps.className).toContain(
      "data-[state=visible]:animate-in",
    );
    expect(indicatorProps.className).toContain("data-[state=hidden]:fade-out");
    expect(viewportProps.className).toContain("bg-popover");
    expect(viewportProps.className).toContain("text-popover-foreground");
    expect(viewportProps.className).toContain("data-[state=open]:animate-in");

    const triggerClasses = navigationMenuTriggerStyle();
    expect(triggerClasses).toContain("cursor-pointer");
    expect(triggerClasses).toContain("data-[active]:bg-accent");
    expect(triggerClasses).toContain("data-[state=open]:bg-accent");
    expect(triggerClasses).toContain("focus-visible:ring-ring-soft");
  });

  it("forwards refs to trigger and viewport", () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const viewportRef = createRef<HTMLDivElement>();

    render(
      <NavigationMenu defaultValue="produits">
        <NavigationMenuList>
          <NavigationMenuItem value="produits">
            <NavigationMenuTrigger ref={triggerRef}>
              Produits
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="#calculateur">
                Calculateur FODMAP
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport ref={viewportRef} />
      </NavigationMenu>,
    );

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(viewportRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it("has no obvious a11y violations", async () => {
    const user = userEvent.setup();
    const { container } = renderNavigationMenu({ defaultValue: "produits" });

    await user.click(screen.getByRole("button", { name: "Produits" }));

    expect(await axe(container)).toHaveNoViolations();
  });
});
