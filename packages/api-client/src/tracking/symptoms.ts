import type { SymptomEntry, SymptomEntryDraft } from "@fodmapp/domain";

import type { ProtectedApiAuth } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import { mapSymptomLogApiResponse } from "../mapping/tracking";
import {
  type SymptomLogCreateRequest,
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
  auth: ProtectedApiAuth,
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

export async function updateSymptomEntry(
  config: ApiClientConfig,
  auth: ProtectedApiAuth,
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
