import { getTrackingFeed } from "@fodmapp/api-client";

import type { AuthTokenGetter } from "../auth/useAuth";
import { getProtectedApiClientConfig } from "../config/api";

export interface ProtectedTrackingProbeResult {
  itemCount: number;
  total: number;
}

export async function probeProtectedTrackingFeed(
  getToken: AuthTokenGetter,
): Promise<ProtectedTrackingProbeResult> {
  const feed = await getTrackingFeed(
    getProtectedApiClientConfig(),
    getToken,
    1,
  );

  return {
    itemCount: feed.items.length,
    total: feed.total,
  };
}
