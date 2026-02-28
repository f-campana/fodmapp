import Link from "next/link";

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
  searchParams?: { locale?: string | string[] };
} = {}) {
  const { locale, fallback } = normalizeLocale(searchParams?.locale);
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
        {auth.isAuthenticated && auth.userId ? (
          <ConsentRightsClient userId={auth.userId} locale={locale} />
        ) : (
          <article className="app-shell__section">
            <h2 className="app-shell__text">
              {copy("screens.runtime.authRequiredTitle")}
            </h2>
            <p className="app-shell__text">
              {copy("screens.runtime.authRequiredBody")}
            </p>
            <p className="app-shell__text">
              <Link href="/sign-in">{copy("screens.runtime.signInCta")}</Link>
            </p>
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
