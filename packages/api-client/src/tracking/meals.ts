import type { MealEntry, MealEntryDraft } from "@fodmapp/domain";

import type { ProtectedApiAuth } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import { mapMealLogApiResponse } from "../mapping/tracking";
import {
  buildTrackingItemInputFromDraft,
  type MealLogCreateRequest,
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
  auth: ProtectedApiAuth,
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

export async function updateMealEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
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
