import { Card, CardContent, CardHeader, Skeleton } from "@fodmapp/ui/server";

export default function FoodsLoading() {
  return (
    <main className="product-page" aria-busy="true">
      <section className="product-page__header">
        <p className="product-page__eyebrow">Aliments</p>
        <h1 className="product-page__title">Chargement de la recherche…</h1>
      </section>

      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full" />
        </CardHeader>
      </Card>

      <div className="product-page__stack">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full max-w-2xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
