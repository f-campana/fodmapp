import type { components } from "@fodmapp/types";

import type {
  DomainCapabilities,
  DomainProvenance,
  EvidenceTier,
} from "../shared/concepts";

export type FoodLevel = components["schemas"]["FoodLevel"];

export interface CuratedFoodNames {
  fr: string;
  en: string;
}

export interface CuratedFoodReferenceNames {
  fr: string | null;
  en: string | null;
}

export interface CuratedFoodReference {
  slug: string;
  names: CuratedFoodReferenceNames;
  overallLevel: FoodLevel | null;
}

export interface CuratedFoodSummary {
  kind: "curated_food";
  slug: string;
  names: CuratedFoodNames;
  overallLevel: FoodLevel | null;
  driverSubtype: string | null;
  coverageRatio: number | null;
  rollupComputedAt: string | null;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface CuratedFoodProfile {
  rollupServingGrams: number | null;
  overallLevel: FoodLevel;
  driverSubtype: string | null;
  knownSubtypesCount: number;
  coverageRatio: number;
  sourceSlug: string;
  rollupComputedAt: string;
  scoringVersion: string | null;
}

export interface CuratedFood {
  kind: "curated_food";
  slug: string;
  names: CuratedFoodNames;
  preparationState: string | null;
  status: string | null;
  sourceSlug: string | null;
  profile: CuratedFoodProfile | null;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface CuratedFoodSearchResult {
  query: string;
  limit: number;
  total: number;
  items: CuratedFoodSummary[];
}
