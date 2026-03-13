export const toastRecommendedUsageCode = `import { Sonner, Toast } from "@fodmap/ui";

export function Example() {
  return (
    <>
      <button
        type="button"
        onClick={() =>
          Toast.success("Alternative enregistree pour le diner", {
            description:
              "Le recapitulatif sans ail reste prioritaire pour les trois prochains repas.",
          })
        }
      >
        Enregistrer la substitution
      </button>
      <Sonner />
    </>
  );
}
`;
