import Link from "next/link";

import { SignIn } from "@clerk/nextjs";

import { getClerkBootstrapStatus } from "../../../lib/clerk";

export default function SignInPage() {
  const auth = getClerkBootstrapStatus();

  if (!auth.fullyConfigured) {
    return (
      <main className="app-shell">
        <section className="app-shell__section">
          <h1 className="text-3xl font-semibold tracking-tight">
            Se connecter
          </h1>
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
      <section className="app-shell__section">
        <h1 className="text-3xl font-semibold tracking-tight">Se connecter</h1>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </section>
    </main>
  );
}
