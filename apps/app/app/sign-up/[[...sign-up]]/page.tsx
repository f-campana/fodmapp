import Link from "next/link";

import { SignUp } from "@clerk/nextjs";

import { getClerkBootstrapStatus } from "../../../lib/clerk";

export default function SignUpPage() {
  const auth = getClerkBootstrapStatus();

  if (!auth.fullyConfigured) {
    return (
      <main className="app-shell">
        <section className="app-shell__section">
          <h1 className="text-3xl font-semibold tracking-tight">
            Créer un compte
          </h1>
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
      <section className="app-shell__section">
        <h1 className="text-3xl font-semibold tracking-tight">
          Créer un compte
        </h1>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </section>
    </main>
  );
}
