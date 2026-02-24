import { normalizeBarcode } from "@fodmap/barcode-core";
import type { BarcodeLookupResult } from "@fodmap/barcode-core";

export interface InternalClientOptions {
  token: string;
  defaultActor?: string;
  actorHeaderName?: string;
}

export interface BarcodeClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  internal?: InternalClientOptions;
}

export interface BarcodeLinkMutationResult {
  normalized_code: string;
  canonical_format: "EAN8" | "EAN13";
  action: "set_manual" | "clear_manual";
  food_slug?: string | null;
  removed?: boolean | null;
}

interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class BarcodeClientError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "BarcodeClientError";
    this.status = status;
    this.code = code;
  }
}

export interface BarcodeClient {
  lookupBarcode(code: string): Promise<BarcodeLookupResult>;
  setManualBarcodeLink(code: string, foodSlug: string, actor?: string): Promise<BarcodeLinkMutationResult>;
  clearManualBarcodeLink(code: string, actor?: string): Promise<BarcodeLinkMutationResult>;
}

export function createBarcodeClient(options: BarcodeClientOptions): BarcodeClient {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error("fetch implementation is required");
  }

  const baseUrl = options.baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const data = (await response.json()) as T & ErrorBody;
    if (!response.ok) {
      throw new BarcodeClientError(
        response.status,
        data.error?.code ?? "unknown_error",
        data.error?.message ?? `HTTP ${response.status}`,
      );
    }
    return data;
  }

  function internalHeaders(actor?: string): Record<string, string> {
    const internal = options.internal;
    if (!internal) {
      throw new Error("internal client options are required for manual link mutations");
    }
    const chosenActor = actor ?? internal.defaultActor;
    if (!chosenActor) {
      throw new Error("actor is required for manual link mutations");
    }

    return {
      Authorization: `Bearer ${internal.token}`,
      [internal.actorHeaderName ?? "X-Actor"]: chosenActor,
    };
  }

  return {
    async lookupBarcode(code: string): Promise<BarcodeLookupResult> {
      const normalized = normalizeBarcode(code);
      return request<BarcodeLookupResult>(`/v0/barcodes/${normalized.queryCode.trim()}`);
    },

    async setManualBarcodeLink(code: string, foodSlug: string, actor?: string): Promise<BarcodeLinkMutationResult> {
      const normalized = normalizeBarcode(code);
      return request<BarcodeLinkMutationResult>(`/v0/internal/barcodes/${normalized.queryCode.trim()}/link`, {
        method: "PUT",
        headers: internalHeaders(actor),
        body: JSON.stringify({ food_slug: foodSlug }),
      });
    },

    async clearManualBarcodeLink(code: string, actor?: string): Promise<BarcodeLinkMutationResult> {
      const normalized = normalizeBarcode(code);
      return request<BarcodeLinkMutationResult>(`/v0/internal/barcodes/${normalized.queryCode.trim()}/link`, {
        method: "DELETE",
        headers: internalHeaders(actor),
      });
    },
  };
}

export function lookupBarcode(client: BarcodeClient, code: string): Promise<BarcodeLookupResult> {
  return client.lookupBarcode(code);
}

export function setManualBarcodeLink(
  client: BarcodeClient,
  code: string,
  foodSlug: string,
  actor?: string,
): Promise<BarcodeLinkMutationResult> {
  return client.setManualBarcodeLink(code, foodSlug, actor);
}

export function clearManualBarcodeLink(
  client: BarcodeClient,
  code: string,
  actor?: string,
): Promise<BarcodeLinkMutationResult> {
  return client.clearManualBarcodeLink(code, actor);
}
