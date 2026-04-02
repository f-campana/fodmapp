import type { TrackingItemDraft } from "@fodmapp/domain";
import type { components, operations } from "@fodmapp/types";

export const TRACKING_API_ROOT = "/me/tracking";

export type TrackingFeedResponse =
  operations["getTrackingFeed"]["responses"][200]["content"]["application/json"];

export type WeeklyTrackingSummaryResponse =
  operations["getWeeklyTrackingSummary"]["responses"][200]["content"]["application/json"];

type TrackingItemInput = components["schemas"]["TrackingItemInput"];

export type SymptomLogResponse =
  operations["createTrackingSymptom"]["responses"][201]["content"]["application/json"];
export type SymptomLogCreateRequest =
  operations["createTrackingSymptom"]["requestBody"]["content"]["application/json"];
export type SymptomLogUpdateRequest =
  operations["updateTrackingSymptom"]["requestBody"]["content"]["application/json"];

export type MealLogResponse =
  operations["createTrackingMeal"]["responses"][201]["content"]["application/json"];
export type MealLogCreateRequest =
  operations["createTrackingMeal"]["requestBody"]["content"]["application/json"];
export type MealLogUpdateRequest =
  operations["updateTrackingMeal"]["requestBody"]["content"]["application/json"];

export type CustomFoodResponse =
  operations["createTrackingCustomFood"]["responses"][201]["content"]["application/json"];
export type CustomFoodCreateRequest =
  operations["createTrackingCustomFood"]["requestBody"]["content"]["application/json"];
export type CustomFoodUpdateRequest =
  operations["updateTrackingCustomFood"]["requestBody"]["content"]["application/json"];

export type SavedMealResponse =
  operations["createTrackingSavedMeal"]["responses"][201]["content"]["application/json"];
export type SavedMealCreateRequest =
  operations["createTrackingSavedMeal"]["requestBody"]["content"]["application/json"];
export type SavedMealUpdateRequest =
  operations["updateTrackingSavedMeal"]["requestBody"]["content"]["application/json"];

export function buildTrackingItemInputFromDraft(
  draft: TrackingItemDraft,
): TrackingItemInput {
  switch (draft.reference.kind) {
    case "canonical_food":
      return {
        item_kind: "canonical_food",
        food_slug: draft.reference.foodSlug,
        quantity_text: draft.quantityText,
        note: draft.note,
      };
    case "custom_food":
      return {
        item_kind: "custom_food",
        custom_food_id: draft.reference.customFoodId,
        quantity_text: draft.quantityText,
        note: draft.note,
      };
    default:
      return {
        item_kind: "free_text",
        free_text_label: draft.reference.label,
        quantity_text: draft.quantityText,
        note: draft.note,
      };
  }
}
