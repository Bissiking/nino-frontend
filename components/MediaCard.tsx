import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { MediaItem } from "@/types/nino";

export function MediaCard({ item, priority = false, portrait = false }: { item: MediaItem; priority?: boolean; portrait?: boolean }) {
  return (
    <Link className={`mediaCard focusTile ${portrait ? "portraitCard" : ""}`} href={`/watch/${item.id}`}>
      <div className="posterFrame">
        {item.poster_url ? <Image src={item.poster_url} alt="" fill sizes={portrait ? "(max-width: 720px) 44vw, 210px" : "(max-width: 720px) 72vw, 320px"} priority={priority} className="posterImage" /> : <div className="posterFallback">{item.title.slice(0, 1)}</div>}
        <span className="playChip"><Play size={16} fill="currentColor" aria-hidden="true" /></span>
        {item.kind === "live" ? <span className="liveBadge">En direct</span> : null}
        {item.progress_percent > 0 ? <span className="progressTrack" aria-label={`Progression ${item.progress_percent}%`}><span style={{ width: `${Math.min(item.progress_percent, 100)}%` }} /></span> : null}
      </div>
      <span className="mediaTitle">{item.title}</span>
      <span className="mediaMeta">{item.genres[0] ?? item.kind}{item.year ? ` · ${item.year}` : ""}</span>
    </Link>
  );
}
