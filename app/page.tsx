"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CategoryStrip } from "@/components/CategoryStrip";
import { HeroConsole } from "@/components/HeroConsole";
import { HomeTopTen } from "@/components/HomeTopTen";
import { Rail } from "@/components/Rail";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { HomePayload } from "@/types/nino";

export default function HomePage() {
  const [home, setHome] = useState<HomePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const profileId = useMemo(() => getProfileId(), []);

  function load() {
    setLoading(true);
    setError(null);
    api.home(profileId).then(setHome).catch((err) => setError(err.message ?? "Connexion au backend impossible.")).finally(() => setLoading(false));
  }

  useEffect(load, [profileId]);

  const topTen = home?.rails.find((rail) => rail.id === "top10")?.items ?? [];
  const visibleRails = home?.rails.filter((rail) => rail.id !== "top10" && (rail.items.length > 0 || rail.id === "latest")) ?? [];

  return (
    <AppShell>
      {loading ? <LoadingState label="Synchronisation du catalogue" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && home ? (
        <div className="homeStack">
          <HeroConsole item={home.hero} />
          <div className="homeCatalog">
            <HomeTopTen items={topTen} />
            <CategoryStrip rails={home.rails} />
            {visibleRails.map((rail) => <Rail rail={rail} key={rail.id} />)}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
