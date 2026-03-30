export type DomainProvider =
  | "fodmapp"
  | "user"
  | "open_food_facts"
  | (string & {});

export type DomainSourceKind =
  | "curated_food_catalog"
  | "curated_swap_rule"
  | "tracking_log"
  | "tracking_projection"
  | "custom_food"
  | "scanned_product";

export type EvidenceTier =
  | "curated"
  | "heuristic"
  | "informational"
  | "derived"
  | "user_entered";

export interface DomainProvenance {
  kind: DomainSourceKind;
  provider: DomainProvider;
  sourceSlug?: string | null;
  sourceId?: string | null;
  capturedAt?: string | null;
}

export interface DomainCapabilities {
  canBeSwapOrigin: boolean;
  canBeSwapTarget: boolean;
  canAppearInTracking: boolean;
  canBeSavedMealItem: boolean;
  hasEvidenceBackedGuidance: boolean;
  isInformationalOnly: boolean;
}
