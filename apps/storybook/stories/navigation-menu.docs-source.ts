export const navigationMenuRecommendedUsageCode = `import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@fodmap/ui";

export function Example() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem value="produits">
          <NavigationMenuTrigger>Produits</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#calculateur">
              Calculateur FODMAP
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
`;
