import type { DomainCapabilities, DomainProvenance } from "../shared/concepts";

function cloneCapabilities(
  capabilities: DomainCapabilities,
): DomainCapabilities {
  return { ...capabilities };
}

const CURATED_FOOD_CAPABILITIES: DomainCapabilities = {
  canBeSwapOrigin: true,
  canBeSwapTarget: true,
  canAppearInTracking: true,
  canBeSavedMealItem: true,
  hasEvidenceBackedGuidance: true,
  isInformationalOnly: false,
};

const CURATED_SWAP_CAPABILITIES: DomainCapabilities = {
  canBeSwapOrigin: false,
  canBeSwapTarget: false,
  canAppearInTracking: false,
  canBeSavedMealItem: false,
  hasEvidenceBackedGuidance: true,
  isInformationalOnly: false,
};

const SCANNED_PRODUCT_CAPABILITIES: DomainCapabilities = {
  canBeSwapOrigin: false,
  canBeSwapTarget: false,
  canAppearInTracking: true,
  canBeSavedMealItem: true,
  hasEvidenceBackedGuidance: false,
  isInformationalOnly: true,
};

const CUSTOM_FOOD_CAPABILITIES: DomainCapabilities = {
  canBeSwapOrigin: false,
  canBeSwapTarget: false,
  canAppearInTracking: true,
  canBeSavedMealItem: true,
  hasEvidenceBackedGuidance: false,
  isInformationalOnly: false,
};

const FREE_TEXT_TRACKING_ITEM_CAPABILITIES: DomainCapabilities = {
  canBeSwapOrigin: false,
  canBeSwapTarget: false,
  canAppearInTracking: true,
  canBeSavedMealItem: true,
  hasEvidenceBackedGuidance: false,
  isInformationalOnly: false,
};

const TRACKING_RECORD_CAPABILITIES: DomainCapabilities = {
  canBeSwapOrigin: false,
  canBeSwapTarget: false,
  canAppearInTracking: false,
  canBeSavedMealItem: false,
  hasEvidenceBackedGuidance: false,
  isInformationalOnly: false,
};

export function getCuratedFoodCapabilities(): DomainCapabilities {
  return cloneCapabilities(CURATED_FOOD_CAPABILITIES);
}

export function getCuratedSwapCapabilities(): DomainCapabilities {
  return cloneCapabilities(CURATED_SWAP_CAPABILITIES);
}

export function getScannedProductCapabilities(): DomainCapabilities {
  return cloneCapabilities(SCANNED_PRODUCT_CAPABILITIES);
}

export function getCustomFoodCapabilities(): DomainCapabilities {
  return cloneCapabilities(CUSTOM_FOOD_CAPABILITIES);
}

export function getFreeTextTrackingItemCapabilities(): DomainCapabilities {
  return cloneCapabilities(FREE_TEXT_TRACKING_ITEM_CAPABILITIES);
}

export function getTrackingRecordCapabilities(): DomainCapabilities {
  return cloneCapabilities(TRACKING_RECORD_CAPABILITIES);
}

export function getCuratedFoodProvenance(
  sourceSlug?: string | null,
  capturedAt?: string | null,
): DomainProvenance {
  return {
    kind: "curated_food_catalog",
    provider: "fodmapp",
    sourceSlug: sourceSlug ?? null,
    capturedAt: capturedAt ?? null,
  };
}

export function getCuratedSwapProvenance(
  sourceSlug?: string | null,
  capturedAt?: string | null,
): DomainProvenance {
  return {
    kind: "curated_swap_rule",
    provider: "fodmapp",
    sourceSlug: sourceSlug ?? null,
    capturedAt: capturedAt ?? null,
  };
}

export function getTrackingRecordProvenance(
  capturedAt?: string | null,
): DomainProvenance {
  return {
    kind: "tracking_log",
    provider: "user",
    capturedAt: capturedAt ?? null,
  };
}

export function getTrackingProjectionProvenance(
  sourceSlug: string,
  capturedAt?: string | null,
): DomainProvenance {
  return {
    kind: "tracking_projection",
    provider: "fodmapp",
    sourceSlug,
    capturedAt: capturedAt ?? null,
  };
}

export function getCustomFoodProvenance(
  sourceId?: string | null,
  capturedAt?: string | null,
): DomainProvenance {
  return {
    kind: "custom_food",
    provider: "user",
    sourceId: sourceId ?? null,
    capturedAt: capturedAt ?? null,
  };
}

export function getScannedProductProvenance(
  provider: string,
  sourceId?: string | null,
  capturedAt?: string | null,
): DomainProvenance {
  return {
    kind: "scanned_product",
    provider,
    sourceId: sourceId ?? null,
    capturedAt: capturedAt ?? null,
  };
}
