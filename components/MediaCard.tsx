import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { MediaItem } from "@/types/nino";

export function MediaCard({ item, priority = false }: { item: MediaItem; priority?: boolean }) {
  return (
    <Link className="mediaCard focusTile" href={`/watch/${item.id}`}>
      <div className="posterFrame">
        {item.poster_url ? (
          <Image src={item.poster_url} alt="" fill sizes="(max-width: 720px) 44vw, 220px" priority={priority} className="posterImage" />
        ) : (
          <div className="posterFallback">{item.title.slice(0, 1)}</div>
        )}
        <span className="playChip">
          <Play size={14} aria-hidden="true" />
        </span>
      </div>
      <span className="mediaTitle">{item.title}</span>
      <span className="mediaMeta">
        {item.year ?? "Nino"} · {item.kind}
      </span>
      {item.progress_percent > 0 ? (
        <span className="progressTrack" aria-label={`Progression ${item.progress_percent}%`}>
          <span style={{ width: `${Math.min(item.progress_percent, 100)}%` }} />
        </span>
      ) : null}
    </Link>
  );
}

