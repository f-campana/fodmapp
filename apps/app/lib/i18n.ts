export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "fr";

interface AppMessages {
  meta: {
    phaseBadge: string;
    localeLabel: string;
  };
  home: {
    title: string;
    description: string;
    contractLabel: string;
    routeNote: string;
    authLabel: string;
    monitoringLabel: string;
    analyticsLabel: string;
    consentLabel: string;
    gatedCta: string;
  };
  gated: {
    title: string;
    description: string;
    authStateLabel: string;
    authModeLabel: string;
    authConfiguredLabel: string;
    consentLabel: string;
    backHome: string;
  };
}

const MESSAGES: Record<SupportedLocale, AppMessages> = {
  fr: {
    meta: {
      phaseBadge: "Scaffold architecture",
      localeLabel: "Locale active: FR",
    },
    home: {
      title: "Socle app Next.js en place",
      description:
        "Ce shell valide les contrats monorepo sans logique metier ni couplage data-engine.",
      contractLabel: "Contrat API compile via @fodmap/types",
      routeNote:
        "Route publique minimale: / (FR-first). Route espace protegee en placeholder: /espace.",
      authLabel: "Authentification",
      monitoringLabel: "Monitoring",
      analyticsLabel: "Analytics",
      consentLabel: "Consentement",
      gatedCta: "Voir l'espace placeholder",
    },
    gated: {
      title: "Espace protege (placeholder)",
      description:
        "Le framework d'authentification sera branche dans la PR suivante.",
      authStateLabel: "Etat auth actuel",
      authModeLabel: "Mode auth",
      authConfiguredLabel: "Config auth complete",
      consentLabel: "Consentement analytics",
      backHome: "Retour accueil",
    },
  },
  en: {
    meta: {
      phaseBadge: "Architecture scaffold",
      localeLabel: "Active locale: EN",
    },
    home: {
      title: "Next.js app shell is in place",
      description:
        "This shell validates monorepo contracts without business logic or data-engine coupling.",
      contractLabel: "API contract compiles via @fodmap/types",
      routeNote:
        "Minimum public route: /. Placeholder protected area route: /espace.",
      authLabel: "Authentication",
      monitoringLabel: "Monitoring",
      analyticsLabel: "Analytics",
      consentLabel: "Consent",
      gatedCta: "Open placeholder area",
    },
    gated: {
      title: "Protected area (placeholder)",
      description: "Auth framework wiring is deferred to the next PR.",
      authStateLabel: "Current auth state",
      authModeLabel: "Auth mode",
      authConfiguredLabel: "Auth fully configured",
      consentLabel: "Analytics consent",
      backHome: "Back to home",
    },
  },
};

export function getMessages(
  locale: SupportedLocale = DEFAULT_LOCALE,
): AppMessages {
  return MESSAGES[locale];
}
