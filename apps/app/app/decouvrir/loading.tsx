import { Card, CardContent, CardHeader } from "@fodmapp/ui/card";
import { Skeleton } from "@fodmapp/ui/skeleton";

export default function DecouvrirLoading() {
  return (
    <main className="product-page" aria-busy="true">
      <section className="product-page__header">
        <p className="product-page__eyebrow">Découvrir</p>
        <h1 className="product-page__title">
          Chargement des bases alimentaires…
        </h1>
      </section>

      <div className="product-page__stack">
        {[0, 1].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full max-w-xl" />
            </CardHeader>
            <CardContent className="product-page__stack">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
