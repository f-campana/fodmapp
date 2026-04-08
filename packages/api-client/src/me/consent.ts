import type { operations } from "@fodmapp/types";

import type { ProtectedApiAuthInput } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";

const ME_CONSENT_API_PATH = "/me/consent";

export type ConsentRecordResponse =
  operations["getMeConsent"]["responses"][200]["content"]["application/json"];

export type ConsentPostRequest =
  operations["postMeConsent"]["requestBody"]["content"]["application/json"];

export type ConsentPostResponse =
  operations["postMeConsent"]["responses"][200]["content"]["application/json"];

export async function getConsentRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
): Promise<ConsentRecordResponse | null> {
  try {
    return await requestProtectedJson<ConsentRecordResponse>(
      config,
      auth,
      ME_CONSENT_API_PATH,
      { method: "GET" },
      { errorPrefix: "me-api" },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("me-api error 404")) {
      return null;
    }

    throw error;
  }
}

export async function postConsentRecord(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  request: ConsentPostRequest,
): Promise<ConsentPostResponse> {
  return requestProtectedJson<ConsentPostResponse>(
    config,
    auth,
    ME_CONSENT_API_PATH,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
    { errorPrefix: "me-api" },
  );
}
