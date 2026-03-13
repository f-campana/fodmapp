export const sheetRecommendedUsageCode = `import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@fodmap/ui";

export function Example() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">Ouvrir les filtres</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtres rapides</SheetTitle>
          <SheetDescription>
            Ajustez les options sans quitter la page en cours.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Annuler</Button>
          </SheetClose>
          <Button>Appliquer</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
`;
