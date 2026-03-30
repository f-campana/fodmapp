import type { operations } from "@fodmapp/types";

import type { CuratedFoodReference, FoodLevel } from "../catalog/foods";
import {
  getScannedProductCapabilities,
  getScannedProductProvenance,
} from "../policies/capabilities";
import type {
  ScannedPackagedProduct,
  ScannedProductAssessmentSubtype,
  ScannedProductGuidedAssessment,
  ScannedProductIngredient,
  ScannedProductIngredientCandidate,
  ScannedProductIngredients,
  ScannedProductLookup,
  ScannedProductLookupSummary,
} from "../products/scanned-products";

type ProductLookupResponse =
  operations["getProductByBarcode"]["responses"][200]["content"]["application/json"];
type ProductResponse =
  operations["getProductById"]["responses"][200]["content"]["application/json"];
type ProductIngredientsResponse =
  operations["getProductIngredients"]["responses"][200]["content"]["application/json"];
type ProductAssessmentResponse =
  operations["getProductAssessment"]["responses"][200]["content"]["application/json"];

function mapFoodReference(
  slug: string,
  nameFr: string | null | undefined,
  nameEn: string | null | undefined,
  overallLevel: FoodLevel | null,
): CuratedFoodReference {
  return {
    slug,
    names: {
      fr: nameFr ?? null,
      en: nameEn ?? null,
    },
    overallLevel,
  };
}

function mapProductLookupSummary(
  summary: NonNullable<ProductLookupResponse["product"]>,
): ScannedProductLookupSummary {
  return {
    productId: summary.product_id,
    names: {
      fr: summary.product_name_fr,
      en: summary.product_name_en ?? null,
    },
    brand: summary.brand ?? null,
  };
}

export function mapProductLookupResponseToScannedProductLookup(
  response: ProductLookupResponse,
): ScannedProductLookup {
  return {
    kind: "scanned_product_lookup",
    queryCode: response.query_code,
    normalizedCode: response.normalized_code,
    canonicalFormat: response.canonical_format,
    lookupStatus: response.lookup_status,
    refreshEnqueued: response.refresh_enqueued,
    provider: response.provider,
    providerLastSyncedAt: response.provider_last_synced_at ?? null,
    product: response.product
      ? mapProductLookupSummary(response.product)
      : null,
    provenance: getScannedProductProvenance(
      response.provider,
      response.product?.product_id ?? response.normalized_code,
      response.provider_last_synced_at ?? null,
    ),
    evidenceTier: "informational",
    capabilities: getScannedProductCapabilities(),
  };
}

export function mapProductResponseToScannedPackagedProduct(
  response: ProductResponse,
): ScannedPackagedProduct {
  return {
    kind: "scanned_product",
    productId: response.product_id,
    contractTier: response.contract_tier,
    syncState: response.sync_state,
    refreshEnqueued: response.refresh_enqueued,
    provider: response.provider,
    providerStatus: response.provider_status ?? null,
    providerLastSyncedAt: response.provider_last_synced_at ?? null,
    staleAfterUtc: response.stale_after_utc ?? null,
    refreshRequestedAt: response.refresh_requested_at ?? null,
    gtin13: response.gtin13 ?? null,
    openFoodFactsCode: response.open_food_facts_code ?? null,
    primaryNormalizedCode: response.primary_normalized_code ?? null,
    canonicalFormat: response.canonical_format ?? null,
    names: {
      fr: response.product_name_fr,
      en: response.product_name_en ?? null,
    },
    brand: response.brand ?? null,
    categoriesTags: response.categories_tags,
    countriesTags: response.countries_tags,
    ingredientsTextFr: response.ingredients_text_fr ?? null,
    assessmentAvailable: response.assessment_available,
    assessmentStatus: response.assessment_status ?? null,
    provenance: getScannedProductProvenance(
      response.provider,
      response.product_id,
      response.provider_last_synced_at ?? null,
    ),
    evidenceTier: "informational",
    capabilities: getScannedProductCapabilities(),
  };
}

function mapIngredientCandidate(
  candidate: ProductIngredientsResponse["items"][number]["candidates"][number],
): ScannedProductIngredientCandidate {
  return {
    rank: candidate.candidate_rank,
    matchedFood: mapFoodReference(
      candidate.food_slug,
      candidate.canonical_name_fr,
      candidate.canonical_name_en,
      null,
    ),
    score: candidate.score,
    confidenceTier: candidate.confidence_tier,
    matchMethod: candidate.match_method,
    signalBreakdown: candidate.signal_breakdown as Record<string, unknown>,
    isSelected: candidate.is_selected,
  };
}

function mapIngredient(
  item: ProductIngredientsResponse["items"][number],
): ScannedProductIngredient {
  return {
    lineNumber: item.line_no,
    ingredientTextFr: item.ingredient_text_fr,
    normalizedName: item.normalized_name,
    declaredSharePercent: item.declared_share_pct ?? null,
    parseConfidence: item.parse_confidence,
    isSubstantive: item.is_substantive,
    candidates: item.candidates.map(mapIngredientCandidate),
  };
}

export function mapProductIngredientsResponseToScannedProductIngredients(
  response: ProductIngredientsResponse,
): ScannedProductIngredients {
  return {
    productId: response.product_id,
    contractTier: response.contract_tier,
    parserVersion: response.parser_version,
    items: response.items.map(mapIngredient),
    total: response.total,
    provenance: getScannedProductProvenance(
      "open_food_facts",
      response.product_id,
    ),
    evidenceTier: "informational",
    capabilities: getScannedProductCapabilities(),
  };
}

function mapAssessmentSubtype(
  subtype: ProductAssessmentResponse["subtypes"][number],
): ScannedProductAssessmentSubtype {
  return {
    subtypeCode: subtype.subtype_code,
    subtypeLevel: subtype.subtype_level,
    sourceFood: subtype.source_food_slug
      ? mapFoodReference(
          subtype.source_food_slug,
          subtype.source_food_name_fr ?? null,
          subtype.source_food_name_en ?? null,
          null,
        )
      : null,
    lowMaxGrams: subtype.low_max_g ?? null,
    moderateMaxGrams: subtype.moderate_max_g ?? null,
    burdenRatio: subtype.burden_ratio ?? null,
  };
}

export function mapProductAssessmentResponseToScannedProductGuidedAssessment(
  response: ProductAssessmentResponse,
): ScannedProductGuidedAssessment {
  return {
    kind: "guided_product_assessment",
    productId: response.product_id,
    contractTier: response.contract_tier,
    assessmentMode: response.assessment_mode,
    assessmentStatus: response.assessment_status,
    confidenceTier: response.confidence_tier,
    heuristicOverallLevel: response.heuristic_overall_level,
    heuristicMaxLowPortionGrams: response.heuristic_max_low_portion_g ?? null,
    numericGuidanceStatus: response.numeric_guidance_status,
    numericGuidanceBasis: response.numeric_guidance_basis ?? null,
    limitingSubtypes: response.limiting_subtypes,
    caveats: response.caveats,
    methodVersion: response.method_version,
    provider: response.provider,
    providerLastSyncedAt: response.provider_last_synced_at ?? null,
    computedAt: response.computed_at,
    dominantFood: response.dominant_food_slug
      ? mapFoodReference(
          response.dominant_food_slug,
          response.dominant_food_name_fr ?? null,
          response.dominant_food_name_en ?? null,
          null,
        )
      : null,
    subtypes: response.subtypes.map(mapAssessmentSubtype),
    provenance: getScannedProductProvenance(
      response.provider,
      response.product_id,
      response.computed_at,
    ),
    evidenceTier: "heuristic",
    capabilities: getScannedProductCapabilities(),
  };
}
