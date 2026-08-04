"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, FileVideo2, Loader2, Search, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { V7ImportPreview, V7ImportResult, V7ImportVideo, V7MigrationSnapshot } from "@/types/nino";

function formatDate(value: string | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes} min ${remainder.toString().padStart(2, "0")} s`;
}

function statusLabel(status: string) {
  if (status === "ready") return "Prête";
  if (status === "existing") return "Déjà importée";
  return "Invalide";
}

function moveVideoFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  const controls = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
  const index = controls.indexOf(document.activeElement as HTMLButtonElement);
  if (index < 0) return;
  const target = controls[index + (event.key === "ArrowUp" ? -1 : 1)];
  if (!target) return;
  event.preventDefault();
  target.focus();
}

export function V7ImportWorkspace() {
  const [snapshots, setSnapshots] = useState<V7MigrationSnapshot[]>([]);
  const [snapshotId, setSnapshotId] = useState("");
  const [preview, setPreview] = useState<V7ImportPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<V7ImportResult | null>(null);

  async function loadPreview(id: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const nextPreview = await api.v7ImportPreview(id);
      setPreview(nextPreview);
      const readyIds = nextPreview.videos.filter((video) => video.status === "ready").map((video) => video.source_id);
      setSelectedIds(new Set(readyIds));
      setSelectedVideoId(readyIds[0] ?? nextPreview.videos[0]?.source_id ?? null);
      setMappings(Object.fromEntries(nextPreview.legacy_user_ids.map((legacyId) => [legacyId, ""])));
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "Impossible de préparer cet import.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSnapshots() {
    setLoading(true);
    setError(null);
    try {
      const items = await api.v7MigrationSnapshots();
      const ready = items.filter((item) => item.status === "ready");
      setSnapshots(ready);
      if (ready[0]) {
        setSnapshotId(ready[0].id);
        await loadPreview(ready[0].id);
      } else {
        setPreview(null);
        setSnapshotId("");
        setLoading(false);
      }
    } catch (err) {
      setSnapshots([]);
      setPreview(null);
      setError(err instanceof Error ? err.message : "Impossible de charger les snapshots V7.");
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSnapshots();
  }, []);

  const filteredVideos = useMemo(() => {
    if (!preview) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return preview.videos;
    return preview.videos.filter((video) => `${video.title} ${video.source_id} ${video.description}`.toLowerCase().includes(normalized));
  }, [preview, query]);
  const selectedVideo = preview?.videos.find((video) => video.source_id === selectedVideoId) ?? null;
  const mappingsComplete = preview?.legacy_user_ids.every((legacyId) => Boolean(mappings[legacyId])) ?? false;

  function toggleVideo(video: V7ImportVideo) {
    if (video.status !== "ready") return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(video.source_id)) next.delete(video.source_id);
      else next.add(video.source_id);
      return next;
    });
  }

  async function runImport() {
    if (!preview || !selectedIds.size || !mappingsComplete || importing) return;
    const confirmed = window.confirm(`Importer ${selectedIds.size} vidéo${selectedIds.size > 1 ? "s" : ""} dans Nino V8 ? Les contenus déjà importés seront ignorés.`);
    if (!confirmed) return;
    setImporting(true);
    setError(null);
    setResult(null);
    try {
      const profileMappings = Object.fromEntries(Object.entries(mappings).filter(([, profileId]) => profileId && profileId !== "__skip__"));
      const nextResult = await api.importV7Videos(preview.snapshot_id, Array.from(selectedIds), profileMappings);
      setResult(nextResult);
      await loadPreview(preview.snapshot_id);
      setResult(nextResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L’import V7 a échoué.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="studioImportWorkspace">
      <header className="studioImportHeader">
        <div><h2>Importer les vidéos dans Nino V8</h2><p>Sélectionnez un snapshot, associez les utilisateurs V7 aux profils du foyer puis contrôlez chaque vidéo.</p></div>
        <label>Snapshot source<select value={snapshotId} onChange={(event) => { setSnapshotId(event.target.value); void loadPreview(event.target.value); }} disabled={loading || importing}>{snapshots.map((snapshot) => <option value={snapshot.id} key={snapshot.id}>{formatDate(snapshot.created_at)} · V7 {snapshot.source_version ?? "?"}</option>)}</select></label>
      </header>

      {error ? <div className="v7InlineError" role="alert"><AlertTriangle size={18} /><span>{error}</span><button type="button" onClick={() => snapshotId ? void loadPreview(snapshotId) : void loadSnapshots()}>Réessayer</button></div> : null}
      {result ? <div className="studioImportSuccess" role="status"><CheckCircle2 size={20} /><span><strong>Import terminé</strong>{result.counts.imported} vidéo{result.counts.imported > 1 ? "s" : ""} ajoutée{result.counts.imported > 1 ? "s" : ""}, {result.counts.skipped} ignorée{result.counts.skipped > 1 ? "s" : ""}, {result.counts.progress} progression{result.counts.progress > 1 ? "s" : ""} reprise{result.counts.progress > 1 ? "s" : ""}.</span></div> : null}
      {loading ? <div className="v7DetailState"><Loader2 className="spin" size={26} /><span>Préparation du mapping V7…</span></div> : null}
      {!loading && !error && !snapshots.length ? <div className="studioOperationalEmpty"><FileVideo2 size={32} /><div><h2>Aucun snapshot prêt</h2><p>Commencez par récupérer les métadonnées V7 depuis la section Administration.</p></div></div> : null}

      {!loading && preview ? (
        <>
          <section className="studioUserMapping">
            <header><Users size={20} /><div><h3>Correspondance des utilisateurs</h3><p>La progression et les favoris V7 seront rattachés au profil choisi.</p></div></header>
            {preview.legacy_user_ids.length ? <div className="studioMappingGrid">{preview.legacy_user_ids.map((legacyId) => <label key={legacyId}><span>Utilisateur V7<code>{legacyId}</code></span><select value={mappings[legacyId] ?? ""} onChange={(event) => setMappings((current) => ({ ...current, [legacyId]: event.target.value }))}><option value="">Choisir une destination…</option>{preview.users.map((user) => <optgroup label={`${user.display_name} · ${user.email}`} key={user.id}>{user.profiles.map((profile) => <option value={profile.id} key={profile.id}>{profile.name}</option>)}</optgroup>)}<option value="__skip__">Ne pas reprendre ses données</option></select></label>)}</div> : <p className="studioMappingEmpty">Aucune donnée utilisateur n’est présente dans ce snapshot.</p>}
          </section>

          <div className="studioImportLayout">
            <section className="studioImportList">
              <header><div><h3>Vidéos détectées</h3><p>{preview.counts.ready} prête{preview.counts.ready > 1 ? "s" : ""} · {preview.counts.existing} déjà importée{preview.counts.existing > 1 ? "s" : ""} · {preview.counts.invalid} invalide{preview.counts.invalid > 1 ? "s" : ""}</p></div><span>{selectedIds.size} sélectionnée{selectedIds.size > 1 ? "s" : ""}</span></header>
              <label className="studioSearch"><Search size={18} /><span className="srOnly">Rechercher une vidéo à importer</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre, description ou identifiant" /></label>
              <div className="studioImportRows" onKeyDown={moveVideoFocus}>
                {filteredVideos.map((video) => <div className={selectedVideoId === video.source_id ? "isActive" : undefined} key={video.source_id || video.title}><input type="checkbox" checked={selectedIds.has(video.source_id)} onChange={() => toggleVideo(video)} disabled={video.status !== "ready"} aria-label={`Sélectionner ${video.title}`} /><button type="button" onClick={() => setSelectedVideoId(video.source_id)}><span><strong>{video.title}</strong><small>{video.source_id || "Identifiant absent"}</small></span><span className={`studioStatus is${video.status[0]?.toUpperCase()}${video.status.slice(1)}`}>{statusLabel(video.status)}</span></button></div>)}
                {!filteredVideos.length ? <p>Aucune vidéo ne correspond à cette recherche.</p> : null}
              </div>
            </section>

            <aside className="studioImportSheet">
              {selectedVideo ? <><header><span className={`studioStatus is${selectedVideo.status[0]?.toUpperCase()}${selectedVideo.status.slice(1)}`}>{statusLabel(selectedVideo.status)}</span><h3>{selectedVideo.title}</h3><p>{selectedVideo.description || "Aucune description."}</p></header><dl><div><dt>Fichier</dt><dd>{selectedVideo.source_path ?? "Absent"}</dd></div><div><dt>Durée</dt><dd>{formatDuration(selectedVideo.duration_seconds)}</dd></div><div><dt>Image</dt><dd>{selectedVideo.width && selectedVideo.height ? `${selectedVideo.width} × ${selectedVideo.height}` : "Inconnue"}{selectedVideo.fps ? ` · ${selectedVideo.fps} fps` : ""}</dd></div><div><dt>Publication</dt><dd>{formatDate(selectedVideo.publish_at)}</dd></div><div><dt>Série</dt><dd>{selectedVideo.series_source_id ?? "Aucune"} · S{selectedVideo.season_number ?? "?"} E{selectedVideo.episode_number ?? "?"}</dd></div><div><dt>Encodage</dt><dd>{selectedVideo.encoding_status ?? "Inconnu"} · HLS {selectedVideo.hls_status ?? "inconnu"}</dd></div><div><dt>Sous-titres</dt><dd>{selectedVideo.has_subtitles ? "Présents" : "Absents"}</dd></div></dl>{selectedVideo.warnings.length ? <ul>{selectedVideo.warnings.map((warning) => <li key={warning}><AlertTriangle size={15} />{warning}</li>)}</ul> : null}</> : <div className="v7DetailState"><FileVideo2 size={25} /><p>Sélectionnez une vidéo pour contrôler son mapping.</p></div>}
            </aside>
          </div>

          <footer className="studioImportFooter"><div><strong>{selectedIds.size} vidéo{selectedIds.size > 1 ? "s" : ""} à importer</strong><small>{mappingsComplete ? "Correspondances utilisateur complètes" : "Choisissez une destination pour chaque utilisateur V7"}</small></div><button className="primaryButton" type="button" onClick={runImport} disabled={!selectedIds.size || !mappingsComplete || importing}>{importing ? <Loader2 className="spin" size={18} /> : <Download size={18} />}{importing ? "Import en cours…" : "Importer dans V8"}</button></footer>
        </>
      ) : null}
    </section>
  );
}
