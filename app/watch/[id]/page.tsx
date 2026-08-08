"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Captions, Gauge, Play, Radio, RotateCw, Volume2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { MediaItem, StreamDecision } from "@/types/nino";

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [decision, setDecision] = useState<StreamDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    const profileId = getProfileId();
    setLoading(true);
    setError(null);
    Promise.all([api.mediaDetail(params.id, profileId), api.streamDecision(params.id)])
      .then(([nextMedia, nextDecision]) => {
        setMedia(nextMedia);
        setDecision(nextDecision);
      })
      .catch((err) => setError(err.message ?? "Lecture indisponible."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  return (
    <AppShell>
      {loading ? <LoadingState label="Preparation du flux" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && media ? (
        <section className="watchSurface">
          <div className="playerDeck">
            {media.backdrop_url ? <Image src={media.backdrop_url} fill alt="" className="playerBackdrop" /> : null}
            <div className="playhead">
              <button className="playButton" type="button" aria-label="Lire">
                <Play size={34} fill="currentColor" aria-hidden="true" />
              </button>
              <div className="waveform" aria-hidden="true">
                {Array.from({ length: 34 }).map((_, index) => (
                  <span key={index} style={{ height: `${24 + ((index * 17) % 58)}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="watchMeta">
            <div>
              <h1>{media.title}</h1>
              <p>{media.synopsis}</p>
            </div>
            <div className="decisionPanel">
              <span><Radio size={17} aria-hidden="true" /> {decision?.mode ?? "decision"}</span>
              <span><Gauge size={17} aria-hidden="true" /> {decision?.mime_type ?? "video"}</span>
              <span><Captions size={17} aria-hidden="true" /> Sous-titres auto</span>
              <span><Volume2 size={17} aria-hidden="true" /> Audio par profil</span>
            </div>
            <button className="secondaryButton" type="button" onClick={load}>
              <RotateCw size={17} aria-hidden="true" />
              Recalculer le flux
            </button>
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}

