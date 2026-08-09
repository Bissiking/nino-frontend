"use client";

import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, FileStack, FileVideo2, FolderOpen, HardDrive, Layers3, Loader2, Play, RefreshCw, Save, Upload, VideoOff, X } from "lucide-react";
import { MediaPlayer } from "@/components/MediaPlayer";
import { api } from "@/lib/api";
import type { MediaItem, MediaWritePayload, StreamDecision } from "@/types/nino";

type SourceMode = "file" | "hls";

type Props = {
  kind: "movie" | "short";
  media?: MediaItem | null;
  onCancel: () => void;
  onSaved: (media: MediaItem) => void;
  variant?: "panel" | "page";
  decision?: StreamDecision | null;
  previewError?: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
};

function formatBytes(bytes: number | null | undefined) {
  if (bytes == null) return "Non renseignée";
  if (bytes < 1024) return `${bytes} o`;
  const units = ["Ko", "Mo", "Go", "To"];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: value >= 10 ? 1 : 2 })} ${unit}`;
}

function initialForm(kind: "movie" | "short", media?: MediaItem | null) {
  return {
    kind,
    title: media?.title ?? "",
    synopsis: media?.synopsis ?? "",
    year: media?.year?.toString() ?? "",
    duration: media?.duration_seconds?.toString() ?? "0",
    genres: media?.genres.join(", ") ?? (kind === "short" ? "Flashy" : ""),
    posterUrl: media?.poster_url ?? "",
    backdropUrl: media?.backdrop_url ?? "",
    visibility: media?.visibility ?? "draft",
    publishAt: media?.publish_at ? media.publish_at.slice(0, 16) : "",
    isAvailable: media?.is_available ?? true
  };
}

export function MediaEditor({ kind, media, onCancel, onSaved, variant = "panel", decision = null, previewError = null, refreshing = false, onRefresh }: Props) {
  const [form, setForm] = useState(() => initialForm(kind, media));
  const [sourceMode, setSourceMode] = useState<SourceMode>("file");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(media);
  const isPage = variant === "page";

  useEffect(() => {
    setForm(initialForm(kind, media));
    setFiles([]);
    setError(null);
    setSuccess(null);
  }, [kind, media]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (sourceMode === "hls") input.setAttribute("webkitdirectory", "");
    else input.removeAttribute("webkitdirectory");
  }, [sourceMode]);

  const packageInfo = useMemo(() => {
    const playlists = files.filter((file) => file.name.toLowerCase().endsWith(".m3u8")).length;
    const segments = files.filter((file) => /\.(ts|m4s)$/i.test(file.name)).length;
    const bytes = files.reduce((total, file) => total + file.size, 0);
    return { playlists, segments, bytes };
  }, [files]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setError(null);
  }

  function dropFiles(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const dropped = Array.from(event.dataTransfer.files ?? []);
    if (!dropped.length) return;
    setFiles(sourceMode === "file" ? dropped.slice(0, 1) : dropped);
    setError(null);
  }

  function moveSourceMode(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const nextMode: SourceMode = sourceMode === "file" ? "hls" : "file";
    setSourceMode(nextMode);
    setFiles([]);
    const button = event.currentTarget.querySelector<HTMLButtonElement>(`[data-source-mode="${nextMode}"]`);
    button?.focus();
  }

  function payload(): MediaWritePayload {
    return {
      kind: form.kind,
      title: form.title.trim(),
      synopsis: form.synopsis.trim(),
      year: form.year ? Number(form.year) : null,
      duration_seconds: Number(form.duration || 0),
      genres: form.genres.split(",").map((genre) => genre.trim()).filter(Boolean),
      poster_url: form.posterUrl.trim() || null,
      backdrop_url: form.backdropUrl.trim() || null,
      visibility: form.visibility,
      publish_at: form.publishAt ? new Date(form.publishAt).toISOString() : null,
      is_available: form.isAvailable
    };
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.title.trim()) {
      setError("Donnez un titre au contenu avant de l’enregistrer.");
      return;
    }
    if (!isEditing && !files.length) {
      setError(sourceMode === "hls" ? "Sélectionnez le dossier complet du paquet HLS." : "Sélectionnez une vidéo à envoyer.");
      return;
    }
    if (!isEditing && sourceMode === "hls" && (!packageInfo.playlists || !packageInfo.segments)) {
      setError("Le dossier HLS doit contenir au moins une playlist .m3u8 et des segments .ts ou .m4s.");
      return;
    }

    setBusy(true);
    try {
      const saved = isEditing && media
        ? await api.updateAdminMedia(media.id, payload())
        : await api.createAdminMedia({ ...payload(), source_mode: sourceMode }, files);
      setSuccess(isEditing ? "Les informations ont été mises à jour." : "Le média est prêt dans Nino Studio.");
      onSaved(saved);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "L’enregistrement du média a échoué.");
    } finally {
      setBusy(false);
    }
  }

  const sourceSection = !isEditing ? (
    <section className="mediaSourceSection" aria-labelledby="media-source-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-source-title">1) Fichier source</h3><p>Choisissez une vidéo ou un paquet HLS déjà préparé.</p></div>
      <div className="mediaSourceModes" role="radiogroup" aria-label="Format de la source" onKeyDown={moveSourceMode}>
        <button data-source-mode="file" type="button" role="radio" tabIndex={sourceMode === "file" ? 0 : -1} aria-checked={sourceMode === "file"} className={sourceMode === "file" ? "isActive" : undefined} onClick={() => { setSourceMode("file"); setFiles([]); }}><FileVideo2 size={21} /><span><strong>Fichier vidéo</strong><small>MP4, M4V, MOV ou WebM</small></span></button>
        <button data-source-mode="hls" type="button" role="radio" tabIndex={sourceMode === "hls" ? 0 : -1} aria-checked={sourceMode === "hls"} className={sourceMode === "hls" ? "isActive" : undefined} onClick={() => { setSourceMode("hls"); setFiles([]); }}><Layers3 size={21} /><span><strong>HLS multi-qualités</strong><small>Playlists .m3u8 + segments .ts</small></span></button>
      </div>
      <label className={`mediaDropzone ${files.length ? "hasFiles" : ""} ${dragging ? "isDragging" : ""}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }} onDrop={dropFiles}>
        <input ref={inputRef} type="file" multiple={sourceMode === "hls"} accept={sourceMode === "file" ? "video/mp4,video/x-m4v,video/quicktime,video/webm,.mp4,.m4v,.mov,.webm" : undefined} onChange={selectFiles} />
        {files.length ? <CheckCircle2 size={28} /> : sourceMode === "hls" ? <FolderOpen size={28} /> : <Upload size={28} />}
        <span><strong>{files.length ? `${files.length} fichier${files.length > 1 ? "s" : ""} sélectionné${files.length > 1 ? "s" : ""}` : sourceMode === "hls" ? "Glissez le dossier HLS ici" : "Glissez-déposez votre vidéo ici"}</strong><small>{sourceMode === "hls" ? `${packageInfo.playlists} playlist(s) · ${packageInfo.segments} segment(s)` : files[0]?.name ?? "ou sélectionnez un fichier depuis votre appareil"}</small></span>
      </label>
      <small className="v7UploadHelp">MP4, M4V, MOV ou WebM. La taille maximale est contrôlée par le serveur.</small>
    </section>
  ) : null;

  const contentSection = (
    <section className="mediaFieldsSection" aria-labelledby="media-details-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-details-title">{isEditing ? "Contenu" : "2) Métadonnées"}</h3><p>Les informations que les spectateurs verront dans le catalogue.</p></div>
      <div className="mediaFieldGrid">
        <label><span>Format</span><select value={form.kind} onChange={(event) => update("kind", event.target.value as "movie" | "short")}><option value="movie">Vidéo</option><option value="short">Flashy</option></select></label>
        <label className="isWide"><span>Titre</span><input required maxLength={255} value={form.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label className="isWide"><span>Synopsis</span><textarea rows={7} maxLength={10000} value={form.synopsis} onChange={(event) => update("synopsis", event.target.value)} /></label>
        <label><span>Année</span><input type="number" min="1900" max="2200" value={form.year} onChange={(event) => update("year", event.target.value)} /></label>
        <label><span>Durée en secondes</span><input type="number" min="0" value={form.duration} onChange={(event) => update("duration", event.target.value)} /></label>
        <label className="isWide"><span>Genres <small>séparés par des virgules</small></span><input value={form.genres} onChange={(event) => update("genres", event.target.value)} /></label>
      </div>
    </section>
  );

  const visualSection = (
    <section className="mediaFieldsSection" aria-labelledby="media-visuals-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-visuals-title">{isEditing ? "Visuels" : "4) Visuels"}</h3><p>Affiche pour les cartes, arrière-plan pour les pages de lecture.</p></div>
      <div className="mediaFieldGrid">
        <label className="isWide"><span>URL de l’affiche</span><input type="url" value={form.posterUrl} onChange={(event) => update("posterUrl", event.target.value)} placeholder="https://…" /></label>
        <label className="isWide"><span>URL de l’arrière-plan</span><input type="url" value={form.backdropUrl} onChange={(event) => update("backdropUrl", event.target.value)} placeholder="https://…" /></label>
      </div>
    </section>
  );

  const publishSection = (
    <section className="mediaPublishSection" aria-labelledby="media-publish-title">
      <div className="mediaEditorSectionTitle"><h3 id="media-publish-title">{isEditing ? "Publication" : "3) Publication"}</h3><p>Un brouillon reste visible uniquement dans Nino Studio.</p></div>
      <div className="mediaFieldGrid">
        <label><span>Visibilité</span><select value={form.visibility} onChange={(event) => update("visibility", event.target.value)}><option value="draft">Brouillon</option><option value="private">Privé</option><option value="public">Public</option></select></label>
        <label><span>Publication programmée</span><input type="datetime-local" value={form.publishAt} onChange={(event) => update("publishAt", event.target.value)} /></label>
        <label className="mediaCheckbox isWide"><input type="checkbox" checked={form.isAvailable} onChange={(event) => update("isAvailable", event.target.checked)} /><span>Autoriser la lecture dès que le contenu est publié</span></label>
      </div>
    </section>
  );

  const feedback = (
    <>
      {error ? <div className="mediaEditorMessage isError" role="alert"><AlertCircle size={18} />{error}</div> : null}
      {success ? <div className="mediaEditorMessage isSuccess" role="status"><CheckCircle2 size={18} />{success}</div> : null}
    </>
  );

  if (isPage && media) {
    const previewReady = Boolean(decision);
    const canOpenPublicPlayer = media.visibility === "public" && media.is_available && Boolean(media.source_kind);
    return (
      <section className="mediaEditPage">
        <header className="mediaEditPageHeader">
          <div className="mediaEditPageTitle">
            <button className="studioIconButton" type="button" onClick={onCancel} aria-label="Retour à la liste des vidéos"><ArrowLeft size={20} /></button>
            <div><h1>{media.title}</h1><p>Modifiez la fiche, contrôlez le flux puis enregistrez.</p></div>
          </div>
          <div className="mediaEditPageActions">
            {canOpenPublicPlayer ? <Link className="secondaryButton" href={`/watch/${encodeURIComponent(media.id)}`} target="_blank"><Play size={18} aria-hidden="true" />Lire</Link> : null}
            <button className="secondaryButton" type="button" onClick={onRefresh} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : undefined} size={18} aria-hidden="true" />{refreshing ? "Actualisation…" : "Rafraîchir"}</button>
            <button className="primaryButton mediaEditDesktopSave" type="submit" form="media-edit-form" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}{busy ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </header>

        <form id="media-edit-form" className="mediaEditLayout" onSubmit={submit}>
          <aside className="mediaEditAside">
            <section className="mediaEditPreview" aria-labelledby="media-preview-title">
              <header><div><h2 id="media-preview-title">Aperçu</h2><p>{form.kind === "short" ? "Format vertical Flashy" : "Format vidéo 16:9"}</p></div><span className={`studioStatus ${previewReady ? "isReady" : "isDraft"}`}>{previewReady ? "Lisible" : "Indisponible"}</span></header>
              <div className={form.kind === "short" ? "mediaEditPlayer isPortrait" : "mediaEditPlayer"}>
                {decision ? <MediaPlayer decision={decision} poster={media.backdrop_url ?? media.poster_url} /> : <div className="mediaEditPreviewEmpty"><VideoOff size={30} aria-hidden="true" /><strong>Aperçu indisponible</strong><p>{previewError ?? "Aucune source lisible n’est attachée à ce média."}</p></div>}
              </div>
            </section>

            <section className="mediaEditFiles" aria-labelledby="media-files-title">
              <header><h2 id="media-files-title">Fichiers</h2></header>
              <dl>
                <div><FileStack size={18} aria-hidden="true" /><dt>Source</dt><dd>{media.source_kind === "hls" ? "Paquet HLS" : media.source_kind === "file" ? "Fichier vidéo" : "Inconnue"}</dd></div>
                <div><FileVideo2 size={18} aria-hidden="true" /><dt>Entrée</dt><dd>{media.source_filename ?? "Non renseignée"}</dd></div>
                <div><HardDrive size={18} aria-hidden="true" /><dt>Taille</dt><dd>{formatBytes(media.file_size_bytes)}</dd></div>
                {media.source_origin === "luma_storage" ? <div><FolderOpen size={18} aria-hidden="true" /><dt>Origine</dt><dd>Stockage LUMA</dd></div> : null}
                {media.hls_variants?.length ? <div className="mediaHlsQualityRow"><Layers3 size={18} aria-hidden="true" /><dt>Qualités</dt><dd><ul className="mediaHlsVariants">{media.hls_variants.map((variant) => <li key={variant.path}>{variant.label}</li>)}</ul></dd></div> : null}
              </dl>
            </section>
          </aside>

          <div className="mediaEditMain">
            {contentSection}
            {publishSection}
            {visualSection}
            {feedback}
          </div>

          <footer className="mediaEditActionBar">
            <span>{success ?? "Les changements restent privés jusqu’à l’enregistrement."}</span>
            <div><button className="secondaryButton" type="button" onClick={onCancel} disabled={busy}>Retour au Studio</button><button className="primaryButton" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : <Save size={18} />}{busy ? "Enregistrement…" : "Enregistrer les modifications"}</button></div>
          </footer>
        </form>
      </section>
    );
  }

  return (
    <form className="mediaEditor v7Upload" onSubmit={submit}>
      <header className="mediaEditorHeader v7UploadHeader">
        <div><span>Nino Studio</span><h2>{kind === "short" ? "Upload Flashy" : "Upload vidéo"}</h2><p>Déposez votre fichier, vérifiez les informations puis envoyez-le. Le traitement démarre ensuite côté backend.</p></div>
        <button className="studioIconButton" type="button" onClick={onCancel} aria-label="Fermer l’éditeur"><X size={19} /></button>
      </header>
      <div className="v7UploadGrid">
        {sourceSection}
        {contentSection}
        <div className="v7UploadSettings">{publishSection}{visualSection}</div>
        {files.length ? <section className="v7UploadPreview" aria-labelledby="upload-preview-title"><div className="mediaEditorSectionTitle"><h3 id="upload-preview-title">Aperçu rapide</h3><p>Le détail technique sera enrichi après le traitement.</p></div><dl><div><dt>Fichier</dt><dd>{sourceMode === "hls" ? `${files.length} éléments HLS` : files[0]?.name}</dd></div><div><dt>Taille</dt><dd>{formatBytes(packageInfo.bytes)}</dd></div><div><dt>Source</dt><dd>{sourceMode === "hls" ? "HLS multi-qualités" : files[0]?.type || "Vidéo"}</dd></div><div><dt>Statut</dt><dd>Prêt à envoyer</dd></div></dl></section> : null}
      </div>
      {feedback}
      {busy ? <div className="v7UploadProgress" role="status"><span aria-hidden="true"><i /></span><strong>Envoi vers Nino en cours…</strong></div> : null}
      <footer className="mediaEditorFooter"><button className="secondaryButton" type="button" onClick={onCancel} disabled={busy}>Annuler</button><button className="primaryButton" type="submit" disabled={busy}>{busy ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}{busy ? "Enregistrement…" : "Importer le média"}</button></footer>
    </form>
  );
}
