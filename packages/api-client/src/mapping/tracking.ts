import {
  type CustomFoodRecord,
  mapCustomFoodToCustomFoodRecord,
  mapMealLogToMealEntry,
  mapSavedMealToSavedMealRecord,
  mapSymptomLogToSymptomEntry,
  mapTrackingFeedResponse,
  mapWeeklyTrackingSummaryResponse,
  type MealEntry,
  type SavedMealRecord,
  type SymptomEntry,
  type TrackingFeed,
  type WeeklyTrackingSummary,
} from "@fodmapp/domain";

import type {
  CustomFoodListResponse,
  CustomFoodResponse,
  MealLogListResponse,
  MealLogResponse,
  SavedMealListResponse,
  SavedMealResponse,
  SymptomLogListResponse,
  SymptomLogResponse,
  TrackingFeedResponse,
  WeeklyTrackingSummaryResponse,
} from "../tracking/shared";

function isValidTrackingFeedItem(
  entry: TrackingFeedResponse["items"][number],
): boolean {
  if (entry.entry_type === "meal") {
    return entry.meal != null;
  }

  if (entry.entry_type === "symptom") {
    return entry.symptom != null;
  }

  return false;
}

export function mapTrackingFeedApiResponse(
  response: TrackingFeedResponse,
): TrackingFeed {
  return mapTrackingFeedResponse({
    ...response,
    items: response.items.filter(isValidTrackingFeedItem),
  });
}

export function mapWeeklyTrackingSummaryApiResponse(
  response: WeeklyTrackingSummaryResponse,
): WeeklyTrackingSummary {
  return mapWeeklyTrackingSummaryResponse(response);
}

export function mapMealLogApiResponse(response: MealLogResponse): MealEntry {
  return mapMealLogToMealEntry(response);
}

export function mapMealLogListApiResponse(
  response: MealLogListResponse,
): MealEntry[] {
  return response.map(mapMealLogToMealEntry);
}

export function mapSymptomLogApiResponse(
  response: SymptomLogResponse,
): SymptomEntry {
  return mapSymptomLogToSymptomEntry(response);
}

export function mapSymptomLogListApiResponse(
  response: SymptomLogListResponse,
): SymptomEntry[] {
  return response.map(mapSymptomLogToSymptomEntry);
}

export function mapCustomFoodApiResponse(
  response: CustomFoodResponse,
): CustomFoodRecord {
  return mapCustomFoodToCustomFoodRecord(response);
}

export function mapCustomFoodListApiResponse(
  response: CustomFoodListResponse,
): CustomFoodRecord[] {
  return response.map(mapCustomFoodToCustomFoodRecord);
}

export function mapSavedMealApiResponse(
  response: SavedMealResponse,
): SavedMealRecord {
  return mapSavedMealToSavedMealRecord(response);
}

export function mapSavedMealListApiResponse(
  response: SavedMealListResponse,
): SavedMealRecord[] {
  return response.map(mapSavedMealToSavedMealRecord);
}
