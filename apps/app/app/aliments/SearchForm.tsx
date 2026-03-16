"use client";

import { type FormEvent, useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button, Input } from "@fodmap/ui/server";

interface SearchFormProps {
  initialQuery: string;
}

export default function SearchForm({ initialQuery }: SearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const trimmedQuery = query.trim();
    if (trimmedQuery.length > 0) {
      params.set("q", trimmedQuery);
    } else {
      params.delete("q");
    }

    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.push(nextUrl);
  }

  return (
    <form className="product-search-form" onSubmit={handleSubmit}>
      <label className="product-search-form__label" htmlFor="food-search">
        Rechercher un aliment
      </label>
      <div className="product-search-form__controls">
        <Input
          autoComplete="off"
          id="food-search"
          name="q"
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Ex. ail, oignon, lentilles"
          type="search"
          value={query}
        />
        <Button type="submit">Rechercher</Button>
      </div>
    </form>
  );
}
