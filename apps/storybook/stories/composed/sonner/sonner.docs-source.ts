export const sonnerRecommendedUsageCode = `import { Sonner, toast } from "@fodmap/ui";

export function Example() {
  return (
    <>
      <button
        type="button"
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
      </button>
      <Sonner />
    </>
  );
}
`;
