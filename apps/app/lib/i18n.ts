import { getMedicalSafetyCopy, type MedicalLocale } from "./medicalSafetyCopy";

export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "fr";

interface AppMessages {
  home: {
    title: string;
    description: string;
    consentLabel: string;
    returnHome: string;
  };
  espace: {
    title: string;
    description: string;
    minimalModeLabel: string;
    consentedModeLabel: string;
    consentToggleLabel: string;
    noAuthStateLabel: string;
    consentLabel: string;
  };
  safety: {
    phaseBadge: string;
    localeLabel: string;
    advisorySafety: string;
  };
}

function normalizeLocale(locale: SupportedLocale): MedicalLocale {
  return locale === "en" ? "en" : "fr";
}

export function getMessages(
  locale: SupportedLocale = DEFAULT_LOCALE,
): AppMessages {
  const normalized = normalizeLocale(locale);

  return {
    home: {
      title: getMedicalSafetyCopy(
        normalized,
        "screens.onboarding.safetyPositioningBanner",
      ),
      description: getMedicalSafetyCopy(
        normalized,
        "screens.onboarding.dataModeTransitionInfo",
      ),
      consentLabel: getMedicalSafetyCopy(
        normalized,
        "screens.consentMode.currentMinimal",
      ),
      returnHome: getMedicalSafetyCopy(
        normalized,
        "fallbacks.unknownFoodLabel",
      ),
    },
    espace: {
      title: getMedicalSafetyCopy(normalized, "screens.clinicianShare.title"),
      description: getMedicalSafetyCopy(
        normalized,
        "screens.clinicianShare.disclaimer",
      ),
      minimalModeLabel: getMedicalSafetyCopy(
        normalized,
        "screens.consentMode.currentMinimal",
      ),
      consentedModeLabel: getMedicalSafetyCopy(
        normalized,
        "screens.consentMode.currentConsented",
      ),
      consentToggleLabel: getMedicalSafetyCopy(
        normalized,
        "screens.consentMode.upgradePrompt",
      ),
      noAuthStateLabel: getMedicalSafetyCopy(
        normalized,
        "screens.runtime.authRequiredTitle",
      ),
      consentLabel: getMedicalSafetyCopy(
        normalized,
        "screens.clinicianShare.createCta",
      ),
    },
    safety: {
      phaseBadge: getMedicalSafetyCopy(normalized, "safetyTiers.unknown.label"),
      localeLabel:
        normalized === "fr" ? "Risque contrôlé: FR" : "Controlled risk: EN",
      advisorySafety: getMedicalSafetyCopy(
        normalized,
        "screens.onboarding.dataModeIntro",
      ),
    },
  };
}
