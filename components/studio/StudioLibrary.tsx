"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Film,
  Grid2X2,
  List,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  X,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";
import { CATEGORIES, VISIBILITY_LABELS } from "@/types/nino";
import type { MediaItem } from "@/types/nino";

type Props = {
  items: MediaItem[];
  kind: "videos" | "flashy";
  querySeed?: string;
  onCreate: () => void;
  onDeleted: (mediaId: string) => void;
};

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : `${minutes}:${String(rest).padStart(2, "0")}`;
}

function formatDate(value: string | null) {
  if (!value) return "Sans date";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date invalide" : new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function MediaThumb({ item }: { item: MediaItem }) {
  const image = api.assetUrl(item.kind === "short" ? item.thumbnail_vertical_url ?? item.poster_url : item.thumbnail_url ?? item.backdrop_url ?? item.poster_url);
  return <span className={`studioLibraryThumb ${item.kind === "short" ? "isPortrait" : ""}`} style={image ? { backgroundImage: `url(${JSON.stringify(image)})` } : undefined}>{image ? null : item.kind === "short" ? <Zap size={18} /> : <Film size={18} />}</span>;
}

export function StudioLibrary({ items, kind, querySeed = "", onCreate, onDeleted }: Props) {
  const [query, setQuery] = useState(querySeed);
  const [visibility, setVisibility] = useState("all");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("recent");
  const [layout, setLayout] = useState<"table" | "grid">("table");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 12;

  useEffect(() => setQuery(querySeed), [querySeed]);
  useEffect(() => { setPage(1); }, [query, visibility, status, category, sort, kind]);
  useEffect(() => { setDeleteConfirm(false); setError(null); }, [selectedId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr-FR");
    const now = Date.now();
    const result = items.filter((item) => {
      const matchesQuery = !normalized || `${item.title} ${item.synopsis} ${item.category ?? ""} ${item.tags.join(" ")} ${item.genres.join(" ")}`.toLocaleLowerCase("fr-FR").includes(normalized);
      const matchesVisibility = visibility === "all" || item.visibility === visibility;
      const publication = item.publish_at ? new Date(item.publish_at).getTime() : 0;
      const derivedStatus = publication > now ? "scheduled" : item.visibility === "public" && item.is_available ? "published" : "prepare";
      return matchesQuery && matchesVisibility && (status === "all" || status === derivedStatus) && (category === "all" || item.category === category);
    });
    return result.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "fr");
      if (sort === "duration") return b.duration_seconds - a.duration_seconds;
      return new Date(b.publish_at ?? 0).getTime() - new Date(a.publish_at ?? 0).getTime();
    });
  }, [category, items, query, sort, status, visibility]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const published = items.filter((item) => item.visibility === "public" && item.is_available).length;
  const privateCount = items.filter((item) => item.visibility === "private" || item.visibility === "unlisted").length;
  const scheduled = items.filter((item) => item.publish_at && new Date(item.publish_at).getTime() > Date.now()).length;

  async function removeSelected() {
    if (!selected) return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAdminMedia(selected.id);
      onDeleted(selected.id);
      setSelectedId(null);
      setDeleteConfirm(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La suppression a échoué.");
    } finally {
      setDeleting(false);
    }
  }

  const title = kind === "flashy" ? "Bibliothèque Flashy" : "Bibliothèque vidéo";
  const description = kind === "flashy" ? "Gérez les formats courts verticaux et leur diffusion." : "Retrouvez et gérez l’ensemble de vos vidéos et de leurs diffusions.";

  return (
    <section className="studioLibrary">
      <header className="studioCommandHeader"><div><h1>{title}</h1><p>{description}</p></div><button className="primaryButton" type="button" onClick={onCreate}><Plus size={18} />{kind === "flashy" ? "Nouveau Flashy" : "Nouvelle vidéo"}</button></header>
      <div className="studioLibraryMetrics" aria-label="Indicateurs de la bibliothèque">
        <div><Film size={20} /><span><small>Total</small><strong>{items.length}</strong></span></div>
        <div className="isSuccess"><Eye size={20} /><span><small>Publiés</small><strong>{published}</strong></span></div>
        <div className="isPrivate"><List size={20} /><span><small>Privés</small><strong>{privateCount}</strong></span></div>
        <div className="isScheduled"><CalendarClock size={20} /><span><small>Programmés</small><strong>{scheduled}</strong></span></div>
      </div>
      <div className="studioLibraryToolbar">
        <label className="studioControlSearch"><Search size={17} /><span className="srOnly">Rechercher</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un média…" /></label>
        <label className="studioControlSelect"><span className="srOnly">Visibilité</span><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="all">Toutes les visibilités</option><option value="public">Publics</option><option value="private">Privés</option><option value="unlisted">Non listés</option><option value="draft">Brouillons</option></select></label>
        <label className="studioControlSelect"><span className="srOnly">Statut</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tous les statuts</option><option value="prepare">À préparer</option><option value="scheduled">Programmés</option><option value="published">Publiés</option></select></label>
        <label className="studioControlSelect"><span className="srOnly">Catégorie</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Toutes les catégories</option>{Object.entries(CATEGORIES).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label className="studioControlSelect"><span className="srOnly">Tri</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recent">Plus récent</option><option value="title">Titre A–Z</option><option value="duration">Durée</option></select></label>
        <div className="studioLayoutSwitch" aria-label="Disposition"><button type="button" className={layout === "table" ? "isActive" : undefined} onClick={() => setLayout("table")} aria-label="Vue tableau" aria-pressed={layout === "table"}><List size={18} /></button><button type="button" className={layout === "grid" ? "isActive" : undefined} onClick={() => setLayout("grid")} aria-label="Vue grille" aria-pressed={layout === "grid"}><Grid2X2 size={18} /></button></div>
      </div>

      {!visible.length ? <div className="studioLibraryEmpty"><Search size={24} /><h2>Aucun média trouvé</h2><p>Modifiez les filtres ou créez un nouveau contenu.</p><button className="secondaryButton" type="button" onClick={() => { setQuery(""); setVisibility("all"); setStatus("all"); setCategory("all"); }}>Réinitialiser les filtres</button></div> : null}
      {visible.length && layout === "table" ? <div className="studioLibraryTableWrap"><table className="studioLibraryTable"><thead><tr><th>Vidéo</th><th>Catégorie</th><th>Statut</th><th>Visibilité</th><th>Durée</th><th>Date</th><th><span className="srOnly">Actions</span></th></tr></thead><tbody>{visible.map((item) => <tr key={item.id} className={selectedId === item.id ? "isSelected" : undefined} onClick={() => setSelectedId(item.id)}><td><button type="button" onClick={() => setSelectedId(item.id)}><MediaThumb item={item} /><span><strong>{item.title}</strong><small>{item.series_source_id ? `S${item.season_number ?? 1} · E${item.episode_number ?? "?"}` : item.kind === "short" ? "Flashy" : "Vidéo"}</small></span></button></td><td><span className="studioCategoryBadge">{item.category ? CATEGORIES[item.category] ?? item.category : "—"}</span></td><td><span className={`studioControlStatus is${item.visibility}`}><i />{item.encoding_status === "running" ? "Encodage" : item.encoding_status === "failed" ? "Échec" : item.is_available ? "Disponible" : "Indisponible"}</span></td><td>{VISIBILITY_LABELS[item.visibility] ?? item.visibility}</td><td>{formatDuration(item.duration_seconds)}</td><td>{formatDate(item.publish_at)}</td><td><Link href={`/studio/media/${encodeURIComponent(item.id)}`} onClick={(event) => event.stopPropagation()} aria-label={`Modifier ${item.title}`}><Pencil size={16} /></Link></td></tr>)}</tbody></table></div> : null}
      {visible.length && layout === "grid" ? <div className={`studioLibraryGrid ${kind === "flashy" ? "isFlashy" : ""}`}>{visible.map((item) => <button key={item.id} type="button" className={selectedId === item.id ? "isSelected" : undefined} onClick={() => setSelectedId(item.id)}><MediaThumb item={item} /><span><strong>{item.title}</strong><small>{VISIBILITY_LABELS[item.visibility] ?? item.visibility} · {formatDuration(item.duration_seconds)}</small></span></button>)}</div> : null}
      {visible.length ? <footer className="studioLibraryPagination"><span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} sur {filtered.length}</span><div><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)} aria-label="Page précédente"><ChevronLeft size={17} /></button><strong>{page} / {pages}</strong><button type="button" disabled={page === pages} onClick={() => setPage((value) => value + 1)} aria-label="Page suivante"><ChevronRight size={17} /></button></div></footer> : null}

      {selected ? <aside className="studioMediaInspector" aria-label={`Détails de ${selected.title}`}><header><span>Média sélectionné</span><button type="button" onClick={() => setSelectedId(null)} aria-label="Fermer l’inspecteur"><X size={19} /></button><h2>{selected.title}</h2></header><MediaThumb item={selected} /><dl><div><Clock3 size={16} /><dt>Durée</dt><dd>{formatDuration(selected.duration_seconds)}</dd></div><div><CalendarClock size={16} /><dt>Publication</dt><dd>{formatDate(selected.publish_at)}</dd></div><div><Eye size={16} /><dt>Visibilité</dt><dd>{VISIBILITY_LABELS[selected.visibility] ?? selected.visibility}</dd></div></dl><section><span>Catégorie</span><strong>{selected.category ? CATEGORIES[selected.category] ?? selected.category : "Non classé"}</strong></section>{selected.tags.length ? <section><span>Tags</span><ul>{selected.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul></section> : null}<section><span>Description</span><p>{selected.synopsis || "Aucun synopsis."}</p></section>{error ? <p className="studioInspectorError" role="alert">{error}</p> : null}<footer><Link className="secondaryButton" href={`/studio/media/${encodeURIComponent(selected.id)}`}><Pencil size={16} />Modifier</Link>{selected.visibility === "public" && selected.is_available ? <Link className="secondaryButton" href={`/watch/${encodeURIComponent(selected.id)}`} target="_blank"><Play size={16} />Lire</Link> : null}{deleteConfirm ? <div className="studioInspectorConfirm"><span>Supprimer définitivement ?</span><button type="button" onClick={() => setDeleteConfirm(false)}>Annuler</button><button type="button" onClick={() => void removeSelected()} disabled={deleting}>{deleting ? <Loader2 className="spin" size={15} /> : <Trash2 size={15} />}Confirmer</button></div> : <button className="dangerButton" type="button" onClick={() => setDeleteConfirm(true)}><Trash2 size={16} />Supprimer</button>}</footer></aside> : null}
      {selected ? <button className="studioInspectorBackdrop" type="button" onClick={() => setSelectedId(null)} aria-label="Fermer l’inspecteur" /> : null}
    </section>
  );
}
