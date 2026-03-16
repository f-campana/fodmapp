import Link from "next/link";

import type { components } from "@fodmap/types";
import { Badge } from "@fodmap/ui/badge";
import { Button } from "@fodmap/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmap/ui/card";

import { AnalyticsPageView } from "../components/analytics-page-view";
import { getAnalyticsBootstrapStatus } from "../lib/analytics";
import { getClerkBootstrapStatus } from "../lib/clerk";
import { canTrackWithConsent, getConsentBootstrapStatus } from "../lib/consent";
import {
  getMedicalSafetyCopy,
  type MedicalLocale,
  SUPPORTED_MEDICAL_LOCALES,
} from "../lib/medicalSafetyCopy";
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

function normalizeLocale(raw: string | string[] | undefined): {
  locale: MedicalLocale;
  fallback: boolean;
} {
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const normalized = requested?.toLowerCase();

  if (normalized === "en") {
    return { locale: "en", fallback: false };
  }
  if (normalized === "fr" || !requested) {
    return { locale: "fr", fallback: false };
  }
  if (SUPPORTED_MEDICAL_LOCALES.includes(normalized as MedicalLocale)) {
    return { locale: normalized as MedicalLocale, fallback: false };
  }
  return { locale: "fr", fallback: true };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ locale?: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { locale, fallback } = normalizeLocale(resolvedSearchParams?.locale);
  const copy = (path: string, vars?: Record<string, string>) =>
    getMedicalSafetyCopy(locale, path, vars ?? {});
  const auth = getClerkBootstrapStatus();
  const monitoring = getMonitoringBootstrapStatus();
  const analytics = getAnalyticsBootstrapStatus();
  const consent = getConsentBootstrapStatus();

  const analyticsAllowed = canTrackWithConsent(consent) && analytics.configured;

  const consentModeLabel = consent.runtimeEnabled
    ? copy("screens.consentMode.currentConsented")
    : copy("screens.consentMode.currentMinimal");
  const consentModeAction = consent.runtimeEnabled
    ? copy("screens.consentMode.downgradePrompt")
    : copy("screens.consentMode.upgradePrompt");
  const consentModeNotice = consent.runtimeEnabled
    ? copy("screens.consentMode.downgradeWarning")
    : copy("screens.consentMode.upgradeSubtext");

  captureArchitectureEvent("app_shell_rendered", {
    route: "/",
    locale,
    fallback_locale: String(fallback),
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
        <Badge variant="secondary">
          {`[${locale.toUpperCase()}] ${HEALTH_CONTRACT_SAMPLE.service}@${HEALTH_CONTRACT_SAMPLE.version}`}
        </Badge>
        {fallback && (
          <p className="app-shell__eyebrow">
            {copy("fallbacks.missingLocale")}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {copy("screens.onboarding.safetyPositioningBanner")}
          </CardTitle>
          <CardDescription>{copy("fallbacks.advisoryFooter")}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {copy("screens.onboarding.dataModeIntro")}
          </p>
          <p className="app-shell__text">
            {copy("screens.onboarding.dataModeTransitionCta")}
          </p>
          <p className="app-shell__text">
            {copy("screens.onboarding.dataModeTransitionInfo")}
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/espace">{copy("screens.swapDetail.trialHint")}</Link>
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{consentModeLabel}</CardTitle>
          <CardDescription>
            {copy("screens.consentMode.transitionSuccess")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">{consentModeAction}</p>
          <p className="app-shell__eyebrow">{consentModeNotice}</p>
          <p className="app-shell__text">
            {copy("screens.notifications.pauseNow")}
          </p>
          <p className="app-shell__text">
            {copy("screens.notifications.pauseUntilReenabled")}
          </p>
          <p className="app-shell__text">
            {copy("screens.notifications.pauseActiveNotice")}
          </p>
          <p className="app-shell__text">
            {copy("screens.notifications.killSwitchLabel")}
          </p>
          <p className="app-shell__text">
            {copy("screens.notifications.killSwitchHelp")}
          </p>
          <p className="app-shell__text">
            {copy("screens.notifications.killSwitchConfirm")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy("screens.clinicianShare.title")}</CardTitle>
          <CardDescription>
            {copy("screens.clinicianShare.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {copy("screens.clinicianShare.createCta")}
          </p>
          <p className="app-shell__text">
            {copy("screens.clinicianShare.exportHint")}
          </p>
          <p className="app-shell__text">
            {copy("screens.clinicianShare.emptyState")}
          </p>
          <p className="app-shell__text">
            {copy("screens.clinicianShare.disclaimer")}
          </p>
          <p className="app-shell__text">
            {copy("screens.deletion.requestOpen")}
          </p>
          <p className="app-shell__text">
            {copy("screens.deletion.requestHelp")}
          </p>
          <p className="app-shell__text">
            {copy("screens.deletion.confirmAction")}
          </p>
          <p className="app-shell__text">{copy("screens.deletion.success")}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy("screens.conflictReview.header")}</CardTitle>
          <CardDescription>
            {copy("screens.conflictReview.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {copy("screens.conflictReview.optionLabel", { index: "1" })}
          </p>
          <p className="app-shell__text">
            {copy("screens.conflictReview.optionLabel", { index: "2" })}
          </p>
          <p className="app-shell__text">
            {copy("screens.conflictReview.confirmation")}
          </p>
          <p className="app-shell__text">
            {copy("screens.conflictReview.choosePrimaryCta")}
          </p>
          <p className="app-shell__text">
            {copy("screens.conflictReview.deferChoiceCta")}
          </p>
          <p className="app-shell__text">
            {copy("screens.conflictReview.noChoiceWarning")}
          </p>
          <p className="app-shell__eyebrow">
            {copy("screens.errorStates.offlineNotice")}
          </p>
          <p className="app-shell__text">
            {copy("screens.errorStates.syncRetry")}
          </p>
          <p className="app-shell__text">
            {copy("screens.errorStates.conflictRetry")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapDetail.fallbackWarning")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy("screens.swapList.blockedTitle")}</CardTitle>
          <CardDescription>
            {copy("screens.swapList.blockedBody")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="app-shell__text">
            {copy("screens.swapList.blockedAction")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapList.unknownTitle")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapList.unknownBody")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapList.unknownAction")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapList.lowConfidenceTitle")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapList.lowConfidenceBody")}
          </p>
          <p className="app-shell__text">
            {copy("screens.swapDetail.unknownRationale")}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
