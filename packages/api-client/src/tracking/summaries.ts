import type { TrackingFeed, WeeklyTrackingSummary } from "@fodmapp/domain";

import type { ProtectedApiAuthInput } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import { mapWeeklyTrackingSummaryApiResponse } from "../mapping/tracking";
import { getTrackingFeed } from "./feed";
import {
  TRACKING_API_ROOT,
  type WeeklyTrackingSummaryResponse,
} from "./shared";

export interface TrackingHubReadModel {
  feed: TrackingFeed;
  summary: WeeklyTrackingSummary;
}

export interface TrackingHubReadOptions {
  anchorDate?: string;
  feedLimit?: number;
}

export async function getWeeklyTrackingSummary(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  anchorDate?: string,
): Promise<WeeklyTrackingSummary> {
  const path = anchorDate
    ? `${TRACKING_API_ROOT}/summary/weekly?anchor_date=${encodeURIComponent(anchorDate)}`
    : `${TRACKING_API_ROOT}/summary/weekly`;
  const response = await requestProtectedJson<WeeklyTrackingSummaryResponse>(
    config,
    auth,
    path,
    { method: "GET" },
    { errorPrefix: "tracking-api" },
  );

  return mapWeeklyTrackingSummaryApiResponse(response);
}

export async function getTrackingHubReadModel(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  options: TrackingHubReadOptions = {},
): Promise<TrackingHubReadModel> {
  const { anchorDate, feedLimit = 50 } = options;
  const [feed, summary] = await Promise.all([
    getTrackingFeed(config, auth, feedLimit),
    getWeeklyTrackingSummary(config, auth, anchorDate),
  ]);

  return {
    feed,
    summary,
  };
}
