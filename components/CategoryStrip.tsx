import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { HomeRail } from "@/types/nino";

export function CategoryStrip({ rails }: { rails: HomeRail[] }) {
  const categories = Array.from(new Set(rails.flatMap((rail) => rail.items.flatMap((item) => item.genres)))).slice(0, 10);
  if (!categories.length) return null;

  return (
    <section className="categorySection" id="categories" aria-labelledby="category-title">
      <div className="railHeader"><h2 id="category-title">Explorer par catégorie</h2></div>
      <div className="categoryStrip">
        {categories.map((category) => <Link href={`/search?q=${encodeURIComponent(category)}`} key={category}><span>{category}</span><ChevronRight size={20} aria-hidden="true" /></Link>)}
      </div>
    </section>
  );
}
