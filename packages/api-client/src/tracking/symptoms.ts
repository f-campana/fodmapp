import type { SymptomEntry, SymptomEntryDraft } from "@fodmapp/domain";

import type { ProtectedApiAuthInput } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import {
  mapSymptomLogApiResponse,
  mapSymptomLogListApiResponse,
} from "../mapping/tracking";
import {
  type SymptomLogCreateRequest,
  type SymptomLogListResponse,
  type SymptomLogResponse,
  type SymptomLogUpdateRequest,
  TRACKING_API_ROOT,
} from "./shared";

function buildSymptomLogCreateRequestFromDraft(
  draft: SymptomEntryDraft,
): SymptomLogCreateRequest {
  return {
    symptom_type: draft.symptomType,
    severity: draft.severity,
    noted_at_utc: draft.notedAtUtc,
    note: draft.note,
  };
}

function buildSymptomLogUpdateRequestFromDraft(
  draft: SymptomEntryDraft,
): SymptomLogUpdateRequest {
  return {
    symptom_type: draft.symptomType,
    severity: draft.severity,
    noted_at_utc: draft.notedAtUtc,
    note: draft.note,
  };
}

export async function createSymptomEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  draft: SymptomEntryDraft,
): Promise<SymptomEntry> {
  const response = await requestProtectedJson<SymptomLogResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/symptoms`,
    {
      method: "POST",
      body: JSON.stringify(buildSymptomLogCreateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapSymptomLogApiResponse(response);
}

export async function listSymptomEntries(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  limit = 100,
): Promise<SymptomEntry[]> {
  const response = await requestProtectedJson<SymptomLogListResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/symptoms?limit=${limit}`,
    { method: "GET" },
    { errorPrefix: "tracking-api" },
  );

  return mapSymptomLogListApiResponse(response);
}

export async function updateSymptomEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  symptomLogId: string,
  draft: SymptomEntryDraft,
): Promise<SymptomEntry> {
  const response = await requestProtectedJson<SymptomLogResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/symptoms/${symptomLogId}`,
    {
      method: "PATCH",
      body: JSON.stringify(buildSymptomLogUpdateRequestFromDraft(draft)),
    },
    { errorPrefix: "tracking-api" },
  );

  return mapSymptomLogApiResponse(response);
}

export async function deleteSymptomEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  symptomLogId: string,
): Promise<void> {
  await requestProtectedJson<void>(
    config,
    auth,
    `${TRACKING_API_ROOT}/symptoms/${symptomLogId}`,
    { method: "DELETE" },
    { errorPrefix: "tracking-api" },
  );
}
