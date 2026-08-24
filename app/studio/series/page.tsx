"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Film,
  ListVideo,
  Loader2,
  Search,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  Eye,
  EyeOff,
  FileEdit
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StudioShell } from "@/components/studio/StudioShell";
import { api } from "@/lib/api";
import { VISIBILITY_LABELS, CATEGORIES } from "@/types/nino";
import type { MediaItem } from "@/types/nino";

type FilterTab = "all" | "public" | "private" | "draft";
type SortField = "title" | "visibility" | "category" | "publish_at";
type SortDirection = "asc" | "desc";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "public", label: "Publiées" },
  { id: "private", label: "Privées" },
  { id: "draft", label: "Brouillons" }
];

const ITEMS_PER_PAGE = 10;

export default function SeriesListPage() {
  const [series, setSeries] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSeries();
  }, []);

  async function loadSeries(background = false) {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const items = await api.adminMedia();
      setSeries(items.filter((item) => item.kind === "series"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur lors du chargement des séries.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const filteredSeries = useMemo(() => {
    let result = series;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.genres.some((g) => g.toLowerCase().includes(query)) ||
          item.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    if (activeFilter !== "all") {
      result = result.filter((item) => item.visibility === activeFilter);
    }

    result = [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "visibility":
          comparison = (a.visibility ?? "").localeCompare(b.visibility ?? "");
          break;
        case "category":
          comparison = (a.category ?? "").localeCompare(b.category ?? "");
          break;
        case "publish_at":
          comparison = (a.publish_at ?? "").localeCompare(b.publish_at ?? "");
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [series, searchQuery, activeFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredSeries.length / ITEMS_PER_PAGE);
  const paginatedSeries = filteredSeries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter, sortField, sortDirection]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function getSeasonCount(item: MediaItem): number {
    return item.season_number ?? 1;
  }

  function getEpisodeCount(item: MediaItem): number {
    return item.episode_number ?? 0;
  }

  function getVisibilityIcon(visibility: string) {
    switch (visibility) {
      case "public":
        return <Eye size={14} aria-hidden="true" />;
      case "private":
        return <EyeOff size={14} aria-hidden="true" />;
      default:
        return <FileEdit size={14} aria-hidden="true" />;
    }
  }

  function getVisibilityClass(visibility: string) {
    switch (visibility) {
      case "public":
        return "studioSeriesVisibility isPublic";
      case "private":
        return "studioSeriesVisibility isPrivate";
      default:
        return "studioSeriesVisibility isDraft";
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  const stats = useMemo(() => {
    const total = series.length;
    const published = series.filter((s) => s.visibility === "public").length;
    const drafts = series.filter((s) => s.visibility === "draft").length;
    const privateCount = series.filter((s) => s.visibility === "private").length;
    const totalSeasons = series.reduce((sum, s) => sum + getSeasonCount(s), 0);
    return { total, published, drafts, privateCount, totalSeasons };
  }, [series]);

  return (
    <StudioShell>
      <div className="studioSeriesPage">
        <header className="studioSeriesHeader">
          <div className="studioSeriesHeaderContent">
            <h1>Séries</h1>
            <p>Gérez l'ensemble de vos séries, leurs saisons et épisodes.</p>
          </div>
          <Link href="/studio/series/new" className="primaryButton">
            <Plus size={18} aria-hidden="true" />
            Nouvelle série
          </Link>
        </header>

        <section className="studioSeriesStats">
          <div className="studioSeriesStat">
            <span className="studioSeriesStatIcon isTotal">
              <Clapperboard size={20} />
            </span>
            <span className="studioSeriesStatContent">
              <dt>Total</dt>
              <dd>{stats.total}</dd>
              <small>Séries déclarées</small>
            </span>
          </div>
          <div className="studioSeriesStat">
            <span className="studioSeriesStatIcon isPublished">
              <Eye size={20} />
            </span>
            <span className="studioSeriesStatContent">
              <dt>Publiées</dt>
              <dd>{stats.published}</dd>
              <small>Visibles dans Nino</small>
            </span>
          </div>
          <div className="studioSeriesStat">
            <span className="studioSeriesStatIcon isDraft">
              <FileEdit size={20} />
            </span>
            <span className="studioSeriesStatContent">
              <dt>Brouillons</dt>
              <dd>{stats.drafts}</dd>
              <small>En préparation</small>
            </span>
          </div>
          <div className="studioSeriesStat">
            <span className="studioSeriesStatIcon isPrivate">
              <EyeOff size={20} />
            </span>
            <span className="studioSeriesStatContent">
              <dt>Privées</dt>
              <dd>{stats.privateCount}</dd>
              <small>Accès restreint</small>
            </span>
          </div>
          <div className="studioSeriesStat">
            <span className="studioSeriesStatIcon isSeasons">
              <ListVideo size={20} />
            </span>
            <span className="studioSeriesStatContent">
              <dt>Saisons</dt>
              <dd>{stats.totalSeasons}</dd>
              <small>Au total</small>
            </span>
          </div>
        </section>

        <div className="studioSeriesToolbar">
          <div className="studioSeriesSearch">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Rechercher une série..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Rechercher une série"
            />
          </div>

          <div className="studioSeriesFilters" role="tablist" aria-label="Filtrer par statut">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeFilter === tab.id}
                className={activeFilter === tab.id ? "isActive" : undefined}
                onClick={() => setActiveFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            className="studioRefreshButton"
            type="button"
            onClick={() => loadSeries(true)}
            disabled={refreshing}
            aria-label="Rafraîchir la liste"
          >
            <RefreshCw className={refreshing ? "spin" : undefined} size={16} />
            {refreshing ? "Actualisation" : "Rafraîchir"}
          </button>
        </div>

        {loading && (
          <div className="studioSeriesLoading" aria-label="Chargement des séries" aria-busy="true">
            <Loader2 className="spin" size={24} />
            <span>Chargement des séries...</span>
          </div>
        )}

        {error && !loading && (
          <div className="studioSeriesError" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => loadSeries()}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && filteredSeries.length === 0 && (
          <div className="studioSeriesEmpty">
            <ListVideo size={40} />
            <h2>Aucune série trouvée</h2>
            <p>
              {searchQuery || activeFilter !== "all"
                ? "Essayez de modifier vos critères de recherche."
                : "Créez votre première série pour commencer."}
            </p>
            {!searchQuery && activeFilter === "all" && (
          <Link href="/studio/series/new" className="primaryButton">
                <Plus size={18} aria-hidden="true" />
                Créer une série
              </Link>
            )}
          </div>
        )}

        {!loading && !error && filteredSeries.length > 0 && (
          <>
            <div className="studioSeriesTableWrapper">
              <table className="studioSeriesTable">
                <thead>
                  <tr>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort("title")}
                        className={sortField === "title" ? "isActive" : undefined}
                      >
                        Série
                        <ArrowUpDown size={14} aria-hidden="true" />
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort("visibility")}
                        className={sortField === "visibility" ? "isActive" : undefined}
                      >
                        Statut
                        <ArrowUpDown size={14} aria-hidden="true" />
                      </button>
                    </th>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort("category")}
                        className={sortField === "category" ? "isActive" : undefined}
                      >
                        Genre
                        <ArrowUpDown size={14} aria-hidden="true" />
                      </button>
                    </th>
                    <th>Saisons</th>
                    <th>Épisodes</th>
                    <th>
                      <button
                        type="button"
                        onClick={() => toggleSort("publish_at")}
                        className={sortField === "publish_at" ? "isActive" : undefined}
                      >
                        Date de pub.
                        <ArrowUpDown size={14} aria-hidden="true" />
                      </button>
                    </th>
                    <th>Visibilité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSeries.map((item) => (
                    <tr key={item.id}>
                      <td className="studioSeriesTitleCell">
                        <span className="studioSeriesPoster">
                          {api.assetUrl(item.poster_url) ? (
                            <span
                              style={{
                                backgroundImage: `url(${JSON.stringify(api.assetUrl(item.poster_url))})`
                              }}
                            />
                          ) : (
                            <Film size={18} aria-hidden="true" />
                          )}
                        </span>
                        <span className="studioSeriesTitleContent">
                          <strong>{item.title}</strong>
                          <small>{item.year ? `(${item.year})` : ""}</small>
                        </span>
                      </td>
                      <td>
                        <span className={`studioSeriesStatus ${item.visibility === "public" ? "isPublished" : item.visibility === "private" ? "isPrivate" : "isDraft"}`}>
                          {item.visibility === "public" ? "Publié" : item.visibility === "private" ? "Privé" : "Brouillon"}
                        </span>
                      </td>
                      <td>
                        <span className="studioSeriesCategory">
                          {item.category ? CATEGORIES[item.category] ?? item.category : "—"}
                        </span>
                      </td>
                      <td className="studioSeriesNumeric">{getSeasonCount(item)}</td>
                      <td className="studioSeriesNumeric">{getEpisodeCount(item)}</td>
                      <td className="studioSeriesDate">{formatDate(item.publish_at)}</td>
                      <td>
                        <span className={getVisibilityClass(item.visibility)}>
                          {getVisibilityIcon(item.visibility)}
                          {VISIBILITY_LABELS[item.visibility] ?? item.visibility}
                        </span>
                      </td>
                      <td>
                        <div className="studioSeriesActions">
                          <Link
                            href={`/studio/series/${encodeURIComponent(item.id)}`}
                            className="studioSeriesEditButton"
                            aria-label={`Modifier ${item.title}`}
                          >
                            <FileEdit size={16} aria-hidden="true" />
                            Éditer
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav className="studioSeriesPagination" aria-label="Pagination des séries">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={18} />
                  Précédent
                </button>
                <span className="studioSeriesPaginationInfo">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Page suivante"
                >
                  Suivant
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </StudioShell>
  );
}