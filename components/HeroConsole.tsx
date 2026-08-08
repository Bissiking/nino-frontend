import Image from "next/image";
import Link from "next/link";
import { Info, Play } from "lucide-react";
import type { MediaItem } from "@/types/nino";

export function HeroConsole({ item }: { item: MediaItem | null }) {
  if (!item) {
    return <section className="heroConsole emptyHero"><div className="heroContent"><h1>Votre prochain programme commence ici.</h1><p>Ajoutez une source côté backend pour mettre en avant vos émissions, directs et créations.</p></div></section>;
  }

  return (
    <section className="heroConsole" aria-labelledby="hero-title">
      {item.backdrop_url ? <Image src={item.backdrop_url} alt="" fill priority sizes="(max-width: 900px) 100vw, calc(100vw - 232px)" className="heroBackdrop" /> : null}
      <div className="heroContent">
        <div className="ninoOriginal"><Image src="/logo_nino_small.png" alt="" width={18} height={22} /> Original</div>
        <h1 id="hero-title">{item.title}</h1>
        <div className="heroFacts">
          {item.rating ? <strong>{item.rating}/10</strong> : null}
          <span>{item.year ?? "Nouveau"}</span>
          <span>{item.genres.slice(0, 2).join(" · ")}</span>
        </div>
        <p>{item.synopsis}</p>
        <div className="heroActions">
          <Link className="primaryButton" href={`/watch/${item.id}`}><Play size={20} fill="currentColor" aria-hidden="true" />Regarder</Link>
          <Link className="secondaryButton" href={`/watch/${item.id}`}><Info size={20} aria-hidden="true" />Plus d'infos</Link>
        </div>
      </div>
      <span className={`heroKind ${item.kind === "live" ? "isLive" : ""}`}>{item.kind === "live" ? "En direct" : item.kind}</span>
    </section>
  );
}
