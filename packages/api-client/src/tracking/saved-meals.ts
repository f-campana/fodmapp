import type { SavedMealDraft, SavedMealRecord } from "@fodmapp/domain";

import type { ProtectedApiAuth } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import { mapSavedMealApiResponse } from "../mapping/tracking";
import {
  buildTrackingItemInputFromDraft,
  type SavedMealCreateRequest,
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
  auth: ProtectedApiAuth,
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

export async function updateSavedMealRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
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
