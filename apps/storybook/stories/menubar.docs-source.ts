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
          <MenubarItem>Ouvrir le profil</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Parametres</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Affichage</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Afficher les alertes</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
`;
