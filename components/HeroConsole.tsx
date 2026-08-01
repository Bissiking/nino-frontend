import Image from "next/image";
import Link from "next/link";
import { Play, RadioTower } from "lucide-react";
import type { MediaItem } from "@/types/nino";

export function HeroConsole({ item }: { item: MediaItem | null }) {
  if (!item) {
    return (
      <section className="heroConsole emptyHero">
        <div>
          <h1>Nino attend une bibliotheque</h1>
          <p>Ajoute une source cote backend pour remplir les rails et activer la lecture.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="heroConsole">
      {item.backdrop_url ? <Image src={item.backdrop_url} alt="" fill priority className="heroBackdrop" /> : null}
      <div className="heroSignal" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="heroContent">
        <div className="signalBadge">
          <RadioTower size={16} aria-hidden="true" />
          Signal disponible
        </div>
        <h1>{item.title}</h1>
        <p>{item.synopsis}</p>
        <div className="heroFacts">
          <span>{item.year ?? "Nino"}</span>
          <span>{item.genres.slice(0, 2).join(" / ")}</span>
          <span>{item.rating ? `${item.rating}/10` : "Non note"}</span>
        </div>
        <Link className="primaryButton" href={`/watch/${item.id}`}>
          <Play size={18} aria-hidden="true" />
          Lire
        </Link>
      </div>
    </section>
  );
}

