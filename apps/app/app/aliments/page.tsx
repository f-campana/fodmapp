import Link from "next/link";

import { searchCuratedFoods } from "@fodmapp/api-client";
import { Alert, AlertDescription, AlertTitle } from "@fodmapp/ui/alert";
import { Badge } from "@fodmapp/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui/card";

import { getPublicApiClientConfig } from "../../lib/apiClientConfig";
import { getFoodLevelPresentation } from "../../lib/format";
import SearchForm from "./SearchForm";

function normalizeSearchQuery(raw: string | string[] | undefined): string {
  return Array.isArray(raw) ? (raw[0]?.trim() ?? "") : (raw?.trim() ?? "");
}

const QUICK_SEARCHES = ["ail", "oignon", "champignons", "lentilles"] as const;

export default async function AlimentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = normalizeSearchQuery(resolvedSearchParams?.q);
  const results =
    query.length > 0
      ? await searchCuratedFoods(getPublicApiClientConfig(), query, 12)
      : null;
  const pendingRollupCount =
    results && results.ok
      ? results.data.items.filter((item) => item.overallLevel == null).length
      : 0;

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
          <CardContent className="product-page__stack">
            <p className="product-page__note">Suggestions rapides</p>
            <ul className="product-page__link-list">
              {QUICK_SEARCHES.map((suggestion) => (
                <li key={suggestion}>
                  <Link
                    className="product-page__link-pill"
                    href={`/aliments?q=${encodeURIComponent(suggestion)}`}
                  >
                    {suggestion}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
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
          <h2 className="product-page__section-title">Résultats</h2>
          <p className="product-page__note">
            {results.data.total} résultat{results.data.total > 1 ? "s" : ""}{" "}
            pour « {results.data.query} »
          </p>
          {pendingRollupCount > 0 ? (
            <p className="product-page__note">
              {pendingRollupCount} fiche
              {pendingRollupCount > 1 ? "s restent" : " reste"} en attente
              d’analyse détaillée publique.
            </p>
          ) : null}
          {results.data.items.map((item) => (
            <Card key={item.slug}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/aliments/${item.slug}`}>{item.names.fr}</Link>
                </CardTitle>
                <CardDescription>
                  {item.names.en && item.names.en !== item.names.fr
                    ? item.names.en
                    : "Fiche catalogue FODMAPP"}
                </CardDescription>
              </CardHeader>
              <CardContent className="product-page__stack">
                <div className="product-page__inline">
                  <Badge
                    variant={
                      getFoodLevelPresentation(item.overallLevel).badgeVariant
                    }
                  >
                    {getFoodLevelPresentation(item.overallLevel).badgeLabel}
                  </Badge>
                  {item.driverSubtype ? (
                    <Badge variant="outline">
                      Sous-type: {item.driverSubtype.toUpperCase()}
                    </Badge>
                  ) : null}
                </div>
                <p className="product-page__note">
                  {getFoodLevelPresentation(item.overallLevel).supportingText}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      ) : null}
    </main>
  );
}
