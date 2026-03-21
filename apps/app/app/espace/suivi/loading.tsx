export default function EspaceSuiviLoading() {
  return (
    <main className="app-shell" aria-busy="true">
      <section className="app-shell__header">
        <div className="app-shell__meta">
          <p className="app-shell__eyebrow">Espace / Suivi</p>
          <p className="app-shell__status">Chargement en cours</p>
        </div>
        <h1 className="app-shell__title">Chargement du suivi…</h1>
        <p className="app-shell__description">
          Chargement de l’historique, des formulaires et du résumé hebdomadaire.
        </p>
      </section>
    </main>
  );
}
