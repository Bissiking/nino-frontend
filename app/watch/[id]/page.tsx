"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarClock, ChevronRight, Flame, Lock, Play, RotateCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Markdown } from "@/components/Markdown";
import { MediaCard } from "@/components/MediaCard";
import { MediaPlayer } from "@/components/MediaPlayer";
import { MediaActions } from "@/components/MediaActions";
import { CommentsSection } from "@/components/CommentsSection";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import { CATEGORIES, CONTENT_FLAGS } from "@/types/nino";
import type { MediaItem, SeriesEpisodeEntry, SeriesPage, StreamDecision } from "@/types/nino";

function Chips({ category, tags, flags }: { category?: string | null; tags?: string[]; flags?: string[] }) {
  const items: Array<{ key: string; label: string; tone?: string }> = [];
  if (category) items.push({ key: "category", label: CATEGORIES[category] ?? category });
  (tags ?? []).forEach((tag) => items.push({ key: `tag-${tag}`, label: tag }));
  (flags ?? []).forEach((flag) => items.push({ key: `flag-${flag}`, label: CONTENT_FLAGS[flag] ?? flag, tone: "isWarning" }));
  if (!items.length) return null;
  return (
    <ul className="watchChips">
      {items.map((item) => <li key={item.key} className={item.tone ?? ""}>{item.label}</li>)}
    </ul>
  );
}

function formatPublishDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function findNextEpisode(media: MediaItem, series: SeriesPage | null): SeriesEpisodeEntry | null {
  if (!series) return null;
  const targetSeason = media.season_number ?? 1;
  const targetEpisode = media.episode_number ?? 0;
  for (const season of series.seasons) {
    if (season.season_number < targetSeason) continue;
    for (const episode of season.episodes) {
      if (season.season_number === targetSeason && episode.episode_number <= targetEpisode) continue;
      if (!episode.is_released) continue;
      return episode;
    }
  }
  return null;
}

function Recommendations({ current }: { current: MediaItem }) {
  const profileId = useMemo(() => getProfileId(), []);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(false);
    api.media(current.kind, profileId)
      .then((all) => {
        if (cancelled) return;
        const currentGenres = new Set(current.genres ?? []);
        const scored = all
          .filter((item) => item.id !== current.id && item.is_available && !item.series_source_id)
          .map((item) => {
            const shared = (item.genres ?? []).filter((genre) => currentGenres.has(genre)).length;
            const sameCategory = item.category ? item.category === current.category : false;
            return { item, score: shared * 2 + (sameCategory ? 1 : 0) };
          })
          .sort((a, b) => b.score - a.score || (b.item.year ?? 0) - (a.item.year ?? 0))
          .slice(0, 10)
          .map(({ item }) => item);
        setItems(scored);
      })
      .catch(() => setError(true));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.id, current.kind]);

  return (
    <section className="watchRecommend" aria-labelledby="watch-recommend">
      <div className="railHeader">
        <h2 id="watch-recommend">À voir aussi</h2>
      </div>
      {error ? <EmptyState title="Recommandations indisponibles" message="Une erreur est survenue, réessayez plus tard." /> : null}
      {!error && items && items.length ? (
        <div className="resultGrid watchRecommendGrid">{items.map((item) => <MediaCard item={item} key={item.id} />)}</div>
      ) : null}
      {!error && !items ? <LoadingState label="Chargement des recommandations" /> : null}
      {!error && items && items.length === 0 ? <EmptyState title="Rien pour l’instant" message="De nouveaux programmes apparaîtront ici dès qu’ils seront disponibles." /> : null}
    </section>
  );
}

function EpisodeSeries({ media, series }: { media: MediaItem; series: SeriesPage }) {
  return (
    <section className="watchSeriesContext" aria-labelledby="watch-series-context">
      <div className="railHeader">
        <h2 id="watch-series-context">Dans cette série</h2>
        <Link href={`/watch/${encodeURIComponent(series.series.id)}`}>Voir la série <ChevronRight size={18} aria-hidden="true" /></Link>
      </div>
      {series.seasons.length ? (
        <div className="seriesSeasons">
          {series.seasons.map((season) => (
            <section key={season.season_number} className="seriesSeason">
              <h3>Saison {season.season_number}</h3>
              <ol className="episodeGrid">
                {season.episodes.map((episode) => {
                  const isCurrent = episode.id === media.id;
                  const isNext = findNextEpisode(media, series)?.id === episode.id;
                  return (
                    <li key={episode.id}>
                      {episode.is_released ? (
                        <Link className={`episodeRow ${isCurrent ? "isCurrent" : ""} ${isNext ? "isNext" : ""}`} href={`/watch/${encodeURIComponent(episode.id)}`} aria-current={isCurrent ? "true" : undefined}>
                          <span className="episodeNumber">{isCurrent ? <Play size={15} fill="currentColor" aria-hidden="true" /> : isNext ? "Suivant" : `E${episode.episode_number}`}</span>
                          <span className="episodeText"><strong>{episode.title || `Épisode ${episode.episode_number}`}</strong></span>
                          <Play size={17} aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="episodeRow isLockedRow">
                          <span className="episodeNumber"><Lock size={15} aria-hidden="true" /></span>
                          <span className="episodeText"><strong>{episode.title || `Épisode ${episode.episode_number}`}</strong></span>
                          <span className="episodeRelease"><CalendarClock size={14} aria-hidden="true" />{formatPublishDate(episode.publish_at) || "Bientôt"}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SeriesDetail({ media, series }: { media: MediaItem; series: SeriesPage }) {
  return (
    <section className="watchSurface seriesSurface">
      <div className="seriesBackdrop" style={api.assetUrl(media.backdrop_url) ? { backgroundImage: `url(${JSON.stringify(api.assetUrl(media.backdrop_url))})` } : undefined}>
        <div>
          <span className="seriesKind">Série</span>
          <h1>{media.title}</h1>
          <p>{media.synopsis}</p>
          <Chips category={media.category} tags={media.tags} flags={media.is_adult ? media.content_flags : undefined} />
          {media.no_spoil ? <p className="noSpoilNote">No Spoil activé : les épisodes non sortis sont masqués.</p> : null}
        </div>
      </div>
      <Markdown>{media.description}</Markdown>
      {series.seasons.length ? (
        <div className="seriesSeasons">
          {series.seasons.map((season) => (
            <section key={season.season_number} className="seriesSeason">
              <h2>Saison {season.season_number}</h2>
              {season.episodes.length ? (
                <ol className="episodeGrid">
                  {season.episodes.map((episode) => (
                    <li key={episode.id} className={episode.is_released && media.is_adult ? "isAdultLocked" : episode.is_released ? undefined : "isLocked"}>
                      {episode.is_released ? (
                        <Link className="episodeRow" href={`/watch/${encodeURIComponent(episode.id)}`}>
                          <span className="episodeNumber">E{episode.episode_number}</span>
                          <span className="episodeText"><strong>{episode.title || `Épisode ${episode.episode_number}`}</strong></span>
                          {media.is_adult ? <span className="episodeAdult"><Flame size={15} aria-hidden="true" />18+</span> : null}
                          <Play size={17} aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="episodeRow isLockedRow">
                          <span className="episodeNumber"><Lock size={15} aria-hidden="true" /></span>
                          <span className="episodeText"><strong>{episode.title || `Épisode ${episode.episode_number}`}</strong></span>
                          <span className="episodeRelease"><CalendarClock size={14} aria-hidden="true" />{formatPublishDate(episode.publish_at) || "Bientôt"}</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="seriesSeasonEmpty">Aucun épisode disponible pour le moment.</p>
              )}
            </section>
          ))}
        </div>
      ) : null}
      <MediaActions mediaId={media.id} initialLiked={media.liked} initialFavorited={media.favorited} initialLikeCount={media.like_count} />
      <CommentsSection mediaId={media.id} />
    </section>
  );
}

function runNextEpisode(next: SeriesEpisodeEntry) {
  window.location.href = `/watch/${encodeURIComponent(next.id)}`;
}

export default function WatchPage() {
  const params = useParams<{ id: string }>();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [series, setSeries] = useState<SeriesPage | null>(null);
  const [decision, setDecision] = useState<StreamDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [restartToken, setRestartToken] = useState(0);

  const isEpisode = media?.series_source_id != null;
  const isSeries = media?.kind === "series";
  const nextEpisode = useMemo(() => (media ? findNextEpisode(media, series) : null), [media, series]);

  function load() {
    const profileId = getProfileId();
    setLoading(true);
    setError(null);
    setAdultConfirmed(false);
    setSeries(null);
    api.mediaDetail(params.id, profileId)
      .then((nextMedia) => {
        setMedia(nextMedia);
        if (nextMedia.kind === "series") {
          setDecision(null);
          return api.seriesDetail(params.id, profileId).then((payload) => setSeries(payload));
        }
        const seriesPromise = nextMedia.series_source_id
          ? api.seriesDetail(nextMedia.series_source_id, profileId).catch(() => null)
          : Promise.resolve(null);
        return api.streamDecision(params.id).then((nextDecision) =>
          seriesPromise.then((seriesPayload) => { setDecision(nextDecision); setSeries(seriesPayload); })
        );
      })
      .catch((err) => setError(err.message ?? "Lecture indisponible."))
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  return (
    <AppShell>
      {loading ? <LoadingState label="Preparation du flux" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && media && isSeries && series ? <SeriesDetail media={media} series={series} /> : null}
      {!loading && !error && media && !isSeries ? (
        <>
          <section className="watchSurface">
            <div className="playerDeck">
              {media.is_adult && !adultConfirmed ? (
                <div className="contentWarning" role="alert">
                  <Flame size={30} aria-hidden="true" />
                  <h2>Contenu sensible (18+)</h2>
                  <p>Ce contenu contient des scènes réservées à un public adulte.</p>
                  <Chips flags={media.content_flags} />
                  <button className="primaryButton" type="button" onClick={() => setAdultConfirmed(true)}>
                    <Play size={17} aria-hidden="true" />Continuer vers la lecture
                  </button>
                </div>
              ) : decision ? (
                <MediaPlayer
                  key={`${media.id}-${restartToken}`}
                  decision={decision}
                  poster={api.assetUrl(media.backdrop_url ?? media.poster_url) ?? undefined}
                  mediaId={media.id}
                  profileId={getProfileId()}
                  resumePercent={restartToken > 0 ? 0 : media.progress_percent}
                  upNext={isEpisode && nextEpisode ? { id: nextEpisode.id, title: nextEpisode.title || `Épisode ${nextEpisode.episode_number}` } : null}
                  onUpNext={isEpisode && nextEpisode ? () => runNextEpisode(nextEpisode) : undefined}
                />
              ) : null}
            </div>
            <div className="watchMeta">
              <div className="watchMetaMain">
                <h1>{media.title}</h1>
                {isEpisode && media.series_source_id ? <p className="watchEpisodeTag">Épisode {media.episode_number ?? ""}{media.season_number ? ` · Saison ${media.season_number}` : ""}</p> : null}
                <p>{media.synopsis}</p>
                <Chips category={media.category} tags={media.tags} flags={media.is_adult ? media.content_flags : undefined} />
                <MediaActions mediaId={media.id} initialLiked={media.liked} initialFavorited={media.favorited} initialLikeCount={media.like_count} />
              </div>
              {media.progress_percent > 0 && media.progress_percent < 95 ? (
                <button className="secondaryButton watchRestart" type="button" onClick={() => setRestartToken((token) => token + 1)}>
                  <RotateCw size={17} aria-hidden="true" />
                  Recommencer
                </button>
              ) : null}
              {media.description ? <Markdown>{media.description}</Markdown> : null}
            </div>
          </section>
          {isEpisode && series ? <EpisodeSeries media={media} series={series} /> : null}
          {!isEpisode ? <Recommendations current={media} /> : null}
          <CommentsSection mediaId={media.id} />
        </>
      ) : null}
    </AppShell>
  );
}