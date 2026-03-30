import type { components } from "@fodmapp/types";

import {
  getCuratedFoodCapabilities,
  getCuratedFoodProvenance,
  getCustomFoodCapabilities,
  getCustomFoodProvenance,
  getFreeTextTrackingItemCapabilities,
  getTrackingProjectionProvenance,
  getTrackingRecordCapabilities,
  getTrackingRecordProvenance,
} from "../policies/capabilities";
import type {
  CustomFoodDraft,
  CustomFoodPatch,
  CustomFoodRecord,
  MealEntry,
  MealEntryDraft,
  MealEntryPatch,
  ProximityMealReference,
  SavedMealDraft,
  SavedMealPatch,
  SavedMealRecord,
  SymptomEntry,
  SymptomEntryDraft,
  SymptomEntryPatch,
  SymptomProximityGroup,
  TrackingFeed,
  TrackingFeedEntry,
  TrackingItemDraft,
  TrackingItemReference,
  TrackingLoggedItem,
  WeeklyTrackingSummary,
} from "../tracking/entities";

type TrackingItemInput = components["schemas"]["TrackingItemInput"];
type MealLogItem = components["schemas"]["MealLogItem"];
type MealLog = components["schemas"]["MealLog"];
type MealLogCreateRequest = components["schemas"]["MealLogCreateRequest"];
type MealLogUpdateRequest = components["schemas"]["MealLogUpdateRequest"];
type SymptomLog = components["schemas"]["SymptomLog"];
type SymptomLogCreateRequest = components["schemas"]["SymptomLogCreateRequest"];
type SymptomLogUpdateRequest = components["schemas"]["SymptomLogUpdateRequest"];
type CustomFood = components["schemas"]["CustomFood"];
type CustomFoodCreateRequest = components["schemas"]["CustomFoodCreateRequest"];
type CustomFoodUpdateRequest = components["schemas"]["CustomFoodUpdateRequest"];
type SavedMeal = components["schemas"]["SavedMeal"];
type SavedMealItem = components["schemas"]["SavedMealItem"];
type SavedMealCreateRequest = components["schemas"]["SavedMealCreateRequest"];
type SavedMealUpdateRequest = components["schemas"]["SavedMealUpdateRequest"];
type TrackingFeedResponse = components["schemas"]["TrackingFeedResponse"];
type WeeklyTrackingSummaryResponse =
  components["schemas"]["WeeklyTrackingSummaryResponse"];

function mapTrackingItemReference(
  itemKind: components["schemas"]["TrackingItemKind"],
  label: string,
  foodSlug?: string | null,
  customFoodId?: string | null,
): TrackingItemReference {
  switch (itemKind) {
    case "canonical_food":
      return {
        kind: "canonical_food",
        foodSlug: foodSlug ?? null,
        label,
        provenance: getCuratedFoodProvenance(),
        evidenceTier: "curated",
        capabilities: getCuratedFoodCapabilities(),
      };
    case "custom_food":
      return {
        kind: "custom_food",
        customFoodId: customFoodId ?? null,
        label,
        provenance: getCustomFoodProvenance(customFoodId ?? null),
        evidenceTier: "user_entered",
        capabilities: getCustomFoodCapabilities(),
      };
    default:
      return {
        kind: "free_text",
        label,
        provenance: getTrackingRecordProvenance(),
        evidenceTier: "user_entered",
        capabilities: getFreeTextTrackingItemCapabilities(),
      };
  }
}

function mapLoggedItem(
  itemId: string,
  sortOrder: number,
  itemKind: components["schemas"]["TrackingItemKind"],
  label: string,
  quantityText?: string | null,
  note?: string | null,
  foodSlug?: string | null,
  customFoodId?: string | null,
): TrackingLoggedItem {
  return {
    itemId,
    sortOrder,
    reference: mapTrackingItemReference(
      itemKind,
      label,
      foodSlug,
      customFoodId,
    ),
    quantityText: quantityText ?? null,
    note: note ?? null,
  };
}

export function mapTrackingItemInputToTrackingItemDraft(
  input: TrackingItemInput,
): TrackingItemDraft {
  switch (input.item_kind) {
    case "canonical_food":
      return {
        reference: {
          kind: "canonical_food",
          foodSlug: input.food_slug ?? null,
        },
        quantityText: input.quantity_text ?? null,
        note: input.note ?? null,
      };
    case "custom_food":
      return {
        reference: {
          kind: "custom_food",
          customFoodId: input.custom_food_id ?? null,
        },
        quantityText: input.quantity_text ?? null,
        note: input.note ?? null,
      };
    default:
      return {
        reference: {
          kind: "free_text",
          label: input.free_text_label ?? null,
        },
        quantityText: input.quantity_text ?? null,
        note: input.note ?? null,
      };
  }
}

export function mapMealLogItemToTrackingLoggedItem(
  item: MealLogItem,
): TrackingLoggedItem {
  return mapLoggedItem(
    item.meal_log_item_id,
    item.sort_order,
    item.item_kind,
    item.label,
    item.quantity_text ?? null,
    item.note ?? null,
    item.food_slug ?? null,
    item.custom_food_id ?? null,
  );
}

export function mapMealLogToMealEntry(meal: MealLog): MealEntry {
  return {
    kind: "meal_log",
    mealLogId: meal.meal_log_id,
    title: meal.title ?? null,
    occurredAtUtc: meal.occurred_at_utc,
    note: meal.note ?? null,
    version: meal.version,
    createdAtUtc: meal.created_at_utc,
    updatedAtUtc: meal.updated_at_utc,
    items: meal.items.map(mapMealLogItemToTrackingLoggedItem),
    provenance: getTrackingRecordProvenance(meal.occurred_at_utc),
    evidenceTier: "user_entered",
    capabilities: getTrackingRecordCapabilities(),
  };
}

export function mapMealLogCreateRequestToMealEntryDraft(
  payload: MealLogCreateRequest,
): MealEntryDraft {
  return {
    occurredAtUtc: payload.occurred_at_utc,
    title: payload.title ?? null,
    note: payload.note ?? null,
    items: payload.items.map(mapTrackingItemInputToTrackingItemDraft),
  };
}

export function mapMealLogUpdateRequestToMealEntryPatch(
  payload: MealLogUpdateRequest,
): MealEntryPatch {
  return {
    occurredAtUtc: payload.occurred_at_utc ?? undefined,
    title: payload.title ?? undefined,
    note: payload.note ?? undefined,
    items: payload.items?.map(mapTrackingItemInputToTrackingItemDraft),
  };
}

export function mapSymptomLogToSymptomEntry(symptom: SymptomLog): SymptomEntry {
  return {
    kind: "symptom_log",
    symptomLogId: symptom.symptom_log_id,
    symptomType: symptom.symptom_type,
    severity: symptom.severity,
    notedAtUtc: symptom.noted_at_utc,
    note: symptom.note ?? null,
    version: symptom.version,
    createdAtUtc: symptom.created_at_utc,
    updatedAtUtc: symptom.updated_at_utc,
    provenance: getTrackingRecordProvenance(symptom.noted_at_utc),
    evidenceTier: "user_entered",
    capabilities: getTrackingRecordCapabilities(),
  };
}

export function mapSymptomLogCreateRequestToSymptomEntryDraft(
  payload: SymptomLogCreateRequest,
): SymptomEntryDraft {
  return {
    symptomType: payload.symptom_type,
    severity: payload.severity,
    notedAtUtc: payload.noted_at_utc,
    note: payload.note ?? null,
  };
}

export function mapSymptomLogUpdateRequestToSymptomEntryPatch(
  payload: SymptomLogUpdateRequest,
): SymptomEntryPatch {
  return {
    symptomType: payload.symptom_type ?? undefined,
    severity: payload.severity ?? undefined,
    notedAtUtc: payload.noted_at_utc ?? undefined,
    note: payload.note ?? undefined,
  };
}

export function mapCustomFoodToCustomFoodRecord(
  customFood: CustomFood,
): CustomFoodRecord {
  return {
    kind: "custom_food",
    customFoodId: customFood.custom_food_id,
    label: customFood.label,
    note: customFood.note ?? null,
    version: customFood.version,
    createdAtUtc: customFood.created_at_utc,
    updatedAtUtc: customFood.updated_at_utc,
    provenance: getCustomFoodProvenance(
      customFood.custom_food_id,
      customFood.updated_at_utc,
    ),
    evidenceTier: "user_entered",
    capabilities: getCustomFoodCapabilities(),
  };
}

export function mapCustomFoodCreateRequestToCustomFoodDraft(
  payload: CustomFoodCreateRequest,
): CustomFoodDraft {
  return {
    label: payload.label,
    note: payload.note ?? null,
  };
}

export function mapCustomFoodUpdateRequestToCustomFoodPatch(
  payload: CustomFoodUpdateRequest,
): CustomFoodPatch {
  return {
    label: payload.label ?? undefined,
    note: payload.note ?? undefined,
  };
}

export function mapSavedMealItemToTrackingLoggedItem(
  item: SavedMealItem,
): TrackingLoggedItem {
  return mapLoggedItem(
    item.saved_meal_item_id,
    item.sort_order,
    item.item_kind,
    item.label,
    item.quantity_text ?? null,
    item.note ?? null,
    item.food_slug ?? null,
    item.custom_food_id ?? null,
  );
}

export function mapSavedMealToSavedMealRecord(
  savedMeal: SavedMeal,
): SavedMealRecord {
  return {
    kind: "saved_meal",
    savedMealId: savedMeal.saved_meal_id,
    label: savedMeal.label,
    note: savedMeal.note ?? null,
    version: savedMeal.version,
    createdAtUtc: savedMeal.created_at_utc,
    updatedAtUtc: savedMeal.updated_at_utc,
    items: savedMeal.items.map(mapSavedMealItemToTrackingLoggedItem),
    provenance: getTrackingRecordProvenance(savedMeal.updated_at_utc),
    evidenceTier: "user_entered",
    capabilities: getTrackingRecordCapabilities(),
  };
}

export function mapSavedMealCreateRequestToSavedMealDraft(
  payload: SavedMealCreateRequest,
): SavedMealDraft {
  return {
    label: payload.label,
    note: payload.note ?? null,
    items: payload.items.map(mapTrackingItemInputToTrackingItemDraft),
  };
}

export function mapSavedMealUpdateRequestToSavedMealPatch(
  payload: SavedMealUpdateRequest,
): SavedMealPatch {
  return {
    label: payload.label ?? undefined,
    note: payload.note ?? undefined,
    items: payload.items?.map(mapTrackingItemInputToTrackingItemDraft),
  };
}

export function mapTrackingFeedEntry(
  entry: TrackingFeedResponse["items"][number],
): TrackingFeedEntry {
  if (entry.entry_type === "meal" && entry.meal) {
    const meal = mapMealLogToMealEntry(entry.meal);
    return {
      entryType: "meal",
      occurredAtUtc: entry.occurred_at_utc,
      entryId: meal.mealLogId,
      meal,
      provenance: getTrackingProjectionProvenance(
        "tracking_feed",
        entry.occurred_at_utc,
      ),
      evidenceTier: "derived",
      capabilities: getTrackingRecordCapabilities(),
    };
  }

  if (entry.entry_type === "symptom" && entry.symptom) {
    const symptom = mapSymptomLogToSymptomEntry(entry.symptom);
    return {
      entryType: "symptom",
      occurredAtUtc: entry.occurred_at_utc,
      entryId: symptom.symptomLogId,
      symptom,
      provenance: getTrackingProjectionProvenance(
        "tracking_feed",
        entry.occurred_at_utc,
      ),
      evidenceTier: "derived",
      capabilities: getTrackingRecordCapabilities(),
    };
  }

  throw new Error("tracking_feed_entry_shape_invalid");
}

export function mapTrackingFeedResponse(
  response: TrackingFeedResponse,
): TrackingFeed {
  return {
    total: response.total,
    limit: response.limit,
    items: response.items.map(mapTrackingFeedEntry),
    provenance: getTrackingProjectionProvenance("tracking_feed"),
    evidenceTier: "derived",
    capabilities: getTrackingRecordCapabilities(),
  };
}

function mapProximityMeal(
  meal: WeeklyTrackingSummaryResponse["proximity_groups"][number]["nearby_meals"][number],
): ProximityMealReference {
  return {
    mealLogId: meal.meal_log_id,
    title: meal.title ?? null,
    occurredAtUtc: meal.occurred_at_utc,
    hoursBeforeSymptom: meal.hours_before_symptom,
    itemLabels: meal.item_labels,
  };
}

function mapSymptomProximityGroup(
  group: WeeklyTrackingSummaryResponse["proximity_groups"][number],
): SymptomProximityGroup {
  return {
    symptomLogId: group.symptom_log_id,
    symptomType: group.symptom_type,
    severity: group.severity,
    notedAtUtc: group.noted_at_utc,
    nearbyMeals: group.nearby_meals.map(mapProximityMeal),
  };
}

export function mapWeeklyTrackingSummaryResponse(
  response: WeeklyTrackingSummaryResponse,
): WeeklyTrackingSummary {
  return {
    anchorDate: response.anchor_date,
    windowStartUtc: response.window_start_utc,
    windowEndUtc: response.window_end_utc,
    dailyCounts: response.daily_counts.map((count) => ({
      date: count.date,
      mealCount: count.meal_count,
      symptomCount: count.symptom_count,
    })),
    symptomCounts: response.symptom_counts.map((count) => ({
      symptomType: count.symptom_type,
      count: count.count,
    })),
    severity: {
      average: response.severity.average ?? null,
      maximum: response.severity.maximum ?? null,
    },
    proximityGroups: response.proximity_groups.map(mapSymptomProximityGroup),
    provenance: getTrackingProjectionProvenance(
      "weekly_tracking_summary",
      response.window_end_utc,
    ),
    evidenceTier: "derived",
    capabilities: getTrackingRecordCapabilities(),
  };
}
