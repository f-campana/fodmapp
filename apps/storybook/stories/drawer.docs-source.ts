export const drawerRecommendedUsageCode = `import { Button } from "@fodmap/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@fodmap/ui/drawer";

export function Example() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline">Ouvrir les actions rapides</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Actions rapides</DrawerTitle>
          <DrawerDescription>
            Ajustez un petit groupe d'options sans changer d'ecran.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Annuler</Button>
          </DrawerClose>
          <Button>Appliquer</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
`;
