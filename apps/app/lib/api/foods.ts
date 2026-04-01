import {
  type ApiResult,
  type CuratedFoodSummary,
  searchCuratedFoods,
} from "@fodmapp/api-client";

import { getPublicApiClientConfig } from "../apiClientConfig";

export interface TrackingCanonicalFoodOption {
  slug: string;
  label: string;
}
export interface TrackingCanonicalFoodSearchResult {
  query: string;
  limit: number;
  total: number;
  items: TrackingCanonicalFoodOption[];
}

function mapCuratedFoodSummaryToTrackingCanonicalFoodOption(
  food: CuratedFoodSummary,
): TrackingCanonicalFoodOption {
  return {
    slug: food.slug,
    label: food.names.fr,
  };
}

export async function searchTrackingCanonicalFoods(
  q: string,
  limit = 5,
): Promise<ApiResult<TrackingCanonicalFoodSearchResult>> {
  const result = await searchCuratedFoods(getPublicApiClientConfig(), q, limit);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: {
      query: result.data.query,
      limit: result.data.limit,
      total: result.data.total,
      items: result.data.items.map(
        mapCuratedFoodSummaryToTrackingCanonicalFoodOption,
      ),
    },
  };
}
