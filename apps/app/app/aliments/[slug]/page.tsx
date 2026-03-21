import Link from "next/link";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@fodmapp/ui/alert";
import { Badge } from "@fodmapp/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@fodmapp/ui/card";
import { ScoreBar } from "@fodmapp/ui/score-bar";

import { getFoodDetail, getFoodRollup, getSwaps } from "../../../lib/api";
import { formatFoodLevel } from "../../../lib/format";

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AlimentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [foodResult, rollupResult, swapsResult] = await Promise.all([
    getFoodDetail(slug),
    getFoodRollup(slug),
    getSwaps(slug),
  ]);

  if (!foodResult.ok && foodResult.status === 404) {
    notFound();
  }

  if (!foodResult.ok) {
    return (
      <main className="product-page">
        <Alert variant="destructive">
          <AlertTitle>Fiche indisponible</AlertTitle>
          <AlertDescription>
            Impossible de charger cet aliment pour le moment.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  const food = foodResult.data;

  return (
    <main className="product-page">
      <section className="product-page__header">
        <p className="product-page__eyebrow">Aliment</p>
        <h1 className="product-page__title">{food.canonical_name_fr}</h1>
        <p className="product-page__description">
          Consulte le niveau global de l&apos;aliment et les substitutions
          actives disponibles aujourd&apos;hui.
        </p>
      </section>

      <nav aria-label="Raccourcis aliment">
        <ul className="product-page__link-list">
          <li>
            <Link className="product-page__link-pill" href="/aliments">
              Retour à la recherche
            </Link>
          </li>
          <li>
            <Link className="product-page__link-pill" href="/decouvrir">
              Voir les bases compatibles
            </Link>
          </li>
        </ul>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Identité</CardTitle>
          <CardDescription>{food.food_slug}</CardDescription>
        </CardHeader>
      </Card>

      {rollupResult.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Profil global</CardTitle>
            <CardDescription>
              Dernier calcul du rollup:{" "}
              {formatTimestamp(rollupResult.data.rollup_computed_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="product-page__stack">
            <div className="product-page__inline">
              <Badge variant="outline">
                Niveau: {formatFoodLevel(rollupResult.data.overall_level)}
              </Badge>
              <Badge variant="outline">
                Couverture: {rollupResult.data.known_subtypes_count}/6
              </Badge>
            </div>
            {rollupResult.data.driver_subtype ? (
              <p className="product-page__note">
                Sous-type conducteur:{" "}
                {rollupResult.data.driver_subtype.toUpperCase()}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Données incomplètes</AlertTitle>
          <AlertDescription>
            Le rollup de cet aliment est indisponible. La fiche d&apos;identité
            et les substitutions restent consultables.
          </AlertDescription>
        </Alert>
      )}

      {!swapsResult.ok ? (
        <Alert variant="destructive">
          <AlertTitle>Substitutions indisponibles</AlertTitle>
          <AlertDescription>
            Impossible de charger les substitutions pour cet aliment.
          </AlertDescription>
        </Alert>
      ) : swapsResult.data.total === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pas de substitut documenté pour le moment</CardTitle>
            <CardDescription>
              Cet aliment n&apos;a pas encore de règle active dans le moteur de
              substitutions.
            </CardDescription>
          </CardHeader>
          <CardContent className="product-page__stack">
            <p className="product-page__note">
              Explore les bases simples déjà vérifiées pour préparer une option
              de repli.
            </p>
            <div>
              <Link className="product-page__link-pill" href="/decouvrir">
                Explorer les bases alimentaires
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <section className="product-page__stack">
          <h2 className="product-page__section-title">Substitutions actives</h2>
          {swapsResult.data.items.map((item) => (
            <Card key={item.to_food_slug}>
              <CardHeader>
                <CardTitle>
                  {item.to_food_name_fr ?? item.to_food_slug}
                </CardTitle>
                <CardDescription>{item.instruction_fr}</CardDescription>
              </CardHeader>
              <CardContent className="product-page__stack">
                <div className="product-page__inline">
                  <Badge variant="outline">
                    Niveau cible: {formatFoodLevel(item.to_overall_level)}
                  </Badge>
                  {item.coverage_ratio < 0.5 ? (
                    <Badge variant="secondary">Données partielles</Badge>
                  ) : null}
                  {item.to_overall_level === "unknown" ? (
                    <Badge variant="secondary">Niveau non vérifié</Badge>
                  ) : null}
                </div>
                <ScoreBar
                  label={`Amélioration FODMAP: ${Math.round(item.fodmap_safety_score * 100)}%`}
                  value={item.fodmap_safety_score}
                />
                {item.from_burden_ratio !== null &&
                item.to_burden_ratio !== null ? (
                  <p className="product-page__note">
                    Charge relative: {item.from_burden_ratio.toFixed(2)} →{" "}
                    {item.to_burden_ratio.toFixed(2)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
