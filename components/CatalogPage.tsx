"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./AppShell";
import { MediaCard } from "./MediaCard";
import { EmptyState, ErrorState, LoadingState } from "./StateBlock";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { MediaItem } from "@/types/nino";

type CatalogPageProps = {
  kind: "movie" | "series" | "live";
  title: string;
  description: string;
  emptyMessage: string;
};

export function CatalogPage({ kind, title, description, emptyMessage }: CatalogPageProps) {
  const profileId = useMemo(() => getProfileId(), []);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const completeCatalog: MediaItem[] = [];
        let page = 1;
        let batch: MediaItem[];
        do {
          batch = await api.media(kind, profileId, 50, page);
          completeCatalog.push(...batch);
          page += 1;
        } while (batch.length === 50);
        setItems(completeCatalog);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Catalogue indisponible.");
      } finally {
        setLoading(false);
      }
    })();
  }

  useEffect(load, [kind, profileId]);

  return (
    <AppShell>
      <section className="catalogSurface" aria-labelledby={`catalog-${kind}-title`}>
        <div className="pageHeading">
          <h1 id={`catalog-${kind}-title`}>{title}</h1>
          <p>{description}</p>
        </div>
        {loading ? <LoadingState label={`Chargement de ${title.toLowerCase()}`} /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && items.length === 0 ? <EmptyState title="Rien à afficher pour l’instant" message={emptyMessage} /> : null}
        {!loading && !error && items.length ? (
          <div className="catalogGrid" aria-label={title}>
            {items.map((item, index) => <MediaCard item={item} key={item.id} priority={index < 6} />)}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
