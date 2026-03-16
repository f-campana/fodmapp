export const sonnerRecommendedUsageCode = `import { Button } from "@fodmapp/ui/button";
import { Sonner, toast } from "@fodmapp/ui/sonner";

export function Example() {
  return (
    <>
      <Button
        onClick={() =>
          toast("Revue hebdomadaire prete", {
            action: {
              label: "Ouvrir la revue",
              onClick: () => undefined,
            },
            description:
              "Le tableau consolide les portions testees avant la reunion du vendredi.",
          })
        }
      >
        Afficher la revue
      </Button>
      <Sonner />
    </>
  );
}
`;
