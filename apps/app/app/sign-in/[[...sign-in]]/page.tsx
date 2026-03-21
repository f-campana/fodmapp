import Link from "next/link";

import { SignIn } from "@clerk/nextjs";

import { getClerkBootstrapStatus } from "../../../lib/clerk";

export default function SignInPage() {
  const auth = getClerkBootstrapStatus();

  if (!auth.fullyConfigured) {
    return (
      <main className="app-shell">
        <section className="app-shell__header">
          <div className="app-shell__meta">
            <p className="app-shell__eyebrow">Accès</p>
            <p className="app-shell__status">Espace personnel FODMAPP</p>
          </div>
          <h1 className="app-shell__title">Se connecter</h1>
          <p className="app-shell__description">
            Accédez à vos droits, exports et suivi descriptif depuis un espace
            dédié.
          </p>
        </section>
        <section className="app-shell__section">
          <h2 className="app-shell__section-title">Se connecter</h2>
          <p className="app-shell__text">Connexion Clerk non disponible.</p>
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
        <h1 className="app-shell__title">Se connecter</h1>
        <p className="app-shell__description">
          Accédez à vos droits, exports et suivi descriptif depuis un espace
          dédié.
        </p>
      </section>
      <section className="app-shell__section">
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </section>
    </main>
  );
}
