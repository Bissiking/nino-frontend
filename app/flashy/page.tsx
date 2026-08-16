"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Heart, Info, Loader2, Play, ThumbsUp, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { MediaPlayer } from "@/components/MediaPlayer";
import { NinoApiError, api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import type { InteractionsState, MediaItem, StreamDecision } from "@/types/nino";

function FlashyRail({ item, profileId }: { item: MediaItem; profileId: string | null }) {
  const [state, setState] = useState<InteractionsState | null>(null);
  const [busy, setBusy] = useState<"like" | "favorite" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    api.mediaInteractions(item.id, profileId)
      .then((next) => { if (!cancelled) setState(next); })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, profileId]);

  async function run(kind: "like" | "favorite") {
    if (!profileId || busy) return;
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === "like") {
        const result = await api.toggleLike(item.id, profileId);
        setState((current) => current ? { ...current, liked: result.liked, like_count: result.like_count } : current);
      } else {
        const result = await api.toggleFavorite(item.id, profileId);
        setState((current) => current ? { ...current, favorited: result.favorited } : current);
      }
    } catch (error) {
      const fallback = error instanceof NinoApiError ? error.message : "Action impossible.";
      setMessage(error instanceof NinoApiError && error.code === "PROFILE_NOT_FOUND" ? "Sélectionnez d’abord un profil." : fallback);
    } finally {
      setBusy(null);
    }
  }

  const liked = state?.liked ?? item.liked ?? false;
  const favorited = state?.favorited ?? item.favorited ?? false;
  const likeCount = state?.like_count ?? item.like_count ?? 0;

  return (
    <div className="flashyRail" role="group" aria-label={`Actions sur ${item.title}`}>
      <button
        className={favorited ? "isActive" : undefined}
        type="button"
        onClick={() => void run("favorite")}
        disabled={busy !== null || !profileId}
        aria-pressed={favorited}
        aria-label={!profileId ? "Sélectionnez un profil pour ajouter aux favoris" : favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        title={!profileId ? "Sélectionnez un profil" : undefined}
      >
        {busy === "favorite" ? <Loader2 className="spin" size={22} aria-hidden="true" /> : <Heart size={22} fill={favorited ? "currentColor" : "none"} aria-hidden="true" />}
        <span>Favori</span>
      </button>
      <button
        className={liked ? "isActive" : undefined}
        type="button"
        onClick={() => void run("like")}
        disabled={busy !== null || !profileId}
        aria-pressed={liked}
        aria-label={!profileId ? "Sélectionnez un profil pour aimer la vidéo" : liked ? "Je n’aime plus la vidéo" : "J’aime la vidéo"}
        title={!profileId ? "Sélectionnez un profil" : undefined}
      >
        {busy === "like" ? <Loader2 className="spin" size={22} aria-hidden="true" /> : <ThumbsUp size={22} aria-hidden="true" />}
        <b>{likeCount || ""}</b>
        <span>J’aime</span>
      </button>
      <Link className="flashyRailInfo" href={`/watch/${encodeURIComponent(item.id)}`} aria-label={`Informations sur ${item.title}`}>
        <Info size={22} aria-hidden="true" />
        <span>Infos</span>
      </Link>
      {message ? <p className="flashyRailMessage" role="alert">{message}</p> : null}
    </div>
  );
}

function FlashyItem({ item, active, profileId }: { item: MediaItem; active: boolean; profileId: string | null }) {
  const [decision, setDecision] = useState<StreamDecision | null>(null);
  const [decisionFailed, setDecisionFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const poster = api.assetUrl(item.thumbnail_vertical_url ?? item.poster_url);

  useEffect(() => {
    if (!active) return;
    setLoaded(true);
    if (decision || decisionFailed || !item.source_kind) return;
    api.streamDecision(item.id)
      .then((next) => setDecision(next))
      .catch(() => setDecisionFailed(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, decision, decisionFailed, item.id, item.source_kind]);

  const showPlayer = loaded && active && decision && !decisionFailed && Boolean(item.source_kind);

  return (
    <article className="flashyItem" aria-current={active ? "true" : undefined}>
      <div className="flashyStage">
        {showPlayer ? (
          <MediaPlayer decision={decision} controls={false} autoPlay muted loop poster={poster} className="flashyPreview" />
        ) : (
          <div className="flashyPoster">
            {poster ? <img src={poster} alt="" className="flashyImage" /> : null}
            {!item.source_kind ? <span className="flashyNoSource">Source indisponible</span> : null}
            {active && !decision && !decisionFailed && item.source_kind ? <div className="flashyStageState"><Loader2 className="spin" size={28} aria-hidden="true" /><span>Préparation de la lecture</span></div> : null}
          </div>
        )}
        <div className="flashyScrim" />
        <div className="flashyCopy">
          <span className="flashyGenres">{item.genres.join(" · ")}</span>
          <h2>{item.title}</h2>
          <p>{item.synopsis}</p>
          <div className="flashyActions">
            <Link className="primaryButton" href={`/watch/${encodeURIComponent(item.id)}`}><Play size={19} fill="currentColor" aria-hidden="true" />Regarder</Link>
            <Link className="flashyInfoButton" href={`/watch/${encodeURIComponent(item.id)}`} aria-label={`Page de ${item.title}`}><Info size={22} aria-hidden="true" /></Link>
          </div>
        </div>
        <FlashyRail item={item} profileId={profileId} />
      </div>
    </article>
  );
}

export default function FlashyPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const profileId = useMemo(() => getProfileId(), []);

  function load() {
    setLoading(true);
    setError(null);
    api.media("short", profileId).then(setItems).catch((err) => setError(err.message ?? "Flashy est indisponible.")).finally(() => setLoading(false));
  }

  useEffect(load, [profileId]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!best) return;
        const index = itemRefs.current.indexOf(best.target as HTMLElement);
        if (index >= 0) setActiveIndex(index);
      },
      { root: feed, threshold: 0.55 }
    );
    itemRefs.current.forEach((node) => { if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [items]);

  function handleKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const next = event.key === "ArrowDown" ? activeIndex + 1 : activeIndex - 1;
    const target = Math.max(0, Math.min(items.length - 1, next));
    itemRefs.current[target]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <AppShell>
      {loading ? <LoadingState label="Chargement de Flashy" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <section className="flashySurface" aria-label="Flashy — vidéos courtes">
          <div
            ref={feedRef}
            className="flashyFeed"
            tabIndex={0}
            role="region"
            aria-roledescription="Fil Flashy"
            aria-label="Vidéos courtes à défilement vertical"
            onKeyDown={handleKey}
          >
            {items.length ? (
              items.map((item, index) => (
                <FlashyItem
                  key={item.id}
                  item={item}
                  active={index === activeIndex}
                  profileId={profileId}
                />
              ))
            ) : <div className="flashyEmpty"><Zap size={34} aria-hidden="true" /><h2>Flashy arrive bientôt</h2><p>Les prochaines vidéos courtes apparaîtront ici.</p></div>}
          </div>
          {items.length ? (
            <header className="flashyHeader">
              <span className="flashyHeaderTitle"><Zap size={22} fill="currentColor" aria-hidden="true" /><h1>Flashy</h1></span>
              <span className="flashyPosition">{activeIndex + 1} / {items.length}</span>
            </header>
          ) : null}
        </section>
      ) : null}
    </AppShell>
  );
}