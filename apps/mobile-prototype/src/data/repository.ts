import { defaultPreferences, foods, type Preferences } from "./mockData";

export type { Preferences };

export async function getDashboardSnapshot() {
  return {
    trackedFoods: foods.length,
    highRiskFoods: foods.filter((food) => food.severity === "high").length,
    availableSwaps: foods.reduce(
      (count, food) => count + food.alternatives.length,
      0,
    ),
  };
}

export function getDefaultPreferences(): Preferences {
  return defaultPreferences;
}
