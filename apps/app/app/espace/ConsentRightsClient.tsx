"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui";

import {
  CONSENT_API_CONFIRM_TEXT,
  type ConsentRecord,
  type DeleteAccepted,
  type ExportAccepted,
  getConsentApiConfig,
  getConsentRecord,
  grantOrRevokeConsent,
  pollDeleteStatus,
  pollExportStatus,
  requestDelete,
  requestExport,
} from "../../lib/consent";
import {
  getMedicalSafetyCopy,
  type MedicalLocale,
} from "../../lib/medicalSafetyCopy";

type PollState = {
  loading: boolean;
  error: string | null;
  payload: Record<string, unknown> | null;
};

type ConsentActionState = "idle" | "loading" | "submitted" | "error";

interface ConsentRightsClientProps {
  userId: string | null;
  locale: MedicalLocale;
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function pickPollTerminated(status: string | null | undefined): boolean {
  if (!status) {
    return false;
  }

  return [
    "ready",
    "ready_with_redactions",
    "failed",
    "partial",
    "completed",
  ].includes(status);
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function pickStatus(payload: PollState["payload"]): string | null {
  if (!payload) {
    return null;
  }

  const proof = payload.proof;
  const status =
    toText(payload.status) ??
    toText(payload.state) ??
    toText(payload.current_state) ??
    toText(payload.stage);

  if (status) {
    return status;
  }

  if (proof && typeof proof === "object") {
    return toText((proof as Record<string, unknown>).status);
  }

  return null;
}

function pickReceiptId(payload: PollState["payload"]): string | null {
  if (!payload) {
    return null;
  }

  const candidates = [
    "proof_id",
    "proofId",
    "receipt_id",
    "receiptId",
    "export_receipt_id",
    "delete_receipt_id",
    "request_id",
    "requestId",
  ];

  for (const key of candidates) {
    const value = toText((payload as Record<string, unknown>)[key]);
    if (value) {
      return value;
    }
  }

  if (typeof payload.proof === "object" && payload.proof !== null) {
    const proof = payload.proof as Record<string, unknown>;
    for (const key of candidates) {
      const value = toText(proof[key]);
      if (value) {
        return value;
      }
    }
  }

  return null;
}

function pickDownloadUrl(payload: PollState["payload"]): string | null {
  if (!payload) {
    return null;
  }

  return toText(payload.download_url) ?? toText(payload.downloadUrl) ?? null;
}

function pickManifestSummary(payload: PollState["payload"]): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const rows = payload.manifest;
  if (!rows || typeof rows !== "object") {
    return null;
  }

  const rowsByDomain = (rows as Record<string, unknown>).rows_by_domain;
  if (!rowsByDomain || typeof rowsByDomain !== "object") {
    return null;
  }

  return JSON.stringify(rowsByDomain);
}

function formatScope(scope: unknown): string {
  if (!scope || typeof scope !== "object") {
    return "scope not present";
  }

  return Object.entries(scope as Record<string, unknown>)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, enabled]) => `${name}: ${String(enabled)}`)
    .join(", ");
}

export default function ConsentRightsClient({
  userId,
  locale,
}: ConsentRightsClientProps) {
  const { apiBase } = getConsentApiConfig();

  const [consentState, setConsentState] = useState<ConsentRecord | null>(null);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentActionState, setConsentActionState] =
    useState<ConsentActionState>("idle");

  const [exportRequest, setExportRequest] = useState<ExportAccepted | null>(
    null,
  );
  const [deleteRequest, setDeleteRequest] = useState<DeleteAccepted | null>(
    null,
  );

  const [exportPoll, setExportPoll] = useState<PollState>({
    loading: false,
    error: null,
    payload: null,
  });
  const [deletePoll, setDeletePoll] = useState<PollState>({
    loading: false,
    error: null,
    payload: null,
  });

  const [confirmDeleteText, setConfirmDeleteText] = useState("");

  const copy = useCallback(
    (path: string, vars?: Record<string, string>) =>
      getMedicalSafetyCopy(locale, path, vars),
    [locale],
  );

  const consentModeLabel = useMemo(
    () =>
      consentState?.consentState.active
        ? copy("screens.consentMode.currentConsented")
        : copy("screens.consentMode.currentMinimal"),
    [consentState?.consentState.active, copy],
  );

  const activeScope = useMemo(
    () =>
      consentState?.consentState.scope &&
      typeof consentState.consentState.scope === "object" &&
      "sync_mutations" in consentState.consentState.scope
        ? Boolean(
            (consentState.consentState.scope as { sync_mutations?: boolean })
              .sync_mutations,
          )
        : false,
    [consentState],
  );

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setConsentState(null);
      setConsentLoading(false);
      return;
    }
    const currentUserId = userId;

    async function load() {
      setConsentLoading(true);
      try {
        const record = await getConsentRecord(currentUserId, apiBase);
        if (!cancelled) {
          setConsentState(record);
          setConsentError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setConsentError(formatError(error));
        }
      } finally {
        if (!cancelled) {
          setConsentLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [apiBase, userId]);

  useEffect(() => {
    if (!userId || !exportRequest) {
      return;
    }
    const currentUserId = userId;
    const currentExportId = exportRequest.exportId;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      setExportPoll((state) => ({ ...state, loading: true, error: null }));
      try {
        const result = (await pollExportStatus({
          userId: currentUserId,
          exportId: currentExportId,
          apiBase,
        })) as Record<string, unknown>;

        if (cancelled) {
          return;
        }

        setExportPoll({
          loading: false,
          error: null,
          payload: result,
        });

        if (!pickPollTerminated(pickStatus(result))) {
          timer = setTimeout(() => {
            void poll();
          }, 2000);
        }
      } catch (error) {
        if (!cancelled) {
          setExportPoll({
            loading: false,
            error: formatError(error),
            payload: null,
          });
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [apiBase, exportRequest, userId]);

  useEffect(() => {
    if (!userId || !deleteRequest) {
      return;
    }
    const currentUserId = userId;
    const currentDeleteRequestId = deleteRequest.deleteRequestId;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      setDeletePoll((state) => ({ ...state, loading: true, error: null }));
      try {
        const result = (await pollDeleteStatus({
          userId: currentUserId,
          deleteRequestId: currentDeleteRequestId,
          apiBase,
        })) as Record<string, unknown>;

        if (cancelled) {
          return;
        }

        setDeletePoll({
          loading: false,
          error: null,
          payload: result,
        });

        if (!pickPollTerminated(pickStatus(result))) {
          timer = setTimeout(() => {
            void poll();
          }, 2000);
        }
      } catch (error) {
        if (!cancelled) {
          setDeletePoll({
            loading: false,
            error: formatError(error),
            payload: null,
          });
        }
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [apiBase, deleteRequest, userId]);

  const updateConsentMode = async (nextMode: "grant" | "revoke") => {
    if (!userId) {
      return;
    }

    setConsentActionState("loading");
    const scope = {
      ...(consentState?.consentState.scope ?? {}),
      sync_mutations: nextMode === "grant",
    };

    try {
      await grantOrRevokeConsent({
        userId,
        action: nextMode,
        policyVersion: consentState?.consentState.policyVersion || "gdpr-v1",
        scope,
        apiBase,
      });
      const record = await getConsentRecord(userId, apiBase);
      setConsentState(record);
      setConsentError(null);
      setConsentActionState("submitted");
    } catch (error) {
      setConsentError(formatError(error));
      setConsentActionState("error");
    }
  };

  const sendExport = async () => {
    if (!userId) {
      return;
    }

    setExportPoll({ loading: true, error: null, payload: null });
    try {
      const response = await requestExport({
        userId,
        apiBase,
        request: {
          anonymize: true,
          include: [
            "consent",
            "profile",
            "swap_history",
            "symptoms",
            "diet_logs",
          ],
          format: "json",
        },
      });
      setExportRequest(response);
      setExportPoll({ loading: false, error: null, payload: null });
    } catch (error) {
      setExportPoll({
        loading: false,
        error: formatError(error),
        payload: null,
      });
    }
  };

  const sendDelete = async () => {
    if (!userId) {
      return;
    }

    if (confirmDeleteText.trim() !== CONSENT_API_CONFIRM_TEXT) {
      setDeletePoll((state) => ({
        ...state,
        error: copy("screens.deletion.confirmAction"),
      }));
      return;
    }

    setDeletePoll({ loading: true, error: null, payload: null });
    try {
      const response = await requestDelete({
        userId,
        apiBase,
        request: {
          scope: "all",
          hardDelete: true,
          softDeleteWindowDays: 0,
          reason: "user_request",
          confirmText: CONSENT_API_CONFIRM_TEXT,
        },
      });
      setDeleteRequest(response);
      setDeletePoll({ loading: false, error: null, payload: null });
    } catch (error) {
      setDeletePoll({
        loading: false,
        error: formatError(error),
        payload: null,
      });
    }
  };

  const exportStatus = pickStatus(exportPoll.payload);
  const exportProofId = pickReceiptId(exportPoll.payload);
  const exportDownloadUrl = pickDownloadUrl(exportPoll.payload);
  const exportManifestSummary = pickManifestSummary(exportPoll.payload);

  const deleteStatus = pickStatus(deletePoll.payload);
  const deleteProofId = pickReceiptId(deletePoll.payload);

  const consentActionLabel = activeScope
    ? copy("screens.consentMode.downgradePrompt")
    : copy("screens.consentMode.upgradePrompt");

  const statusHint = activeScope
    ? copy("screens.consentMode.downgradeWarning")
    : copy("screens.consentMode.upgradeSubtext");

  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{copy("screens.runtime.authRequiredTitle")}</CardTitle>
          <CardDescription>
            {copy("screens.runtime.authRequiredBody")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">{copy("fallbacks.advisoryFooter")}</p>
        </CardContent>
      </Card>
    );
  }

  if (consentLoading) {
    return <p>{copy("screens.runtime.loadingConsent")}</p>;
  }

  return (
    <main className="app-shell">
      <div className="app-shell__meta">
        <Badge variant="outline">{consentModeLabel}</Badge>
        <p className="app-shell__text">{statusHint}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{consentModeLabel}</CardTitle>
          <CardDescription>
            {copy("screens.consentMode.transitionSuccess")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {formatScope(consentState?.consentState.scope)}
          </p>
          <p className="app-shell__eyebrow">{statusHint}</p>
          {consentError ? (
            <p className="app-shell__eyebrow">{consentError}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => {
              void updateConsentMode(activeScope ? "revoke" : "grant");
            }}
            disabled={consentActionState === "loading"}
          >
            {consentActionLabel}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy("screens.clinicianShare.title")}</CardTitle>
          <CardDescription>
            {copy("screens.clinicianShare.exportHint")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {copy("screens.clinicianShare.disclaimer")}
          </p>
          <p className="app-shell__text">
            {consentState?.consentState.scope
              ? formatScope(consentState.consentState.scope)
              : copy("screens.clinicianShare.emptyState")}
          </p>
          <Button
            onClick={() => {
              void sendExport();
            }}
            className="mt-4"
            disabled={exportPoll.loading}
          >
            {copy("screens.clinicianShare.createCta")}
          </Button>
          {exportRequest ? (
            <p className="app-shell__eyebrow">
              {copy("screens.runtime.exportRequestLabel")}:{" "}
              {exportRequest.statusUri}
            </p>
          ) : null}
          {exportPoll.loading ? (
            <p>{copy("screens.notifications.pauseNow")}</p>
          ) : null}
          {exportPoll.error ? <p>{exportPoll.error}</p> : null}
          {exportStatus ? (
            <p className="app-shell__eyebrow">
              {copy("screens.runtime.statusLabel")}: {exportStatus}
            </p>
          ) : null}
          {exportProofId ? (
            <p className="app-shell__eyebrow">
              {copy("screens.runtime.proofLabel")}: {exportProofId}
            </p>
          ) : null}
          {exportDownloadUrl ? (
            <p className="app-shell__text">
              <a href={exportDownloadUrl}>
                {copy("screens.runtime.downloadLabel")}
              </a>
            </p>
          ) : null}
          {exportManifestSummary ? (
            <p className="app-shell__text">
              {copy("screens.runtime.manifestLabel")}: {exportManifestSummary}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy("screens.deletion.requestOpen")}</CardTitle>
          <CardDescription>
            {copy("screens.deletion.requestHelp")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {copy("screens.deletion.confirmAction")}
          </p>
          <input
            aria-label="confirmation"
            className="w-full rounded border border-input p-2"
            value={confirmDeleteText}
            onChange={(event) => setConfirmDeleteText(event.target.value)}
            placeholder={copy("screens.deletion.confirmAction")}
          />
          <Button
            onClick={() => {
              void sendDelete();
            }}
            className="mt-2"
            disabled={deletePoll.loading}
          >
            {copy("screens.deletion.success")}
          </Button>
          {deleteRequest ? (
            <p className="app-shell__eyebrow">
              {copy("screens.runtime.deleteRequestLabel")}:{" "}
              {deleteRequest.statusUri}
            </p>
          ) : null}
          {deletePoll.loading ? (
            <p>{copy("screens.notifications.pauseUntilReenabled")}</p>
          ) : null}
          {deletePoll.error ? <p>{deletePoll.error}</p> : null}
          {deleteStatus ? (
            <p className="app-shell__eyebrow">
              {copy("screens.runtime.statusLabel")}: {deleteStatus}
            </p>
          ) : null}
          {deleteProofId ? (
            <p className="app-shell__eyebrow">
              {copy("screens.runtime.proofLabel")}: {deleteProofId}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
