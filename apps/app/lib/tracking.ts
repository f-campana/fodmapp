"use client";

import type { components } from "@fodmapp/types";

import { buildApiUrl } from "./api/base";
import { getClientRuntimeEnv } from "./env.client";
import {
  buildProtectedApiHeaders,
  type ProtectedApiAuth,
} from "./protectedApiAuth";

const TRACKING_API_ROOT = "/me/tracking";

export type SymptomLog = components["schemas"]["SymptomLog"];
export type MealLog = components["schemas"]["MealLog"];
export type CustomFood = components["schemas"]["CustomFood"];
export type SavedMeal = components["schemas"]["SavedMeal"];
export type {
  CustomFoodDraft,
  MealEntry,
  MealEntryDraft,
  SavedMealDraft,
  SymptomEntry,
  SymptomEntryDraft,
  TrackingItemDraft,
  TrackingLoggedItem,
} from "@fodmapp/domain";

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
