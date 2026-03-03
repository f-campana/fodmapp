import { createRef } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";

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
          <NavigationMenuItem>
            <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[420px] lg:w-[520px] lg:grid-cols-2">
                <li>
                  <NavigationMenuLink asChild>
                    <a href="#calculateur">Calculateur FODMAP</a>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink asChild>
                    <a href="#substitutions">Substitutions</a>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Ressources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-2 p-4 md:w-[340px]">
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

  it("renders navigation slots and root semantics", () => {
    const { container } = renderNavigationMenu();

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
      container.querySelector(
        "[data-slot='navigation-menu-viewport-position']",
      ),
    ).toBeTruthy();
  });

  it("opens content from trigger in uncontrolled mode", async () => {
    renderNavigationMenu();

    const trigger = screen.getByRole("button", { name: "Produits" });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='navigation-menu-content']"),
      ).toBeTruthy();
    });

    expect(
      screen.getByRole("link", { name: "Calculateur FODMAP" }),
    ).toBeTruthy();
  });

  it("supports keyboard open flow", async () => {
    renderNavigationMenu();

    const trigger = screen.getByRole("button", { name: "Produits" });
    trigger.focus();

    fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='navigation-menu-content']"),
      ).toBeTruthy();
    });

    fireEvent.keyDown(trigger, { key: "Escape", code: "Escape" });
  });

  it("exposes viewport and indicator semantic class contracts", () => {
    const viewportElement = NavigationMenuViewport({}) as {
      props: { className: string };
    };
    const indicatorElement = NavigationMenuIndicator({}) as {
      props: { className: string };
    };

    const viewportClassName = viewportElement.props.className;
    const indicatorClassName = indicatorElement.props.className;

    expect(viewportClassName).toContain("bg-popover");
    expect(viewportClassName).toContain("text-popover-foreground");
    expect(viewportClassName).toContain("data-[state=open]:animate-in");

    expect(indicatorClassName).toContain("data-[state=visible]:animate-in");
    expect(indicatorClassName).toContain("data-[state=hidden]:fade-out");
  });

  it("applies motion class contracts on content", async () => {
    renderNavigationMenu();

    fireEvent.click(screen.getByRole("button", { name: "Produits" }));

    const content = await waitFor(() => {
      return document.querySelector(
        "[data-slot='navigation-menu-content']",
      ) as HTMLElement | null;
    });

    expect(content?.className ?? "").toContain(
      "data-[motion^=from-]:animate-in",
    );
    expect(content?.className ?? "").toContain(
      "data-[motion^=to-]:animate-out",
    );
    expect(content?.className ?? "").toContain(
      "data-[motion=from-end]:slide-in-from-right-2",
    );
    expect(content?.className ?? "").toContain(
      "data-[motion=to-start]:slide-out-to-left-2",
    );
  });

  it("supports asChild links and className merging", async () => {
    render(
      <NavigationMenu>
        <NavigationMenuList className="liste-personnalisee">
          <NavigationMenuItem>
            <NavigationMenuTrigger>AsChild</NavigationMenuTrigger>
            <NavigationMenuContent className="contenu-personnalise">
              <NavigationMenuLink asChild className="lien-personnalise">
                <a href="#profil">Voir le profil</a>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    fireEvent.click(screen.getByRole("button", { name: "AsChild" }));

    const link = await waitFor(() => {
      return screen.getByRole("link", { name: "Voir le profil" });
    });

    expect(
      document.querySelector("[data-slot='navigation-menu-list']")?.className ??
        "",
    ).toContain("liste-personnalisee");
    expect(
      document.querySelector("[data-slot='navigation-menu-content']")
        ?.className ?? "",
    ).toContain("contenu-personnalise");
    expect(link).toHaveAttribute("data-slot", "navigation-menu-link");
    expect(link.className).toContain("lien-personnalise");
  });

  it("forwards refs to trigger and content", async () => {
    const triggerRef = createRef<HTMLButtonElement>();
    const contentRef = createRef<HTMLDivElement>();

    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger ref={triggerRef}>Refs</NavigationMenuTrigger>
            <NavigationMenuContent ref={contentRef}>
              <NavigationMenuLink asChild>
                <a href="#refs">Lien refs</a>
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Refs" }));

    await waitFor(() => {
      expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    });

    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("exposes navigationMenuTriggerStyle semantic contract", () => {
    const triggerClasses = navigationMenuTriggerStyle();

    expect(triggerClasses).toContain("data-[active]:bg-accent");
    expect(triggerClasses).toContain("data-[state=open]:bg-accent");
    expect(triggerClasses).toContain("focus-visible:ring-ring-soft");
    expect(triggerClasses).not.toContain("focus-visible:ring-ring/50");
  });

  it("has no obvious a11y violations", async () => {
    const { container } = renderNavigationMenu();

    fireEvent.click(screen.getByRole("button", { name: "Produits" }));

    await waitFor(() => {
      expect(
        document.querySelector("[data-slot='navigation-menu-content']"),
      ).toBeTruthy();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
