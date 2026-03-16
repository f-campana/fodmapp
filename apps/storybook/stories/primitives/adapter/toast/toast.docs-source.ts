export const toastRecommendedUsageCode = `import { Button } from "@fodmapp/ui/button";
import { Sonner } from "@fodmapp/ui/sonner";
import { Toast } from "@fodmapp/ui/toast";

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
