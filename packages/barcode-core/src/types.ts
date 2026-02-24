export type BarcodeSourceFormat = "EAN8" | "EAN13" | "UPC_A";
export type BarcodeCanonicalFormat = "EAN8" | "EAN13";
export type BarcodeFormat = BarcodeCanonicalFormat;

export interface NormalizedBarcode {
  queryCode: string;
  sourceFormat: BarcodeSourceFormat;
  canonicalFormat: BarcodeCanonicalFormat;
  normalizedCode: string;
}

export interface RetailValidation {
  valid: boolean;
  normalized?: NormalizedBarcode;
  error?: string;
}

export type BarcodeResolutionStatus = "resolved" | "unresolved";
export type BarcodeCacheStatus = "fresh" | "stale" | "miss";
export type BarcodeLinkMethod = "manual" | "heuristic";

export interface BarcodeLookupProduct {
  source_code?: string | null;
  product_name_fr?: string | null;
  product_name_en?: string | null;
  brand?: string | null;
  ingredients_text_fr?: string | null;
  categories_tags: string[];
  countries_tags: string[];
}

export interface BarcodeResolvedFood {
  food_slug: string;
  canonical_name_fr: string;
  canonical_name_en: string;
  link_method: BarcodeLinkMethod;
  confidence?: number | null;
}

export interface BarcodeCandidate {
  food_slug: string;
  canonical_name_fr: string;
  canonical_name_en: string;
  score: number;
  signal_breakdown: Record<string, number>;
}

export interface BarcodeLookupResult {
  query_code: string;
  normalized_code: string;
  canonical_format: BarcodeCanonicalFormat;
  resolution_status: BarcodeResolutionStatus;
  cache_status: BarcodeCacheStatus;
  product?: BarcodeLookupProduct | null;
  resolved_food?: BarcodeResolvedFood | null;
  candidates: BarcodeCandidate[];
  provider: string;
  provider_last_synced_at?: string | null;
}
