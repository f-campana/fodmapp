import type { operations } from "@fodmapp/types";

export const TRACKING_API_ROOT = "/me/tracking";

export type TrackingFeedResponse =
  operations["getTrackingFeed"]["responses"][200]["content"]["application/json"];

export type WeeklyTrackingSummaryResponse =
  operations["getWeeklyTrackingSummary"]["responses"][200]["content"]["application/json"];
