import type { CustomFoodDraft, CustomFoodRecord } from "@fodmapp/domain";

import type { ProtectedApiAuth } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import {
  mapCustomFoodApiResponse,
  mapCustomFoodListApiResponse,
} from "../mapping/tracking";
import {
  type CustomFoodCreateRequest,
  type CustomFoodListResponse,
  type CustomFoodResponse,
  type CustomFoodUpdateRequest,
  TRACKING_API_ROOT,
} from "./shared";

function buildCustomFoodCreateRequestFromDraft(
  draft: CustomFoodDraft,
): CustomFoodCreateRequest {
  return {
    label: draft.label,
    note: draft.note,
  };
}

function buildCustomFoodUpdateRequestFromDraft(
  draft: CustomFoodDraft,
): CustomFoodUpdateRequest {
  return {
    label: draft.label,
    note: draft.note,
  };
}

export async function createCustomFoodRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
  draft: CustomFoodDraft,
): Promise<CustomFoodRecord> {
  const response = await requestProtectedJson<CustomFoodResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/custom-foods`,
    {
      method: "POST",
      body: JSON.stringify(buildCustomFoodCreateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapCustomFoodApiResponse(response);
}

export async function listCustomFoodRecords(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
): Promise<CustomFoodRecord[]> {
  const response = await requestProtectedJson<CustomFoodListResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/custom-foods`,
    { method: "GET" },
    { errorPrefix: "tracking-api" },
  );

  return mapCustomFoodListApiResponse(response);
}

export async function updateCustomFoodRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
  customFoodId: string,
  draft: CustomFoodDraft,
): Promise<CustomFoodRecord> {
  const response = await requestProtectedJson<CustomFoodResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/custom-foods/${customFoodId}`,
    {
      method: "PATCH",
      body: JSON.stringify(buildCustomFoodUpdateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapCustomFoodApiResponse(response);
}

export async function deleteCustomFoodRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
  customFoodId: string,
): Promise<void> {
  await requestProtectedJson<void>(
    config,
    auth,
    `${TRACKING_API_ROOT}/custom-foods/${customFoodId}`,
    { method: "DELETE" },
    { errorPrefix: "tracking-api" },
  );
}
