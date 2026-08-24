"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  CircleOff,
  Database,
  Film,
  HardDrive,
  ScanLine,
  Users
} from "lucide-react";
import { StudioShell } from "@/components/studio/StudioShell";
import { useStudioData } from "@/hooks/useStudioData";
import type { MediaItem } from "@/types/nino";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

type StorageCategory = {
  id: string;
  label: string;
  color: string;
  count: number;
  bytes: number;
};

export default function AdministrationPage() {
  const { media, stats, loading, error, accessDenied, refresh } = useStudioData();

  const storage = useMemo(() => {
    const categories: StorageCategory[] = [
      { id: "movies", label: "Vidéos", color: "#7cc7ff", count: 0, bytes: 0 },
      { id: "shorts", label: "Flashy", color: "#ffc266", count: 0, bytes: 0 },
      { id: "live", label: "Direct", color: "#ff6b73", count: 0, bytes: 0 },
      { id: "images", label: "Images", color: "#61d99c", count: 0, bytes: 0 }
    ];

    media.forEach((item) => {
      let category: StorageCategory | undefined;
      switch (item.kind) {
        case "movie":
          category = categories.find((c) => c.id === "movies");
          break;
        case "short":
          category = categories.find((c) => c.id === "shorts");
          break;
        case "live":
          category = categories.find((c) => c.id === "live");
          break;
      }
      if (category) {
        category.count += 1;
        category.bytes += item.file_size_bytes ?? 0;
      }
      // Count images (poster + backdrop + thumbnails)
      const imageBytes = 500000; // Estimate ~500KB per image
      if (item.poster_url) {
        const images = categories.find((c) => c.id === "images")!;
        images.bytes += imageBytes;
      }
      if (item.backdrop_url) {
        const images = categories.find((c) => c.id === "images")!;
        images.bytes += imageBytes;
      }
      if (item.thumbnail_url) {
        const images = categories.find((c) => c.id === "images")!;
        images.bytes += imageBytes;
      }
    });

    const totalBytes = categories.reduce((sum, cat) => sum + cat.bytes, 0);
    const totalFiles = categories.reduce((sum, cat) => sum + cat.count, 0);

    return { categories, totalBytes, totalFiles };
  }, [media]);

  const rows: Array<[string, number, typeof Film, string]> = stats ? [
    ["Médias", stats.media, Film, "Contenus enregistrés"],
    ["Utilisateurs", stats.users, Users, "Comptes Nino"],
    ["Bibliothèques", stats.libraries, Database, "Sources configurées"],
    ["Scans", stats.scan_jobs, ScanLine, "Jobs connus"],
    ["Transcodages", stats.transcode_jobs, Activity, "Jobs connus"]
  ] : [];

  return (
    <StudioShell>
      <div className="studioControlRoom studioModernControlRoom">
        <div className="studioControlMain">
          {loading && <div className="studioControlSkeleton" aria-label="Chargement" aria-busy="true"><span /><span /><span /><span /></div>}
          {error && !loading && <div className="studioAccessDenied"><p role="alert">{error}</p><button type="button" onClick={() => refresh()}>Réessayer</button></div>}
          {accessDenied && !loading && <div className="studioAccessDenied"><CircleOff size={30} /><h1>Accès administrateur requis</h1><p>Votre compte peut regarder Nino, mais il ne peut pas ouvrir la régie éditoriale.</p></div>}

          {!loading && !error && !accessDenied && stats ? (
            <main className="studioControlContent">
              <header className="studioCommandHeader">
                <div><h1>Système</h1><p>État administratif réellement exposé par Nino V8.</p></div>
              </header>
              <section className="studioSystemTable">
                <header><span>Ressource</span><span>État</span><span>Volume</span></header>
                {rows.map(([label, value, Icon, description]) => (
                  <div key={label}>
                    <Icon size={19} aria-hidden="true" />
                    <span><strong>{label}</strong><small>{description}</small></span>
                    <span className="studioSystemOnline"><i />Connecté</span>
                    <b>{value}</b>
                  </div>
                ))}
              </section>

              <section className="studioStorageOverview" aria-labelledby="studio-storage-overview-title">
                <div className="studioStorageOverviewHeader">
                  <HardDrive size={22} aria-hidden="true" />
                  <div>
                    <h2 id="studio-storage-overview-title">Stockage système</h2>
                    <p>Vue d'ensemble de l'utilisation du stockage par type de contenu.</p>
                  </div>
                </div>

                <div className="studioStorageMetrics">
                  <div className="studioStorageMetricMain">
                    <span className="studioStorageMetricValue">{formatBytes(storage.totalBytes)}</span>
                    <span className="studioStorageMetricLabel">Espace utilisé</span>
                  </div>
                  <div className="studioStorageMetricSecondary">
                    <span className="studioStorageMetricValue">{storage.totalFiles}</span>
                    <span className="studioStorageMetricLabel">Fichiers média</span>
                  </div>
                </div>

                <div className="studioStorageBar">
                  {storage.categories.map((cat) => {
                    const percent = storage.totalBytes > 0 ? (cat.bytes / storage.totalBytes) * 100 : 0;
                    return percent > 0 ? (
                      <div
                        key={cat.id}
                        className="studioStorageBarSegment"
                        style={{ width: `${percent}%`, backgroundColor: cat.color }}
                        title={`${cat.label}: ${formatBytes(cat.bytes)} (${percent.toFixed(1)}%)`}
                      />
                    ) : null;
                  })}
                </div>

                <div className="studioStorageLegend">
                  {storage.categories.map((cat) => {
                    const percent = storage.totalBytes > 0 ? (cat.bytes / storage.totalBytes) * 100 : 0;
                    return (
                      <div key={cat.id} className="studioStorageLegendItem">
                        <span className="studioStorageLegendDot" style={{ backgroundColor: cat.color }} />
                        <span className="studioStorageLegendLabel">{cat.label}</span>
                        <span className="studioStorageLegendCount">{cat.count} fichier{cat.count > 1 ? "s" : ""}</span>
                        <span className="studioStorageLegendSize">{formatBytes(cat.bytes)}</span>
                        <span className="studioStorageLegendPercent">{percent.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="studioStorageIndexer" aria-labelledby="studio-transcode-title">
                <div className="studioStorageIndexerCopy">
                  <Activity size={22} aria-hidden="true" />
                  <div>
                    <h2 id="studio-transcode-title">Worker et file de transcodage</h2>
                    <p>Démarrer ou arrêter le worker, suivre son statut et les jobs en temps réel.</p>
                  </div>
                </div>
                <Link className="secondaryButton" href="/studio/transcode">
                  <Activity size={18} aria-hidden="true" /> Ouvrir le transcodage
                </Link>
              </section>
            </main>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}