import type { SavedMealDraft, SavedMealRecord } from "@fodmapp/domain";

import type { ProtectedApiAuthInput } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import {
  mapSavedMealApiResponse,
  mapSavedMealListApiResponse,
} from "../mapping/tracking";
import {
  buildTrackingItemInputFromDraft,
  type SavedMealCreateRequest,
  type SavedMealListResponse,
  type SavedMealResponse,
  type SavedMealUpdateRequest,
  TRACKING_API_ROOT,
} from "./shared";

function buildSavedMealCreateRequestFromDraft(
  draft: SavedMealDraft,
): SavedMealCreateRequest {
  return {
    label: draft.label,
    note: draft.note,
    items: draft.items.map(buildTrackingItemInputFromDraft),
  };
}

function buildSavedMealUpdateRequestFromDraft(
  draft: SavedMealDraft,
): SavedMealUpdateRequest {
  return {
    label: draft.label,
    note: draft.note,
    items: draft.items.map(buildTrackingItemInputFromDraft),
  };
}

export async function createSavedMealRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  draft: SavedMealDraft,
): Promise<SavedMealRecord> {
  const response = await requestProtectedJson<SavedMealResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/saved-meals`,
    {
      method: "POST",
      body: JSON.stringify(buildSavedMealCreateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapSavedMealApiResponse(response);
}

export async function listSavedMealRecords(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
): Promise<SavedMealRecord[]> {
  const response = await requestProtectedJson<SavedMealListResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/saved-meals`,
    { method: "GET" },
    { errorPrefix: "tracking-api" },
  );

  return mapSavedMealListApiResponse(response);
}

export async function updateSavedMealRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  savedMealId: string,
  draft: SavedMealDraft,
): Promise<SavedMealRecord> {
  const response = await requestProtectedJson<SavedMealResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/saved-meals/${savedMealId}`,
    {
      method: "PATCH",
      body: JSON.stringify(buildSavedMealUpdateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapSavedMealApiResponse(response);
}

export async function deleteSavedMealRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  savedMealId: string,
): Promise<void> {
  await requestProtectedJson<void>(
    config,
    auth,
    `${TRACKING_API_ROOT}/saved-meals/${savedMealId}`,
    { method: "DELETE" },
    { errorPrefix: "tracking-api" },
  );
}
