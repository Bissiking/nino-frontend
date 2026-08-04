"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  CircleOff,
  Clapperboard,
  Database,
  Download,
  Film,
  LayoutDashboard,
  ListVideo,
  Plus,
  Radio,
  ScanLine,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
  Zap
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/StateBlock";
import { V7MigrationWorkspace } from "@/components/studio/V7MigrationWorkspace";
import { V7ImportWorkspace } from "@/components/studio/V7ImportWorkspace";
import { api } from "@/lib/api";
import type { MediaItem } from "@/types/nino";

type StudioView = "overview" | "series" | "flashy" | "videos" | "schedule" | "live" | "import" | "administration";

function moveStudioTabFocus(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const index = controls.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  const next = controls[(index + (event.key === "ArrowLeft" ? -1 : 1) + controls.length) % controls.length];
  event.preventDefault();
  next.focus();
}

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
  icon: LucideIcon;
};

const sections: StudioSection[] = [
  { id: "overview", label: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "series", label: "Séries", icon: Clapperboard },
  { id: "flashy", label: "Flashy", icon: Zap },
  { id: "videos", label: "Vidéos", icon: Film },
  { id: "schedule", label: "Programmation", icon: CalendarClock },
  { id: "live", label: "Direct", icon: Radio },
  { id: "import", label: "Import V7", icon: Download },
  { id: "administration", label: "Administration", icon: Settings }
];

const unavailableMetadata = [
  "Identifiant et URL Nino V7",
  "Fichier source et informations techniques",
  "Émission, saison et numéro d’épisode",
  "Date de sortie et fenêtre de publication",
  "Créateur, participants et crédits",
  "Visibilité, droits et restrictions"
];

function formatDuration(seconds: number) {
  if (!seconds) return "Non renseignée";
  if (seconds < 60) return `${seconds} s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours ? `${hours} h ${minutes.toString().padStart(2, "0")}` : `${minutes} min`;
}

function kindLabel(kind: string) {
  const labels: Record<string, string> = { movie: "Vidéo", series: "Série", short: "Flashy", live: "Direct" };
  return labels[kind] ?? kind;
}

function ApiDependency({ children }: { children: React.ReactNode }) {
  return <span className="studioDependency"><CircleOff size={14} aria-hidden="true" />{children}</span>;
}

function LoadingStudio() {
  return (
    <div className="studioSkeleton" aria-label="Chargement de Nino Studio" aria-busy="true">
      <span /><span /><span /><span /><span />
    </div>
  );
}

function MediaInspector({ media, onClose }: { media: MediaItem; onClose: () => void }) {
  const knownFields = [
    ["Identifiant V8", media.id],
    ["Type", kindLabel(media.kind)],
    ["Titre", media.title],
    ["Année", media.year?.toString() ?? "Non renseignée"],
    ["Durée", formatDuration(media.duration_seconds)],
    ["Genres", media.genres.length ? media.genres.join(", ") : "Non renseignés"],
    ["Note", media.rating === null ? "Non renseignée" : `${media.rating}/10`],
    ["Disponibilité", media.is_available ? "Disponible" : "Indisponible"],
    ["Affiche", media.poster_url ?? "Non renseignée"],
    ["Arrière-plan", media.backdrop_url ?? "Non renseigné"]
  ];

  return (
    <aside className="studioInspector" aria-label={`Fiche de préparation de ${media.title}`}>
      <header className="studioInspectorHeader">
        <div>
          <span className="studioStatus isDraft">Préparation d’import</span>
          <h2>{media.title}</h2>
        </div>
        <button className="studioIconButton" type="button" onClick={onClose} aria-label="Fermer la fiche"><X size={19} /></button>
      </header>

      <section className="studioInspectorSection">
        <h3>Informations disponibles</h3>
        <dl className="studioMetadata">
          {knownFields.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
          <div className="studioMetadataWide"><dt>Synopsis</dt><dd>{media.synopsis || "Non renseigné"}</dd></div>
        </dl>
      </section>

      <section className="studioInspectorSection">
        <h3>Informations attendues de Nino V7</h3>
        <ul className="studioCheckList">
          {unavailableMetadata.map((label) => <li key={label}><CircleOff size={16} aria-hidden="true" /><span>{label}<small>Non fourni par l’API actuelle</small></span></li>)}
        </ul>
      </section>

      <footer className="studioInspectorFooter">
        <button className="primaryButton" type="button" disabled title="Endpoint de mise à jour requis">Enregistrer la fiche</button>
        <ApiDependency>API d’écriture à connecter</ApiDependency>
      </footer>
    </aside>
  );
}

function MediaWorkspace({ title, description, items, createLabel }: { title: string; description: string; items: MediaItem[]; createLabel: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.title} ${item.synopsis} ${item.genres.join(" ")}`.toLowerCase().includes(normalized));
  }, [items, query]);

  return (
    <div className={`studioWorkArea ${selected ? "hasInspector" : ""}`}>
      <section className="studioListPanel">
        <header className="studioSectionHeader">
          <div><h2>{title}</h2><p>{description}</p></div>
          <div className="studioHeaderAction">
            <button className="primaryButton" type="button" disabled title="Endpoint de création requis"><Plus size={18} aria-hidden="true" />{createLabel}</button>
            <ApiDependency>Création non connectée</ApiDependency>
          </div>
        </header>

        <label className="studioSearch">
          <Search size={18} aria-hidden="true" />
          <span className="srOnly">Rechercher dans cette liste</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher par titre, synopsis ou genre" />
        </label>

        {filtered.length ? (
          <div className="studioTableWrap">
            <table className="studioTable">
              <thead><tr><th>Contenu</th><th>Type</th><th>Durée</th><th>État</th><th><span className="srOnly">Action</span></th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className={selected?.id === item.id ? "isSelected" : undefined}>
                    <td><strong>{item.title}</strong><small>{item.year ?? "Année inconnue"} · {item.genres.join(", ") || "Sans genre"}</small></td>
                    <td>{kindLabel(item.kind)}</td>
                    <td>{formatDuration(item.duration_seconds)}</td>
                    <td><span className={`studioStatus ${item.is_available ? "isReady" : "isDraft"}`}>{item.is_available ? "Disponible" : "Indisponible"}</span></td>
                    <td><button className="studioRowAction" type="button" onClick={() => setSelected(item)} aria-label={`Ouvrir la fiche de ${item.title}`}><ChevronRight size={19} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="studioEmpty"><ListVideo size={26} aria-hidden="true" /><h3>Aucun contenu trouvé</h3><p>{query ? "Modifiez votre recherche pour retrouver un contenu." : "Cette liste se remplira depuis le catalogue Nino."}</p></div>
        )}
      </section>
      {selected ? <MediaInspector media={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

function ScheduleWorkspace() {
  return (
    <section className="studioOperationalEmpty">
      <div className="studioEmptyVisual"><CalendarClock size={34} aria-hidden="true" /></div>
      <div><h2>Programmation des sorties</h2><p>Le calendrier accueillera les brouillons, dates de publication, reports et sorties déjà publiées.</p></div>
      <button className="primaryButton" type="button" disabled title="Endpoint de programmation requis"><Plus size={18} />Programmer une sortie</button>
      <ApiDependency>Modèle et endpoints de programmation requis</ApiDependency>
    </section>
  );
}

function LiveWorkspace({ liveItems }: { liveItems: MediaItem[] }) {
  const catalogLive = liveItems[0];
  return (
    <div className="studioLiveLayout">
      <section className="studioLiveStage">
        <header><span className="studioStatus isIdle">Hors ligne</span><strong>0 / 1 flux OBS actif</strong></header>
        <div className="studioLivePreview"><Radio size={38} aria-hidden="true" /><h2>Aucun signal OBS</h2><p>L’état d’ingestion et la clé de stream seront affichés ici dès que le backend live sera disponible.</p></div>
      </section>
      <aside className="studioLiveControls">
        <h2>Configuration du direct</h2>
        <dl>
          <div><dt>Limite</dt><dd>1 stream simultané</dd></div>
          <div><dt>Entrée catalogue</dt><dd>{catalogLive?.title ?? "Aucune"}</dd></div>
          <div><dt>État OBS</dt><dd>Non disponible</dd></div>
        </dl>
        <button className="primaryButton wide" type="button" disabled title="Endpoint live requis">Configurer le flux OBS</button>
        <ApiDependency>API d’ingestion live à connecter</ApiDependency>
      </aside>
    </div>
  );
}

function AdministrationWorkspace({ stats }: { stats: Stats }) {
  const statRows: Array<[string, number, LucideIcon]> = [
    ["Utilisateurs", stats.users, Users],
    ["Bibliothèques", stats.libraries, Database],
    ["Médias", stats.media, Film],
    ["Scans", stats.scan_jobs, ScanLine],
    ["Transcodages", stats.transcode_jobs, Activity]
  ];

  return (
    <div className="studioAdminLayout">
      <section className="studioAdminStats">
        <header><h2>État de Nino</h2><p>Informations fournies par l’administration V8.</p></header>
        <dl>{statRows.map(([label, value, Icon]) => <div key={label}><Icon size={20} aria-hidden="true" /><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <V7MigrationWorkspace />
    </div>
  );
}

export default function StudioPage() {
  const [view, setView] = useState<StudioView>("overview");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    api.me()
      .then((user) => {
        if (!user.is_admin) {
          setAccessDenied(true);
          return null;
        }
        return Promise.all([api.media(), api.adminStats()]);
      })
      .then((payload) => {
        if (payload) {
          setMedia(payload[0]);
          setStats(payload[1]);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Nino Studio est indisponible."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const hash = window.location.hash.slice(1) as StudioView;
    if (sections.some((section) => section.id === hash)) setView(hash);
    load();
  }, []);

  function selectView(nextView: StudioView) {
    setView(nextView);
    window.history.replaceState(null, "", `#${nextView}`);
  }

  const currentSection = sections.find((section) => section.id === view) ?? sections[0];
  const CurrentSectionIcon = currentSection.icon;
  const series = media.filter((item) => item.kind === "series");
  const flashy = media.filter((item) => item.kind === "short");
  const live = media.filter((item) => item.kind === "live");

  return (
    <AppShell>
      <section className="studioSurface">
        <header className="studioTitlebar">
          <div><h1>Nino Studio</h1><p>Préparer, organiser et publier les programmes de Nino.</p></div>
          <span className="studioAccess"><Sparkles size={16} aria-hidden="true" />Espace administrateur</span>
        </header>

        <nav className="studioNav" aria-label="Sections de Nino Studio" onKeyDown={moveStudioTabFocus}>
          {sections.map((section) => {
            const Icon = section.icon;
            return <button type="button" key={section.id} className={view === section.id ? "isActive" : undefined} onClick={() => selectView(section.id)} aria-current={view === section.id ? "page" : undefined}><Icon size={18} aria-hidden="true" /><span>{section.label}</span></button>;
          })}
        </nav>

        {loading ? <LoadingStudio /> : null}
        {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}
        {accessDenied && !loading ? <div className="studioAccessDenied"><CircleOff size={30} aria-hidden="true" /><h2>Accès administrateur requis</h2><p>Votre compte peut regarder Nino, mais il ne peut pas ouvrir Nino Studio.</p></div> : null}

        {!loading && !error && !accessDenied && stats ? (
          <div className="studioContent">
            {view !== "import" ? <div className="studioCurrentTitle"><CurrentSectionIcon size={20} aria-hidden="true" /><h2>{currentSection.label}</h2></div> : null}
            {view === "overview" ? (
              <div className="studioOverview">
                <section className="studioOverviewLead">
                  <div><h2>Le catalogue est prêt à être travaillé</h2><p>{stats.media} média{stats.media > 1 ? "s" : ""} dans V8. Ouvrez une fiche pour contrôler les métadonnées disponibles avant le futur import V7.</p></div>
                  <button className="secondaryButton" type="button" onClick={() => selectView("videos")}>Voir les vidéos<ChevronRight size={18} /></button>
                </section>
                <div className="studioOverviewGrid">
                  <button type="button" onClick={() => selectView("schedule")}><CalendarClock size={24} /><span><strong>Programmation</strong><small>Calendrier en attente du backend</small></span><ChevronRight size={18} /></button>
                  <button type="button" onClick={() => selectView("live")}><Radio size={24} /><span><strong>Direct OBS</strong><small>Un seul flux simultané</small></span><ChevronRight size={18} /></button>
                  <button type="button" onClick={() => selectView("import")}><ScanLine size={24} /><span><strong>Import Nino V7</strong><small>Prévisualisation avant import</small></span><ChevronRight size={18} /></button>
                </div>
                <MediaWorkspace title="Contenus récemment chargés" description="Catalogue réel fourni par l’API V8." items={media.slice(0, 8)} createLabel="Ajouter une vidéo" />
              </div>
            ) : null}
            {view === "series" ? <MediaWorkspace title="Gestion des séries" description="Séries et programmes organisés en saisons et épisodes." items={series} createLabel="Créer une série" /> : null}
            {view === "flashy" ? <MediaWorkspace title="Gestion des Flashy" description="Formats courts verticaux destinés au flux Flashy." items={flashy} createLabel="Ajouter un Flashy" /> : null}
            {view === "videos" ? <MediaWorkspace title="Gestion des vidéos" description="Tous les contenus actuellement exposés par le catalogue V8." items={media} createLabel="Ajouter une vidéo" /> : null}
            {view === "schedule" ? <ScheduleWorkspace /> : null}
            {view === "live" ? <LiveWorkspace liveItems={live} /> : null}
            {view === "import" ? <V7ImportWorkspace /> : null}
            {view === "administration" ? <AdministrationWorkspace stats={stats} /> : null}
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
