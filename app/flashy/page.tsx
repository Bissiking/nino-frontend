"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Play, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { MediaItem } from "@/types/nino";

export default function FlashyPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const profileId = useMemo(() => getProfileId(), []);

  function load() {
    setLoading(true);
    setError(null);
    api.media("short", profileId).then(setItems).catch((err) => setError(err.message ?? "Flashy est indisponible.")).finally(() => setLoading(false));
  }

  useEffect(load, [profileId]);

  return (
    <AppShell>
      {loading ? <LoadingState label="Chargement de Flashy" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <section className="flashySurface" aria-label="Flashy — vidéos courtes">
          <header className="flashyHeader"><span><Zap size={22} fill="currentColor" aria-hidden="true" /><h1>Flashy</h1></span><p>Faites défiler pour découvrir</p></header>
          {items.length ? (
            <div className="flashyFeed">
              {items.map((item) => (
                <article className="flashyItem" key={item.id}>
                  <div className="flashyVideo">
                    {item.poster_url ? <Image src={item.poster_url} alt="" fill sizes="(max-width: 700px) 100vw, 430px" className="flashyImage" /> : null}
                    <div className="flashyScrim" />
                    <div className="flashyCopy">
                      <span>{item.genres.join(" · ")}</span><h2>{item.title}</h2><p>{item.synopsis}</p>
                      <div><Link className="primaryButton" href={`/watch/${item.id}`}><Play size={19} fill="currentColor" aria-hidden="true" />Regarder</Link><Link className="flashyInfo" href={`/watch/${item.id}`} aria-label={`Informations sur ${item.title}`}><Info size={22} aria-hidden="true" /></Link></div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : <div className="flashyEmpty"><Zap size={34} aria-hidden="true" /><h2>Flashy arrive bientôt</h2><p>Les prochaines vidéos courtes apparaîtront ici.</p></div>}
        </section>
      ) : null}
    </AppShell>
  );
}
