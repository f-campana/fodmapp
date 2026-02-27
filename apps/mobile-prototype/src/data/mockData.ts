export type Severity = "none" | "low" | "moderate" | "high";

export type Food = {
  id: string;
  name: string;
  category: string;
  serving: string;
  severity: Severity;
  note: string;
  tags: string[];
  alternatives: {
    id: string;
    name: string;
    serving: string;
    severity: Severity;
    reason: string;
  }[];
};

export const foods: Food[] = [
  {
    id: "apple",
    name: "Apple",
    category: "Fruit",
    serving: "1 medium",
    severity: "high",
    note: "High fructose load for many people.",
    tags: ["Fructose", "Common trigger"],
    alternatives: [
      {
        id: "kiwi",
        name: "Kiwi",
        serving: "2 medium",
        severity: "low",
        reason: "Fresh and lower FODMAP load.",
      },
      {
        id: "strawberry",
        name: "Strawberry",
        serving: "10 berries",
        severity: "none",
        reason: "Easy sweet replacement.",
      },
    ],
  },
  {
    id: "garlic",
    name: "Garlic",
    category: "Aromatics",
    serving: "1 clove",
    severity: "high",
    note: "Fructans can trigger symptoms strongly.",
    tags: ["Fructans", "Cooking staple"],
    alternatives: [
      {
        id: "garlic-oil",
        name: "Garlic-infused oil",
        serving: "1 tbsp",
        severity: "none",
        reason: "Flavor without solids.",
      },
      {
        id: "chives",
        name: "Chives",
        serving: "1 tbsp",
        severity: "none",
        reason: "Aromatic replacement in dishes.",
      },
    ],
  },
  {
    id: "milk",
    name: "Cow milk",
    category: "Dairy",
    serving: "1 cup",
    severity: "high",
    note: "Lactose can be difficult to digest.",
    tags: ["Lactose"],
    alternatives: [
      {
        id: "lactose-free-milk",
        name: "Lactose-free milk",
        serving: "1 cup",
        severity: "low",
        reason: "Near-identical behavior.",
      },
    ],
  },
];

export const defaultPreferences = {
  householdName: "Fabien & Family",
  strictMode: true,
  showOnlySafeSwaps: true,
  triggerTags: ["Lactose", "Fructans"],
};

export type Preferences = typeof defaultPreferences;
