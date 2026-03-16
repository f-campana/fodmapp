import Link from "next/link";

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fodmap/ui/server";

import { searchFoods } from "../../lib/api";
import SearchForm from "./SearchForm";

function normalizeSearchQuery(raw: string | string[] | undefined): string {
  return Array.isArray(raw) ? (raw[0]?.trim() ?? "") : (raw?.trim() ?? "");
}

function levelLabel(level?: string | null): string {
  switch (level) {
    case "none":
      return "Aucun";
    case "low":
      return "Faible";
    case "moderate":
      return "Modéré";
    case "high":
      return "Élevé";
    case "unknown":
      return "Inconnu";
    default:
      return "Non calculé";
  }
}

export default async function AlimentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = normalizeSearchQuery(resolvedSearchParams?.q);
  const results = query.length > 0 ? await searchFoods(query, 12) : null;

  return (
    <main className="product-page">
      <section className="product-page__header">
        <p className="product-page__eyebrow">Aliments</p>
        <h1 className="product-page__title">Trouver un aliment</h1>
        <p className="product-page__description">
          Recherche un aliment de la base pour consulter son niveau FODMAP et
          les substitutions actives disponibles aujourd&apos;hui.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recherche</CardTitle>
          <CardDescription>
            L&apos;état de la page est porté par l&apos;URL pour partager un
            résultat précis et garder un historique de navigation simple.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SearchForm initialQuery={query} />
        </CardContent>
      </Card>

      {query.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Commence par un aliment connu</CardTitle>
            <CardDescription>
              Essaie par exemple ail, oignon, champignons ou lentilles.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : results && !results.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Recherche indisponible</AlertTitle>
          <AlertDescription>
            Impossible de charger la liste des aliments pour le moment.
          </AlertDescription>
        </Alert>
      ) : results && results.ok && results.data.total === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun aliment trouvé pour « {query} »</CardTitle>
            <CardDescription>
              Vérifie l&apos;orthographe ou explore les bases alimentaires déjà
              compatibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/decouvrir">Ouvrir les bases alimentaires</Link>
          </CardContent>
        </Card>
      ) : results && results.ok ? (
        <section className="product-page__stack">
          <p className="product-page__note">
            {results.data.total} résultat{results.data.total > 1 ? "s" : ""}{" "}
            pour « {results.data.query} »
          </p>
          {results.data.items.map((item) => (
            <Card key={item.food_slug}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/aliments/${item.food_slug}`}>
                    {item.canonical_name_fr}
                  </Link>
                </CardTitle>
                <CardDescription>
                  Niveau global: {levelLabel(item.overall_level)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {item.driver_subtype ? (
                  <p className="product-page__note">
                    Sous-type conducteur: {item.driver_subtype.toUpperCase()}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </main>
  );
}
