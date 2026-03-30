import type { components } from "@fodmapp/types";

import type { CuratedFoodReference, FoodLevel } from "../catalog/foods";
import type {
  DomainCapabilities,
  DomainProvenance,
  EvidenceTier,
} from "../shared/concepts";

export type BarcodeCanonicalFormat =
  components["schemas"]["BarcodeCanonicalFormat"];
export type ProductContractTier = components["schemas"]["ProductContractTier"];
export type ProductLookupStatus = components["schemas"]["ProductLookupStatus"];
export type ProductSyncState = components["schemas"]["ProductSyncState"];
export type ProductConfidenceTier =
  components["schemas"]["ProductConfidenceTier"];
export type ProductNumericGuidanceStatus =
  components["schemas"]["ProductNumericGuidanceStatus"];

export interface ScannedProductNames {
  fr: string;
  en: string | null;
}

export interface ScannedProductLookupSummary {
  productId: string;
  names: ScannedProductNames;
  brand: string | null;
}

export interface ScannedProductLookup {
  kind: "scanned_product_lookup";
  queryCode: string;
  normalizedCode: string;
  canonicalFormat: BarcodeCanonicalFormat;
  lookupStatus: ProductLookupStatus;
  refreshEnqueued: boolean;
  provider: string;
  providerLastSyncedAt: string | null;
  product: ScannedProductLookupSummary | null;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface ScannedPackagedProduct {
  kind: "scanned_product";
  productId: string;
  contractTier: ProductContractTier;
  syncState: ProductSyncState;
  refreshEnqueued: boolean;
  provider: string;
  providerStatus: string | null;
  providerLastSyncedAt: string | null;
  staleAfterUtc: string | null;
  refreshRequestedAt: string | null;
  gtin13: string | null;
  openFoodFactsCode: string | null;
  primaryNormalizedCode: string | null;
  canonicalFormat: BarcodeCanonicalFormat | null;
  names: ScannedProductNames;
  brand: string | null;
  categoriesTags: string[];
  countriesTags: string[];
  ingredientsTextFr: string | null;
  assessmentAvailable: boolean;
  assessmentStatus: string | null;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface ScannedProductIngredientCandidate {
  rank: number;
  matchedFood: CuratedFoodReference;
  score: number;
  confidenceTier: ProductConfidenceTier;
  matchMethod: string;
  signalBreakdown: Record<string, unknown>;
  isSelected: boolean;
}

export interface ScannedProductIngredient {
  lineNumber: number;
  ingredientTextFr: string;
  normalizedName: string;
  declaredSharePercent: number | null;
  parseConfidence: number;
  isSubstantive: boolean;
  candidates: ScannedProductIngredientCandidate[];
}

export interface ScannedProductIngredients {
  productId: string;
  contractTier: ProductContractTier;
  parserVersion: string;
  items: ScannedProductIngredient[];
  total: number;
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}

export interface ScannedProductAssessmentSubtype {
  subtypeCode: string;
  subtypeLevel: FoodLevel;
  sourceFood: CuratedFoodReference | null;
  lowMaxGrams: number | null;
  moderateMaxGrams: number | null;
  burdenRatio: number | null;
}

export interface ScannedProductGuidedAssessment {
  kind: "guided_product_assessment";
  productId: string;
  contractTier: ProductContractTier;
  assessmentMode: "guided";
  assessmentStatus: string;
  confidenceTier: ProductConfidenceTier;
  heuristicOverallLevel: FoodLevel;
  heuristicMaxLowPortionGrams: number | null;
  numericGuidanceStatus: ProductNumericGuidanceStatus;
  numericGuidanceBasis: "dominant_matched_food" | null;
  limitingSubtypes: string[];
  caveats: string[];
  methodVersion: string;
  provider: string;
  providerLastSyncedAt: string | null;
  computedAt: string;
  dominantFood: CuratedFoodReference | null;
  subtypes: ScannedProductAssessmentSubtype[];
  provenance: DomainProvenance;
  evidenceTier: EvidenceTier;
  capabilities: DomainCapabilities;
}
