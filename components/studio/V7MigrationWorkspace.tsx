"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  FileJson2,
  Loader2,
  RefreshCw,
  ScanLine,
  Search,
  Video
} from "lucide-react";
import { api } from "@/lib/api";
import type { V7MigrationSnapshot, V7MigrationSnapshotDetail } from "@/types/nino";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function exportData(payload: unknown): JsonRecord | null {
  const root = asRecord(payload);
  if (!root) return null;
  if (root.success === true) return asRecord(root.data) ?? root;
  return root;
}

function snapshotVideos(payload: unknown): JsonRecord[] {
  const videos = exportData(payload)?.videos;
  return Array.isArray(videos) ? videos.map(asRecord).filter((video): video is JsonRecord => video !== null) : [];
}

function tableCounts(payload: unknown): Array<[string, number]> {
  const tables = asRecord(exportData(payload)?.tables);
  if (!tables) return [];
  return Object.entries(tables).map(([name, rows]) => [name, Array.isArray(rows) ? rows.length : 0]);
}

function videoRow(video: JsonRecord) {
  return asRecord(video.row) ?? video;
}

function firstText(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function videoTitle(video: JsonRecord, index: number) {
  return firstText(videoRow(video), ["title", "name", "titre", "video_title"]) ?? `Vidéo ${index + 1}`;
}

function videoId(video: JsonRecord, index: number) {
  return firstText(videoRow(video), ["id", "video_id", "uuid", "slug"]) ?? String(index + 1);
}

function formatDate(value: string | null) {
  if (!value) return "Date inconnue";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function statusInfo(status: string) {
  if (status === "ready") return { label: "Prêt", className: "isReady", Icon: CheckCircle2 };
  if (status === "failed") return { label: "Échec", className: "isFailed", Icon: AlertTriangle };
  return { label: "En cours", className: "isPending", Icon: Clock3 };
}

function SnapshotStatus({ status }: { status: string }) {
  const info = statusInfo(status);
  const StatusIcon = info.Icon;
  return <span className={`studioStatus ${info.className}`}><StatusIcon size={13} aria-hidden="true" />{info.label}</span>;
}

function JsonSection({ title, value, open = false }: { title: string; value: unknown; open?: boolean }) {
  const empty = value === null || value === undefined || (Array.isArray(value) && value.length === 0);
  return (
    <details className="v7JsonSection" open={open}>
      <summary>{title}<span>{empty ? "Aucune donnée" : "JSON complet"}</span></summary>
      <pre>{JSON.stringify(value ?? null, null, 2)}</pre>
    </details>
  );
}

export function V7MigrationWorkspace() {
  const [snapshots, setSnapshots] = useState<V7MigrationSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<V7MigrationSnapshotDetail | null>(null);
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [query, setQuery] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailRequest = useRef(0);

  async function openSnapshot(id: string) {
    const requestId = ++detailRequest.current;
    setSelectedId(id);
    setLoadingDetail(true);
    setError(null);
    try {
      const nextDetail = await api.v7MigrationSnapshot(id);
      if (requestId !== detailRequest.current) return;
      setDetail(nextDetail);
      setSelectedVideo(0);
      setQuery("");
    } catch (err) {
      if (requestId === detailRequest.current) setError(err instanceof Error ? err.message : "Impossible de lire ce snapshot.");
    } finally {
      if (requestId === detailRequest.current) setLoadingDetail(false);
    }
  }

  async function refreshSnapshots(preferredId?: string) {
    setLoadingList(true);
    setError(null);
    try {
      const nextSnapshots = await api.v7MigrationSnapshots();
      setSnapshots(nextSnapshots);
      const nextId = preferredId ?? selectedId ?? nextSnapshots[0]?.id;
      if (nextId) await openSnapshot(nextId);
      else {
        setSelectedId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les récupérations V7.");
    } finally {
      setLoadingList(false);
    }
  }

  async function createSnapshot() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const created = await api.createV7MigrationSnapshot();
      await refreshSnapshots(created.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "La récupération V7 a échoué.";
      await refreshSnapshots();
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    void refreshSnapshots();
  }, []);

  const videos = useMemo(() => snapshotVideos(detail?.payload), [detail]);
  const tables = useMemo(() => tableCounts(detail?.payload), [detail]);
  const filteredVideos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return videos.map((video, index) => ({ video, index }));
    return videos.map((video, index) => ({ video, index })).filter(({ video, index }) => `${videoTitle(video, index)} ${videoId(video, index)}`.toLowerCase().includes(normalized));
  }, [query, videos]);
  const activeVideo = videos[selectedVideo] ?? null;

  return (
    <section className="studioV7Workspace">
      <header className="v7MigrationHeader">
        <div><h2>Récupération des métadonnées Nino V7</h2><p>Crée un snapshot de staging depuis LUMA, sans modifier le catalogue V8.</p></div>
        <button className="primaryButton" type="button" onClick={createSnapshot} disabled={creating}>
          {creating ? <Loader2 className="spin" size={18} aria-hidden="true" /> : <ScanLine size={18} aria-hidden="true" />}
          {creating ? "Récupération en cours…" : "Récupérer depuis V7"}
        </button>
      </header>

      {error ? <div className="v7InlineError" role="alert"><AlertTriangle size={18} aria-hidden="true" /><span>{error}</span><button type="button" onClick={() => void refreshSnapshots()}>Réessayer</button></div> : null}
      <p className="v7OperationStatus" role="status" aria-live="polite">{creating ? "L’export V7 est en cours de téléchargement. Cette opération peut prendre jusqu’à une minute." : ""}</p>

      <div className="v7MigrationLayout">
        <aside className="v7SnapshotRail" aria-label="Historique des récupérations V7">
          <header><h3>Récupérations</h3><button className="studioIconButton" type="button" onClick={() => void refreshSnapshots()} disabled={loadingList || creating} aria-label="Actualiser les récupérations"><RefreshCw className={loadingList ? "spin" : undefined} size={17} /></button></header>
          {loadingList && !snapshots.length ? <div className="v7RailState"><Loader2 className="spin" size={20} /><span>Chargement…</span></div> : null}
          {!loadingList && !snapshots.length ? <div className="v7RailState"><FileJson2 size={22} /><span>Aucun snapshot</span><small>Lancez une première récupération.</small></div> : null}
          <div className="v7SnapshotList">
            {snapshots.map((snapshot) => (
              <button className={selectedId === snapshot.id ? "isSelected" : undefined} type="button" key={snapshot.id} onClick={() => void openSnapshot(snapshot.id)}>
                <span><strong>{formatDate(snapshot.created_at)}</strong><small>V7 {snapshot.source_version ?? "version inconnue"}</small></span>
                <SnapshotStatus status={snapshot.status} />
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            ))}
          </div>
        </aside>

        <div className="v7SnapshotContent">
          {loadingDetail ? <div className="v7DetailState"><Loader2 className="spin" size={24} /><span>Lecture du snapshot…</span></div> : null}
          {!loadingDetail && !detail ? <div className="v7DetailState"><Database size={26} /><h3>Sélectionnez une récupération</h3><p>Son contenu, ses tables et ses vidéos apparaîtront ici.</p></div> : null}
          {!loadingDetail && detail ? (
            <>
              <header className="v7SnapshotSummary">
                <div><SnapshotStatus status={detail.status} /><h3>Snapshot du {formatDate(detail.created_at)}</h3><p>{detail.source_url}</p></div>
                <dl>
                  <div><dt>Tables</dt><dd>{formatNumber(detail.table_count)}</dd></div>
                  <div><dt>Lignes</dt><dd>{formatNumber(detail.row_count)}</dd></div>
                  <div><dt>Vidéos</dt><dd>{formatNumber(detail.video_count)}</dd></div>
                </dl>
              </header>

              {detail.status === "failed" ? <div className="v7SnapshotFailure" role="alert"><AlertTriangle size={20} /><div><strong>{detail.error_code ?? "Échec de récupération"}</strong><p>{detail.error_message ?? "Le backend n’a pas pu récupérer cet export."}</p></div></div> : null}

              {detail.status === "ready" ? (
                <div className="v7PreviewWorkspace">
                  <div className="v7PreviewIndex">
                    <div className="v7PreviewTabs">
                      <span><Video size={17} />{formatNumber(videos.length)} vidéos</span>
                      <span><Database size={17} />{formatNumber(tables.length)} tables</span>
                    </div>
                    <label className="studioSearch v7Search"><Search size={17} /><span className="srOnly">Rechercher une vidéo V7</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titre ou identifiant V7" /></label>
                    <div className="v7VideoList">
                      {filteredVideos.map(({ video, index }) => <button type="button" className={selectedVideo === index ? "isSelected" : undefined} key={`${videoId(video, index)}-${index}`} onClick={() => setSelectedVideo(index)}><span><strong>{videoTitle(video, index)}</strong><small>ID {videoId(video, index)}</small></span><ChevronRight size={17} /></button>)}
                      {!filteredVideos.length ? <p>Aucune vidéo ne correspond à cette recherche.</p> : null}
                    </div>
                    <details className="v7TableInventory"><summary>Voir les tables récupérées</summary><ul>{tables.map(([name, count]) => <li key={name}><span>{name}</span><strong>{formatNumber(count)}</strong></li>)}</ul></details>
                  </div>

                  <article className="v7VideoSheet">
                    {activeVideo ? (
                      <>
                        <header><span>Fiche de préparation V7</span><h3>{videoTitle(activeVideo, selectedVideo)}</h3><p>Identifiant {videoId(activeVideo, selectedVideo)} · toutes les données reçues sont conservées ci-dessous.</p></header>
                        <JsonSection title="Informations principales" value={activeVideo.row ?? activeVideo} open />
                        <JsonSection title="Relations" value={activeVideo.relations} open />
                        <JsonSection title="Fichiers et assets" value={activeVideo.assets} open />
                      </>
                    ) : <div className="v7DetailState"><Video size={24} /><h3>Aucune vidéo dans cet export</h3><p>Les tables restent disponibles dans l’inventaire.</p></div>}
                  </article>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
