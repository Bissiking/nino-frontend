import Link from "next/link";
import { Play } from "lucide-react";
import { api } from "@/lib/api";
import type { MediaItem } from "@/types/nino";

function remainingLabel(item: MediaItem): string | null {
  if (typeof item.position_seconds !== "number" || item.position_seconds == null) return null;
  const remaining = Math.max(0, item.duration_seconds - item.position_seconds);
  if (remaining <= 0) return null;
  const minutes = Math.ceil(remaining / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} restantes` : `${minutes} min restantes`;
}

export function MediaCard({ item, priority = false, portrait = false, resume = false }: { item: MediaItem; priority?: boolean; portrait?: boolean; resume?: boolean }) {
  const posterUrl = api.assetUrl(portrait ? (item.thumbnail_vertical_url ?? item.poster_url) : item.poster_url);
  const remaining = resume ? remainingLabel(item) : null;
  const href = item.kind === "short" ? "/flashy" : `/watch/${item.id}`;
  return (
    <Link className={`mediaCard focusTile ${portrait ? "portraitCard" : ""}`} href={href}>
      <div className="posterFrame">
        {posterUrl ? <img src={posterUrl} alt="" loading={priority ? "eager" : "lazy"} className="posterImage" /> : <div className="posterFallback">{item.title.slice(0, 1)}</div>}
        <span className="playChip"><Play size={16} fill="currentColor" aria-hidden="true" /></span>
        {item.kind === "live" ? <span className="liveBadge">En direct</span> : null}
        {resume ? <span className="resumeBadge">Reprendre{remaining ? ` · ${remaining}` : ""}</span> : null}
        {item.progress_percent > 0 ? <span className="progressTrack" aria-label={`Progression ${item.progress_percent}%`}><span style={{ width: `${Math.min(item.progress_percent, 100)}%` }} /></span> : null}
      </div>
      <span className="mediaTitle">{item.title}</span>
      <span className="mediaMeta">{item.genres[0] ?? item.kind}{item.year ? ` · ${item.year}` : ""}</span>
    </Link>
  );
}
