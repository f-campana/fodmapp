"use client";

import type { components } from "@fodmapp/types";

import { buildApiUrl } from "./api/base";
import { getClientRuntimeEnv } from "./env.client";

const TRACKING_API_ROOT = "/me/tracking";

export type SymptomLog = components["schemas"]["SymptomLog"];
export type SymptomLogCreateRequest =
  components["schemas"]["SymptomLogCreateRequest"];
export type SymptomLogUpdateRequest =
  components["schemas"]["SymptomLogUpdateRequest"];
export type MealLog = components["schemas"]["MealLog"];
export type MealLogCreateRequest =
  components["schemas"]["MealLogCreateRequest"];
export type MealLogUpdateRequest =
  components["schemas"]["MealLogUpdateRequest"];
export type CustomFood = components["schemas"]["CustomFood"];
export type CustomFoodCreateRequest =
  components["schemas"]["CustomFoodCreateRequest"];
export type CustomFoodUpdateRequest =
  components["schemas"]["CustomFoodUpdateRequest"];
export type SavedMeal = components["schemas"]["SavedMeal"];
export type SavedMealCreateRequest =
  components["schemas"]["SavedMealCreateRequest"];
export type SavedMealUpdateRequest =
  components["schemas"]["SavedMealUpdateRequest"];
export type TrackingFeedResponse =
  components["schemas"]["TrackingFeedResponse"];
export type WeeklyTrackingSummaryResponse =
  components["schemas"]["WeeklyTrackingSummaryResponse"];

function getTrackingApiBase(apiBase?: string | null): string | null {
  return apiBase ?? getClientRuntimeEnv().apiBaseUrl;
}

async function callTrackingApi<T>(
  path: string,
  userId: string,
  options: RequestInit = {},
  apiBase?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("X-User-Id", userId);
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = buildApiUrl(path, getTrackingApiBase(apiBase));
  if (!url) {
    throw new Error("tracking-api error 0: api_not_configured");
  }

  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body && "error" in body
        ? JSON.stringify(body)
        : await response.text().catch(() => "");
    throw new Error(`tracking-api error ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getTrackingFeed(
  userId: string,
  limit = 50,
  apiBase?: string | null,
): Promise<TrackingFeedResponse> {
  return callTrackingApi<TrackingFeedResponse>(
    `${TRACKING_API_ROOT}/feed?limit=${limit}`,
    userId,
    { method: "GET" },
    apiBase,
  );
}

export function getWeeklyTrackingSummary(
  userId: string,
  anchorDate?: string,
  apiBase?: string | null,
): Promise<WeeklyTrackingSummaryResponse> {
  const suffix = anchorDate
    ? `${TRACKING_API_ROOT}/summary/weekly?anchor_date=${encodeURIComponent(anchorDate)}`
    : `${TRACKING_API_ROOT}/summary/weekly`;
  return callTrackingApi<WeeklyTrackingSummaryResponse>(
    suffix,
    userId,
    { method: "GET" },
    apiBase,
  );
}

export function listTrackingSymptoms(
  userId: string,
  limit = 100,
  apiBase?: string | null,
): Promise<SymptomLog[]> {
  return callTrackingApi<SymptomLog[]>(
    `${TRACKING_API_ROOT}/symptoms?limit=${limit}`,
    userId,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingSymptom(
  userId: string,
  payload: SymptomLogCreateRequest,
  apiBase?: string | null,
): Promise<SymptomLog> {
  return callTrackingApi<SymptomLog>(
    `${TRACKING_API_ROOT}/symptoms`,
    userId,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function updateTrackingSymptom(
  userId: string,
  symptomLogId: string,
  payload: SymptomLogUpdateRequest,
  apiBase?: string | null,
): Promise<SymptomLog> {
  return callTrackingApi<SymptomLog>(
    `${TRACKING_API_ROOT}/symptoms/${symptomLogId}`,
    userId,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingSymptom(
  userId: string,
  symptomLogId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/symptoms/${symptomLogId}`,
    userId,
    { method: "DELETE" },
    apiBase,
  );
}

export function listTrackingMeals(
  userId: string,
  limit = 100,
  apiBase?: string | null,
): Promise<MealLog[]> {
  return callTrackingApi<MealLog[]>(
    `${TRACKING_API_ROOT}/meals?limit=${limit}`,
    userId,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingMeal(
  userId: string,
  payload: MealLogCreateRequest,
  apiBase?: string | null,
): Promise<MealLog> {
  return callTrackingApi<MealLog>(
    `${TRACKING_API_ROOT}/meals`,
    userId,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function updateTrackingMeal(
  userId: string,
  mealLogId: string,
  payload: MealLogUpdateRequest,
  apiBase?: string | null,
): Promise<MealLog> {
  return callTrackingApi<MealLog>(
    `${TRACKING_API_ROOT}/meals/${mealLogId}`,
    userId,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingMeal(
  userId: string,
  mealLogId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/meals/${mealLogId}`,
    userId,
    { method: "DELETE" },
    apiBase,
  );
}

export function listTrackingCustomFoods(
  userId: string,
  apiBase?: string | null,
): Promise<CustomFood[]> {
  return callTrackingApi<CustomFood[]>(
    `${TRACKING_API_ROOT}/custom-foods`,
    userId,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingCustomFood(
  userId: string,
  payload: CustomFoodCreateRequest,
  apiBase?: string | null,
): Promise<CustomFood> {
  return callTrackingApi<CustomFood>(
    `${TRACKING_API_ROOT}/custom-foods`,
    userId,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function updateTrackingCustomFood(
  userId: string,
  customFoodId: string,
  payload: CustomFoodUpdateRequest,
  apiBase?: string | null,
): Promise<CustomFood> {
  return callTrackingApi<CustomFood>(
    `${TRACKING_API_ROOT}/custom-foods/${customFoodId}`,
    userId,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingCustomFood(
  userId: string,
  customFoodId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/custom-foods/${customFoodId}`,
    userId,
    { method: "DELETE" },
    apiBase,
  );
}

export function listTrackingSavedMeals(
  userId: string,
  apiBase?: string | null,
): Promise<SavedMeal[]> {
  return callTrackingApi<SavedMeal[]>(
    `${TRACKING_API_ROOT}/saved-meals`,
    userId,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingSavedMeal(
  userId: string,
  payload: SavedMealCreateRequest,
  apiBase?: string | null,
): Promise<SavedMeal> {
  return callTrackingApi<SavedMeal>(
    `${TRACKING_API_ROOT}/saved-meals`,
    userId,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function updateTrackingSavedMeal(
  userId: string,
  savedMealId: string,
  payload: SavedMealUpdateRequest,
  apiBase?: string | null,
): Promise<SavedMeal> {
  return callTrackingApi<SavedMeal>(
    `${TRACKING_API_ROOT}/saved-meals/${savedMealId}`,
    userId,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingSavedMeal(
  userId: string,
  savedMealId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/saved-meals/${savedMealId}`,
    userId,
    { method: "DELETE" },
    apiBase,
  );
}
