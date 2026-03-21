import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { ClerkShell } from "../components/clerk-shell";
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

const bodyFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--app-font-body",
  display: "swap",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--app-font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FODMAPP App",
    template: "%s | FODMAPP App",
  },
  description:
    "Recherchez des aliments, consultez des substitutions actives et suivez votre journal FODMAP dans un espace personnel FR-first.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
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
        className={`${bodyFont.variable} ${displayFont.variable}`}
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
        <ClerkShell enabled={auth.fullyConfigured}>{children}</ClerkShell>
      </body>
    </html>
  );
}
