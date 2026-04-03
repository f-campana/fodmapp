import type {
  CuratedFood,
  CuratedFoodReference,
  CuratedFoodSummary,
  CuratedSwap,
  FoodLevel,
} from "@fodmapp/domain";

export const QUICK_SEARCHES = [
  "ail",
  "oignon",
  "champignons",
  "lentilles",
] as const;

export type FoodLevelBadgeVariant = FoodLevel | "default";

export function formatFoodLevel(level?: FoodLevel | null): string {
  switch (level) {
    case "none":
      return "Aucun";
    case "low":
      return "Faible";
    case "moderate":
      return "Modere";
    case "high":
      return "Eleve";
    case "unknown":
      return "Inconnu";
    default:
      return "Non calcule";
  }
}

export function getFoodLevelBadgeVariant(
  level?: FoodLevel | null,
): FoodLevelBadgeVariant {
  switch (level) {
    case "none":
    case "low":
    case "moderate":
    case "high":
    case "unknown":
      return level;
    default:
      return "default";
  }
}

export function getFoodDisplayName(
  food:
    | Pick<CuratedFoodSummary, "names" | "slug">
    | Pick<CuratedFood, "names" | "slug">,
): string {
  return food.names.fr || food.names.en || food.slug;
}

export function getFoodReferenceDisplayName(
  food: CuratedFoodReference,
): string {
  return food.names.fr || food.names.en || food.slug;
}

export function getSwapDisplayName(swap: CuratedSwap): string {
  return getFoodReferenceDisplayName(swap.to);
}

export function formatCoverageRatio(value?: number | null): string {
  if (typeof value !== "number") {
    return "Couverture indisponible";
  }

  return `Couverture ${Math.round(value * 100)}%`;
}
