import Link from "next/link";
import { api } from "@/lib/api";
import type { MediaItem } from "@/types/nino";

export function HomeTopTen({ items }: { items: MediaItem[] }) {
  if (!items.length) return null;

  return (
    <section className="topTen" id="top10" aria-labelledby="top-ten-title">
      <div className="railHeader"><h2 id="top-ten-title">Top 10 cette semaine</h2><span>Les mieux notés sur Nino</span></div>
      <ol className="topTenList">
        {items.map((item, index) => (
          <li key={item.id}>
            <Link href={`/watch/${item.id}`} className="topTenItem focusTile" aria-label={`${index + 1}. ${item.title}`}>
              <span className="topTenRank" aria-hidden="true">{index + 1}</span>
              <span className="topTenThumb">
                {api.assetUrl(item.poster_url) ? <img src={api.assetUrl(item.poster_url) ?? ""} alt="" loading="lazy" className="posterImage" /> : <span className="topTenFallback">{item.title.slice(0, 1)}</span>}
              </span>
              <span className="topTenCopy"><strong>{item.title}</strong><small>{item.genres[0] ?? item.kind}</small></span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
