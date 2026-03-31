"use client";

import {
  mapTrackingFeedResponse,
  mapWeeklyTrackingSummaryResponse,
  type MealEntryDraft,
  type SymptomEntryDraft,
  type TrackingFeed,
  type TrackingItemDraft,
  type WeeklyTrackingSummary,
} from "@fodmapp/domain";
import type { components } from "@fodmapp/types";

import { buildApiUrl } from "./api/base";
import { getClientRuntimeEnv } from "./env.client";
import {
  buildProtectedApiHeaders,
  type ProtectedApiAuth,
} from "./protectedApiAuth";

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
type TrackingItemInput = components["schemas"]["TrackingItemInput"];
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
export type {
  MealEntry,
  MealEntryDraft,
  SymptomEntry,
  SymptomEntryDraft,
  TrackingFeed,
  TrackingItemDraft,
  TrackingLoggedItem,
  WeeklyTrackingSummary,
} from "@fodmapp/domain";
export interface TrackingHubReadModel {
  feed: TrackingFeed;
  summary: WeeklyTrackingSummary;
}

function getTrackingApiBase(apiBase?: string | null): string | null {
  return apiBase ?? getClientRuntimeEnv().apiBaseUrl;
}

async function callTrackingApi<T>(
  path: string,
  auth: ProtectedApiAuth,
  options: RequestInit = {},
  apiBase?: string | null,
): Promise<T> {
  const headers = await buildProtectedApiHeaders(auth, options.headers, {
    json: Boolean(options.body),
  });

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
  auth: ProtectedApiAuth,
  limit = 50,
  apiBase?: string | null,
): Promise<TrackingFeedResponse> {
  return callTrackingApi<TrackingFeedResponse>(
    `${TRACKING_API_ROOT}/feed?limit=${limit}`,
    auth,
    { method: "GET" },
    apiBase,
  );
}

export function getWeeklyTrackingSummary(
  auth: ProtectedApiAuth,
  anchorDate?: string,
  apiBase?: string | null,
): Promise<WeeklyTrackingSummaryResponse> {
  const suffix = anchorDate
    ? `${TRACKING_API_ROOT}/summary/weekly?anchor_date=${encodeURIComponent(anchorDate)}`
    : `${TRACKING_API_ROOT}/summary/weekly`;
  return callTrackingApi<WeeklyTrackingSummaryResponse>(
    suffix,
    auth,
    { method: "GET" },
    apiBase,
  );
}

export async function getTrackingHubReadModel(
  auth: ProtectedApiAuth,
  options: {
    anchorDate?: string;
    feedLimit?: number;
    apiBase?: string | null;
  } = {},
): Promise<TrackingHubReadModel> {
  const { anchorDate, feedLimit = 50, apiBase } = options;
  const [feed, summary] = await Promise.all([
    getTrackingFeed(auth, feedLimit, apiBase),
    getWeeklyTrackingSummary(auth, anchorDate, apiBase),
  ]);

  return {
    feed: mapTrackingFeedResponse(feed),
    summary: mapWeeklyTrackingSummaryResponse(summary),
  };
}

export function listTrackingSymptoms(
  auth: ProtectedApiAuth,
  limit = 100,
  apiBase?: string | null,
): Promise<SymptomLog[]> {
  return callTrackingApi<SymptomLog[]>(
    `${TRACKING_API_ROOT}/symptoms?limit=${limit}`,
    auth,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingSymptom(
  auth: ProtectedApiAuth,
  payload: SymptomLogCreateRequest,
  apiBase?: string | null,
): Promise<SymptomLog> {
  return callTrackingApi<SymptomLog>(
    `${TRACKING_API_ROOT}/symptoms`,
    auth,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function buildSymptomLogCreateRequestFromDraft(
  draft: SymptomEntryDraft,
): SymptomLogCreateRequest {
  return {
    symptom_type: draft.symptomType,
    severity: draft.severity,
    noted_at_utc: draft.notedAtUtc,
    note: draft.note,
  };
}

export function buildSymptomLogUpdateRequestFromDraft(
  draft: SymptomEntryDraft,
): SymptomLogUpdateRequest {
  return {
    symptom_type: draft.symptomType,
    severity: draft.severity,
    noted_at_utc: draft.notedAtUtc,
    note: draft.note,
  };
}

export function updateTrackingSymptom(
  auth: ProtectedApiAuth,
  symptomLogId: string,
  payload: SymptomLogUpdateRequest,
  apiBase?: string | null,
): Promise<SymptomLog> {
  return callTrackingApi<SymptomLog>(
    `${TRACKING_API_ROOT}/symptoms/${symptomLogId}`,
    auth,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingSymptom(
  auth: ProtectedApiAuth,
  symptomLogId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/symptoms/${symptomLogId}`,
    auth,
    { method: "DELETE" },
    apiBase,
  );
}

export function listTrackingMeals(
  auth: ProtectedApiAuth,
  limit = 100,
  apiBase?: string | null,
): Promise<MealLog[]> {
  return callTrackingApi<MealLog[]>(
    `${TRACKING_API_ROOT}/meals?limit=${limit}`,
    auth,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingMeal(
  auth: ProtectedApiAuth,
  payload: MealLogCreateRequest,
  apiBase?: string | null,
): Promise<MealLog> {
  return callTrackingApi<MealLog>(
    `${TRACKING_API_ROOT}/meals`,
    auth,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

function buildTrackingItemInputFromDraft(
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

export function buildMealLogCreateRequestFromDraft(
  draft: MealEntryDraft,
): MealLogCreateRequest {
  return {
    title: draft.title,
    occurred_at_utc: draft.occurredAtUtc,
    note: draft.note,
    items: draft.items.map(buildTrackingItemInputFromDraft),
  };
}

export function buildMealLogUpdateRequestFromDraft(
  draft: MealEntryDraft,
): MealLogUpdateRequest {
  return {
    title: draft.title,
    occurred_at_utc: draft.occurredAtUtc,
    note: draft.note,
    items: draft.items.map(buildTrackingItemInputFromDraft),
  };
}

export function updateTrackingMeal(
  auth: ProtectedApiAuth,
  mealLogId: string,
  payload: MealLogUpdateRequest,
  apiBase?: string | null,
): Promise<MealLog> {
  return callTrackingApi<MealLog>(
    `${TRACKING_API_ROOT}/meals/${mealLogId}`,
    auth,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingMeal(
  auth: ProtectedApiAuth,
  mealLogId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/meals/${mealLogId}`,
    auth,
    { method: "DELETE" },
    apiBase,
  );
}

export function listTrackingCustomFoods(
  auth: ProtectedApiAuth,
  apiBase?: string | null,
): Promise<CustomFood[]> {
  return callTrackingApi<CustomFood[]>(
    `${TRACKING_API_ROOT}/custom-foods`,
    auth,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingCustomFood(
  auth: ProtectedApiAuth,
  payload: CustomFoodCreateRequest,
  apiBase?: string | null,
): Promise<CustomFood> {
  return callTrackingApi<CustomFood>(
    `${TRACKING_API_ROOT}/custom-foods`,
    auth,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function updateTrackingCustomFood(
  auth: ProtectedApiAuth,
  customFoodId: string,
  payload: CustomFoodUpdateRequest,
  apiBase?: string | null,
): Promise<CustomFood> {
  return callTrackingApi<CustomFood>(
    `${TRACKING_API_ROOT}/custom-foods/${customFoodId}`,
    auth,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingCustomFood(
  auth: ProtectedApiAuth,
  customFoodId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/custom-foods/${customFoodId}`,
    auth,
    { method: "DELETE" },
    apiBase,
  );
}

export function listTrackingSavedMeals(
  auth: ProtectedApiAuth,
  apiBase?: string | null,
): Promise<SavedMeal[]> {
  return callTrackingApi<SavedMeal[]>(
    `${TRACKING_API_ROOT}/saved-meals`,
    auth,
    { method: "GET" },
    apiBase,
  );
}

export function createTrackingSavedMeal(
  auth: ProtectedApiAuth,
  payload: SavedMealCreateRequest,
  apiBase?: string | null,
): Promise<SavedMeal> {
  return callTrackingApi<SavedMeal>(
    `${TRACKING_API_ROOT}/saved-meals`,
    auth,
    { method: "POST", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function updateTrackingSavedMeal(
  auth: ProtectedApiAuth,
  savedMealId: string,
  payload: SavedMealUpdateRequest,
  apiBase?: string | null,
): Promise<SavedMeal> {
  return callTrackingApi<SavedMeal>(
    `${TRACKING_API_ROOT}/saved-meals/${savedMealId}`,
    auth,
    { method: "PATCH", body: JSON.stringify(payload) },
    apiBase,
  );
}

export function deleteTrackingSavedMeal(
  auth: ProtectedApiAuth,
  savedMealId: string,
  apiBase?: string | null,
): Promise<void> {
  return callTrackingApi<void>(
    `${TRACKING_API_ROOT}/saved-meals/${savedMealId}`,
    auth,
    { method: "DELETE" },
    apiBase,
  );
}
