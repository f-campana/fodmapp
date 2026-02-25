import Link from "next/link";
import type { components } from "@fodmap/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmap/ui";
import { AnalyticsPageView } from "../components/analytics-page-view";
import { getAnalyticsBootstrapStatus } from "../lib/analytics";
import { getClerkBootstrapStatus } from "../lib/clerk";
import { canTrackWithConsent, getConsentBootstrapStatus } from "../lib/consent";
import { getMessages } from "../lib/i18n";
import {
  captureArchitectureEvent,
  getMonitoringBootstrapStatus,
} from "../lib/monitoring";

type HealthResponse = components["schemas"]["HealthResponse"];

const HEALTH_CONTRACT_SAMPLE: HealthResponse = {
  status: "ok",
  service: "fodmap-api",
  version: "v0",
};

export default function HomePage() {
  const messages = getMessages();
  const auth = getClerkBootstrapStatus();
  const monitoring = getMonitoringBootstrapStatus();
  const analytics = getAnalyticsBootstrapStatus();
  const consent = getConsentBootstrapStatus();

  const analyticsAllowed = canTrackWithConsent(consent) && analytics.configured;

  captureArchitectureEvent("app_shell_rendered", {
    route: "/",
    auth_configured: String(auth.fullyConfigured),
    monitoring_configured: String(monitoring.configured),
    analytics_configured: String(analytics.configured),
    consent_configured: String(consent.configured),
  });

  return (
    <main className="app-shell">
      <AnalyticsPageView
        enabled={analyticsAllowed}
        event="home_page_viewed"
        route="/"
      />
      <div className="app-shell__meta">
        <Badge variant="secondary">{messages.meta.phaseBadge}</Badge>
        <p className="app-shell__status">{messages.meta.localeLabel}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{messages.home.title}</CardTitle>
          <CardDescription>{messages.home.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {messages.home.contractLabel}:{" "}
            <code>
              {HEALTH_CONTRACT_SAMPLE.service}@{HEALTH_CONTRACT_SAMPLE.version}
            </code>
          </p>
          <p className="app-shell__eyebrow">{messages.home.routeNote}</p>
          <p className="app-shell__eyebrow">
            {messages.home.authLabel}: <code>{auth.provider}</code> ({auth.mode}
            )
          </p>
          <p className="app-shell__eyebrow">
            {messages.home.monitoringLabel}: <code>{monitoring.provider}</code>{" "}
            ({monitoring.configured ? "configured" : "placeholder"})
          </p>
          <p className="app-shell__eyebrow">
            {messages.home.analyticsLabel}: <code>{analytics.provider}</code> (
            {analytics.configured ? "configured" : "placeholder"})
          </p>
          <p className="app-shell__eyebrow">
            {messages.home.consentLabel}: <code>{consent.provider}</code> (
            {consent.configured ? "configured" : "placeholder"})
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/espace">{messages.home.gatedCta}</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
