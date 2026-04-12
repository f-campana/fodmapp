import {
  createMealEntry,
  createSymptomEntry,
  getTrackingFeed,
  getTrackingHubReadModel,
  type MealEntry,
  type SymptomEntry,
  type TrackingFeed,
  type TrackingHubReadModel,
} from "@fodmapp/api-client";
import type { SymptomType, TrackingItemDraft } from "@fodmapp/domain";

import type { AuthTokenGetter } from "../auth/useAuth";
import { getProtectedApiClientConfig } from "../config/api";

const DEFAULT_FEED_LIMIT = 20;

export interface CreateSymptomInput {
  symptomType: SymptomType;
  severity: number;
  note: string | null;
}

export interface CreateMealItemInput {
  label: string;
  quantityText: string | null;
}

export interface CreateMealInput {
  title: string | null;
  note: string | null;
  items: CreateMealItemInput[];
}

export interface TrackingRepository {
  getFeed: (limit?: number) => Promise<TrackingFeed>;
  getHubReadModel: (options?: {
    anchorDate?: string;
    feedLimit?: number;
  }) => Promise<TrackingHubReadModel>;
  createSymptom: (input: CreateSymptomInput) => Promise<SymptomEntry>;
  createMeal: (input: CreateMealInput) => Promise<MealEntry>;
}

function normalizeNote(note: string | null): string | null {
  if (!note) {
    return null;
  }

  const trimmed = note.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeOptionalText(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildMealItems(items: CreateMealItemInput[]): TrackingItemDraft[] {
  return items.map((item) => ({
    reference: {
      kind: "free_text",
      label: item.label.trim(),
    },
    quantityText: normalizeOptionalText(item.quantityText),
    note: null,
  }));
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
    createMeal: async (input) =>
      createMealEntry(getProtectedApiClientConfig(), getToken, {
        title: normalizeOptionalText(input.title),
        occurredAtUtc: new Date().toISOString(),
        note: normalizeNote(input.note),
        items: buildMealItems(input.items),
      }),
  };
}
