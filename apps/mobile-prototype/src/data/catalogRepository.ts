import {
  type ApiResult,
  type CuratedFoodDetailPageData,
  type CuratedFoodSearchResult,
  getCuratedFoodDetailPageData,
  searchCuratedFoods,
} from "@fodmapp/api-client";

import { getPublicCatalogApiClientConfig } from "../config/api";

const SEARCH_LIMIT = 12;

export type { CuratedFoodDetailPageData, CuratedFoodSearchResult };

export async function searchCatalogFoods(
  query: string,
): Promise<ApiResult<CuratedFoodSearchResult>> {
  return searchCuratedFoods(
    getPublicCatalogApiClientConfig(),
    query.trim(),
    SEARCH_LIMIT,
  );
}

export async function getCatalogFoodDetailPage(
  slug: string,
): Promise<CuratedFoodDetailPageData> {
  return getCuratedFoodDetailPageData(getPublicCatalogApiClientConfig(), slug);
}
