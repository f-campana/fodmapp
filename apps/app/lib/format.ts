export function formatFoodLevel(level?: string | null): string {
  switch (level) {
    case "none":
      return "Aucun";
    case "low":
      return "Faible";
    case "moderate":
      return "Modéré";
    case "high":
      return "Élevé";
    case "unknown":
      return "Inconnu";
    default:
      return "Non calculé";
  }
}

export interface FoodLevelPresentation {
  badgeLabel: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
  supportingText: string;
}

export function getFoodLevelPresentation(
  level?: string | null,
): FoodLevelPresentation {
  switch (level) {
    case "none":
      return {
        badgeLabel: "Profil disponible · Aucun",
        badgeVariant: "default",
        supportingText:
          "Le rollup public est disponible et ne signale pas de charge FODMAP notable.",
      };
    case "low":
      return {
        badgeLabel: "Profil disponible · Faible",
        badgeVariant: "default",
        supportingText:
          "Le rollup public est disponible avec une charge FODMAP faible à ce stade.",
      };
    case "moderate":
      return {
        badgeLabel: "Profil disponible · Modéré",
        badgeVariant: "secondary",
        supportingText:
          "Le rollup public existe, avec une charge intermédiaire à interpréter avec prudence.",
      };
    case "high":
      return {
        badgeLabel: "Profil disponible · Élevé",
        badgeVariant: "destructive",
        supportingText:
          "Le rollup public signale une charge FODMAP élevée pour cet aliment.",
      };
    case "unknown":
      return {
        badgeLabel: "Profil partiel · Niveau non vérifié",
        badgeVariant: "secondary",
        supportingText:
          "Des données existent, mais le niveau global n’est pas encore suffisamment vérifié.",
      };
    default:
      return {
        badgeLabel: "Analyse détaillée en attente",
        badgeVariant: "outline",
        supportingText:
          "Cet aliment est présent dans la base, mais son rollup public n’est pas encore calculé.",
      };
  }
}
