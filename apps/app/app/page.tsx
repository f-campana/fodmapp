import Link from "next/link";

import { Button } from "@fodmapp/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui/card";

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
  searchParams?: Promise<{ locale?: string | string[] | undefined }>;
} = {}) {
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
  const routeCards = [
    {
      href: "/aliments",
      title: "Aliments",
      description:
        "Recherche un aliment de la base pour consulter son niveau FODMAP et les substitutions actives disponibles aujourd’hui.",
      cta: "Rechercher un aliment",
      variant: "default",
    },
    {
      href: "/decouvrir",
      title: "Découvrir",
      description:
        "Quand un aliment n’a pas encore de substitut documenté, cette page propose des bases simples pour continuer à cuisiner sans impasse.",
      cta: "Explorer les bases",
      variant: "outline",
    },
    {
      href: "/espace",
      title: "Espace",
      description:
        "Gérez le consentement, les exports et un suivi descriptif sans transformer l’app en outil clinique.",
      cta: "Ouvrir mon espace",
      variant: "secondary",
    },
  ] as const;

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

      <section className="app-shell__header">
        <div className="app-shell__meta">
          <p className="app-shell__eyebrow">FODMAPP App</p>
          <p className="app-shell__status">{consentModeLabel}</p>
        </div>
        <h1 className="app-shell__title">
          Repères alimentaires et suivi personnel
        </h1>
        <p className="app-shell__description">
          {copy("screens.onboarding.safetyPositioningBanner")}
        </p>
        <p className="app-shell__text">
          {copy("screens.onboarding.dataModeIntro")}
        </p>
        <div className="app-shell__actions">
          <Button asChild>
            <Link href="/aliments">Rechercher un aliment</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/decouvrir">Explorer les bases</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/espace">Ouvrir mon espace</Link>
          </Button>
        </div>
        {fallback && (
          <p className="app-shell__eyebrow">
            {copy("fallbacks.missingLocale")}
          </p>
        )}
      </section>

      <section className="app-shell__section">
        <div className="app-shell__meta">
          <p className="app-shell__eyebrow">Parcours</p>
          <p className="app-shell__status">
            {copy("screens.onboarding.dataModeTransitionCta")}
          </p>
        </div>
        <h2 className="app-shell__section-title">
          Trois entrées complémentaires
        </h2>
        <p className="app-shell__text">
          Recherche ciblée, bases compatibles et espace personnel restent
          séparés pour garder une lecture simple de chaque action.
        </p>
        <div className="app-shell__grid">
          {routeCards.map((routeCard) => (
            <Card key={routeCard.href}>
              <CardHeader>
                <CardTitle>{routeCard.title}</CardTitle>
                <CardDescription>{routeCard.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant={routeCard.variant}>
                  <Link href={routeCard.href}>{routeCard.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="app-shell__section">
        <div className="app-shell__meta">
          <p className="app-shell__eyebrow">Sécurité d’usage</p>
          <p className="app-shell__status">{consentModeAction}</p>
        </div>
        <h2 className="app-shell__section-title">
          Un appui pratique, pas une conclusion clinique
        </h2>
        <p className="app-shell__text">{copy("fallbacks.advisoryFooter")}</p>
        <p className="app-shell__text">
          {copy("screens.swapDetail.trialHint")}
        </p>
        <p className="app-shell__text">
          {copy("screens.onboarding.dataModeTransitionInfo")}
        </p>
        <p className="app-shell__text">
          {copy("screens.swapDetail.fallbackWarning")}
        </p>
        <p className="app-shell__eyebrow">{consentModeNotice}</p>
      </section>
    </main>
  );
}
