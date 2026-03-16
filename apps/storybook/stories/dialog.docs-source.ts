export const dialogRecommendedUsageCode = `import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fodmapp/ui";

export function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Confirmer la substitution</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appliquer la substitution</DialogTitle>
          <DialogDescription>
            Cette action mettra a jour les recommandations associees.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          Verifiez les informations avant de valider.
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuler</Button>
          </DialogClose>
          <Button>Valider</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
`;
