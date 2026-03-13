export const menubarRecommendedUsageCode = `import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@fodmap/ui";

export function Example() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Fichier</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Profil</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Parametres</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
`;
