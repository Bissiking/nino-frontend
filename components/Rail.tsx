import type { HomeRail } from "@/types/nino";
import { EmptyState } from "./StateBlock";
import { MediaCard } from "./MediaCard";

export function Rail({ rail }: { rail: HomeRail }) {
  return (
    <section className="rail" aria-labelledby={`rail-${rail.id}`}>
      <div className="railHeader">
        <h2 id={`rail-${rail.id}`}>{rail.title}</h2>
        <span>{rail.items.length} titres</span>
      </div>
      {rail.items.length ? (
        <div className="railScroller">
          {rail.items.map((item, index) => (
            <MediaCard item={item} key={item.id} priority={index < 3} />
          ))}
        </div>
      ) : (
        <EmptyState title="Rien ici pour l'instant" message="Ce rail se remplira avec l'historique, les favoris ou les scans." />
      )}
    </section>
  );
}

