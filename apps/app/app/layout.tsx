import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import {
  getAnalyticsBootstrapStatus,
  getPlausibleScriptConfig,
} from "../lib/analytics";
import { getClerkBootstrapStatus } from "../lib/clerk";
import { canTrackWithConsent, getConsentBootstrapStatus } from "../lib/consent";
import {
  captureArchitectureEvent,
  getMonitoringBootstrapStatus,
} from "../lib/monitoring";

export const metadata: Metadata = {
  title: "FODMAP App Scaffold",
  description: "Architecture-only app shell for FR-first frontend rollout.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const auth = getClerkBootstrapStatus();
  const monitoring = getMonitoringBootstrapStatus();
  const analytics = getAnalyticsBootstrapStatus();
  const consent = getConsentBootstrapStatus();
  const analyticsAllowed = analytics.configured && canTrackWithConsent(consent);
  const plausible = analyticsAllowed
    ? getPlausibleScriptConfig(analytics)
    : null;

  captureArchitectureEvent("layout_bootstrap_rendered", {
    auth_provider: auth.provider,
    auth_configured: String(auth.fullyConfigured),
    monitoring_provider: monitoring.provider,
    monitoring_configured: String(monitoring.configured),
    analytics_provider: analytics.provider,
    analytics_configured: String(analytics.configured),
    consent_provider: consent.provider,
    consent_configured: String(consent.configured),
  });

  return (
    <html lang="fr">
      <body
        data-auth-provider={auth.provider}
        data-auth-mode={auth.mode}
        data-auth-configured={String(auth.fullyConfigured)}
        data-monitoring-provider={monitoring.provider}
        data-monitoring-mode={monitoring.mode}
        data-monitoring-configured={String(monitoring.configured)}
        data-analytics-provider={analytics.provider}
        data-analytics-mode={analytics.mode}
        data-analytics-configured={String(analytics.configured)}
        data-consent-provider={consent.provider}
        data-consent-mode={consent.mode}
        data-consent-configured={String(consent.configured)}
      >
        {plausible ? (
          <script defer data-domain={plausible.domain} src={plausible.src} />
        ) : null}
        {children}
      </body>
    </html>
  );
}
