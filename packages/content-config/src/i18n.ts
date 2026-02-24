export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export interface SectionCopy {
  title: string;
  description: string;
  eyebrow: string;
  bullets: string[];
}

export type ContentSection = "marketing" | "research";

const COPY: Record<ContentSection, Record<Locale, SectionCopy>> = {
  marketing: {
    fr: {
      title: "Site marketing en preparation",
      description:
        "Scaffold Astro FR-first pour la presentation produit, sans couplage backend.",
      eyebrow: "Phase architecture",
      bullets: [
        "Structure de pages statiques et conventions de contenu",
        "Conventions bilingues FR-first, EN-ready",
        "Aucun flux metier ni runtime API dans ce scaffold",
      ],
    },
    en: {
      title: "Marketing site scaffold in progress",
      description:
        "FR-first Astro scaffold for product presentation without backend coupling.",
      eyebrow: "Architecture phase",
      bullets: [
        "Static page structure and content conventions",
        "Bilingual FR-first, EN-ready conventions",
        "No business flow or API runtime integration in this scaffold",
      ],
    },
  },
  research: {
    fr: {
      title: "Site recherche en preparation",
      description:
        "Scaffold Astro dedie aux contenus evidence/recherche, en mode statique.",
      eyebrow: "Phase architecture",
      bullets: [
        "Base documentaire pour protocoles et methodologie",
        "Conventions de contenu partagees avec le site marketing",
        "Aucun couplage ETL, schema SQL ou runtime API",
      ],
    },
    en: {
      title: "Research site scaffold in progress",
      description:
        "Astro scaffold dedicated to evidence/research content in static mode.",
      eyebrow: "Architecture phase",
      bullets: [
        "Documentation baseline for protocols and methodology",
        "Shared content conventions with the marketing site",
        "No ETL, SQL schema, or API runtime coupling",
      ],
    },
  },
};

export function getLocalizedCopy(
  section: ContentSection,
  locale: Locale = DEFAULT_LOCALE,
): SectionCopy {
  return COPY[section][locale];
}
