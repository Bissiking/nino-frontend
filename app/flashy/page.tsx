"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Flame, Heart, Info, Loader2, Play, ThumbsUp, Volume2, VolumeX, X, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { Markdown } from "@/components/Markdown";
import { MediaPlayer } from "@/components/MediaPlayer";
import { CommentsSection } from "@/components/CommentsSection";
import { NinoApiError, api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import { CATEGORIES, CONTENT_FLAGS } from "@/types/nino";
import type { InteractionsState, MediaItem, StreamDecision } from "@/types/nino";

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours} h ${String(minutes % 60).padStart(2, "0")} min`;
  }
  return minutes > 0 ? `${minutes}:${String(rest).padStart(2, "0")}` : `${rest}s`;
}

function FlashyRail({ item, profileId, open, onToggleInfo }: {
  item: MediaItem;
  profileId: string | null;
  open: boolean;
  onToggleInfo: () => void;
}) {
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
      <button
        className={`flashyRailInfo ${open ? "isActive" : ""}`}
        type="button"
        onClick={onToggleInfo}
        aria-expanded={open}
        aria-pressed={open}
        aria-label={open ? `Fermer les informations sur ${item.title}` : `Informations sur ${item.title}`}
      >
        <Info size={22} aria-hidden="true" />
        <span>Infos</span>
      </button>
      {message ? <p className="flashyRailMessage" role="alert">{message}</p> : null}
    </div>
  );
}

function FlashyInfo({ item, profileId, open, onClose, onOpenItem }: {
  item: MediaItem;
  profileId: string | null;
  open: boolean;
  onClose: () => void;
  onOpenItem: (item: MediaItem) => void;
}) {
  const [related, setRelated] = useState<MediaItem[] | null>(null);
  const [relatedError, setRelatedError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRelated(null);
    setRelatedError(false);
    api.media("short", profileId)
      .then((all) => {
        if (cancelled) return;
        setRelated(all.filter((candidate) => candidate.id !== item.id && candidate.is_available && Boolean(candidate.source_kind)).slice(0, 8));
      })
      .catch(() => { if (!cancelled) setRelatedError(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item.id, profileId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const chips: Array<{ key: string; label: string; tone?: string }> = [];
  if (item.category) chips.push({ key: "category", label: CATEGORIES[item.category] ?? item.category });
  item.genres.forEach((genre) => chips.push({ key: `genre-${genre}`, label: genre }));
  item.tags.forEach((tag) => chips.push({ key: `tag-${tag}`, label: tag }));
  item.content_flags.forEach((flag) => chips.push({ key: `flag-${flag}`, label: CONTENT_FLAGS[flag] ?? flag, tone: "isWarning" }));
  const duration = formatDuration(item.duration_seconds);

  return (
    <div className="flashyInfo" role="dialog" aria-modal="false" aria-label={`Informations sur ${item.title}`}>
      <button className="flashyInfoScrim" type="button" aria-label="Fermer les informations" onClick={onClose} />
      <div className="flashyInfoCard">
        <header className="flashyInfoHeader">
          <h2>{item.title}</h2>
          <button className="flashyInfoClose" type="button" onClick={onClose} aria-label="Fermer les informations"><X size={20} aria-hidden="true" /></button>
        </header>
        <p className="flashyInfoSynopsis">{item.synopsis}</p>
        <div className="flashyInfoMeta">
          {item.year ? <span>{item.year}</span> : null}
          {duration ? <span>{duration}</span> : null}
        </div>
        {chips.length ? (
          <ul className="watchChips">{chips.map((chip) => <li key={chip.key} className={chip.tone ?? ""}>{chip.label}</li>)}</ul>
        ) : null}
        {item.description ? (
          <div className="flashyInfoDescription"><Markdown>{item.description}</Markdown></div>
        ) : null}
        <CommentsSection mediaId={item.id} />
        <section className="flashyRelated" aria-labelledby="flashy-related-title">
          <h3 id="flashy-related-title">À voir aussi</h3>
          {relatedError ? <p className="flashyRelatedError">Recommandations indisponibles.</p> : null}
          {!relatedError && related && related.length ? (
            <div className="flashyRelatedScroller">
              {related.map((candidate) => {
                const thumb = api.assetUrl(candidate.thumbnail_vertical_url ?? candidate.poster_url);
                return (
                  <button type="button" className="flashyRelatedCard" key={candidate.id} onClick={() => onOpenItem(candidate)}>
                    <span className="flashyRelatedThumb">{thumb ? <img src={thumb} alt="" /> : <span className="flashyRelatedFallback">{candidate.title.slice(0, 1)}</span>}<Play size={18} fill="currentColor" aria-hidden="true" /></span>
                    <span className="flashyRelatedTitle">{candidate.title}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

type FlashyItemProps = {
  item: MediaItem;
  active: boolean;
  profileId: string | null;
  soundOn: boolean;
  infoOpen: boolean;
  onToggleSound: () => void;
  onMutedChange: (muted: boolean) => void;
  onToggleInfo: () => void;
  onCloseInfo: () => void;
  onOpenItem: (item: MediaItem) => void;
  onThumbnail: (id: string, url: string) => void;
};

const FlashyItem = forwardRef<HTMLElement, FlashyItemProps>(function FlashyItem(
  { item, active, profileId, soundOn, infoOpen, onToggleSound, onMutedChange, onToggleInfo, onCloseInfo, onOpenItem, onThumbnail },
  ref
) {
  const [decision, setDecision] = useState<StreamDecision | null>(null);
  const [decisionFailed, setDecisionFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const thumbnailRequestedRef = useRef(false);
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

  useEffect(() => {
    if (!active || thumbnailRequestedRef.current) return;
    if (item.thumbnail_vertical_url || item.poster_url || !item.source_kind) return;
    thumbnailRequestedRef.current = true;
    api.mediaThumbnail(item.id)
      .then((next) => {
        const url = next.thumbnail_vertical_url ?? next.poster_url;
        if (url) onThumbnail(item.id, url);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, item]);

  const showPlayer = loaded && active && decision && !decisionFailed && Boolean(item.source_kind) && (!item.is_adult || adultConfirmed);
  const showWarning = active && item.is_adult && !adultConfirmed && !decisionFailed && Boolean(item.source_kind);

  return (
    <article ref={ref} className="flashyItem" aria-current={active ? "true" : undefined}>
      <div className="flashyStage">
        {showPlayer ? (
          <MediaPlayer
            decision={decision}
            controls={false}
            tapToToggle
            autoPlay
            muted={!soundOn}
            loop
            poster={poster}
            className="flashyPreview"
            onMutedChange={onMutedChange}
          />
        ) : (
          <div className="flashyPoster">
            {poster ? <img src={poster} alt="" className="flashyImage" /> : <span className="flashyPosterFallback" aria-hidden="true">{item.title}</span>}
            {!item.source_kind ? <span className="flashyNoSource">Source indisponible</span> : null}
            {active && !decision && !decisionFailed && item.source_kind ? <div className="flashyStageState"><Loader2 className="spin" size={28} aria-hidden="true" /><span>Préparation de la lecture</span></div> : null}
          </div>
        )}
        <div className="flashyScrim" />
        {showWarning ? (
          <div className="contentWarning flashyWarning" role="alert">
            <Flame size={30} aria-hidden="true" />
            <h2>Contenu sensible (18+)</h2>
            <p>Ce contenu contient des scènes réservées à un public adulte.</p>
            {item.content_flags.length ? (
              <ul className="watchChips">{item.content_flags.map((flag) => <li key={flag} className="isWarning">{CONTENT_FLAGS[flag] ?? flag}</li>)}</ul>
            ) : null}
            <button className="primaryButton" type="button" onClick={() => setAdultConfirmed(true)}>
              <Play size={17} aria-hidden="true" />Continuer vers la lecture
            </button>
          </div>
        ) : null}
        {showPlayer ? (
          <button
            className="flashySound"
            type="button"
            onClick={onToggleSound}
            aria-label={soundOn ? "Couper le son" : "Activer le son"}
            title={soundOn ? "Couper le son" : "Activer le son"}
          >
            {soundOn ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
          </button>
        ) : null}
        <div className="flashyCopy">
          <span className="flashyGenres">{item.genres.join(" · ")}</span>
          <h2>{item.title}</h2>
        </div>
        <FlashyRail item={item} profileId={profileId} open={infoOpen} onToggleInfo={onToggleInfo} />
        <FlashyInfo item={item} profileId={profileId} open={infoOpen} onClose={onCloseInfo} onOpenItem={onOpenItem} />
      </div>
    </article>
  );
});

export default function FlashyPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [infoOpenId, setInfoOpenId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);
  const activeIndexRef = useRef(0);
  const profileId = useMemo(() => getProfileId(), []);

  function load() {
    setLoading(true);
    setError(null);
    api.media("short", profileId).then(setItems).catch((err) => setError(err.message ?? "Flashy est indisponible.")).finally(() => setLoading(false));
  }

  useEffect(load, [profileId]);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const handleMutedChange = useCallback((muted: boolean) => {
    setSoundOn(!muted);
  }, []);

  const goTo = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(items.length - 1, activeIndexRef.current + delta));
    activeIndexRef.current = next;
    setActiveIndex(next);
    itemRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [items.length]);

  const handleThumbnail = useCallback((id: string, url: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, thumbnail_vertical_url: url } : item)));
  }, []);

  const openItem = useCallback((next: MediaItem) => {
    setInfoOpenId(null);
    activeIndexRef.current = 0;
    setActiveIndex(0);
    setItems((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    window.requestAnimationFrame(() => feedRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      if (infoOpenId) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      event.preventDefault();
      goTo(event.key === "ArrowDown" ? 1 : -1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goTo, infoOpenId]);

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
        if (index >= 0) {
          activeIndexRef.current = index;
          setActiveIndex(index);
        }
      },
      { root: feed, threshold: 0.55 }
    );
    itemRefs.current.forEach((node) => { if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, [items]);

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
          >
            {items.length ? (
              items.map((item, index) => (
                <FlashyItem
                  key={item.id}
                  ref={(node) => { itemRefs.current[index] = node; }}
                  item={item}
                  active={index === activeIndex}
                  profileId={profileId}
                  soundOn={soundOn}
                  infoOpen={infoOpenId === item.id}
                  onToggleSound={() => setSoundOn((current) => !current)}
                  onMutedChange={handleMutedChange}
                  onToggleInfo={() => setInfoOpenId((current) => (current === item.id ? null : item.id))}
                  onCloseInfo={() => setInfoOpenId(null)}
                  onOpenItem={openItem}
                  onThumbnail={handleThumbnail}
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
