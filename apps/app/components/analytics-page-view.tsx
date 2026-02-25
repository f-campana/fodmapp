"use client";

import { useEffect } from "react";
import { trackAnalyticsEvent } from "../lib/analytics";

interface AnalyticsPageViewProps {
  enabled: boolean;
  event: string;
  route: string;
}

export function AnalyticsPageView({
  enabled,
  event,
  route,
}: AnalyticsPageViewProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    trackAnalyticsEvent(event, { route });
  }, [enabled, event, route]);

  return null;
}
