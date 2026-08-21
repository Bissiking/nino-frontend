import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeRail } from "@/types/nino";
import { EmptyState } from "./StateBlock";
import { MediaCard } from "./MediaCard";

export function Rail({ rail }: { rail: HomeRail }) {
  const portrait = rail.id === "shorts";
  return (
    <section className={`rail ${portrait ? "homeFlashyRail" : ""}`} id={rail.id} aria-labelledby={`rail-${rail.id}`}>
      <div className="railHeader">
        <h2 id={`rail-${rail.id}`}>{rail.title}</h2>
        {portrait && rail.items.length ? <Link href="/flashy">Tout voir <ChevronRight size={18} aria-hidden="true" /></Link> : null}
      </div>
      {rail.items.length ? <div className={`railScroller ${portrait ? "portraitScroller" : ""}`}>{rail.items.map((item, index) => <MediaCard item={item} key={item.id} priority={index < 3} portrait={portrait} resume={rail.id === "continue"} />)}</div> : <EmptyState title="Rien à afficher pour l’instant" message="De nouveaux programmes apparaîtront ici dès qu’ils seront disponibles." />}
    </section>
  );
}
