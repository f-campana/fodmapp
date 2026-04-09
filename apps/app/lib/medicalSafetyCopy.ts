export const SUPPORTED_MEDICAL_LOCALES = ["fr", "en"] as const;
export type MedicalLocale = (typeof SUPPORTED_MEDICAL_LOCALES)[number];

type CopyText = string;

type SafetyTierCopy = {
  label: CopyText;
  status: CopyText;
  details: CopyText;
};

type OnboardingCopy = {
  safetyPositioningBanner: CopyText;
  dataModeIntro: CopyText;
  dataModeTransitionCta: CopyText;
  dataModeTransitionInfo: CopyText;
};

type SwapListCopy = {
  blockedTitle: CopyText;
  blockedBody: CopyText;
  blockedAction: CopyText;
  unknownTitle: CopyText;
  unknownBody: CopyText;
  unknownAction: CopyText;
  lowConfidenceTitle: CopyText;
  lowConfidenceBody: CopyText;
};

type SwapDetailCopy = {
  rationaleHeader: CopyText;
  unknownRationale: CopyText;
  trialHint: CopyText;
  fallbackWarning: CopyText;
};

type ConflictReviewCopy = {
  header: CopyText;
  subtitle: CopyText;
  optionLabel: CopyText;
  choosePrimaryCta: CopyText;
  deferChoiceCta: CopyText;
  confirmation: CopyText;
  noChoiceWarning: CopyText;
};

type ConsentModeCopy = {
  currentMinimal: CopyText;
  currentConsented: CopyText;
  upgradePrompt: CopyText;
  upgradeSubtext: CopyText;
  downgradePrompt: CopyText;
  downgradeWarning: CopyText;
  transitionSuccess: CopyText;
};

type NotificationCopy = {
  pauseNow: CopyText;
  pauseUntilReenabled: CopyText;
  pauseActiveNotice: CopyText;
  killSwitchLabel: CopyText;
  killSwitchConfirm: CopyText;
  killSwitchHelp: CopyText;
};

type ClinicianShareCopy = {
  title: CopyText;
  description: CopyText;
  exportHint: CopyText;
  createCta: CopyText;
  disclaimer: CopyText;
  emptyState: CopyText;
};

type DeletionCopy = {
  requestOpen: CopyText;
  requestHelp: CopyText;
  confirmAction: CopyText;
  success: CopyText;
};

type ErrorStateCopy = {
  syncRetry: CopyText;
  conflictRetry: CopyText;
  offlineNotice: CopyText;
};

type RuntimeCopy = {
  authRequiredTitle: CopyText;
  authRequiredBody: CopyText;
  authUnavailableTitle: CopyText;
  authUnavailableBody: CopyText;
  authDeploymentIssueTitle: CopyText;
  authDeploymentIssueBody: CopyText;
  previewModeTitle: CopyText;
  previewModeBody: CopyText;
  signInCta: CopyText;
  loadingConsent: CopyText;
  exportRequestLabel: CopyText;
  deleteRequestLabel: CopyText;
  statusLabel: CopyText;
  proofLabel: CopyText;
  manifestLabel: CopyText;
  downloadLabel: CopyText;
};

type MedicalGlossary = {
  symptom: {
    term: CopyText;
    def: CopyText;
  };
  burden: {
    term: CopyText;
    def: CopyText;
  };
  severity: {
    term: CopyText;
    def: CopyText;
  };
  confidence: {
    term: CopyText;
    def: CopyText;
  };
  swap: {
    term: CopyText;
    def: CopyText;
  };
};

type FallbackCopy = {
  advisoryFooter: CopyText;
  unknownFoodLabel: CopyText;
  unknownAlternativeLabel: CopyText;
  safetyTierLabelPrefix: CopyText;
  missingLocale: CopyText;
  missingKey: CopyText;
};

export type PhraseRule = {
  id: string;
  en: CopyText;
  fr: CopyText;
  rationale?: CopyText;
};

export type MedicalCopyLocale = {
  glossary: MedicalGlossary;
  toneGuide: {
    voice: CopyText;
    sentencePrinciple: CopyText;
    actionPrinciple: CopyText;
    errorPrinciple: CopyText;
  };
  approvedPhrases: PhraseRule[];
  forbiddenPhrases: PhraseRule[];
  safetyTiers: {
    high: SafetyTierCopy;
    moderate: SafetyTierCopy;
    low: SafetyTierCopy;
    blocked: SafetyTierCopy;
    unknown: SafetyTierCopy;
  };
  screens: {
    onboarding: OnboardingCopy;
    swapList: SwapListCopy;
    swapDetail: SwapDetailCopy;
    conflictReview: ConflictReviewCopy;
    consentMode: ConsentModeCopy;
    notifications: NotificationCopy;
    clinicianShare: ClinicianShareCopy;
    deletion: DeletionCopy;
    errorStates: ErrorStateCopy;
    runtime: RuntimeCopy;
  };
  fallbacks: FallbackCopy;
};

type MedicalSafetyCopy = Record<MedicalLocale, MedicalCopyLocale>;

export const MEDICAL_SAFETY_COPY: MedicalSafetyCopy = {
  fr: {
    glossary: {
      symptom: {
        term: "Symptômes digestifs",
        def: "Expérience digestive perçue par l’utilisateur, décrite par l’utilisateur.",
      },
      burden: {
        term: "Charge digestive",
        def: "Niveau de gêne ressenti après un repas (intensité et tolérance).",
      },
      severity: {
        term: "Sévérité",
        def: "Niveau de manifestation (none, low, moderate, high, unknown).",
      },
      confidence: {
        term: "Confiance",
        def: "Degré de certitude interne sur la fiabilité de la suggestion.",
      },
      swap: {
        term: "Substitution",
        def: "Alternative proposée pour un aliment de départ.",
      },
    },
    toneGuide: {
      voice:
        "Soutenant, non directif, non alarmiste, orienté action prudente avec suivi.",
      sentencePrinciple:
        "Une idée par phrase. Pas d’instruction médicale. Pas de promesse de résultat.",
      actionPrinciple:
        'Toujours des verbes d’option: "vous pouvez", "vous pouvez envisager", "si cela convient".',
      errorPrinciple:
        "En cas d’aggravation, l’action recommande de revenir au choix précédent et de consulter.",
    },
    approvedPhrases: [
      {
        id: "approve-001",
        en: "This is a decision-support suggestion, not a medical treatment.",
        fr: "Cette suggestion est une aide à la décision, pas un avis médical.",
      },
      {
        id: "approve-002",
        en: "Use as a trial, then monitor your symptoms.",
        fr: "Utilisez-la en essai court, puis suivez vos symptômes.",
      },
      {
        id: "approve-003",
        en: "If symptoms worsen, stop and return to your previous option.",
        fr: "En cas d’aggravation, arrêtez l’essai et revenez à votre option précédente.",
      },
      {
        id: "approve-004",
        en: "Share in context with your clinician before treatment changes.",
        fr: "Partagez ces informations avec votre professionnel avant toute modification de prise en charge.",
      },
    ],
    forbiddenPhrases: [
      {
        id: "forbid-001",
        en: "This must be framed as supportive context, not outcome certainty.",
        fr: "Cela corrigera vos symptômes.",
        rationale:
          "Affirmation de résultat impossible à garantir en safety support context.",
      },
      {
        id: "forbid-002",
        en: "Replace clinical care with this app.",
        fr: "Remplacez des soins cliniques par cette app.",
        rationale:
          "Directive médicale explicite, risque d’interprétation thérapeutique.",
      },
      {
        id: "forbid-003",
        en: "Guaranteed / risk-free recommendation.",
        fr: "Recommandation sans risque / garantie.",
        rationale:
          "Langage de promesse sans base clinique et sans support de preuve absolue.",
      },
      {
        id: "forbid-004",
        en: "You should follow this guidance with clinical context.",
        fr: "Vous devez garder votre clinique comme référence.",
        rationale:
          "Directive impérative de santé, non conforme à une posture conseil.",
      },
    ],
    safetyTiers: {
      high: {
        label: "Confiance élevée",
        status: "Critères de sécurité remplis. Règle active.",
        details:
          "Extrémités connues, sans aggravation attendue, ratio de charge stable ou amélioré.",
      },
      moderate: {
        label: "Confiance modérée",
        status: "Peut être utile, usage surveillé.",
        details:
          "Critères remplis, marge intermédiaire, données partielles ou limites de preuve.",
      },
      low: {
        label: "Confiance limitée",
        status: "Utilisation prudente, correspondance de sécurité incertaine.",
        details:
          "Garde-fous partiellement remplis; comportement utile uniquement avec suivi rapproché.",
      },
      blocked: {
        label: "Bloqué pour sécurité",
        status: "La règle n’est pas activable actuellement.",
        details:
          "Échec de validation de sécurité ou divergence avec les règles contractuelles actives.",
      },
      unknown: {
        label: "Aucune estimation de sécurité",
        status: "Données insuffisantes pour activer la suggestion.",
        details:
          "Endpoint inconnu pour la chaîne sécurité; la règle reste hors recommandation active.",
      },
    },
    screens: {
      onboarding: {
        safetyPositioningBanner:
          "L’app soutient vos choix digestifs et ne pose pas de conclusion clinique.",
        dataModeIntro:
          "Vous pouvez démarrer en mode minimal, puis activer le mode consenti pour une personnalisation renforcée.",
        dataModeTransitionCta: "Mode minimal / Mode consenti",
        dataModeTransitionInfo:
          "La sortie du mode consenti reste possible à tout moment depuis les paramètres.",
      },
      swapList: {
        blockedTitle: "Bloqué par sécurité",
        blockedBody:
          "Cette substitution n’est pas affichée dans les recommandations actives tant que la validation sécurité n’est pas rétablie.",
        blockedAction: "Voir la raison du blocage",
        unknownTitle: "Pas encore prêt",
        unknownBody:
          "Les données nécessaires pour cette paire sont encore insuffisantes.",
        unknownAction: "Ajouter plus de repas",
        lowConfidenceTitle: "À utiliser avec surveillance",
        lowConfidenceBody:
          "Vous pouvez l’essayer sur quelques repas puis décider selon votre ressenti.",
      },
      swapDetail: {
        rationaleHeader: "Pourquoi cette substitution peut convenir",
        unknownRationale:
          "L’estimation de sécurité est incomplète. Cette substitution n’est pas une recommandation active.",
        trialHint:
          "Testez sur 2 à 3 repas, puis ajustez en fonction des symptômes.",
        fallbackWarning:
          "En cas d’aggravation, arrêtez l’essai et revenez à votre option précédente.",
      },
      conflictReview: {
        header: "Choisir une substitution",
        subtitle:
          "Ces options se chevauchent. Choisissez d’abord celle qui vous convient le mieux.",
        optionLabel: "Option {{index}}",
        choosePrimaryCta: "Utiliser cette option",
        deferChoiceCta: "Décider plus tard",
        confirmation:
          "Enregistrer ce choix ? Vous pourrez le modifier si votre suivi l’exige.",
        noChoiceWarning:
          "Aucun choix n’a été validé. Conservez votre substitution actuelle pour l’instant.",
      },
      consentMode: {
        currentMinimal: "Mode actuel : Minimal",
        currentConsented: "Mode actuel : Consenti",
        upgradePrompt:
          "Le mode consenti active une personnalisation plus riche et plus précise.",
        upgradeSubtext: "Vous pouvez quitter le mode consenti à tout moment.",
        downgradePrompt: "Passer en mode minimal",
        downgradeWarning:
          "Certaines recommandations actives pourront être moins personnalisées.",
        transitionSuccess: "Mode mis à jour.",
      },
      notifications: {
        pauseNow: "Mettre les notifications en pause",
        pauseUntilReenabled: "Mettre en pause jusqu’à réactivation",
        pauseActiveNotice:
          "Notifications en pause. Les suggestions restent accessibles manuellement.",
        killSwitchLabel: "Arrêter toutes les notifications santé",
        killSwitchConfirm:
          "Désactive immédiatement toutes les notifications santé. Vous pourrez réactiver ensuite.",
        killSwitchHelp:
          "Activez cette option en cas de surcharge ou de période de repos.",
      },
      clinicianShare: {
        title: "Partager un récapitulatif avec votre professionnel",
        description:
          "Partagez un résumé non clinique : tendances, substitutions actives, niveaux de confiance.",
        exportHint: "La période choisie est exportée.",
        createCta: "Créer le récapitulatif",
        disclaimer:
          "Ce récapitulatif sert au soutien de discussion, pas à une directive thérapeutique.",
        emptyState:
          "Ajoutez au moins un repas et une donnée symptomatique avant export.",
      },
      deletion: {
        requestOpen: "Supprimer vos données",
        requestHelp:
          "La suppression concerne les données de santé identifiables; certaines durées légales de conservation peuvent s’appliquer.",
        confirmAction:
          "Je confirme que cette action supprime les données visibles dans cette vue.",
        success:
          "Demande de suppression transmise. Vous recevrez une confirmation après validation.",
      },
      errorStates: {
        syncRetry:
          "Sécurisation impossible pour le moment: suggestions en pause jusqu’à nouvelle vérification.",
        conflictRetry:
          "Conflit inattendu détecté. Votre choix précédent a été conservé, incident journalisé.",
        offlineNotice:
          "Hors ligne: contenu d’appui uniquement, pas de mise à jour sécurité.",
      },
      runtime: {
        authRequiredTitle: "Connexion requise pour gérer vos droits",
        authRequiredBody:
          "Connectez-vous pour consulter, exporter ou supprimer vos données personnelles.",
        authUnavailableTitle: "Connexion indisponible dans cette version",
        authUnavailableBody:
          "Cette version locale n’embarque pas encore de parcours de connexion. Utilisez le mode aperçu local pour tester l’espace compte et le suivi.",
        authDeploymentIssueTitle:
          "Authentification indisponible sur ce déploiement",
        authDeploymentIssueBody:
          "Ce déploiement n’est pas prêt pour l’espace personnel. Vérifiez la configuration Clerk runtime ainsi que l’accès navigateur vers l’API.",
        previewModeTitle: "Mode aperçu local actif",
        previewModeBody:
          "Vous naviguez avec l’utilisateur local {{userId}}. Les écritures passent par l’API réelle, mais il ne s’agit pas d’une authentification réelle.",
        signInCta: "Se connecter",
        loadingConsent: "Chargement de l’état de consentement...",
        exportRequestLabel: "Demande d’export",
        deleteRequestLabel: "Demande de suppression",
        statusLabel: "Statut",
        proofLabel: "Preuve",
        manifestLabel: "Manifeste",
        downloadLabel: "Télécharger l’export",
      },
    },
    fallbacks: {
      advisoryFooter:
        "Cette suggestion est un soutien décisionnel, pas un avis médical.",
      unknownFoodLabel: "cet aliment",
      unknownAlternativeLabel: "une alternative",
      safetyTierLabelPrefix: "Niveau de sécurité",
      missingLocale: "Copie FR/EN manquante pour la langue demandée.",
      missingKey: "Copie manquante pour la clé: {{key}}",
    },
  },
  en: {
    glossary: {
      symptom: {
        term: "Digestive symptom",
        def: "User-reported digestive experience.",
      },
      burden: {
        term: "Symptom burden",
        def: "Perceived symptom load after a meal.",
      },
      severity: {
        term: "Severity",
        def: "Symptom level (none, low, moderate, high, unknown).",
      },
      confidence: {
        term: "Confidence",
        def: "Internal certainty level for a suggestion match.",
      },
      swap: {
        term: "Substitution",
        def: "Alternative option proposed for a source food.",
      },
    },
    toneGuide: {
      voice:
        "Supportive, non-directive, non-alarming, and focused on monitored choice.",
      sentencePrinciple:
        "One idea per sentence. No certainty language for outcomes.",
      actionPrinciple:
        'Use option-style phrasing: "you can" or "you may choose".',
      errorPrinciple:
        "If worsening appears, stop the option and return to the previous one.",
    },
    approvedPhrases: [
      {
        id: "approve-001",
        en: "This is a decision-support suggestion, not a medical treatment.",
        fr: "Cette suggestion est une aide à la décision, pas un avis médical.",
      },
      {
        id: "approve-002",
        en: "Use as a trial, then monitor your symptoms.",
        fr: "Utilisez-la en essai court, puis suivez vos symptômes.",
      },
      {
        id: "approve-003",
        en: "If symptoms worsen, stop and return to your previous option.",
        fr: "En cas d’aggravation, arrêtez l’essai et revenez à votre option précédente.",
      },
      {
        id: "approve-004",
        en: "Share in context with your clinician before treatment changes.",
        fr: "Partagez ces informations avec votre professionnel avant toute modification de prise en charge.",
      },
    ],
    forbiddenPhrases: [
      {
        id: "forbid-001",
        en: "This must be framed as supportive context, not outcome certainty.",
        fr: "Cela corrigera vos symptômes.",
        rationale:
          "Overpromising outcomes cannot be safely stated in support-only context.",
      },
      {
        id: "forbid-002",
        en: "Replace clinical care with this app.",
        fr: "Remplacez des soins cliniques par cette app.",
        rationale:
          "Medical directive that crosses into treatment recommendation.",
      },
      {
        id: "forbid-003",
        en: "Guaranteed / risk-free recommendation.",
        fr: "Recommandation sans risque / garantie.",
        rationale:
          "Guaranteed certainty language is not defensible for non-clinical recommendations.",
      },
      {
        id: "forbid-004",
        en: "You should follow this guidance with clinical context.",
        fr: "Vous devez garder votre clinique comme référence.",
        rationale:
          "Imperative directive language conflicts with advisory posture.",
      },
    ],
    safetyTiers: {
      high: {
        label: "High confidence",
        status: "Safety criteria are met and the rule is active.",
        details:
          "Known endpoints, no expected worsening, stable or improved burden ratio.",
      },
      moderate: {
        label: "Moderate confidence",
        status: "Likely helpful, but use with monitoring.",
        details:
          "Criteria pass with moderate margins and partial evidence footprint.",
      },
      low: {
        label: "Limited confidence",
        status: "Use with care; safety confidence is limited.",
        details:
          "Some safeguards are partial; monitor closely before broader use.",
      },
      blocked: {
        label: "Blocked for safety",
        status: "Rule is currently inactive for safety reasons.",
        details:
          "Validation failed or active snapshot mismatch with policy requirements.",
      },
      unknown: {
        label: "No safety estimate",
        status: "Not enough validated data to activate.",
        details:
          "Unknown endpoint in the safety path; recommendation remains inactive.",
      },
    },
    screens: {
      onboarding: {
        safetyPositioningBanner:
          "The app supports meal decisions only and does not provide clinical care guidance.",
        dataModeIntro:
          "You can start in minimal mode, then enable consents mode for stronger personalization.",
        dataModeTransitionCta: "Minimal mode / Consented mode",
        dataModeTransitionInfo:
          "You can always leave consents mode from settings.",
      },
      swapList: {
        blockedTitle: "Blocked for safety",
        blockedBody:
          "This substitution is removed from active suggestions until security checks pass again.",
        blockedAction: "Why blocked",
        unknownTitle: "Not ready",
        unknownBody:
          "Not enough required data has been collected for this pair.",
        unknownAction: "Add more meals",
        lowConfidenceTitle: "Use with monitoring",
        lowConfidenceBody:
          "You can try this for a few meals and review symptom response.",
      },
      swapDetail: {
        rationaleHeader: "Why this substitution may fit",
        unknownRationale:
          "Safety estimate is incomplete. This is not an active recommendation.",
        trialHint:
          "Try for 2 to 3 meals, then evaluate response before broader use.",
        fallbackWarning:
          "If symptoms worsen, stop and return to your previous choice.",
      },
      conflictReview: {
        header: "Choose one substitution",
        subtitle:
          "These options overlap. Pick the one you are most comfortable trying first.",
        optionLabel: "Option {{index}}",
        choosePrimaryCta: "Use this option",
        deferChoiceCta: "Decide later",
        confirmation: "Save your choice? You can change it later if needed.",
        noChoiceWarning:
          "No choice selected. Keep your current substitution for now.",
      },
      consentMode: {
        currentMinimal: "Current mode: Minimal",
        currentConsented: "Current mode: Consented",
        upgradePrompt:
          "Consented mode enables richer personalization and ranking depth.",
        upgradeSubtext:
          "You can leave consents mode from settings at any time.",
        downgradePrompt: "Switch to minimal mode",
        downgradeWarning:
          "Some active recommendations may become less personalized.",
        transitionSuccess: "Mode updated.",
      },
      notifications: {
        pauseNow: "Pause support notifications",
        pauseUntilReenabled: "Pause until I re-enable",
        pauseActiveNotice:
          "Notifications paused. You can still open suggestions manually.",
        killSwitchLabel: "Stop all health prompts",
        killSwitchConfirm:
          "Disables all health prompts immediately. You can turn them back on any time.",
        killSwitchHelp:
          "Use when overload is likely or when follow-up is not possible.",
      },
      clinicianShare: {
        title: "Share a summary with your clinician",
        description:
          "Share a non-clinical summary: symptoms, active swaps, confidence labels.",
        exportHint: "Only the selected period is exported.",
        createCta: "Create clinician summary",
        disclaimer:
          "This summary is for discussion support, not treatment guidance.",
        emptyState:
          "Add at least one meal and one symptom entry before export.",
      },
      deletion: {
        requestOpen: "Delete your data",
        requestHelp:
          "Deletion removes identifiable health data; legal retention windows may still apply.",
        confirmAction:
          "I confirm that this action removes the currently visible profile data.",
        success:
          "Deletion request accepted. Confirmation will be sent after processing.",
      },
      errorStates: {
        syncRetry:
          "Cannot verify safely right now. Recommendations are paused until checks pass.",
        conflictRetry:
          "Unexpected conflict state was detected. Your current choice was kept and logged.",
        offlineNotice:
          "Offline: advisory content only. No active safety updates.",
      },
      runtime: {
        authRequiredTitle: "Sign in required to manage your rights",
        authRequiredBody:
          "Sign in to review, export, or delete your personal data.",
        authUnavailableTitle: "Sign-in unavailable in this build",
        authUnavailableBody:
          "This local build does not include a real sign-in flow yet. Use local preview mode to validate account and tracking screens.",
        authDeploymentIssueTitle: "Sign-in is unavailable on this deployment",
        authDeploymentIssueBody:
          "This deployment is not ready for account surfaces yet. Check the Clerk runtime configuration and browser access to the API.",
        previewModeTitle: "Local preview mode active",
        previewModeBody:
          "You are browsing as local preview user {{userId}}. Writes go to the real API, but this is not real authentication.",
        signInCta: "Sign in",
        loadingConsent: "Loading consent state...",
        exportRequestLabel: "Export request",
        deleteRequestLabel: "Delete request",
        statusLabel: "Status",
        proofLabel: "Proof",
        manifestLabel: "Manifest",
        downloadLabel: "Download export",
      },
    },
    fallbacks: {
      advisoryFooter: "These suggestions are advisory-only decision support.",
      unknownFoodLabel: "this food",
      unknownAlternativeLabel: "an alternative",
      safetyTierLabelPrefix: "Safety level",
      missingLocale: "Missing FR/EN copy for requested locale.",
      missingKey: "Missing copy key: {{key}}",
    },
  },
};

function getCopyNode(data: unknown, parts: string[]): unknown {
  let cursor: unknown = data;
  for (const part of parts) {
    if (
      !cursor ||
      typeof cursor !== "object" ||
      !(part in (cursor as Record<string, unknown>))
    ) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function interpolateCopyTemplate(
  value: string,
  vars: Record<string, string>,
): string {
  return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => {
    return Object.prototype.hasOwnProperty.call(vars, key)
      ? vars[key]
      : `{{${key}}}`;
  });
}

export function getMedicalSafetyCopy(
  locale: MedicalLocale,
  path: string,
  vars: Record<string, string> = {},
): string {
  const normalizedLocale = SUPPORTED_MEDICAL_LOCALES.includes(locale)
    ? locale
    : "fr";
  const keys = path.split(".");

  const localeValue = getCopyNode(MEDICAL_SAFETY_COPY[normalizedLocale], keys);
  const fallbackValue = getCopyNode(MEDICAL_SAFETY_COPY.fr, keys);

  const value = localeValue ?? fallbackValue;

  if (typeof value !== "string") {
    return interpolateCopyTemplate(
      MEDICAL_SAFETY_COPY[normalizedLocale].fallbacks.missingKey,
      { key: path },
    );
  }

  return interpolateCopyTemplate(value, vars);
}
