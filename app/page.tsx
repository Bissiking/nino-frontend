"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeroConsole } from "@/components/HeroConsole";
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
    api
      .home(profileId)
      .then(setHome)
      .catch((err) => setError(err.message ?? "Connexion au backend impossible."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [profileId]);

  return (
    <AppShell>
      {loading ? <LoadingState label="Synchronisation du catalogue" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && home ? (
        <div className="homeStack">
          <HeroConsole item={home.hero} />
          {home.rails.map((rail) => (
            <Rail rail={rail} key={rail.id} />
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}

