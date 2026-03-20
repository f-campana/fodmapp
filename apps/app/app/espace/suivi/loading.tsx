export default function EspaceSuiviLoading() {
  return (
    <main className="app-shell" aria-busy="true">
      <div className="app-shell__meta">
        <p className="app-shell__eyebrow">Espace / Suivi</p>
      </div>
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Chargement du suivi…
        </h1>
        <p className="app-shell__text">
          Chargement de l’historique, des formulaires et du résumé hebdomadaire.
        </p>
      </section>
    </main>
  );
}
