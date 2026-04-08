import {
  type ConsentPostRequest,
  type ConsentRecordResponse,
  getConsentRecord,
  postConsentRecord,
} from "@fodmapp/api-client";

import type { AuthTokenGetter } from "../auth/useAuth";
import { getProtectedApiClientConfig } from "../config/api";

export type TrackingConsentMissingScope = "symptom_logs" | null;

export interface TrackingConsentState {
  canCreateSymptoms: boolean;
  isActive: boolean;
  missingScope: TrackingConsentMissingScope;
  scope: Record<string, boolean>;
  status: string | null;
}

export interface ConsentRepository {
  getConsentState: () => Promise<TrackingConsentState>;
  enableTracking: () => Promise<TrackingConsentState>;
}

const TRACKING_CONSENT_REQUEST: ConsentPostRequest = {
  action: "grant",
  policy_version: "gdpr-v1",
  scope: {
    symptom_logs: true,
    diet_logs: true,
    sync_mutations: true,
  },
  legal_basis: "consent",
  method: "in_app_sheet",
  source: "mobile_app",
  source_ref: "mobile_tracking_unlock",
  language: "en",
  reason: null,
  signature: null,
  public_key_id: null,
  signature_payload: null,
};

function hasSymptomTrackingScope(scope: Record<string, boolean>): boolean {
  return Boolean(scope.symptom_logs || scope.symptoms);
}

export function deriveTrackingConsentState(
  record: ConsentRecordResponse | null,
): TrackingConsentState {
  const scope = (record?.consent_state.scope ?? {}) as Record<string, boolean>;
  const isActive = Boolean(record?.consent_state.active);
  const canCreateSymptoms = isActive && hasSymptomTrackingScope(scope);

  return {
    canCreateSymptoms,
    isActive,
    missingScope: canCreateSymptoms ? null : "symptom_logs",
    scope,
    status: record?.consent_state.status ?? null,
  };
}

export function createConsentRepository(
  getToken: AuthTokenGetter,
): ConsentRepository {
  return {
    getConsentState: async () =>
      deriveTrackingConsentState(
        await getConsentRecord(getProtectedApiClientConfig(), getToken),
      ),
    enableTracking: async () => {
      await postConsentRecord(
        getProtectedApiClientConfig(),
        getToken,
        TRACKING_CONSENT_REQUEST,
      );

      return deriveTrackingConsentState(
        await getConsentRecord(getProtectedApiClientConfig(), getToken),
      );
    },
  };
}
