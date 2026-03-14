export const toastRecommendedUsageCode = `import { Button, Sonner, Toast } from "@fodmap/ui";

export function Example() {
  return (
    <>
      <Button
        onClick={() =>
          Toast.success("Alternative enregistree pour le diner", {
            description:
              "Le recapitulatif sans ail reste actif pour les trois prochains repas.",
          })
        }
      >
        Enregistrer la substitution
      </Button>
      <Sonner />
    </>
  );
}
`;
