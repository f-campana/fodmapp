import {
  mapTrackingFeedResponse,
  mapWeeklyTrackingSummaryResponse,
  type TrackingFeed,
  type WeeklyTrackingSummary,
} from "@fodmapp/domain";

import type {
  TrackingFeedResponse,
  WeeklyTrackingSummaryResponse,
} from "../tracking/shared";

function isValidTrackingFeedItem(
  entry: TrackingFeedResponse["items"][number],
): boolean {
  if (entry.entry_type === "meal") {
    return entry.meal != null;
  }

  if (entry.entry_type === "symptom") {
    return entry.symptom != null;
  }

  return false;
}

export function mapTrackingFeedApiResponse(
  response: TrackingFeedResponse,
): TrackingFeed {
  return mapTrackingFeedResponse({
    ...response,
    items: response.items.filter(isValidTrackingFeedItem),
  });
}

export function mapWeeklyTrackingSummaryApiResponse(
  response: WeeklyTrackingSummaryResponse,
): WeeklyTrackingSummary {
  return mapWeeklyTrackingSummaryResponse(response);
}
