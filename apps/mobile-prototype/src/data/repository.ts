import {
  defaultPreferences,
  type Food,
  foods,
  type Preferences,
} from "./mockData";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type { Food, Preferences };

export async function listFoods(query = ""): Promise<Food[]> {
  await wait(250);
  const normalized = query.toLowerCase().trim();
  if (!normalized) {
    return foods;
  }
  return foods.filter((food) =>
    [food.name, food.category, ...food.tags]
      .join(" ")
      .toLowerCase()
      .includes(normalized),
  );
}

export async function getFoodById(foodId: string): Promise<Food | undefined> {
  await wait(180);
  return foods.find((food) => food.id === foodId);
}

export async function getDashboardSnapshot() {
  await wait(150);
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
