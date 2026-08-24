"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleOff,
  Film,
  Radio
} from "lucide-react";
import { StudioShell } from "@/components/studio/StudioShell";
import { useStudioData } from "@/hooks/useStudioData";
import { api } from "@/lib/api";
import { VISIBILITY_LABELS } from "@/types/nino";
import type { MediaItem } from "@/types/nino";

function kindLabel(kind: string) {
  const labels: Record<string, string> = { movie: "Vidéo", series: "Série", short: "Flashy", live: "Direct" };
  return labels[kind] ?? kind;
}

function visibilityLabel(visibility: string) {
  return VISIBILITY_LABELS[visibility] ?? visibility;
}

function sourceLabel(item: MediaItem) {
  if (item.source_kind === "hls") return "HLS";
  if (item.source_kind === "file") return "Fichier";
  return "Sans source";
}

function MediaArtwork({ item }: { item: MediaItem }) {
  const posterUrl = api.assetUrl(item.poster_url);
  const style = posterUrl ? { backgroundImage: `url(${JSON.stringify(posterUrl)})` } : undefined;
  return <span className={`studioControlArtwork ${item.kind === "short" ? "isPortrait" : ""}`} style={style}>{posterUrl ? null : <Film size={18} aria-hidden="true" />}</span>;
}

function EditorialItem({ item }: { item: MediaItem }) {
  return (
    <li className="studioQueueItem">
      <Link href={`/studio/media/${encodeURIComponent(item.id)}`} aria-label={`Modifier ${item.title}`}>
        <MediaArtwork item={item} />
        <span className="studioQueueCopy">
          <strong>{item.title}</strong>
          <small>{kindLabel(item.kind)} · {sourceLabel(item)}</small>
        </span>
        <span className="studioQueueMeta">
          <span className={`studioControlStatus is${item.visibility}`}><i aria-hidden="true" />{visibilityLabel(item.visibility)}</span>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function LivePage() {
  const { media, loading, error, accessDenied, refresh } = useStudioData();
  const liveItems = useMemo(() => media.filter((item) => item.kind === "live"), [media]);

  return (
    <StudioShell>
      <div className="studioControlRoom studioModernControlRoom">
        <div className="studioControlMain">
          {loading && <div className="studioControlSkeleton" aria-label="Chargement" aria-busy="true"><span /><span /><span /><span /></div>}
          {error && !loading && <div className="studioAccessDenied"><p role="alert">{error}</p><button type="button" onClick={() => refresh()}>Réessayer</button></div>}
          {accessDenied && !loading && <div className="studioAccessDenied"><h1>Accès administrateur requis</h1><p>Votre compte peut regarder Nino, mais il ne peut pas ouvrir la régie éditoriale.</p></div>}

          {!loading && !error && !accessDenied ? (
            <main className="studioControlContent">
              <header className="studioCommandHeader">
                <div><h1>Direct</h1><p>Surveillez l'entrée live du catalogue et la future connexion OBS.</p></div>
              </header>
              <div className="studioLiveControlRoom">
                <section className="studioLiveMonitor">
                  <header>
                    <span className="studioControlStatus isdraft"><i />Statut non exposé</span>
                    <strong>API live requise</strong>
                  </header>
                  <div>
                    <Radio size={38} aria-hidden="true" />
                    <h2>Signal non vérifiable</h2>
                    <p>L'ingestion OBS n'est pas encore exposée par l'API. Aucun contrôle ne sera simulé ici.</p>
                  </div>
                </section>
                <aside className="studioSystemRail">
                  <header>
                    <h2>Entrées du catalogue</h2>
                    <span>{liveItems.length}</span>
                  </header>
                  {liveItems.length ? (
                    <ul>{liveItems.map((item) => <EditorialItem key={item.id} item={item} />)}</ul>
                  ) : (
                    <div className="studioLaneEmpty"><Radio size={23} /><p>Aucune entrée de type direct.</p></div>
                  )}
                  <div className="studioDependency"><CircleOff size={15} />API d'ingestion live requise</div>
                </aside>
              </div>
            </main>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}