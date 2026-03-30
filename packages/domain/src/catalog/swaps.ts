import type { components } from "@fodmapp/types";

import type {
  DomainCapabilities,
  DomainProvenance,
  EvidenceTier,
} from "../shared/concepts";
import type { CuratedFoodReference } from "./foods";

export type RuleStatus = components["schemas"]["RuleStatus"];

export interface CuratedSwapInstruction {
  fr: string;
  en: string;
}

export interface CuratedSwap {
  kind: "curated_swap";
  id: string;
  from: CuratedFoodReference;
  to: CuratedFoodReference;
  instruction: CuratedSwapInstruction;
  driverSubtype: string | null;
  fromBurdenRatio: number | null;
  toBurdenRatio: number | null;
  coverageRatio: number;
  fodmapSafetyScore: number;
  overallScore: number;
  ruleStatus: RuleStatus;
  scoringVersion: string;
  rollupComputedAt: string;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface CuratedSwapListFilters {
  limit?: number;
  minSafetyScore?: number;
}

export interface CuratedSwapList {
  fromFoodSlug: string;
  total: number;
  appliedFilters: CuratedSwapListFilters | null;
  items: CuratedSwap[];
}
