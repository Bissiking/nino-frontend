"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
  Film,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Plus,
  Pencil,
  Save,
  Send,
  Upload,
  X
} from "lucide-react";
import { StudioShell } from "@/components/studio/StudioShell";
import { api } from "@/lib/api";
import { CATEGORIES, VISIBILITY_LABELS } from "@/types/nino";
import type { AdminEpisodes, MediaItem } from "@/types/nino";

type FormState = {
  title: string;
  synopsis: string;
  description: string;
  category: string;
  genres: string[];
  tags: string[];
  year: string;
  visibility: "draft" | "private" | "public" | "development";
  publishAt: string;
  posterUrl: string;
  backdropUrl: string;
  thumbnailUrl: string;
  isAvailable: boolean;
  notifyDiscord: boolean;
  noSpoil: boolean;
  isAdult: boolean;
};

function statusBadge(visibility: string) {
  switch (visibility) {
    case "public": return <span className="seBadge isPublished"><i />Publié</span>;
    case "private": return <span className="seBadge isPrivate"><i />Privé</span>;
    case "development": return <span className="seBadge isDraft"><i />Développement</span>;
    default: return <span className="seBadge isDraft"><i />Brouillon</span>;
  }
}

function episodeStatusBadge(item: MediaItem) {
  if (item.visibility === "public" && item.is_available) return <span className="seBadge isPublished"><i />Publié</span>;
  if (item.visibility === "private") return <span className="seBadge isPrivate"><i />Privé</span>;
  if (item.visibility === "development") return <span className="seBadge isDraft"><i />Développement</span>;
  return <span className="seBadge isDraft"><i />Brouillon</span>;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function SeriesEditorPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = params.id as string;

  const [series, setSeries] = useState<MediaItem | null>(null);
  const [episodes, setEpisodes] = useState<AdminEpisodes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [order, setOrder] = useState<Record<number, string[]>>({});
  const [genreDraft, setGenreDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBackdrop, setUploadingBackdrop] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const [form, setForm] = useState<FormState>({
    title: "",
    synopsis: "",
    description: "",
    category: "",
    genres: [],
    tags: [],
    year: "",
    visibility: "draft",
    publishAt: "",
    posterUrl: "",
    backdropUrl: "",
    thumbnailUrl: "",
    isAvailable: true,
    notifyDiscord: false,
    noSpoil: false,
    isAdult: false
  });

  useEffect(() => { loadSeries(); }, [seriesId]);

  async function loadSeries() {
    setLoading(true);
    setError(null);
    try {
      const media = await api.adminMediaDetail(seriesId);
      setSeries(media);
      setForm({
        title: media.title ?? "",
        synopsis: media.synopsis ?? "",
        description: media.description ?? "",
        category: media.category ?? "",
        genres: media.genres ?? [],
        tags: media.tags ?? [],
        year: media.year?.toString() ?? "",
        visibility: media.visibility as "draft" | "private" | "public" | "development",
        publishAt: media.publish_at ? media.publish_at.slice(0, 16) : "",
        posterUrl: media.poster_url ?? "",
        backdropUrl: media.backdrop_url ?? "",
        thumbnailUrl: media.thumbnail_url ?? "",
        isAvailable: media.is_available ?? true,
        notifyDiscord: media.notify_discord ?? false,
        noSpoil: media.no_spoil ?? false,
        isAdult: media.is_adult ?? false
      });
      try {
        const episodesData = await api.adminMediaEpisodes(seriesId);
        setEpisodes(episodesData);
        const initialOrder: Record<number, string[]> = {};
        episodesData.seasons.forEach((season) => { initialOrder[season.season_number] = [...season.episode_ids]; });
        setOrder(initialOrder);
      } catch { /* no episodes yet */ }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger la série.");
    } finally { setLoading(false); }
  }

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
    setSaved(false);
  }

  function addGenre(genre: string) {
    const t = genre.trim();
    if (!t || form.genres.includes(t)) return;
    updateField("genres", [...form.genres, t]);
  }
  function removeGenre(genre: string) { updateField("genres", form.genres.filter((g) => g !== genre)); }

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || form.tags.includes(t)) return;
    updateField("tags", [...form.tags, t]);
  }
  function removeTag(tag: string) { updateField("tags", form.tags.filter((t) => t !== tag)); }

  function moveEpisode(season: number, from: number, to: number) {
    if (to < 0 || to >= (order[season]?.length ?? 0)) return;
    setOrder((c) => {
      const ids = [...(c[season] ?? [])];
      const [moved] = ids.splice(from, 1);
      if (!moved) return c;
      ids.splice(to, 0, moved);
      return { ...c, [season]: ids };
    });
    setSaved(false);
  }

  async function handleSave(publish = false) {
    if (!series) return;
    setSaving(true);
    setError(null);
    try {
      const visibility = publish ? "public" : form.visibility;
      const updated = await api.updateAdminMedia(series.id, {
        kind: "series",
        title: form.title.trim(),
        synopsis: form.synopsis.trim(),
        description: form.description.trim(),
        category: form.category.trim() || null,
        genres: form.genres,
        tags: form.tags,
        year: form.year ? Number(form.year) : null,
        visibility,
        publish_at: form.publishAt ? new Date(form.publishAt).toISOString() : null,
        is_available: form.isAvailable,
        notify_discord: form.notifyDiscord,
        no_spoil: form.noSpoil,
        is_adult: form.isAdult,
        poster_url: form.posterUrl.trim() || null,
        backdrop_url: form.backdropUrl.trim() || null,
        thumbnail_url: form.thumbnailUrl.trim() || null
      });
      await Promise.all(
        Object.entries(order).map(([season, episodeIds]) => api.adminReorderEpisodes(series.id, Number(season), episodeIds))
      );
      setSeries(updated);
      setForm((current) => ({ ...current, visibility }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur lors de l'enregistrement.");
    } finally { setSaving(false); }
  }

  async function handleImageUpload(field: "poster" | "backdrop" | "thumbnail", file: File) {
    if (!series) return;
    const setUp = field === "poster" ? setUploadingPoster : field === "backdrop" ? setUploadingBackdrop : setUploadingThumbnail;
    setUp(true);
    try {
      const updated = await api.uploadMediaImage(series.id, field, file);
      if (field === "poster") updateField("posterUrl", updated.poster_url ?? "");
      else if (field === "backdrop") updateField("backdropUrl", updated.backdrop_url ?? "");
      else updateField("thumbnailUrl", updated.thumbnail_url ?? "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur lors de l'envoi de l'image.");
    } finally { setUp(false); }
  }

  async function handleImageRemove(field: "poster" | "backdrop" | "thumbnail") {
    if (!series) return;
    try {
      const updated = await api.deleteMediaImage(series.id, field);
      if (field === "poster") updateField("posterUrl", updated.poster_url ?? "");
      else if (field === "backdrop") updateField("backdropUrl", updated.backdrop_url ?? "");
      else updateField("thumbnailUrl", updated.thumbnail_url ?? "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur lors de la suppression.");
    }
  }

  const episodesById = useMemo(() => {
    const map: Record<string, MediaItem> = {};
    (episodes?.episodes ?? []).forEach((ep) => { map[ep.id] = ep; });
    return map;
  }, [episodes]);

  if (loading) {
    return <StudioShell immersive><div className="studioSeriesEditorLoading" aria-busy="true"><Loader2 className="spin" size={32} /><span>Chargement...</span></div></StudioShell>;
  }
  if (error && !series) {
    return <StudioShell immersive><div className="studioSeriesEditorError"><p role="alert">{error}</p><Link href="/studio/series" className="secondaryButton"><ArrowLeft size={18} /> Retour</Link></div></StudioShell>;
  }

  return (
    <StudioShell immersive>
      <div className="sePage">
        <header className="seTopbar">
          <div className="seTopbarLeft">
            <h1>Édition des séries</h1>
            <p>Modifiez les informations et le contenu de votre série.</p>
          </div>
          <div className="seTopbarActions">
            <Link href={`/watch/${encodeURIComponent(seriesId)}`} className="seBtn seBtnGhost" target="_blank"><Eye size={16} /> Aperçu</Link>
            <button type="button" className="seBtn seBtnSecondary" onClick={() => void handleSave(false)} disabled={saving}>
              {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />} Enregistrer
            </button>
            <button type="button" className="seBtn seBtnPrimary" onClick={() => void handleSave(true)} disabled={saving}>
              <Send size={16} /> Publier
            </button>
          </div>
        </header>

        {error && <div className="seBanner isError" role="alert">{error}</div>}
        {saved && <div className="seBanner isSuccess" role="status">Enregistré avec succès.</div>}

        <div className="seGrid">
          {/* Colonne gauche */}
          <div className="seColLeft">
            {/* 1. Informations générales */}
            <section className="seCard seGeneralCard">
              <h2>1. Informations générales</h2>
              <div className="seFormGrid">
                <label className="seField seTitleField">
                  <span>Titre de la série *</span>
                  <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Titre de la série" maxLength={255} />
                </label>
                <label className="seField">
                  <span>Slug *</span>
                  <input type="text" value={form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")} readOnly />
                </label>
                <label className="seField">
                  <span>Statut</span>
                  <div className="seSelectWrapper">
                    <select value={form.visibility} onChange={(e) => updateField("visibility", e.target.value as "draft" | "private" | "public" | "development")}>
                      <option value="draft">Brouillon</option>
                      <option value="development">Développement</option>
                      <option value="private">Privé</option>
                      <option value="public">Publié</option>
                    </select>
                  </div>
                </label>
                <label className="seField">
                  <span>Visibilité</span>
                  <div className="seSelectWrapper">
                    <select value={form.isAvailable ? "visible" : "hidden"} onChange={(e) => updateField("isAvailable", e.target.value === "visible")}>
                      <option value="visible">Publique</option>
                      <option value="hidden">Masquée</option>
                    </select>
                  </div>
                </label>
                <label className="seField">
                  <span>Genre</span>
                  <div className="seSelectWrapper">
                    <select value={form.genres[0] ?? ""} onChange={(e) => updateField("genres", e.target.value ? [e.target.value] : [])}>
                      <option value="">Sélectionner</option>
                      {["Action", "Aventure", "Animation", "Comédie", "Documentaire", "Drame", "Science-fiction"].map((genre) => <option key={genre} value={genre}>{genre}</option>)}
                    </select>
                  </div>
                </label>
                <label className="seField">
                  <span>Catégorie</span>
                  <div className="seSelectWrapper">
                    <select value={form.category} onChange={(e) => updateField("category", e.target.value)}>
                      <option value="">Sélectionner</option>
                      <option value="originals">Séries originales</option>
                      {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </label>
                <label className="seField">
                  <span>Langue</span>
                  <div className="seSelectWrapper">
                    <select disabled title="La langue des séries n’est pas encore exposée par l’API">
                      <option>Français — valeur système</option>
                    </select>
                  </div>
                </label>
                <label className="seField">
                  <span>Date de sortie</span>
                  <input type="date" value={form.publishAt ? form.publishAt.slice(0, 10) : ""} onChange={(e) => updateField("publishAt", e.target.value)} />
                </label>
              </div>
            </section>

            {/* 3. Médias */}
            <section className="seCard seMediaCard">
              <h2>3. Médias</h2>
              <div className="seMediaGrid">
                <div className="seMediaSlot">
                  <span className="seMediaSlotLabel">Affiche / Poster</span>
                  <div className="seMediaPreview isPoster">
                    {form.posterUrl ? <img src={api.assetUrl(form.posterUrl) ?? ""} alt="Affiche" /> : <ImageIcon size={24} />}
                    {form.posterUrl ? <button type="button" onClick={() => void handleImageRemove("poster")} aria-label="Supprimer l’affiche"><X size={13} /></button> : null}
                  </div>
                  <label className="seMediaUploadBtn">
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("poster", f); }} />
                    {uploadingPoster ? <Loader2 className="spin" size={14} /> : <Upload size={14} />} {form.posterUrl ? "Remplacer" : "Ajouter"}
                  </label>
                </div>
                <div className="seMediaSlot">
                  <span className="seMediaSlotLabel">Bannière</span>
                  <div className="seMediaPreview isBanner">
                    {form.backdropUrl ? <img src={api.assetUrl(form.backdropUrl) ?? ""} alt="Bannière" /> : <ImageIcon size={24} />}
                    {form.backdropUrl ? <button type="button" onClick={() => void handleImageRemove("backdrop")} aria-label="Supprimer la bannière"><X size={13} /></button> : null}
                  </div>
                  <label className="seMediaUploadBtn">
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("backdrop", f); }} />
                    {uploadingBackdrop ? <Loader2 className="spin" size={14} /> : <Upload size={14} />} {form.backdropUrl ? "Remplacer" : "Ajouter"}
                  </label>
                </div>
                <div className="seMediaSlot">
                  <span className="seMediaSlotLabel">Miniature</span>
                  <div className="seMediaPreview isThumb">
                    {form.thumbnailUrl ? <img src={api.assetUrl(form.thumbnailUrl) ?? ""} alt="Miniature" /> : <ImageIcon size={24} />}
                    {form.thumbnailUrl ? <button type="button" onClick={() => void handleImageRemove("thumbnail")} aria-label="Supprimer la miniature"><X size={13} /></button> : null}
                  </div>
                  <label className="seMediaUploadBtn">
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("thumbnail", f); }} />
                    {uploadingThumbnail ? <Loader2 className="spin" size={14} /> : <Upload size={14} />} {form.thumbnailUrl ? "Remplacer" : "Ajouter"}
                  </label>
                </div>
              </div>
              <p className="seMediaHint">Formats recommandés : Poster 1000x1500px, Bannière 1920x600px, Miniature 1280x720px</p>
            </section>

            {/* 5. Paramètres additionnels */}
            <section className="seCard seSettingsCard">
              <h2>5. Paramètres additionnels</h2>
              <div className="seFormGrid">
                <label className="seField">
                  <span>Âge minimum</span>
                  <div className="seSelectWrapper">
                    <select value={form.isAdult ? "18" : "0"} onChange={(event) => updateField("isAdult", event.target.value === "18")}>
                      <option value="0">Tous publics</option>
                      <option value="18">18+</option>
                    </select>
                  </div>
                </label>
                <div className="seField">
                  <span>Options de publication</span>
                  <div className="seToggles">
                    <label className="seToggle"><input type="checkbox" checked={form.isAvailable} onChange={(e) => updateField("isAvailable", e.target.checked)} /><span className="seToggleTrack" /><span>Afficher dans le catalogue</span></label>
                    <label className="seToggle"><input type="checkbox" checked={form.notifyDiscord} onChange={(e) => updateField("notifyDiscord", e.target.checked)} /><span className="seToggleTrack" /><span>Notifier Discord à la publication</span></label>
                  </div>
                </div>
                <label className="seField isWide">
                  <span>Tags</span>
                  <div className="seTagInput">
                    {form.tags.map((tag) => (
                      <span key={tag} className="seTag">{tag}<button type="button" onClick={() => removeTag(tag)}><X size={12} /></button></span>
                    ))}
                    <input value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); setTagDraft(""); } }} placeholder="Ajouter un tag..." />
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Colonne droite */}
          <div className="seColRight">
            {/* 2. Synopsis */}
            <section className="seCard seSynopsisCard">
              <h2>2. Synopsis</h2>
              <label className="seField isWide">
                <textarea
                  rows={7}
                  maxLength={1000}
                  value={form.synopsis}
                  onChange={(e) => updateField("synopsis", e.target.value)}
                  placeholder="Résumé de la série..."
                  className="seTextarea"
                />
                <span className="seCharCount">{form.synopsis.length} / 1000</span>
              </label>
            </section>

            {/* 4. Organisation de la série */}
            <section className="seCard seOrganizationCard">
              <h2>4. Organisation de la série</h2>
              <div className="seOrgLayout">
                <div className="seSeasonsList">
                  <div className="seSeasonsHeader">
                    <strong>Saisons</strong>
                    <Link className="seLinkBtn" href={`/studio/videos/new?series=${encodeURIComponent(seriesId)}&season=${episodes?.seasons.length ? Math.max(...episodes.seasons.map((season) => season.season_number)) + 1 : 1}`}><Plus size={14} /> Ajouter une saison</Link>
                  </div>
                  {(episodes?.seasons ?? []).map((season) => (
                    <button
                      key={season.season_number}
                      type="button"
                      className={`seSeasonItem ${selectedSeason === season.season_number ? "isActive" : ""}`}
                      onClick={() => setSelectedSeason(season.season_number)}
                    >
                      <span className="seSeasonDrag"><GripVertical size={14} /></span>
                      <span>
                        <strong>Saison {season.season_number}</strong>
                        <small>{(order[season.season_number] ?? []).length} épisode{(order[season.season_number] ?? []).length > 1 ? "s" : ""}</small>
                      </span>
                    </button>
                  ))}
                </div>

                <div className="seEpisodesPanel">
                  <div className="seEpisodesHeader">
                    <strong>Épisodes de la saison {selectedSeason}</strong>
                    <Link className="seLinkBtn" href={`/studio/videos/new?series=${encodeURIComponent(seriesId)}&season=${selectedSeason}`}><Plus size={14} /> Ajouter un épisode</Link>
                  </div>
                  <table className="seEpisodesTable">
                    <thead>
                      <tr><th>#</th><th>Titre</th><th>Durée</th><th>Statut</th><th /></tr>
                    </thead>
                    <tbody>
                      {(order[selectedSeason] ?? []).map((epId, idx) => {
                        const ep = episodesById[epId];
                        return (
                          <tr key={epId}>
                            <td className="seEpNum">{idx + 1}</td>
                            <td className="seEpTitle">{ep?.title ?? epId}</td>
                            <td className="seEpDuration">{formatDuration(ep?.duration_seconds ?? null)}</td>
                            <td>{ep ? episodeStatusBadge(ep) : null}</td>
                            <td className="seEpMoves">
                              {ep ? <Link href={`/watch/${encodeURIComponent(ep.id)}`} target="_blank" aria-label={`Aperçu de ${ep.title}`}><Eye size={15} /></Link> : null}
                              {ep ? <Link href={`/studio/media/${encodeURIComponent(ep.id)}`} aria-label={`Modifier ${ep.title}`}><Pencil size={15} /></Link> : null}
                              <button type="button" onClick={() => moveEpisode(selectedSeason, idx, idx - 1)} disabled={idx === 0} aria-label="Monter"><ChevronUp size={15} /></button>
                              <button type="button" onClick={() => moveEpisode(selectedSeason, idx, idx + 1)} disabled={idx === (order[selectedSeason]?.length ?? 0) - 1} aria-label="Descendre"><ChevronDown size={15} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <span className="seEpisodesCount">{(order[selectedSeason] ?? []).length} épisode{(order[selectedSeason] ?? []).length > 1 ? "s" : ""}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </StudioShell>
  );
}
