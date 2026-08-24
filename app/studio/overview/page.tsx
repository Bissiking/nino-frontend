"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Film,
  ListVideo,
  RefreshCw
} from "lucide-react";
import { StudioShell } from "@/components/studio/StudioShell";
import { useStudioData } from "@/hooks/useStudioData";
import { api } from "@/lib/api";
import { VISIBILITY_LABELS } from "@/types/nino";
import type { MediaItem } from "@/types/nino";

type EditorialLane = "prepare" | "scheduled" | "published";

const laneCopy: Record<EditorialLane, { label: string; description: string }> = {
  prepare: { label: "À préparer", description: "Brouillons, privés ou indisponibles" },
  scheduled: { label: "Programmé", description: "Une date de diffusion est définie" },
  published: { label: "Publié", description: "Visible et lisible dans Nino" }
};

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

function transcodeLabel(item: MediaItem): { text: string; cls: string } | null {
  if (item.source_kind === "hls" && item.hls_status === "ready") return null;
  switch (item.encoding_status) {
    case "pending":
      return { text: "Transcode en attente", cls: "isPending" };
    case "running":
      return { text: "En transcode", cls: "isRunning" };
    case "failed":
      return { text: "Transcode échoué", cls: "isFailed" };
    default:
      return null;
  }
}

function laneFor(item: MediaItem, now: number): EditorialLane {
  const publication = item.publish_at ? new Date(item.publish_at).getTime() : 0;
  if (publication > now) return "scheduled";
  if (item.visibility === "public" && item.is_available && Boolean(item.source_kind)) return "published";
  return "prepare";
}

function MediaArtwork({ item }: { item: MediaItem }) {
  const posterUrl = api.assetUrl(item.poster_url);
  const style = posterUrl ? { backgroundImage: `url(${JSON.stringify(posterUrl)})` } : undefined;
  return <span className={`studioControlArtwork ${item.kind === "short" ? "isPortrait" : ""}`} style={style}>{posterUrl ? null : item.kind === "short" ? <span>⚡</span> : <Film size={18} aria-hidden="true" />}</span>;
}

function EditorialItem({ item, now }: { item: MediaItem; now: number }) {
  const lane = laneFor(item, now);
  return (
    <li className="studioQueueItem">
      <Link href={`/studio/media/${encodeURIComponent(item.id)}`} aria-label={`Modifier ${item.title}`}>
        <MediaArtwork item={item} />
        <span className="studioQueueCopy">
          <strong>{item.title}</strong>
          <small>{kindLabel(item.kind)} · {sourceLabel(item)}{transcodeLabel(item) ? <span className={`studioTranscodeBadge ${transcodeLabel(item)!.cls}`}>{transcodeLabel(item)!.text}</span> : null}</small>
        </span>
        <span className="studioQueueMeta"><span className={`studioControlStatus is${item.visibility}`}><i aria-hidden="true" />{visibilityLabel(item.visibility)}</span><span className="studioQueueDate">{lane === "scheduled" ? formatPublishDate(item.publish_at, true) : item.is_available ? "Disponible" : "Indisponible"}</span></span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    </li>
  );
}

function EditorialBoard({ items, now }: { items: MediaItem[]; now: number }) {
  const [activeLane, setActiveLane] = useState<EditorialLane>("prepare");
  const lanes = useMemo(() => ({
    prepare: items.filter((item) => laneFor(item, now) === "prepare"),
    scheduled: items.filter((item) => laneFor(item, now) === "scheduled").sort((a, b) => new Date(a.publish_at!).getTime() - new Date(b.publish_at!).getTime()),
    published: items.filter((item) => laneFor(item, now) === "published")
  }), [items, now]);

  return (
    <section className="studioBoard" aria-label="Cycle de publication">
      <div className="studioLaneSwitcher" role="tablist" aria-label="Files éditoriales">
        {(Object.keys(lanes) as EditorialLane[]).map((lane) => <button key={lane} type="button" role="tab" aria-selected={activeLane === lane} className={activeLane === lane ? "isActive" : undefined} onClick={() => setActiveLane(lane)}>{laneCopy[lane].label}<span>{lanes[lane].length}</span></button>)}
      </div>
      <div className="studioBoardLanes">
        {(Object.keys(lanes) as EditorialLane[]).map((lane) => (
          <section key={lane} className={`studioLane ${activeLane === lane ? "isActiveLane" : ""}`} aria-labelledby={`studio-lane-${lane}`}>
            <header>
              <div><h2 id={`studio-lane-${lane}`}>{laneCopy[lane].label}</h2><p>{laneCopy[lane].description}</p></div>
              <strong>{lanes[lane].length}</strong>
            </header>
            {lanes[lane].length ? <ul>{lanes[lane].map((item) => <EditorialItem key={item.id} item={item} now={now} />)}</ul> : <div className="studioLaneEmpty"><ListVideo size={23} aria-hidden="true" /><p>{lane === "prepare" ? "Tout est prêt pour la diffusion." : lane === "scheduled" ? "Aucune sortie n'est programmée." : "Aucun contenu publié dans cette sélection."}</p></div>}
          </section>
        ))}
      </div>
    </section>
  );
}

export default function OverviewPage() {
  const { media, stats, loading, error, accessDenied, refresh } = useStudioData();
  const [refreshing, setRefreshing] = useState(false);
  const [now] = useState(() => Date.now());

  const prepared = media.filter((item) => laneFor(item, now) === "prepare").length;
  const scheduled = media.filter((item) => laneFor(item, now) === "scheduled").length;
  const published = media.filter((item) => laneFor(item, now) === "published").length;

  function handleRefresh() {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }

  return (
    <StudioShell>
      <div className="studioControlRoom studioModernControlRoom">
        <div className="studioControlMain">
          <header className="studioTopline">
            <dl>
              <div><span className="studioMetricIcon isMedia"><Film size={21} /></span><span><dt>Médias</dt><dd>{stats?.media ?? 0}</dd><small>Tous vos contenus</small></span></div>
              <div><span className="studioMetricIcon isPrepare"><Clock3 size={21} /></span><span><dt>À préparer</dt><dd>{prepared}</dd><small>Brouillons en cours</small></span></div>
              <div><span className="studioMetricIcon isSchedule"><CalendarClock size={21} /></span><span><dt>Programmés</dt><dd>{scheduled}</dd><small>Planifiés à venir</small></span></div>
              <div><span className="studioMetricIcon isPublished"><CheckCircle2 size={21} /></span><span><dt>Publiés</dt><dd>{published}</dd><small>Contenus en ligne</small></span></div>
            </dl>
            <button className="studioRefreshButton" type="button" onClick={handleRefresh} disabled={refreshing} aria-label="Rafraîchir le Studio"><RefreshCw className={refreshing ? "spin" : undefined} size={18} />{refreshing ? "Actualisation" : "À jour"}</button>
          </header>

          {loading && <div className="studioControlSkeleton" aria-label="Chargement" aria-busy="true"><span /><span /><span /><span /></div>}
          {error && !loading && <div className="studioAccessDenied"><p role="alert">{error}</p><button type="button" onClick={() => refresh()}>Réessayer</button></div>}
          {accessDenied && !loading && <div className="studioAccessDenied"><h1>Accès administrateur requis</h1><p>Votre compte peut regarder Nino, mais il ne peut pas ouvrir la régie éditoriale.</p></div>}

          {!loading && !error && !accessDenied && stats ? (
            <main className="studioControlContent">
              <div className="studioCommandHeader">
                <div><h1>Tableau éditorial</h1><p>Pilotez la préparation, la programmation et la mise en ligne.</p></div>
              </div>
              <EditorialBoard items={media} now={now} />
            </main>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}