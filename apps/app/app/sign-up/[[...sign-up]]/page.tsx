import Link from "next/link";

import { SignUp } from "@clerk/nextjs";

import { getClerkBootstrapStatus } from "../../../lib/clerk";

export default function SignUpPage() {
  const auth = getClerkBootstrapStatus();

  if (!auth.fullyConfigured) {
    return (
      <main className="app-shell">
        <section className="app-shell__header">
          <div className="app-shell__meta">
            <p className="app-shell__eyebrow">Accès</p>
            <p className="app-shell__status">Espace personnel FODMAPP</p>
          </div>
          <h1 className="app-shell__title">Créer un compte</h1>
          <p className="app-shell__description">
            Préparez un espace personnel pour retrouver votre suivi et vos
            droits d’export.
          </p>
        </section>
        <section className="app-shell__section">
          <h2 className="app-shell__section-title">Créer un compte</h2>
          <p className="app-shell__text">Inscription Clerk non disponible.</p>
          <p className="app-shell__text">
            Cette page s’active uniquement quand les clés Clerk runtime sont
            configurées.
          </p>
          <p className="app-shell__text">
            <Link href="/">Retour à l’accueil</Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="app-shell__header">
        <div className="app-shell__meta">
          <p className="app-shell__eyebrow">Accès</p>
          <p className="app-shell__status">Espace personnel FODMAPP</p>
        </div>
        <h1 className="app-shell__title">Créer un compte</h1>
        <p className="app-shell__description">
          Préparez un espace personnel pour retrouver votre suivi et vos droits
          d’export.
        </p>
      </section>
      <section className="app-shell__section">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </section>
    </main>
  );
}
