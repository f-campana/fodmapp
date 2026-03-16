import "../src/styles/landing.css";

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
    <main className="marketing-page">
      <section className="marketing-hero">
        <p className="marketing-eyebrow">{landingCopy.hero.eyebrow}</p>
        <h1 className="marketing-title">{landingCopy.hero.title}</h1>
        <p className="marketing-description">{landingCopy.hero.description}</p>
        <a className="marketing-cta" href="#waitlist">
          {landingCopy.hero.cta}
        </a>
      </section>

      {showApproach ? (
        <section aria-labelledby="approach-title" className="marketing-section">
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

      {showTrust ? (
        <section
          aria-labelledby="trust-title"
          className="marketing-section marketing-muted"
        >
          <h2 id="trust-title" className="marketing-section-title">
            {landingCopy.trust.title}
          </h2>
          <ul className="marketing-list" aria-label={landingCopy.trust.title}>
            {landingCopy.trust.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <p className="marketing-description">{landingCopy.trust.footer}</p>
        </section>
      ) : null}

      <section id="waitlist" className="marketing-section marketing-muted">
        <h2 className="marketing-section-title">
          {landingCopy.waitlist.title}
        </h2>
        <p className="marketing-description">
          {landingCopy.waitlist.description}
        </p>
        <WaitlistForm />
      </section>

      <section aria-labelledby="faq-title" className="marketing-section">
        <h2 id="faq-title" className="marketing-section-title">
          {landingCopy.faq.title}
        </h2>
        <div className="marketing-faq">
          {landingCopy.faq.items.map((item) => (
            <details key={item.question} className="marketing-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="marketing-footer">
        <a href={landingCopy.footer.githubHref}>
          {landingCopy.footer.githubLabel}
        </a>
        <a href={landingCopy.footer.legalHref}>{landingCopy.footer.legal}</a>
        <span>{landingCopy.footer.builtInFrance}</span>
      </footer>
    </main>
  );
}
