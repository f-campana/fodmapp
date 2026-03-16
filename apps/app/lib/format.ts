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
