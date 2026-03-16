import { buildApiUrl, resolveApiBase } from "./api/base";
import { getClientRuntimeEnv } from "./env.client";
const API_PATHS = {
  consent: "/me/consent",
  export: "/me/export",
  delete: "/me/delete",
};

export interface ConsentBootstrapStatus {
  provider: "app-me-endpoint";
  mode: "disabled" | "api-ready";
  configured: boolean;
  runtimeEnabled: boolean;
  manualOptInRequested: boolean;
  manualOptIn: boolean;
  clientId: string | null;
  cookiesVersion: string | null;
  deferredReason: string | null;
}

const CONSENT_API_BOOTSTRAP_INFO =
  "Consent is API-backed via /v0/me endpoints and resolved per-account.";

export interface ConsentScope {
  [key: string]: boolean;
}

export interface ConsentState {
  active: boolean;
  consentId: string;
  policyVersion: string;
  legalBasis: string;
  scope: ConsentScope;
  method: string;
  source: string;
  grantedAtUtc: string;
  revokedAtUtc: string | null;
  status: string;
}

export interface ConsentEvent {
  event: string;
  atUtc: string;
  policyVersion: string;
  source: string | null;
  reason: string | null;
}

export interface ConsentRecord {
  consentId: string;
  consentState: ConsentState;
  history: ConsentEvent[];
}

export interface ExportRequest {
  idempotencyKey?: string;
  format?: "json" | "ndjson";
  include?: string[];
  fromTsUtc?: string | null;
  toTsUtc?: string | null;
  anonymize?: boolean;
}

export interface ExportAccepted {
  exportId: string;
  status: string;
  requestedAtUtc: string;
  expiryAtUtc: string;
  idempotencyKey: string;
  statusUri: string;
}

export interface DeleteRequest {
  scope: "all" | "symptoms_only" | "diet_only" | "analytics_only";
  softDeleteWindowDays?: number;
  hardDelete: boolean;
  confirmText?: string;
  reason?: string;
  idempotencyKey?: string;
}

export interface DeleteAccepted {
  deleteRequestId: string;
  status: string;
  requestedAtUtc: string;
  scope: string;
  idempotencyKey: string;
  localEffectiveTtlSeconds: number;
  serverEffectiveAtUtc: string;
  proofUri: string | null;
  statusUri: string;
}

export interface QueuePollResult {
  status: string;
  statusUri: string;
  result: unknown | null;
}

export interface ExportReceipt {
  status: "pending" | "ready" | "ready_with_redactions" | "failed" | "partial";
  statusUri: string;
  result: {
    export_id: string;
    status: string;
  };
}

type ConsentStatePayload = {
  active?: boolean;
  consent_id?: string;
  policy_version?: string;
  legal_basis?: string;
  scope?: ConsentScope;
  method?: string;
  source?: string;
  granted_at_utc?: string;
  revoked_at_utc?: string | null;
  status?: string;
};

async function callMeApi<T>(
  path: string,
  userId: string,
  options: RequestInit = {},
  apiBase?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set("X-User-Id", userId);

  const url = buildApiUrl(path, apiBase ?? getClientRuntimeEnv().apiBaseUrl);
  if (!url) {
    throw new Error("me-api error 0: api_not_configured");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body && "error" in body
        ? JSON.stringify(body)
        : await response.text().catch(() => "");
    throw new Error(`me-api error ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

export function getConsentApiConfig(): { apiBase: string | null } {
  const env = getClientRuntimeEnv();
  return {
    apiBase: env.apiBaseUrl,
  };
}

export function getConsentBootstrapStatus(): ConsentBootstrapStatus {
  const env = getClientRuntimeEnv();
  const configured = Boolean(env.apiBaseUrl);
  const deferredReason = configured
    ? CONSENT_API_BOOTSTRAP_INFO
    : "Consent API base is not configured.";

  return {
    provider: "app-me-endpoint",
    mode: configured ? "api-ready" : "disabled",
    configured,
    // API availability does not imply active consent.
    runtimeEnabled: false,
    manualOptInRequested: false,
    manualOptIn: false,
    clientId: null,
    cookiesVersion: null,
    deferredReason: deferredReason || null,
  };
}

export function canTrackWithConsent(
  status: ConsentBootstrapStatus = getConsentBootstrapStatus(),
): boolean {
  void status;
  // Bootstrap status alone is never sufficient to enable analytics tracking.
  return false;
}

export async function getConsentRecord(
  userId: string,
  apiBase?: string | null,
): Promise<ConsentRecord | null> {
  try {
    const payload = await callMeApi<{
      consent_state: ConsentStatePayload;
      history: Array<Record<string, unknown>>;
    }>(API_PATHS.consent, userId, { method: "GET" }, apiBase);

    return {
      consentId: String(payload.consent_state.consent_id ?? ""),
      consentState: {
        active: Boolean(payload.consent_state.active),
        consentId: String(payload.consent_state.consent_id ?? ""),
        policyVersion: String(payload.consent_state.policy_version ?? ""),
        legalBasis: String(payload.consent_state.legal_basis ?? "consent"),
        scope: payload.consent_state.scope as ConsentScope,
        method: String(payload.consent_state.method ?? "manual"),
        source: String(payload.consent_state.source ?? "app"),
        grantedAtUtc: String(payload.consent_state.granted_at_utc ?? ""),
        revokedAtUtc: payload.consent_state.revoked_at_utc
          ? String(payload.consent_state.revoked_at_utc)
          : null,
        status: String(payload.consent_state.status ?? "active"),
      },
      history: payload.history.map((entry) => ({
        event: String(entry.event ?? "unknown"),
        atUtc: String(entry.at_utc ?? ""),
        policyVersion: String(entry.policy_version ?? ""),
        source: entry.source ? String(entry.source) : null,
        reason: entry.reason ? String(entry.reason) : null,
      })),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }

    throw error;
  }
}

export async function grantOrRevokeConsent(params: {
  userId: string;
  action: "grant" | "revoke";
  scope: ConsentScope;
  policyVersion: string;
  apiBase?: string | null;
  reason?: string;
}): Promise<ConsentRecord> {
  const body = {
    action: params.action,
    scope: params.scope,
    policy_version: params.policyVersion,
    method: "in_app_sheet",
    source: "mobile_app",
    source_ref: "web_scaffold",
    language: "en",
    reason: params.reason ?? null,
    signature: null,
    public_key_id: null,
    signature_payload: null,
  };

  const response = await callMeApi<{
    consent_id: string;
    status: string;
    policy_version: string;
    legal_basis: string;
    effective_at_utc: string;
    previous_consent_id?: string | null;
    evidence_uri?: string | null;
    evidence_hash?: string | null;
  }>(
    API_PATHS.consent,
    params.userId,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    params.apiBase,
  );

  return {
    consentId: response.consent_id,
    consentState: {
      active: params.action === "grant",
      consentId: response.consent_id,
      policyVersion: response.policy_version,
      legalBasis: response.legal_basis,
      scope: params.scope,
      method: "in_app_sheet",
      source: "mobile_app",
      grantedAtUtc: response.effective_at_utc,
      revokedAtUtc: null,
      status: response.status,
    },
    history: [
      {
        event: params.action,
        atUtc: response.effective_at_utc,
        policyVersion: response.policy_version,
        source: "mobile_app",
        reason: params.reason ?? null,
      },
    ],
  };
}

export async function requestExport(params: {
  userId: string;
  request: ExportRequest;
  apiBase?: string | null;
}): Promise<ExportAccepted> {
  const response = await callMeApi<{
    export_id: string;
    status: string;
    requested_at_utc: string;
    expiry_at_utc: string;
    idempotency_key: string;
    status_uri: string;
  }>(
    API_PATHS.export,
    params.userId,
    {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: params.request.idempotencyKey,
        format: params.request.format ?? "json",
        from_ts_utc: params.request.fromTsUtc,
        to_ts_utc: params.request.toTsUtc,
        anonymize: params.request.anonymize ?? true,
        include: params.request.include ?? ["consent", "profile", "symptoms"],
      }),
    },
    params.apiBase,
  );

  return {
    exportId: response.export_id,
    status: response.status,
    requestedAtUtc: response.requested_at_utc,
    expiryAtUtc: response.expiry_at_utc,
    idempotencyKey: response.idempotency_key,
    statusUri: response.status_uri,
  };
}

export async function pollExportStatus(params: {
  userId: string;
  exportId: string;
  apiBase?: string | null;
}): Promise<Record<string, unknown>> {
  return callMeApi(
    `${API_PATHS.export}/${params.exportId}`,
    params.userId,
    { method: "GET" },
    params.apiBase,
  );
}

export async function requestDelete(params: {
  userId: string;
  request: DeleteRequest;
  apiBase?: string | null;
}): Promise<DeleteAccepted> {
  const response = await callMeApi<{
    delete_request_id: string;
    status: string;
    requested_at_utc: string;
    scope: string;
    idempotency_key: string;
    local_effective_ttl_seconds: number;
    server_effective_at_utc: string;
    proof_uri: string | null;
    status_uri: string;
  }>(
    API_PATHS.delete,
    params.userId,
    {
      method: "POST",
      body: JSON.stringify({
        scope: params.request.scope,
        soft_delete_window_days: params.request.softDeleteWindowDays ?? 0,
        hard_delete: params.request.hardDelete,
        confirm_text: params.request.confirmText ?? "SUPPRIMER MES DONNÉES",
        reason: params.request.reason ?? "user_request",
        idempotency_key: params.request.idempotencyKey,
      }),
    },
    params.apiBase,
  );

  return {
    deleteRequestId: response.delete_request_id,
    status: response.status,
    requestedAtUtc: response.requested_at_utc,
    scope: response.scope,
    idempotencyKey: response.idempotency_key,
    localEffectiveTtlSeconds: response.local_effective_ttl_seconds,
    serverEffectiveAtUtc: response.server_effective_at_utc,
    proofUri: response.proof_uri,
    statusUri: response.status_uri,
  };
}

export async function pollDeleteStatus(params: {
  userId: string;
  deleteRequestId: string;
  apiBase?: string | null;
}): Promise<Record<string, unknown>> {
  return callMeApi(
    `${API_PATHS.delete}/${params.deleteRequestId}`,
    params.userId,
    { method: "GET" },
    params.apiBase,
  );
}

export function buildExportUrl(
  statusUri: string,
  apiBase?: string | null,
): string {
  if (statusUri.startsWith("http://") || statusUri.startsWith("https://")) {
    return statusUri;
  }

  const base = resolveApiBase(apiBase ?? getClientRuntimeEnv().apiBaseUrl);
  if (!base) {
    return statusUri;
  }

  const normalizedStatusUri = statusUri.startsWith("/")
    ? statusUri
    : `/${statusUri}`;
  const basePath = normalizedStatusUri.startsWith("/v0")
    ? base.replace(/\/v0$/, "")
    : base;

  return `${basePath}${normalizedStatusUri}`;
}

export const CONSENT_API_CONFIRM_TEXT = "SUPPRIMER MES DONNÉES";
