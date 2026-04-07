import type { TrackingFeed } from "@fodmapp/domain";

import type { ProtectedApiAuthInput } from "../core/auth";
import { requestProtectedJson } from "../core/client";
import type { ApiClientConfig } from "../core/config";
import { mapTrackingFeedApiResponse } from "../mapping/tracking";
import { TRACKING_API_ROOT, type TrackingFeedResponse } from "./shared";

export async function getTrackingFeed(
  config: ApiClientConfig,
  auth: ProtectedApiAuthInput,
  limit = 50,
): Promise<TrackingFeed> {
  const response = await requestProtectedJson<TrackingFeedResponse>(
    config,
    auth,
    `${TRACKING_API_ROOT}/feed?limit=${limit}`,
    { method: "GET" },
    { errorPrefix: "tracking-api" },
  );

  return mapTrackingFeedApiResponse(response);
}
