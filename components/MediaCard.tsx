"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock3, Eye, Loader2, Play } from "lucide-react";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { MediaItem } from "@/types/nino";

function remainingLabel(item: MediaItem): string | null {
  if (typeof item.position_seconds !== "number" || item.position_seconds == null) return null;
  const remaining = Math.max(0, item.duration_seconds - item.position_seconds);
  if (remaining <= 0) return null;
  const minutes = Math.ceil(remaining / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} restantes` : `${minutes} min restantes`;
}

function durationLabel(seconds: number): string | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  const totalMinutes = Math.ceil(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} h ${String(minutes).padStart(2, "0")}` : `${hours} h`;
}

export function MediaCard({ item, priority = false, portrait = false, resume = false, onSeen }: { item: MediaItem; priority?: boolean; portrait?: boolean; resume?: boolean; onSeen?: (id: string) => void }) {
  const profileId = useMemo(() => getProfileId(), []);
  const [seen, setSeen] = useState(item.progress_percent >= 95);
  const [markingSeen, setMarkingSeen] = useState(false);
  const [markError, setMarkError] = useState(false);
  const posterUrl = api.assetUrl(portrait ? (item.thumbnail_vertical_url ?? item.poster_url) : item.poster_url);
  const remaining = resume ? remainingLabel(item) : null;
  const duration = durationLabel(item.duration_seconds);
  const href = item.kind === "short" ? "/flashy" : `/watch/${item.id}`;
  const canMarkSeen = item.kind === "movie" && !seen;

  async function markAsSeen() {
    if (!profileId || markingSeen || !canMarkSeen) return;
    setMarkingSeen(true);
    setMarkError(false);
    const total = Math.max(1, item.duration_seconds);
    try {
      await api.progress(item.id, profileId, total, total);
      setSeen(true);
      onSeen?.(item.id);
    } catch {
      setMarkError(true);
    } finally {
      setMarkingSeen(false);
    }
  }

  return (
    <article className={`mediaCard ${portrait ? "portraitCard" : ""}`}>
      <Link className="mediaCardLink focusTile" href={href}>
        <div className="posterFrame">
          {posterUrl ? <img src={posterUrl} alt="" loading={priority ? "eager" : "lazy"} className="posterImage" /> : <div className="posterFallback">{item.title.slice(0, 1)}</div>}
          <span className="playChip"><Play size={16} fill="currentColor" aria-hidden="true" /></span>
          {item.kind === "live" ? <span className="liveBadge">En direct</span> : null}
          {resume ? <span className="resumeBadge">Reprendre{remaining ? ` · ${remaining}` : ""}</span> : null}
          {item.progress_percent > 0 && item.progress_percent < 95 ? <span className="progressTrack" aria-label={`Progression ${item.progress_percent}%`}><span style={{ width: `${Math.min(item.progress_percent, 100)}%` }} /></span> : null}
        </div>
        <span className="mediaTitle">{item.title}</span>
        <span className="mediaMeta">{item.genres[0] ?? ""}{item.year ? `${item.genres[0] ? " · " : ""}${item.year}` : ""}{duration ? <><span aria-hidden="true"> · </span><Clock3 size={12} aria-hidden="true" />{duration}</> : null}</span>
      </Link>
      {item.kind === "movie" ? (
        <button
          className={`markSeenButton ${seen ? "isSeen" : ""}`}
          type="button"
          onClick={() => void markAsSeen()}
          disabled={markingSeen || seen || !profileId}
          aria-label={markError ? `Réessayer de marquer ${item.title} comme vu` : seen ? `${item.title} est vu` : `Marquer ${item.title} comme vu`}
          title={markError ? "Échec de la mise à jour — réessayer" : seen ? "Vu" : "Marquer comme vu"}
        >
          {markingSeen ? <Loader2 className="spin" size={16} aria-hidden="true" /> : seen ? <Check size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          <span>{markError ? "Réessayer" : "Vu"}</span>
        </button>
      ) : null}
    </article>
  );
}
