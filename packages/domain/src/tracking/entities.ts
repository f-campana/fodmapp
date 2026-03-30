import type { components } from "@fodmapp/types";

import type {
  DomainCapabilities,
  DomainProvenance,
  EvidenceTier,
} from "../shared/concepts";

export type SymptomType = components["schemas"]["SymptomType"];
export type TrackingItemKind = components["schemas"]["TrackingItemKind"];

export interface TrackingItemReferenceBase {
  label: string;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface CanonicalTrackingItemReference extends TrackingItemReferenceBase {
  kind: "canonical_food";
  foodSlug: string | null;
}

export interface CustomTrackingItemReference extends TrackingItemReferenceBase {
  kind: "custom_food";
  customFoodId: string | null;
}

export interface FreeTextTrackingItemReference extends TrackingItemReferenceBase {
  kind: "free_text";
}

export type TrackingItemReference =
  | CanonicalTrackingItemReference
  | CustomTrackingItemReference
  | FreeTextTrackingItemReference;

export interface CanonicalTrackingItemDraftReference {
  kind: "canonical_food";
  foodSlug: string | null;
}

export interface CustomTrackingItemDraftReference {
  kind: "custom_food";
  customFoodId: string | null;
}

export interface FreeTextTrackingItemDraftReference {
  kind: "free_text";
  label: string | null;
}

export type TrackingItemDraftReference =
  | CanonicalTrackingItemDraftReference
  | CustomTrackingItemDraftReference
  | FreeTextTrackingItemDraftReference;

export interface TrackingItemDraft {
  reference: TrackingItemDraftReference;
  quantityText: string | null;
  note: string | null;
}

export interface TrackingLoggedItem {
  itemId: string;
  sortOrder: number;
  reference: TrackingItemReference;
  quantityText: string | null;
  note: string | null;
}

export interface SymptomEntry {
  kind: "symptom_log";
  symptomLogId: string;
  symptomType: SymptomType;
  severity: number;
  notedAtUtc: string;
  note: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface SymptomEntryDraft {
  symptomType: SymptomType;
  severity: number;
  notedAtUtc: string;
  note: string | null;
}

export interface SymptomEntryPatch {
  symptomType?: SymptomType;
  severity?: number | null;
  notedAtUtc?: string | null;
  note?: string | null;
}

export interface MealEntry {
  kind: "meal_log";
  mealLogId: string;
  title: string | null;
  occurredAtUtc: string;
  note: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  items: TrackingLoggedItem[];
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface MealEntryDraft {
  occurredAtUtc: string;
  title: string | null;
  note: string | null;
  items: TrackingItemDraft[];
}

export interface MealEntryPatch {
  occurredAtUtc?: string | null;
  title?: string | null;
  note?: string | null;
  items?: TrackingItemDraft[];
}

export interface CustomFoodRecord {
  kind: "custom_food";
  customFoodId: string;
  label: string;
  note: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface CustomFoodDraft {
  label: string;
  note: string | null;
}

export interface CustomFoodPatch {
  label?: string | null;
  note?: string | null;
}

export interface SavedMealRecord {
  kind: "saved_meal";
  savedMealId: string;
  label: string;
  note: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc: string;
  items: TrackingLoggedItem[];
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface SavedMealDraft {
  label: string;
  note: string | null;
  items: TrackingItemDraft[];
}

export interface SavedMealPatch {
  label?: string | null;
  note?: string | null;
  items?: TrackingItemDraft[];
}

export type TrackingFeedEntry =
  | {
      entryType: "meal";
      occurredAtUtc: string;
      entryId: string;
      meal: MealEntry;
      provenance: DomainProvenance;
      evidenceTier: EvidenceTier;
      capabilities: DomainCapabilities;
    }
  | {
      entryType: "symptom";
      occurredAtUtc: string;
      entryId: string;
      symptom: SymptomEntry;
      provenance: DomainProvenance;
      evidenceTier: EvidenceTier;
      capabilities: DomainCapabilities;
    };

export interface TrackingFeed {
  total: number;
  limit: number;
  items: TrackingFeedEntry[];
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface DailyTrackingCount {
  date: string;
  mealCount: number;
  symptomCount: number;
}

export interface SymptomTypeCount {
  symptomType: SymptomType;
  count: number;
}

export interface TrackingSeveritySummary {
  average: number | null;
  maximum: number | null;
}

export interface ProximityMealReference {
  mealLogId: string;
  title: string | null;
  occurredAtUtc: string;
  hoursBeforeSymptom: number;
  itemLabels: string[];
}

export interface SymptomProximityGroup {
  symptomLogId: string;
  symptomType: SymptomType;
  severity: number;
  notedAtUtc: string;
  nearbyMeals: ProximityMealReference[];
}

export interface WeeklyTrackingSummary {
  anchorDate: string;
  windowStartUtc: string;
  windowEndUtc: string;
  dailyCounts: DailyTrackingCount[];
  symptomCounts: SymptomTypeCount[];
  severity: TrackingSeveritySummary;
  proximityGroups: SymptomProximityGroup[];
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}
