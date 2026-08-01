"use client";

import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Activity, Database, Film, ScanLine, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";

type Stats = {
  users: number;
  libraries: number;
  media: number;
  transcode_jobs: number;
  scan_jobs: number;
};

type StatTile = [string, number, LucideIcon];

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    api.adminStats().then(setStats).catch((err) => setError(err.message ?? "Admin indisponible.")).finally(() => setLoading(false));
  }

  useEffect(load, []);

  const tiles: StatTile[] = stats
    ? [
        ["Utilisateurs", stats.users, Users],
        ["Bibliotheques", stats.libraries, Database],
        ["Medias", stats.media, Film],
        ["Scans", stats.scan_jobs, ScanLine],
        ["Transcodages", stats.transcode_jobs, Activity]
      ]
    : [];

  return (
    <AppShell>
      <section className="adminSurface">
        <h1>Administration</h1>
        {loading ? <LoadingState /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        <div className="adminGrid">
          {tiles.map(([label, value, Icon]) => (
            <article className="statTile" key={String(label)}>
              <Icon size={26} aria-hidden="true" />
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
