import type { MealEntry, MealEntryDraft } from "@fodmapp/domain";

import type { ProtectedApiAuthInput } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import {
  mapMealLogApiResponse,
  mapMealLogListApiResponse,
} from "../mapping/tracking";
import {
  buildTrackingItemInputFromDraft,
  type MealLogCreateRequest,
  type MealLogListResponse,
  type MealLogResponse,
  type MealLogUpdateRequest,
  TRACKING_API_ROOT,
} from "./shared";

function buildMealLogCreateRequestFromDraft(
  draft: MealEntryDraft,
): MealLogCreateRequest {
  return {
    title: draft.title,
    occurred_at_utc: draft.occurredAtUtc,
    note: draft.note,
    items: draft.items.map(buildTrackingItemInputFromDraft),
  };
}

function buildMealLogUpdateRequestFromDraft(
  draft: MealEntryDraft,
): MealLogUpdateRequest {
  return {
    title: draft.title,
    occurred_at_utc: draft.occurredAtUtc,
    note: draft.note,
    items: draft.items.map(buildTrackingItemInputFromDraft),
  };
}

export async function createMealEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  draft: MealEntryDraft,
): Promise<MealEntry> {
  const response = await requestProtectedJson<MealLogResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/meals`,
    {
      method: "POST",
      body: JSON.stringify(buildMealLogCreateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapMealLogApiResponse(response);
}

export async function listMealEntries(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  limit = 100,
): Promise<MealEntry[]> {
  const response = await requestProtectedJson<MealLogListResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/meals?limit=${limit}`,
    { method: "GET" },
    { errorPrefix: "tracking-api" },
  );

  return mapMealLogListApiResponse(response);
}

export async function updateMealEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  mealLogId: string,
  draft: MealEntryDraft,
): Promise<MealEntry> {
  const response = await requestProtectedJson<MealLogResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/meals/${mealLogId}`,
    {
      method: "PATCH",
      body: JSON.stringify(buildMealLogUpdateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapMealLogApiResponse(response);
}

export async function deleteMealEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  mealLogId: string,
): Promise<void> {
  await requestProtectedJson<void>(
    config,
    auth,
    `${TRACKING_API_ROOT}/meals/${mealLogId}`,
    { method: "DELETE" },
    { errorPrefix: "tracking-api" },
  );
}
