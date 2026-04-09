import type { TrackingFeedEntry, WeeklyTrackingSummary } from "@fodmapp/domain";

import type { AuthTokenGetter } from "../auth/useAuth";
import { createTrackingRepository } from "./trackingRepository";

const DEFAULT_HOME_ACTIVITY_LIMIT = 5;

export interface HomeData {
  recentEntries: TrackingFeedEntry[];
  totalEntries: number;
  weeklySummary: WeeklyTrackingSummary;
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
      const hubReadModel = await trackingRepository.getHubReadModel({
        feedLimit: limit,
      });

      return {
        recentEntries: hubReadModel.feed.items,
        totalEntries: hubReadModel.feed.total,
        weeklySummary: hubReadModel.summary,
      };
    },
  };
}
