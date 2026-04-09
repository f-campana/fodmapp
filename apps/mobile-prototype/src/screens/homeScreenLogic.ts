import type { TrackingFeedEntry } from "@fodmapp/domain";

import {
  buildTrackingFeedListItems,
  type TrackingFeedListItem,
} from "./trackingScreenLogic";

const DEFAULT_RECENT_ACTIVITY_LIMIT = 3;

export type HomeActivityState = "loading" | "error" | "empty" | "ready";

export function formatHomeDate(anchorDate: Date = new Date()): string {
  return anchorDate.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function resolveHomeActivityState(input: {
  loading: boolean;
  error: string | null;
  itemCount: number;
}): HomeActivityState {
  if (input.loading) {
    return "loading";
  }

  if (input.error) {
    return "error";
  }

  if (input.itemCount === 0) {
    return "empty";
  }

  return "ready";
}

export function buildHomeRecentActivityItems(
  entries: TrackingFeedEntry[],
  limit: number = DEFAULT_RECENT_ACTIVITY_LIMIT,
): TrackingFeedListItem[] {
  return buildTrackingFeedListItems(entries).slice(0, limit);
}

export function buildHomeRecentActivitySubtitle(
  totalEntries: number,
  visibleEntries: number,
): string {
  if (totalEntries === 0 || visibleEntries === 0) {
    return "No recent entries yet";
  }

  if (totalEntries <= visibleEntries) {
    return `${visibleEntries} recent entr${visibleEntries === 1 ? "y" : "ies"}`;
  }

  return `Showing ${visibleEntries} of ${totalEntries} recent entries`;
}
