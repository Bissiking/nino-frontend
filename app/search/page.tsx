"use client";

import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MediaCard } from "@/components/MediaCard";
import { EmptyState, ErrorState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import type { MediaItem } from "@/types/nino";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

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
        <h1>Recherche globale</h1>
        <form className="searchBox" onSubmit={submit}>
          <Search size={22} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, genre, description" aria-label="Recherche" />
          <button className="secondaryButton" type="submit">Chercher</button>
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

