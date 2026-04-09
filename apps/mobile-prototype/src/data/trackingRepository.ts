import {
  createSymptomEntry,
  getTrackingFeed,
  getTrackingHubReadModel,
  type SymptomEntry,
  type TrackingFeed,
  type TrackingHubReadModel,
} from "@fodmapp/api-client";
import type { SymptomType } from "@fodmapp/domain";

import type { AuthTokenGetter } from "../auth/useAuth";
import { getProtectedApiClientConfig } from "../config/api";

const DEFAULT_FEED_LIMIT = 20;

export interface CreateSymptomInput {
  symptomType: SymptomType;
  severity: number;
  note: string | null;
}

export interface TrackingRepository {
  getFeed: (limit?: number) => Promise<TrackingFeed>;
  getHubReadModel: (options?: {
    anchorDate?: string;
    feedLimit?: number;
  }) => Promise<TrackingHubReadModel>;
  createSymptom: (input: CreateSymptomInput) => Promise<SymptomEntry>;
}

function normalizeNote(note: string | null): string | null {
  if (!note) {
    return null;
  }

  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function createTrackingRepository(
  getToken: AuthTokenGetter,
): TrackingRepository {
  return {
    getFeed: async (limit = DEFAULT_FEED_LIMIT) =>
      getTrackingFeed(getProtectedApiClientConfig(), getToken, limit),
    getHubReadModel: async (options = {}) =>
      getTrackingHubReadModel(getProtectedApiClientConfig(), getToken, options),
    createSymptom: async (input) =>
      createSymptomEntry(getProtectedApiClientConfig(), getToken, {
        symptomType: input.symptomType,
        severity: input.severity,
        notedAtUtc: new Date().toISOString(),
        note: normalizeNote(input.note),
      }),
  };
}
