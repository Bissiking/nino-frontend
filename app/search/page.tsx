"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import type { MediaItem } from "@/types/nino";

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!initialQuery) return;
    setSearched(true);
    setError(null);
    api.search(initialQuery).then((result) => setItems(result.items)).catch((err) => setError(err.message ?? "Recherche impossible."));
  }, [initialQuery]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSearched(true);
    try {
      const result = await api.search(query);
      setItems(result.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Recherche impossible.");
    }
  }

  return (
    <AppShell>
      <section className="searchSurface">
        <div className="pageHeading"><span>Explorer Nino</span><h1>Trouvez votre prochain programme</h1></div>
        <form className="searchBox" onSubmit={submit}>
          <Search size={22} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Émission, série, créateur ou catégorie" aria-label="Recherche" autoFocus />
          <button className="primaryButton" type="submit">Rechercher</button>
        </form>
        {error ? <ErrorState message={error} /> : null}
        {!error && searched && items.length === 0 ? <EmptyState title="Aucun resultat" message="Essaie un titre plus court ou relance un scan cote backend." /> : null}
        <div className="resultGrid">
          {items.map((item) => (
            <MediaCard item={item} key={item.id} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppShell><LoadingState label="Ouverture de la recherche" /></AppShell>}>
      <SearchContent />
    </Suspense>
  );
}
