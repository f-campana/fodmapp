import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@fodmapp/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui/card";

import { getSafeHarbors } from "../../lib/api";

function hasRenderableMeta(meta: {
  attribution?: string;
  no_endorsement_notice?: string;
}): meta is { attribution: string; no_endorsement_notice: string } {
  return Boolean(meta.attribution && meta.no_endorsement_notice);
}

export default async function DecouvrirPage() {
  const safeHarbors = await getSafeHarbors();

  return (
    <main className="product-page">
      <section className="product-page__header">
        <p className="product-page__eyebrow">Découvrir</p>
        <h1 className="product-page__title">Bases alimentaires compatibles</h1>
        <p className="product-page__description">
          Quand un aliment n&apos;a pas encore de substitut documenté, cette
          page propose des bases simples pour continuer à cuisiner sans impasse.
        </p>
      </section>

      {!safeHarbors.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Impossible de charger les bases alimentaires</AlertTitle>
          <AlertDescription>
            Réessaie plus tard ou retourne à la recherche d&apos;aliments.
          </AlertDescription>
        </Alert>
      ) : !hasRenderableMeta(safeHarbors.data.meta) ? (
        <Alert variant="destructive">
          <AlertTitle>Métadonnées indisponibles</AlertTitle>
          <AlertDescription>
            Les informations d&apos;attribution sont requises pour afficher
            cette page.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {safeHarbors.data.cohorts.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucune base disponible pour le moment</CardTitle>
                <CardDescription>
                  Les cohortes approuvées apparaîtront ici dès qu&apos;elles
                  seront alimentées.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Link href="/aliments">Retourner à la recherche</Link>
              </CardFooter>
            </Card>
          ) : (
            <div className="product-page__stack">
              {safeHarbors.data.cohorts.map((cohort) => (
                <Card key={cohort.cohort_code}>
                  <CardHeader>
                    <CardTitle>{cohort.label_fr}</CardTitle>
                    <CardDescription>{cohort.rationale_fr}</CardDescription>
                  </CardHeader>
                  <CardContent className="product-page__stack">
                    <ul className="product-page__link-list">
                      {cohort.items.map((item) => (
                        <li key={item.food_slug}>
                          <Link
                            className="product-page__link-pill"
                            href={`/aliments/${item.food_slug}`}
                          >
                            {item.canonical_name_fr}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <p className="product-page__note">{cohort.caveat_fr}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <footer className="product-page__footer">
            <p>{safeHarbors.data.meta.attribution}</p>
            <p>{safeHarbors.data.meta.no_endorsement_notice}</p>
          </footer>
        </>
      )}
    </main>
  );
}
