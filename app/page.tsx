"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CategoryStrip } from "@/components/CategoryStrip";
import { HeroConsole } from "@/components/HeroConsole";
import { HomeTopTen } from "@/components/HomeTopTen";
import { Rail } from "@/components/Rail";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { HomePayload } from "@/types/nino";

export default function HomePage() {
  const [home, setHome] = useState<HomePayload | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const profileId = useMemo(() => getProfileId(), []);

  function load() {
    setLoading(true);
    setError(null);
    api.home(profileId).then(setHome).catch((err) => setError(err instanceof Error ? err : new Error("Impossible de charger les programmes."))).finally(() => setLoading(false));
  }

  useEffect(load, [profileId]);

  const topRail = home?.rails.find((rail) => rail.id === "top10");
  const topTen = topRail?.items ?? [];
  const visibleRails = home?.rails.filter((rail) => rail.id !== "top10" && (rail.items.length > 0 || rail.id === "latest")) ?? [];

  return (
    <AppShell>
      {loading ? <LoadingState label="Synchronisation du catalogue" /> : null}
      {error ? <ErrorState message={error.message} error={error} onRetry={load} /> : null}
      {!loading && !error && home && !home.hero && home.rails.every((rail) => rail.items.length === 0) ? <EmptyState title="Les programmes arrivent bientôt." message="Votre catalogue est encore vide. Les contenus disponibles apparaîtront ici." /> : null}
      {!loading && !error && home && (home.hero || home.rails.some((rail) => rail.items.length > 0)) ? (
        <div className="homeStack">
          <HeroConsole item={home.hero} />
          <div className="homeCatalog">
            <HomeTopTen items={topTen} title={topRail?.title} />
            <CategoryStrip rails={home.rails} />
            {visibleRails.map((rail) => <Rail rail={rail} key={rail.id} />)}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
