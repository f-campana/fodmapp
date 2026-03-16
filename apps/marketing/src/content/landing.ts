type LandingFAQ = {
  question: string;
  answer: string;
};

type LandingPillar = {
  title: string;
  description: string;
};

export const landingCopy = {
  hero: {
    eyebrow: "Un mode de vie low-FODMAP, moins galère",
    title:
      "Tu suis un régime pauvre en FODMAP et tu ne sais plus quoi cuisiner ?",
    description:
      "FODMAPP t'aide à trouver des substitutions compatibles pour poursuivre ton assiette sans te reprendre d’un coup.",
    cta: "Rejoins la liste d'attente",
  },
  approach: {
    title: "Comment ça marche",
    pillars: [
      {
        title: "Des données réelles",
        description:
          "Tout part de la base CIQUAL, la base nutritionnelle publique française, pas d’opinions isolées.",
      },
      {
        title: "Des substitutions cohérentes",
        description:
          "L’outil propose des alternatives moins chargées en FODMAP, dans une logique de cuisine réelle.",
      },
      {
        title: "La dose compte",
        description:
          "La tolérance dépend des portions, donc la guidance tient compte de la quantité quand la donnée existe.",
      },
    ] satisfies LandingPillar[],
  },
  trust: {
    title: "Pourquoi lui faire confiance",
    bullets: [
      "Données issues de CIQUAL, base française officielle des compositions.",
      "Règles et scores alignés sur la littérature scientifique (sans endossement).",
      "Méthode transparente et code source visible sur GitHub.",
      "L'application n'est pas un avis médical et ne remplace pas un diagnostic.",
    ],
    footer:
      "L’outil soutient tes choix de manière pratique, en complément d'un suivi nutritionnel.",
  },
  waitlist: {
    title: "Reste en lien",
    description:
      "Inscris ton email pour être prévenu quand la première version privée de FODMAPP ouvre.",
    emailLabel: "Ton email",
    cta: "Rejoins les premiers utilisateurs",
    note: "Données hébergées en UE, email via Resend, zéro tracking tiers.",
    successMessage: "C'est noté — on te prévient dès que c'est prêt.",
    invalidEmailMessage:
      "On n’a pas reconnu cette adresse email, vérifie-la et réessaie.",
    serverErrorMessage:
      "Le service est temporairement indisponible. Réessaie dans quelques minutes.",
  },
  faq: {
    title: "Questions fréquentes",
    items: [
      {
        question: "C'est un avis médical ?",
        answer:
          "Non. L’outil soutient tes choix alimentaires mais ne remplace pas un avis médical ou un diagnostic.",
      },
      {
        question: "J'ai besoin d'un diagnostic ?",
        answer:
          "Le suivi est plus utile quand un protocole low-FODMAP est déjà accompagné par un professionnel.",
      },
      {
        question: "Combien ça coûte ?",
        answer:
          "Le détail des modalités sera précisé au lancement. Aujourd’hui, le projet est en pré-activation.",
      },
      {
        question: "C'est quoi CIQUAL ?",
        answer:
          "La base CIQUAL est la base nationale française de composition alimentaire, maintenue par ANSES et publiée en open data.",
      },
    ] satisfies LandingFAQ[],
  },
  footer: {
    builtInFrance: "Construit en France.",
    legal: "Mentions légales",
    legalHref: "/",
    githubHref: "https://github.com/f-campana/fodmapp",
    githubLabel: "Github",
  },
} as const;
