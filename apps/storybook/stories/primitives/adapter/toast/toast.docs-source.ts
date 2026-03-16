export const toastRecommendedUsageCode = `import { Button } from "@fodmap/ui/button";
import { Sonner } from "@fodmap/ui/sonner";
import { Toast } from "@fodmap/ui/toast";

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
