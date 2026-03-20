export default function MentionsLegalesPage() {
  return (
    <main className="mx-auto w-full max-w-[64rem] px-5 py-16">
      <section className="rounded-lg border border-border-subtle bg-surface p-5 md:p-8">
        <h1 className="font-serif text-[1.875rem] leading-[1.15] font-bold">
          Mentions légales
        </h1>
        <p className="mt-4 max-w-[36rem] text-[1.1875rem] leading-[1.55] text-muted-foreground">
          FODMAPP est un outil personnel en développement, édité par
          l&apos;auteur du projet.
        </p>
        <p className="mt-3 max-w-[36rem] text-[1.1875rem] leading-[1.55] text-muted-foreground">
          Pour toute question relative aux données ou à la conformité, contactez
          : contact@fodmapp.fr.
        </p>
      </section>
    </main>
  );
}
