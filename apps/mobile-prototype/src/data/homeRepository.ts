import type { TrackingFeedEntry } from "@fodmapp/domain";

import type { AuthTokenGetter } from "../auth/useAuth";
import { createTrackingRepository } from "./trackingRepository";

const DEFAULT_HOME_ACTIVITY_LIMIT = 5;

export interface HomeData {
  recentEntries: TrackingFeedEntry[];
  totalEntries: number;
}

export interface HomeRepository {
  getHomeData: (limit?: number) => Promise<HomeData>;
}

export function createHomeRepository(
  getToken: AuthTokenGetter,
): HomeRepository {
  const trackingRepository = createTrackingRepository(getToken);

  return {
    getHomeData: async (limit = DEFAULT_HOME_ACTIVITY_LIMIT) => {
      const feed = await trackingRepository.getFeed(limit);

      return {
        recentEntries: feed.items,
        totalEntries: feed.total,
      };
    },
  };
}
