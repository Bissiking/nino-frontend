"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleOff,
  Clapperboard,
  Database,
  Film,
  GripVertical,
  LayoutDashboard,
  ListFilter,
  ListVideo,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Save,
  ScanLine,
  Search,
  Settings,
  Users,
  Zap
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/StateBlock";
import { MediaEditor } from "@/components/studio/MediaEditor";
import { api } from "@/lib/api";
import { VISIBILITY_LABELS } from "@/types/nino";
import type { AdminEpisodes, MediaItem, StorageIndexReport } from "@/types/nino";

type StudioView = "overview" | "videos" | "series" | "flashy" | "schedule" | "live" | "administration";
type EditorialLane = "prepare" | "scheduled" | "published";
type VisibilityFilter = "all" | "public" | "private" | "draft";
type CreateKind = "movie" | "short" | "series";

type Stats = {
  users: number;
  libraries: number;
  media: number;
  transcode_jobs: number;
  scan_jobs: number;
};

type StudioSection = {
  id: StudioView;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

const sections: StudioSection[] = [
  { id: "overview", label: "Tableau éditorial", shortLabel: "Tableau", icon: LayoutDashboard },
  { id: "videos", label: "Bibliothèque", shortLabel: "Vidéos", icon: Film },
  { id: "series", label: "Séries", shortLabel: "Séries", icon: Clapperboard },
  { id: "flashy", label: "Flashy", shortLabel: "Flashy", icon: Zap },
  { id: "schedule", label: "Programmation", shortLabel: "Planning", icon: CalendarClock },
  { id: "live", label: "Direct", shortLabel: "Direct", icon: Radio },
  { id: "administration", label: "Système", shortLabel: "Système", icon: Settings }
];

const laneCopy: Record<EditorialLane, { label: string; description: string }> = {
  prepare: { label: "À préparer", description: "Brouillons, privés ou indisponibles" },
  scheduled: { label: "Programmé", description: "Une date de diffusion est définie" },
  published: { label: "Publié", description: "Visible et lisible dans Nino" }
};

function moveStudioNavFocus(event: KeyboardEvent<HTMLElement>) {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const index = controls.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  const backwards = event.key === "ArrowLeft" || event.key === "ArrowUp";
  event.preventDefault();
  controls[(index + (backwards ? -1 : 1) + controls.length) % controls.length]?.focus();
}

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

function LoadingStudio() {
  return <div className="studioControlSkeleton" aria-label="Chargement de Nino Studio" aria-busy="true"><span /><span /><span /><span /></div>;
}

function MediaArtwork({ item }: { item: MediaItem }) {
  const posterUrl = api.assetUrl(item.poster_url);
  const style = posterUrl ? { backgroundImage: `url(${JSON.stringify(posterUrl)})` } : undefined;
  return <span className={`studioControlArtwork ${item.kind === "short" ? "isPortrait" : ""}`} style={style}>{posterUrl ? null : item.kind === "short" ? <Zap size={18} aria-hidden="true" /> : <Film size={18} aria-hidden="true" />}</span>;
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
      <div className="studioLaneSwitcher" role="tablist" aria-label="Files éditoriales" onKeyDown={moveStudioNavFocus}>
        {(Object.keys(lanes) as EditorialLane[]).map((lane) => <button key={lane} type="button" role="tab" aria-selected={activeLane === lane} className={activeLane === lane ? "isActive" : undefined} onClick={() => setActiveLane(lane)}>{laneCopy[lane].label}<span>{lanes[lane].length}</span></button>)}
      </div>
      <div className="studioBoardLanes">
        {(Object.keys(lanes) as EditorialLane[]).map((lane) => (
          <section key={lane} className={`studioLane ${activeLane === lane ? "isActiveLane" : ""}`} aria-labelledby={`studio-lane-${lane}`}>
            <header>
              <div><h2 id={`studio-lane-${lane}`}>{laneCopy[lane].label}</h2><p>{laneCopy[lane].description}</p></div>
              <strong>{lanes[lane].length}</strong>
            </header>
            {lanes[lane].length ? <ul>{lanes[lane].map((item) => <EditorialItem key={item.id} item={item} now={now} />)}</ul> : <div className="studioLaneEmpty"><ListVideo size={23} aria-hidden="true" /><p>{lane === "prepare" ? "Tout est prêt pour la diffusion." : lane === "scheduled" ? "Aucune sortie n’est programmée." : "Aucun contenu publié dans cette sélection."}</p></div>}
          </section>
        ))}
      </div>
    </section>
  );
}

function StudioWorkspace({ media, now, view, onCreate }: { media: MediaItem[]; now: number; view: StudioView; onCreate: (kind: "movie" | "short") => void }) {
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const scope = useMemo(() => {
    if (view === "series") return media.filter((item) => item.kind === "series");
    if (view === "flashy") return media.filter((item) => item.kind === "short");
    if (view === "videos") return media.filter((item) => !["series", "short", "live"].includes(item.kind));
    return media.filter((item) => item.kind !== "live");
  }, [media, view]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return scope.filter((item) => {
      const visible = visibility === "all" || item.visibility === visibility;
      const matches = !normalized || `${item.title} ${item.synopsis} ${item.genres.join(" ")}`.toLowerCase().includes(normalized);
      return visible && matches;
    });
  }, [query, scope, visibility]);

  const titles: Record<"overview" | "videos" | "series" | "flashy", [string, string]> = {
    overview: ["Tableau éditorial", "Pilotez la préparation, la programmation et la mise en ligne."],
    videos: ["Bibliothèque vidéo", "Retrouvez les programmes longs et leurs états de publication."],
    series: ["Séries", "Suivez les programmes déclarés comme séries dans le catalogue V8."],
    flashy: ["Flashy", "Préparez les formats courts verticaux pour le flux Flashy."]
  };
  const [title, description] = titles[view as keyof typeof titles];

  return (
    <>
      <header className="studioCommandHeader">
        <div><h1>{title}</h1><p>{description}</p></div>
        <div className="studioCommandActions">
          {view !== "series" ? <button className="primaryButton" type="button" onClick={() => onCreate(view === "flashy" ? "short" : "movie")}><Plus size={18} aria-hidden="true" />{view === "flashy" ? "Nouveau Flashy" : "Nouvelle vidéo"}</button> : null}
        </div>
      </header>
      <div className="studioCommandBar">
        <label className="studioControlSearch"><Search size={18} aria-hidden="true" /><span className="srOnly">Rechercher dans le Studio</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un titre, un synopsis ou un genre" /></label>
        <label className="studioControlSelect"><ListFilter size={17} aria-hidden="true" /><span className="srOnly">Filtrer par visibilité</span><select value={visibility} onChange={(event) => setVisibility(event.target.value as VisibilityFilter)}><option value="all">Toutes les visibilités</option><option value="draft">Brouillons</option><option value="private">Privées</option><option value="public">Publiques</option></select></label>
        <span className="studioResultCount">{filtered.length} sur {scope.length}</span>
      </div>
      <EditorialBoard items={filtered} now={now} />
    </>
  );
}

function ScheduleWorkspace({ media, now }: { media: MediaItem[]; now: number }) {
  const scheduled = media.filter((item) => item.publish_at && new Date(item.publish_at).getTime() > now).sort((a, b) => new Date(a.publish_at!).getTime() - new Date(b.publish_at!).getTime());
  const withoutDate = media.filter((item) => item.visibility === "draft" && !item.publish_at);
  return (
    <>
      <header className="studioCommandHeader"><div><h1>Programmation</h1><p>Contrôlez les prochaines diffusions et les brouillons encore sans date.</p></div></header>
      <div className="studioScheduleGrid">
        <section className="studioSchedulePanel"><header><div><h2>Prochaines sorties</h2><p>{scheduled.length} contenu{scheduled.length > 1 ? "s" : ""} planifié{scheduled.length > 1 ? "s" : ""}</p></div><CalendarClock size={20} aria-hidden="true" /></header>{scheduled.length ? <ul>{scheduled.map((item) => <EditorialItem key={item.id} item={item} now={now} />)}</ul> : <div className="studioLaneEmpty"><CalendarClock size={23} /><p>Aucune sortie à venir. Définissez une date depuis la fiche d’un média.</p></div>}</section>
        <section className="studioSchedulePanel"><header><div><h2>Sans date</h2><p>Brouillons à programmer</p></div><ListVideo size={20} aria-hidden="true" /></header>{withoutDate.length ? <ul>{withoutDate.map((item) => <EditorialItem key={item.id} item={item} now={now} />)}</ul> : <div className="studioLaneEmpty"><ListVideo size={23} /><p>Tous les brouillons ont une date de publication.</p></div>}</section>
      </div>
    </>
  );
}

function LiveWorkspace({ liveItems }: { liveItems: MediaItem[] }) {
  return (
    <>
      <header className="studioCommandHeader"><div><h1>Direct</h1><p>Surveillez l’entrée live du catalogue et la future connexion OBS.</p></div></header>
      <div className="studioLiveControlRoom">
        <section className="studioLiveMonitor"><header><span className="studioControlStatus isdraft"><i />Statut non exposé</span><strong>API live requise</strong></header><div><Radio size={38} aria-hidden="true" /><h2>Signal non vérifiable</h2><p>L’ingestion OBS n’est pas encore exposée par l’API. Aucun contrôle ne sera simulé ici.</p></div></section>
        <aside className="studioSystemRail"><header><h2>Entrées du catalogue</h2><span>{liveItems.length}</span></header>{liveItems.length ? <ul>{liveItems.map((item) => <EditorialItem key={item.id} item={item} now={Date.now()} />)}</ul> : <div className="studioLaneEmpty"><Radio size={23} /><p>Aucune entrée de type direct.</p></div>}<div className="studioDependency"><CircleOff size={15} />API d’ingestion live requise</div></aside>
      </div>
    </>
  );
}

function SeriesWorkspace({ series, onOpen, onCreate }: { series: MediaItem[]; onOpen: (id: string) => void; onCreate: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [data, setData] = useState<AdminEpisodes | null>(null);
  const [order, setOrder] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const selected = series.find((item) => item.id === selectedId) ?? null;
  const episodesById = useMemo(() => {
    const map: Record<string, MediaItem> = {};
    (data?.episodes ?? []).forEach((episode) => {
      map[episode.id] = episode;
    });
    return map;
  }, [data]);

  function open(id: string) {
    setSelectedId(id);
    setError(null);
    setSaved(null);
    setLoading(true);
    api.adminMediaEpisodes(id)
      .then((payload) => {
        setData(payload);
        const initial: Record<number, string[]> = {};
        payload.seasons.forEach((season) => {
          initial[season.season_number] = [...season.episode_ids];
        });
        setOrder(initial);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Impossible de charger les épisodes."))
      .finally(() => setLoading(false));
  }

  function moveEpisode(season: number, from: number, to: number) {
    if (to < 0 || to >= (order[season]?.length ?? 0)) return;
    setOrder((current) => {
      const ids = [...(current[season] ?? [])];
      const [moved] = ids.splice(from, 1);
      if (!moved) return current;
      ids.splice(to, 0, moved);
      return { ...current, [season]: ids };
    });
    setSaved(null);
  }

  async function saveSeason(season: number) {
    if (!selected) return;
    const ids = order[season] ?? [];
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      await api.adminReorderEpisodes(selected.id, season, ids);
      setSaved(`Saison ${season} réordonnée.`);
      open(selected.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Le réordonnancement a échoué.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="studioCommandHeader">
        <div><h1>Séries</h1><p>Créez des contenants de série puis gérez l’ordre des épisodes par saison.</p></div>
        <button className="primaryButton" type="button" onClick={onCreate}><Plus size={18} aria-hidden="true" />Nouvelle série</button>
      </header>
      <div className="studioSeriesGrid">
        <ul className="studioSeriesList">
          {series.length ? series.map((item) => (
            <li key={item.id} className={item.id === selectedId ? "isActive" : undefined}>
              <button type="button" onClick={() => open(item.id)} aria-current={item.id === selectedId ? "true" : undefined}>
                <span className="studioSeriesListPoster">{api.assetUrl(item.poster_url) ? <span style={{ backgroundImage: `url(${JSON.stringify(api.assetUrl(item.poster_url))})` }} /> : <Film size={18} aria-hidden="true" />}</span>
                <span><strong>{item.title}</strong><small>{item.no_spoil ? "No Spoil activé · " : ""}{VISIBILITY_LABELS[item.visibility] ?? item.visibility}</small></span>
              </button>
              <Link href={`/studio/media/${encodeURIComponent(item.id)}`} aria-label={`Modifier ${item.title}`}><span className="srOnly">Modifier</span><ChevronRight size={16} /></Link>
            </li>
          )) : (
            <li className="studioSeriesEmpty"><ListVideo size={22} /><p>Aucune série. Créez-en une pour commencer.</p></li>
          )}
        </ul>
        <aside className="studioSeriesDetail" aria-live="polite">
          {!selected ? <div className="studioSeriesEmpty"><Clapperboard size={26} /><p>Sélectionnez une série pour réordonner ses saisons et épisodes.</p></div> : null}
          {loading ? <LoadingStudio /> : null}
          {error && !loading ? <p className="studioStorageIndexResult isError" role="alert">{error}</p> : null}
          {saved ? <p className="studioStorageIndexResult" role="status">{saved}</p> : null}
          {!loading && !error && data ? data.seasons.map((season) => (
            <section key={season.season_number} className="studioSeasonPanel">
              <header>
                <div><h2>Saison {season.season_number}</h2><p>{episodesById[order[season.season_number]?.[0]] ? `${order[season.season_number].length} épisode${order[season.season_number].length > 1 ? "s" : ""}` : "Aucun épisode"}</p></div>
                <button className="secondaryButton" type="button" onClick={() => void saveSeason(season.season_number)} disabled={saving}>{saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}Enregistrer l’ordre</button>
              </header>
              <ol className="studioEpisodeOrder">
                {(order[season.season_number] ?? []).map((episodeId, index) => {
                  const episode = episodesById[episodeId];
                  return (
                    <li key={episodeId}>
                      <GripVertical size={15} aria-hidden="true" />
                      <span className="studioEpisodeNumber">E{index + 1}</span>
                      <span className="studioEpisodeTitle">{episode?.title ?? episodeId}</span>
                      <span className="studioEpisodeMoves">
                        <button type="button" onClick={() => moveEpisode(season.season_number, index, index - 1)} disabled={index === 0} aria-label="Monter"><ChevronUp size={16} /></button>
                        <button type="button" onClick={() => moveEpisode(season.season_number, index, index + 1)} disabled={index === (order[season.season_number]?.length ?? 0) - 1} aria-label="Descendre"><ChevronDown size={16} /></button>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )) : null}
        </aside>
      </div>
    </>
  );
}

function AdministrationWorkspace({ stats, indexing, indexReport, indexError, onIndexStorage }: { stats: Stats; indexing: boolean; indexReport: StorageIndexReport | null; indexError: string | null; onIndexStorage: () => void }) {
  const rows: Array<[string, number, LucideIcon, string]> = [
    ["Médias", stats.media, Film, "Contenus enregistrés"],
    ["Utilisateurs", stats.users, Users, "Comptes Nino"],
    ["Bibliothèques", stats.libraries, Database, "Sources configurées"],
    ["Scans", stats.scan_jobs, ScanLine, "Jobs connus"],
    ["Transcodages", stats.transcode_jobs, Activity, "Jobs connus"]
  ];
  return (
    <>
      <header className="studioCommandHeader"><div><h1>Système</h1><p>État administratif réellement exposé par Nino V8.</p></div></header>
      <section className="studioSystemTable"><header><span>Ressource</span><span>État</span><span>Volume</span></header>{rows.map(([label, value, Icon, description]) => <div key={label}><Icon size={19} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><span className="studioSystemUnknown">Non exposé par l’API</span><b>{value}</b></div>)}</section>
      <section className="studioStorageIndexer" aria-labelledby="studio-storage-index-title">
        <div className="studioStorageIndexerCopy"><ScanLine size={22} aria-hidden="true" /><div><h2 id="studio-storage-index-title">Stockage HLS existant</h2><p>Détecte les dossiers LUMA configurés dans <code>NINO_MEDIA_DIR</code>, sans déplacer ni réencoder les segments.</p></div></div>
        <button className="secondaryButton" type="button" onClick={onIndexStorage} disabled={indexing}>{indexing ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <ScanLine size={18} aria-hidden="true" />}{indexing ? "Indexation…" : "Indexer le stockage"}</button>
        {indexReport ? <p className={indexReport.errors.length ? "studioStorageIndexResult hasWarnings" : "studioStorageIndexResult"} role="status">{indexReport.discovered} dossier{indexReport.discovered > 1 ? "s" : ""} détecté{indexReport.discovered > 1 ? "s" : ""} · {indexReport.created} créé{indexReport.created > 1 ? "s" : ""} · {indexReport.updated} actualisé{indexReport.updated > 1 ? "s" : ""}{indexReport.errors.length ? ` · ${indexReport.errors.length} erreur${indexReport.errors.length > 1 ? "s" : ""}` : ""}</p> : null}
        {indexError ? <p className="studioStorageIndexResult isError" role="alert">{indexError}</p> : null}
      </section>
      <section className="studioStorageIndexer" aria-labelledby="studio-transcode-title">
        <div className="studioStorageIndexerCopy"><Activity size={22} aria-hidden="true" /><div><h2 id="studio-transcode-title">Worker et file de transcodage</h2><p>Démarrer ou arrêter le worker, suivre son statut et les jobs en temps réel.</p></div></div>
        <Link className="secondaryButton" href="/studio/transcode"><Activity size={18} aria-hidden="true" /> Ouvrir le transcodage</Link>
      </section>
    </>
  );
}

export default function StudioPage() {
  const router = useRouter();
  const [view, setView] = useState<StudioView>("overview");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [creating, setCreating] = useState<CreateKind | null>(null);
  const [indexingStorage, setIndexingStorage] = useState(false);
  const [storageIndexReport, setStorageIndexReport] = useState<StorageIndexReport | null>(null);
  const [storageIndexError, setStorageIndexError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  function load(background = false) {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setAccessDenied(false);
    api.me().then((user) => {
      if (!user.is_admin) {
        setAccessDenied(true);
        return null;
      }
      return Promise.all([api.adminMedia(), api.adminStats()]);
    }).then((payload) => {
      if (payload) {
        setMedia(payload[0]);
        setStats(payload[1]);
      }
    })
      .then(() => api.adminPublishSweep().catch(() => null))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Nino Studio est indisponible."))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => {
    const hash = window.location.hash.slice(1) as StudioView;
    if (sections.some((section) => section.id === hash)) setView(hash);
    load();
  }, []);

  function selectView(next: StudioView) {
    setCreating(null);
    setView(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  function saveMedia(saved: MediaItem) {
    setMedia((current) => {
      const exists = current.some((item) => item.id === saved.id);
      if (!exists) setStats((currentStats) => currentStats ? { ...currentStats, media: currentStats.media + 1 } : currentStats);
      return exists ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current];
    });
    setCreating(null);
  }

  async function indexStorage() {
    setIndexingStorage(true);
    setStorageIndexError(null);
    setStorageIndexReport(null);
    try {
      const report = await api.indexMediaStorage();
      setStorageIndexReport(report);
      load(true);
    } catch (reason) {
      setStorageIndexError(reason instanceof Error ? reason.message : "L’indexation du stockage HLS a échoué.");
    } finally {
      setIndexingStorage(false);
    }
  }

  const live = media.filter((item) => item.kind === "live");
  const prepared = media.filter((item) => laneFor(item, now) === "prepare").length;
  const scheduled = media.filter((item) => laneFor(item, now) === "scheduled").length;
  const published = media.filter((item) => laneFor(item, now) === "published").length;

  return (
    <AppShell>
      <section className="studioControlRoom">
        <aside className="studioControlNav">
          <header><strong>Studio</strong><small>Régie éditoriale</small></header>
          <nav aria-label="Sections de Nino Studio" onKeyDown={moveStudioNavFocus}>{sections.map((section) => { const Icon = section.icon; return <button key={section.id} type="button" className={view === section.id ? "isActive" : undefined} onClick={() => selectView(section.id)} aria-current={view === section.id ? "page" : undefined}><Icon size={18} aria-hidden="true" /><span>{section.label}</span></button>; })}</nav>
          <footer><span><i />API connectée</span><small>Administration V8</small></footer>
        </aside>

        <div className="studioControlMain">
          <div className="studioMobileNav" role="tablist" aria-label="Sections du Studio" onKeyDown={moveStudioNavFocus}>{sections.map((section) => { const Icon = section.icon; return <button key={section.id} type="button" role="tab" aria-selected={view === section.id} className={view === section.id ? "isActive" : undefined} onClick={() => selectView(section.id)}><Icon size={18} /><span>{section.shortLabel}</span></button>; })}</div>
          <header className="studioTopline">
            <dl><div><dt>Médias</dt><dd>{stats?.media ?? 0}</dd></div><div><dt>À préparer</dt><dd>{prepared}</dd></div><div><dt>Programmés</dt><dd>{scheduled}</dd></div><div><dt>Publiés</dt><dd>{published}</dd></div></dl>
            <button className="studioRefreshButton" type="button" onClick={() => load(true)} disabled={refreshing} aria-label="Rafraîchir le Studio"><RefreshCw className={refreshing ? "spin" : undefined} size={18} />{refreshing ? "Actualisation" : "À jour"}</button>
          </header>

          {loading ? <LoadingStudio /> : null}
          {error && !loading ? <ErrorState message={error} onRetry={() => load()} /> : null}
          {accessDenied && !loading ? <div className="studioAccessDenied"><CircleOff size={30} /><h1>Accès administrateur requis</h1><p>Votre compte peut regarder Nino, mais il ne peut pas ouvrir la régie éditoriale.</p></div> : null}

          {!loading && !error && !accessDenied && stats ? (
            <main className="studioControlContent">
              {creating ? <section className="studioCreateStage"><MediaEditor kind={creating} onCancel={() => setCreating(null)} onSaved={saveMedia} /></section> : null}
              {!creating && ["overview", "videos", "flashy"].includes(view) ? <StudioWorkspace media={media} now={now} view={view} onCreate={setCreating} /> : null}
              {!creating && view === "series" ? <SeriesWorkspace series={media.filter((item) => item.kind === "series")} onOpen={(id) => router.push(`/studio/media/${encodeURIComponent(id)}`)} onCreate={() => setCreating("series")} /> : null}
              {!creating && view === "schedule" ? <ScheduleWorkspace media={media} now={now} /> : null}
              {!creating && view === "live" ? <LiveWorkspace liveItems={live} /> : null}
              {!creating && view === "administration" ? <AdministrationWorkspace stats={stats} indexing={indexingStorage} indexReport={storageIndexReport} indexError={storageIndexError} onIndexStorage={() => void indexStorage()} /> : null}
            </main>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
