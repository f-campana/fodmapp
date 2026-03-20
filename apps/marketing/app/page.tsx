import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fodmapp/ui/accordion";

import { InViewReveal } from "../src/components/InViewReveal";
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
        <section className="marketing-top-shell relative isolate overflow-clip bg-background">
          <div
            className="marketing-ambient marketing-ambient--hero"
            aria-hidden="true"
          >
            <span className="marketing-ambient-shape marketing-ambient-shape--primary" />
            <span className="marketing-ambient-shape marketing-ambient-shape--secondary" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[64rem] px-5">
            <section className="pt-24 pb-12 max-[35.999rem]:pt-14 max-[35.999rem]:pb-10">
              <p className="marketing-hero-eyebrow m-0 text-[0.8125rem] font-semibold tracking-[0.08em] text-primary uppercase">
                {landingCopy.hero.eyebrow}
              </p>
              <h1 className="marketing-hero-title mt-3 max-w-[20em] font-serif text-[clamp(2.5rem,5.5vw,3.75rem)] leading-[1.08] font-semibold text-foreground">
                {landingCopy.hero.title}
              </h1>
              <p className="mt-3 max-w-[36rem] text-[1.1875rem] leading-[1.55] text-balance text-muted-foreground">
                <span className="marketing-hero-summary block">
                  {landingCopy.hero.description}
                </span>
                <span className="marketing-hero-support mt-2 block">
                  {landingCopy.hero.descriptionSupport}
                </span>
              </p>
              <a
                className="marketing-cta marketing-hero-cta mt-6 inline-flex w-fit items-center gap-2 rounded-sm bg-primary px-8 py-3.5 font-semibold text-primary-foreground no-underline"
                href="#waitlist"
              >
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

            <section
              className="pt-3 pb-10"
              aria-label="Garanties"
              data-motion-section="trust-strip"
            >
              <ul className="grid list-none gap-4 p-0 md:grid-cols-3 md:gap-x-6 md:gap-y-4">
                <li className="marketing-trust-item grid grid-cols-[auto_1fr] items-start gap-2.5 text-sm leading-[1.45] text-muted-foreground">
                  <span
                    className="mt-1.5 size-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Données issues de CIQUAL, la base nutritionnelle publique
                    française
                  </span>
                </li>
                <li className="marketing-trust-item grid grid-cols-[auto_1fr] items-start gap-2.5 text-sm leading-[1.45] text-muted-foreground">
                  <span
                    className="mt-1.5 size-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>
                    Substitutions fondées sur la littérature scientifique
                  </span>
                </li>
                <li className="marketing-trust-item grid grid-cols-[auto_1fr] items-start gap-2.5 text-sm leading-[1.45] text-muted-foreground">
                  <span
                    className="mt-1.5 size-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  <span>Code source ouvert et méthode transparente</span>
                </li>
              </ul>
            </section>
          </div>
        </section>

        {showApproach || showTrust ? (
          <div className="mx-auto grid w-full max-w-[64rem] gap-6 px-5 py-10">
            {showApproach ? (
              <section
                aria-labelledby="approach-title"
                className="rounded-lg border border-border-subtle bg-surface p-5 md:p-8"
                data-motion-reveal="approach"
                data-reveal-target="true"
              >
                <h2
                  id="approach-title"
                  className="font-serif text-[1.875rem] leading-[1.15] font-bold"
                >
                  {landingCopy.approach.title}
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {landingCopy.approach.pillars.map((pillar) => (
                    <article
                      key={pillar.title}
                      className="rounded-md border border-border-subtle bg-surface p-3"
                    >
                      <h3 className="mb-2 font-semibold text-foreground">
                        {pillar.title}
                      </h3>
                      <p className="m-0 text-base leading-6 text-muted-foreground">
                        {pillar.description}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            {showTrust ? (
              <section
                aria-labelledby="trust-title"
                className="rounded-lg border border-border-subtle bg-muted p-5 md:p-8"
                data-motion-reveal="trust"
                data-reveal-target="true"
              >
                <h2
                  id="trust-title"
                  className="font-serif text-[1.875rem] leading-[1.15] font-bold"
                >
                  {landingCopy.trust.title}
                </h2>
                <ul
                  className="mt-4 grid list-none gap-3 p-0"
                  aria-label={landingCopy.trust.title}
                >
                  {landingCopy.trust.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="grid grid-cols-[0.35rem_1fr] items-start gap-2 rounded-md border border-border-subtle bg-surface p-3 font-semibold text-foreground"
                    >
                      <span
                        className="mt-2 size-[0.35rem] rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 max-w-none text-base leading-7 text-muted-foreground">
                  {landingCopy.trust.footer}
                </p>
              </section>
            ) : null}
          </div>
        ) : null}

        <section
          id="waitlist"
          className="relative isolate overflow-clip border-y border-border-subtle bg-surface py-16"
          data-motion-section="waitlist"
        >
          <div
            className="marketing-ambient marketing-ambient--waitlist"
            aria-hidden="true"
          >
            <span className="marketing-ambient-shape marketing-ambient-shape--primary" />
            <span className="marketing-ambient-shape marketing-ambient-shape--secondary" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[64rem] px-5">
            <InViewReveal
              className="marketing-reveal mx-auto max-w-[32rem] text-center"
              threshold={0.2}
              data-reveal="waitlist"
              data-motion-reveal="waitlist"
              data-reveal-target="true"
            >
              <h2 className="font-serif text-[1.875rem] leading-[1.15] font-bold">
                {landingCopy.waitlist.title}
              </h2>
              <p className="mx-auto mt-3 max-w-[36rem] text-[1.1875rem] leading-[1.55] text-balance text-muted-foreground">
                {landingCopy.waitlist.description}
              </p>
              <WaitlistForm />
            </InViewReveal>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[64rem] px-5 py-16 pb-8">
          <section
            aria-labelledby="faq-title"
            className="marketing-faq-section"
          >
            <InViewReveal
              className="marketing-reveal"
              threshold={0.18}
              data-reveal="faq"
              data-motion-reveal="faq"
              data-reveal-target="true"
            >
              <h2
                id="faq-title"
                className="mb-5 font-serif text-[1.625rem] font-bold"
              >
                {landingCopy.faq.title}
              </h2>
              <Accordion type="single" collapsible defaultValue="faq-0">
                {landingCopy.faq.items.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${String(index)}`}
                  >
                    <AccordionTrigger
                      className="marketing-faq-trigger"
                      data-motion-item="faq-trigger"
                    >
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </InViewReveal>
          </section>
        </div>
      </main>

      <footer className="marketing-footer-band mt-12 bg-surface-inverse py-10 text-foreground-inverse">
        <div className="mx-auto grid w-full max-w-[64rem] gap-6 px-5">
          <div className="flex flex-wrap items-center justify-between gap-4 max-[35.999rem]:flex-col max-[35.999rem]:items-start">
            <span className="font-serif text-[1.375rem] font-black">
              FODMAPP
            </span>
            <nav
              className="flex gap-6 text-sm"
              aria-label="Liens du pied de page"
            >
              <a
                className="text-[inherit] no-underline hover:underline focus-visible:underline"
                href={landingCopy.footer.githubHref}
              >
                {landingCopy.footer.githubLabel}
              </a>
              <a
                className="text-[inherit] no-underline hover:underline focus-visible:underline"
                href={landingCopy.footer.legalHref}
              >
                {landingCopy.footer.legal}
              </a>
            </nav>
          </div>
          <hr className="m-0 border-0 border-t border-white/12" />
          <div className="flex flex-wrap justify-between gap-2 text-[0.8125rem] opacity-50 max-[35.999rem]:flex-col max-[35.999rem]:items-start">
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
