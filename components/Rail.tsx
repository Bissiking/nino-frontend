import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeRail } from "@/types/nino";
import { CarouselViewport } from "./CarouselViewport";
import { EmptyState } from "./StateBlock";
import { MediaCard } from "./MediaCard";

const PREVIEW_LIMIT = 10;
const MORE_LINKS: Record<string, string> = {
  latest: "/videos",
  movies: "/videos",
  series: "/series",
  shorts: "/flashy",
  live: "/live"
};

export function Rail({ rail }: { rail: HomeRail }) {
  const portrait = rail.id === "shorts";
  const items = rail.items.slice(0, PREVIEW_LIMIT);
  const moreHref = MORE_LINKS[rail.id];
  return (
    <section className={`rail ${portrait ? "homeFlashyRail" : ""}`} id={rail.id} aria-labelledby={`rail-${rail.id}`}>
      <div className="railHeader">
        <h2 id={`rail-${rail.id}`}>{rail.title}</h2>
        {moreHref && rail.items.length ? <Link href={moreHref}>Voir plus <ChevronRight size={18} aria-hidden="true" /></Link> : null}
      </div>
      {items.length ? (
        <CarouselViewport className={`railScroller ${portrait ? "portraitScroller" : ""}`} label={rail.title}>
          {items.map((item, index) => <MediaCard item={item} key={item.id} priority={index < 3} portrait={portrait} resume={rail.id === "continue"} />)}
        </CarouselViewport>
      ) : <EmptyState title="Rien à afficher pour l’instant" message="De nouveaux programmes apparaîtront ici dès qu’ils seront disponibles." />}
    </section>
  );
}
