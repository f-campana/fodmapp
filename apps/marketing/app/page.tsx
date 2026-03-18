import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fodmapp/ui/accordion";

import { WaitlistForm } from "../src/components/WaitlistForm";
import { landingCopy } from "../src/content/landing";

const enabled = (value: string | undefined): boolean =>
  value === "1" || value?.toLowerCase() === "true";

function isFeatureEnabled(name: string): boolean {
  return enabled(process.env[name]);
}

export default function HomePage() {
  const showApproach = isFeatureEnabled("NEXT_PUBLIC_FF_SECTION_APPROACH");
  const showTrust = isFeatureEnabled("NEXT_PUBLIC_FF_SECTION_TRUST");

  return (
    <>
      <main>
        <div className="marketing-page">
          {/* ---- Hero ---- */}
          <section className="marketing-hero">
            <p className="marketing-eyebrow">{landingCopy.hero.eyebrow}</p>
            <h1 className="marketing-title">{landingCopy.hero.title}</h1>
            <p className="marketing-description">
              <span>{landingCopy.hero.description}</span>
              <span className="marketing-description-support">
                {landingCopy.hero.descriptionSupport}
              </span>
            </p>
            <a className="marketing-cta" href="#waitlist">
              {landingCopy.hero.cta}
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </section>

          {/* ---- Trust strip ---- */}
          <section className="marketing-trust-strip" aria-label="Garanties">
            <ul className="marketing-trust-list">
              <li>
                Données issues de CIQUAL, la base nutritionnelle publique
                française
              </li>
              <li>Substitutions fondées sur la littérature scientifique</li>
              <li>Code source ouvert et méthode transparente</li>
            </ul>
          </section>

          {/* ---- Approach (feature-flagged) ---- */}
          {showApproach ? (
            <section
              aria-labelledby="approach-title"
              className="marketing-section"
            >
              <h2 id="approach-title" className="marketing-section-title">
                {landingCopy.approach.title}
              </h2>
              <div className="marketing-pillars" role="list">
                {landingCopy.approach.pillars.map((pillar) => (
                  <article
                    key={pillar.title}
                    className="marketing-pillars-item"
                    role="listitem"
                  >
                    <h3>{pillar.title}</h3>
                    <p>{pillar.description}</p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {/* ---- Trust section (feature-flagged) ---- */}
          {showTrust ? (
            <section
              aria-labelledby="trust-title"
              className="marketing-section marketing-muted"
            >
              <h2 id="trust-title" className="marketing-section-title">
                {landingCopy.trust.title}
              </h2>
              <ul
                className="marketing-list"
                aria-label={landingCopy.trust.title}
              >
                {landingCopy.trust.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <p className="marketing-description">
                {landingCopy.trust.footer}
              </p>
            </section>
          ) : null}
        </div>

        {/* ---- Waitlist band ---- */}
        <section id="waitlist" className="marketing-band">
          <div className="marketing-page marketing-page--band">
            <div className="marketing-waitlist">
              <h2 className="marketing-section-title">
                {landingCopy.waitlist.title}
              </h2>
              <p className="marketing-description">
                {landingCopy.waitlist.description}
              </p>
              <WaitlistForm />
            </div>
          </div>
        </section>

        <div className="marketing-page">
          {/* ---- FAQ ---- */}
          <section
            aria-labelledby="faq-title"
            className="marketing-faq-section"
          >
            <h2 id="faq-title" className="marketing-faq-title">
              {landingCopy.faq.title}
            </h2>
            <Accordion type="single" collapsible defaultValue="faq-0">
              {landingCopy.faq.items.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${String(index)}`}
                >
                  <AccordionTrigger className="marketing-faq-trigger">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>
      </main>

      {/* ---- Footer ---- */}
      <footer className="marketing-footer-band">
        <div className="marketing-page marketing-page--footer">
          <div className="marketing-footer-top">
            <span className="marketing-footer-brand">FODMAPP</span>
            <nav
              className="marketing-footer-links"
              aria-label="Liens du pied de page"
            >
              <a href={landingCopy.footer.githubHref}>
                {landingCopy.footer.githubLabel}
              </a>
              <a href={landingCopy.footer.legalHref}>
                {landingCopy.footer.legal}
              </a>
            </nav>
          </div>
          <hr className="marketing-footer-divider" />
          <div className="marketing-footer-bottom">
            <span>
              {landingCopy.footer.builtInFrance.replace(/\.$/, ", avec soin.")}
            </span>
            <span>Données CIQUAL · Licence Etalab 2.0</span>
          </div>
        </div>
      </footer>
    </>
  );
}
