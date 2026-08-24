"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Film,
  ListVideo
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

function formatPublishDate(value: string | null, compact = false) {
  if (!value) return "Sans date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date invalide";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    ...(compact ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function sourceLabel(item: MediaItem) {
  if (item.source_kind === "hls") return "HLS";
  if (item.source_kind === "file") return "Fichier";
  return "Sans source";
}

function laneFor(item: MediaItem, now: number) {
  const publication = item.publish_at ? new Date(item.publish_at).getTime() : 0;
  if (publication > now) return "scheduled";
  if (item.visibility === "public" && item.is_available && Boolean(item.source_kind)) return "published";
  return "prepare";
}

function MediaArtwork({ item }: { item: MediaItem }) {
  const posterUrl = api.assetUrl(item.poster_url);
  const style = posterUrl ? { backgroundImage: `url(${JSON.stringify(posterUrl)})` } : undefined;
  return <span className={`studioControlArtwork ${item.kind === "short" ? "isPortrait" : ""}`} style={style}>{posterUrl ? null : <Film size={18} aria-hidden="true" />}</span>;
}

function EditorialItem({ item, now }: { item: MediaItem; now: number }) {
  const lane = laneFor(item, now);
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
          <span className="studioQueueDate">{lane === "scheduled" ? formatPublishDate(item.publish_at, true) : item.is_available ? "Disponible" : "Indisponible"}</span>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </li>
  );
}

export default function SchedulePage() {
  const { media, loading, error, accessDenied, refresh } = useStudioData();
  const [now] = useState(() => Date.now());

  const scheduled = useMemo(() =>
    media.filter((item) => item.publish_at && new Date(item.publish_at).getTime() > now)
      .sort((a, b) => new Date(a.publish_at!).getTime() - new Date(b.publish_at!).getTime()),
    [media, now]
  );

  const withoutDate = useMemo(() =>
    media.filter((item) => item.visibility === "draft" && !item.publish_at),
    [media]
  );

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
                <div><h1>Programmation</h1><p>Contrôlez les prochaines diffusions et les brouillons encore sans date.</p></div>
              </header>
              <div className="studioScheduleGrid">
                <section className="studioSchedulePanel">
                  <header>
                    <div><h2>Prochaines sorties</h2><p>{scheduled.length} contenu{scheduled.length > 1 ? "s" : ""} planifié{scheduled.length > 1 ? "s" : ""}</p></div>
                    <CalendarClock size={20} aria-hidden="true" />
                  </header>
                  {scheduled.length ? (
                    <ul>{scheduled.map((item) => <EditorialItem key={item.id} item={item} now={now} />)}</ul>
                  ) : (
                    <div className="studioLaneEmpty"><CalendarClock size={23} /><p>Aucune sortie à venir. Définissez une date depuis la fiche d'un média.</p></div>
                  )}
                </section>
                <section className="studioSchedulePanel">
                  <header>
                    <div><h2>Sans date</h2><p>Brouillons à programmer</p></div>
                    <ListVideo size={20} aria-hidden="true" />
                  </header>
                  {withoutDate.length ? (
                    <ul>{withoutDate.map((item) => <EditorialItem key={item.id} item={item} now={now} />)}</ul>
                  ) : (
                    <div className="studioLaneEmpty"><ListVideo size={23} /><p>Tous les brouillons ont une date de publication.</p></div>
                  )}
                </section>
              </div>
            </main>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}