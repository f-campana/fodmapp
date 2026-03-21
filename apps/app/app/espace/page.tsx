import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@fodmapp/ui/alert";

import { AnalyticsPageView } from "../../components/analytics-page-view";
import { getAnalyticsBootstrapStatus } from "../../lib/analytics";
import { getAuthContext } from "../../lib/auth";
import {
  canTrackWithConsent,
  getConsentBootstrapStatus,
} from "../../lib/consent";
import {
  getMedicalSafetyCopy,
  type MedicalLocale,
  SUPPORTED_MEDICAL_LOCALES,
} from "../../lib/medicalSafetyCopy";
import { captureArchitectureEvent } from "../../lib/monitoring";
import ConsentRightsClient from "./ConsentRightsClient";
import RuntimeUserButton from "./RuntimeUserButton";

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
  if (
    normalized &&
    SUPPORTED_MEDICAL_LOCALES.includes(normalized as MedicalLocale)
  ) {
    return { locale: normalized as MedicalLocale, fallback: false };
  }
  return { locale: "fr", fallback: true };
}

export default async function EspacePage({
  searchParams,
}: {
  searchParams?: Promise<{ locale?: string | string[] | undefined }>;
} = {}) {
  const resolvedSearchParams = await searchParams;
  const { locale, fallback } = normalizeLocale(resolvedSearchParams?.locale);
  const copy = (path: string, vars: Record<string, string> = {}) =>
    getMedicalSafetyCopy(locale, path, vars);

  const auth = await getAuthContext();
  const analytics = getAnalyticsBootstrapStatus();
  const consent = getConsentBootstrapStatus();
  const analyticsAllowed = canTrackWithConsent(consent) && analytics.configured;

  captureArchitectureEvent("espace_page_rendered", {
    route: "/espace",
    auth_state: auth.state,
    auth_configured: String(auth.configured),
    analytics_allowed: String(analyticsAllowed),
    consent_mode: consent.mode,
    consent_configured: String(consent.configured),
    locale,
    locale_fallback: String(fallback),
  });

  const authenticatedUserId =
    auth.isAuthenticated && auth.userId ? auth.userId : null;
  const isPreviewMode = auth.mode === "preview" && authenticatedUserId !== null;
  const isRuntimeMode = auth.mode === "runtime";
  const fallbackTitle =
    auth.mode === "disabled"
      ? copy("screens.runtime.authUnavailableTitle")
      : copy("screens.runtime.authRequiredTitle");
  const fallbackBody =
    auth.mode === "disabled"
      ? copy("screens.runtime.authUnavailableBody")
      : copy("screens.runtime.authRequiredBody");

  return (
    <main className="app-shell">
      <AnalyticsPageView
        enabled={analyticsAllowed}
        event="espace_page_viewed"
        route="/espace"
      />

      <div className="app-shell__meta">
        <p className="app-shell__text">
          {copy("screens.onboarding.safetyPositioningBanner")}
        </p>
        <p className="app-shell__eyebrow">
          {copy("screens.onboarding.dataModeTransitionInfo")}
        </p>
        {fallback && (
          <p className="app-shell__eyebrow">
            {copy("fallbacks.missingLocale")}
          </p>
        )}
      </div>

      <section className="app-shell__section">
        {authenticatedUserId ? (
          <>
            {isRuntimeMode ? <RuntimeUserButton /> : null}
            {isPreviewMode ? (
              <Alert>
                <AlertTitle>
                  {copy("screens.runtime.previewModeTitle")}
                </AlertTitle>
                <AlertDescription>
                  {copy("screens.runtime.previewModeBody", {
                    userId: authenticatedUserId,
                  })}
                </AlertDescription>
              </Alert>
            ) : null}
            <ConsentRightsClient
              auth={
                isPreviewMode
                  ? { mode: "preview", userId: authenticatedUserId }
                  : { mode: "runtime" }
              }
              locale={locale}
            />
            <article className="app-shell__section">
              <h2 className="app-shell__text">Ouvrir le suivi</h2>
              <p className="app-shell__text">
                Enregistre repas, symptômes et résumé hebdomadaire descriptif.
              </p>
              <p className="app-shell__text">
                <Link href="/espace/suivi">Accéder au suivi</Link>
              </p>
            </article>
          </>
        ) : (
          <article className="app-shell__section">
            <h2 className="app-shell__text">{fallbackTitle}</h2>
            <p className="app-shell__text">{fallbackBody}</p>
            {isRuntimeMode ? (
              <p className="app-shell__text">
                <Link href="/sign-in">{copy("screens.runtime.signInCta")}</Link>
              </p>
            ) : null}
          </article>
        )}
      </section>

      <p className="app-shell__text">
        {copy("screens.clinicianShare.disclaimer")}
      </p>
      <p className="app-shell__text">
        <Link href="/">{copy("fallbacks.advisoryFooter")}</Link>
      </p>
    </main>
  );
}
