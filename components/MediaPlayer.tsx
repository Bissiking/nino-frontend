"use client";

import { useEffect, useRef, useState } from "react";
import Hls, { ErrorTypes, Events } from "hls.js";
import {
  Check, Gauge, Loader2, Maximize, Minimize, Pause, PictureInPicture, Play, Radio,
  RectangleHorizontal, RotateCw, SkipBack, SkipForward, Volume1, Volume2, VolumeX
} from "lucide-react";
import { api } from "@/lib/api";
import type { StreamDecision } from "@/types/nino";

export type PlayerUpNext = {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
};

type Props = {
  decision: StreamDecision;
  poster?: string | null;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  tapToToggle?: boolean;
  className?: string;
  mediaId?: string;
  profileId?: string | null;
  resumePercent?: number;
  resumePositionSeconds?: number | null;
  introStartSeconds?: number;
  introEndSeconds?: number;
  upNext?: PlayerUpNext | null;
  onUpNext?: () => void;
  onProgress?: (positionSeconds: number, durationSeconds: number) => void;
  onMutedChange?: (muted: boolean) => void;
};

const KEYBOARD_STEPS = 10;
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PROGRESS_SYNC_MS = 5000;
const UP_NEXT_LEAD_SECONDS = 30;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) return `${hours}:${minutes.toString().padStart(2, "0")}:${rest.toString().padStart(2, "0")}`;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function MediaPlayer({
  decision, poster, controls = true, autoPlay = false, muted = false, loop = false, tapToToggle = false, className,
  mediaId, profileId, resumePercent = 0, resumePositionSeconds = null, introStartSeconds = 0, introEndSeconds = 0,
  upNext = null, onUpNext, onProgress, onMutedChange = () => {}
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastProgressRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(muted ? 0 : 1);
  const [mutedState, setMutedState] = useState(muted);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [isCinema, setIsCinema] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [qualities, setQualities] = useState<Array<{ index: number; label: string; height: number }>>([]);
  const [quality, setQuality] = useState<number>(-1);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const onlineRef = useRef(true);
  const [ended, setEnded] = useState(false);
  const [upNextCancelled, setUpNextCancelled] = useState(false);

  const source = api.assetUrl(decision.url);
  const seekStep = KEYBOARD_STEPS;

  function resetAndResolveSource() {
    const video = videoRef.current;
    if (!video || !source) return;
    setError(null);
    setOffline(false);
    setReady(false);
    setQualities([]);
    setQuality(-1);
    resumeAppliedRef.current = false;
    setIsLive(false);
    setEnded(false);
    setUpNextCancelled(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const wantsHls = decision.mode === "hls";
    const nativeHls = video.canPlayType("application/vnd.apple.mpegurl");
    if (wantsHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 60
      });
      hlsRef.current = hls;
      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Events.MANIFEST_PARSED, () => {
        const seen = new Set<string>();
        const levels = hls.levels.reduce<Array<{ index: number; label: string; height: number }>>((acc, level, index) => {
          const height = level.height || index;
          const fps = level.frameRate || 0;
          const key = `${height}x${fps}`;
          if (seen.has(key)) return acc;
          seen.add(key);
          acc.push({ index, label: fps ? `${height}p ${fps}` : `${height}p`, height });
          return acc;
        }, []);
        setQualities(levels);
        setReady(true);
        setPlaying((current) => current && !video.paused);
      });

      hls.on(Events.LEVEL_SWITCHED, (_event, data) => {
        setQuality(data.level ?? -1);
      });

      hls.on(Events.ERROR, (_event, data) => {
        const { fatal, type } = data;
        if (!fatal) return;
        if (type === ErrorTypes.NETWORK_ERROR) {
          if (!onlineRef.current) setOffline(true);
          hls.startLoad();
          return;
        }
        if (type === ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }
        hls.destroy();
        hlsRef.current = null;
        setError("Impossible de lire ce flux sur cet appareil.");
      });
    } else if (wantsHls && nativeHls) {
      video.src = source;
      video.addEventListener("loadedmetadata", () => setReady(true), { once: true });
      setReady(true);
    } else {
      video.src = source;
      video.addEventListener("loadedmetadata", () => setReady(true), { once: true });
      setReady(true);
    }
  }

  function applyResume() {
    const video = videoRef.current;
    if (!video || resumeAppliedRef.current) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    const percent = resumePercent ?? 0;
    const exactPosition = resumePositionSeconds ?? 0;
    if (exactPosition > 0 && exactPosition < video.duration * 0.95) {
      video.currentTime = Math.min(exactPosition, Math.max(0, video.duration - 1));
    } else if (percent > 0 && percent < 95) {
      video.currentTime = (percent / 100) * video.duration;
    }
    resumeAppliedRef.current = true;
  }

  function isLiveState(): boolean {
    return duration === Infinity;
  }

  function trackProgress(force = false) {
    const video = videoRef.current;
    if (!video || !mediaId) return;
    const now = performance.now();
    if (!force && now - lastProgressRef.current < PROGRESS_SYNC_MS) return;
    lastProgressRef.current = now;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    if (!Number.isFinite(video.currentTime) || video.currentTime < 0) return;
    if (onProgress) {
      onProgress(video.currentTime, video.duration);
    }
    if (mediaId && profileId) {
      api.progress(mediaId, profileId, video.currentTime, video.duration).catch(() => {});
    }
  }

  function replayFromEnd() {
    const video = videoRef.current;
    if (!video) return;
    setEnded(false);
    setUpNextCancelled(true);
    video.currentTime = Math.max(0, (Number.isFinite(video.duration) ? video.duration : duration) - 15);
    void video.play().catch(() => {});
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
  }

  function seekBy(delta: number) {
    const video = videoRef.current;
    if (!video || isLiveState()) return;
    video.currentTime = Math.max(0, Math.min((Number.isFinite(video.duration) ? video.duration : 0), video.currentTime + delta));
  }

  function skipIntro() {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const target = Math.min(video.duration, introEndSeconds);
    if (target <= video.currentTime) return;
    video.currentTime = target;
    setCurrentTime(target);
    pokeControls();
  }

  function setPlaybackRate(rate: number) {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setSpeed(rate);
  }

  async function toggleFullscreen() {
    if (!containerRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current.requestFullscreen();
    } catch {
      /* plein écran non autorisé */
    }
  }

  async function togglePip() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* PiP non supporté */
    }
  }

  function toggleCinema() {
    setIsCinema((current) => !current);
    setShowControls(true);
  }

  function changeQuality(index: number) {
    const hls = hlsRef.current;
    if (!hls) return;
    if (index === -1) hls.currentLevel = -1;
    else hls.currentLevel = index;
    setQuality(index);
    setShowQualityMenu(false);
  }

  function handleKey(event: React.KeyboardEvent) {
    if (!controls) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
    switch (event.key) {
      case " ":
      case "k":
        event.preventDefault(); togglePlay(); break;
      case "ArrowLeft":
      case "j":
        event.preventDefault(); seekBy(-seekStep); break;
      case "ArrowRight":
      case "l":
        event.preventDefault(); seekBy(seekStep); break;
      case "ArrowUp":
        event.preventDefault(); { const v = videoRef.current; if (v) v.volume = Math.min(1, v.volume + 0.1); setVolume(videoRef.current?.volume ?? volume); } break;
      case "ArrowDown":
        event.preventDefault(); { const v = videoRef.current; if (v) v.volume = Math.max(0, v.volume - 0.1); setVolume(videoRef.current?.volume ?? volume); } break;
      case "m":
        event.preventDefault(); { const v = videoRef.current; if (v) v.muted = !v.muted; setMutedState(videoRef.current?.muted ?? true); } break;
      case "f":
        event.preventDefault(); void toggleFullscreen(); break;
      case "p":
        event.preventDefault(); void togglePip(); break;
      case ".":
      case ",":
        event.preventDefault(); {
          const index = SPEED_OPTIONS.indexOf(speed);
          const nextScore = event.key === "." ? [1, 1.25, 1.5, 2, 0.5, 0.75] : [1, 0.75, 0.5, 2, 1.5, 1.25];
          const currentIndex = nextScore.indexOf(speed);
          const nextRate = currentIndex >= 0 ? nextScore[(currentIndex + 1) % nextScore.length] : 1;
          setPlaybackRate(nextRate);
        } break;
      case "Home":
        event.preventDefault(); seekBy(-Number.MAX_SAFE_INTEGER); break;
      case "End":
        event.preventDefault(); { const v = videoRef.current; if (v) { v.currentTime = v.duration; } } break;
      case "Escape":
        if (upNext && onUpNext && !upNextCancelled) { event.preventDefault(); setUpNextCancelled(true); } break;
      default:
        break;
    }
  }

  function pokeControls() {
    setShowControls(true);
    if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setShowControls(false);
    }, 2600);
  }

  useEffect(() => {
    resetAndResolveSource();
    lastProgressRef.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision.url, decision.mode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted !== muted) video.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!ready || !autoPlay) return;
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {
      if (video.muted) return;
      video.muted = true;
      setMutedState(true);
      onMutedChange(true);
      void video.play().catch(() => {});
    });
  }, [ready, autoPlay, onMutedChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => { setPlaying(true); setBuffering(false); pokeControls(); };
    const onPause = () => { setPlaying(false); setShowControls(true); trackProgress(true); };
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => setBuffering(false);
    const onTime = () => { setCurrentTime(video.currentTime); trackProgress(); };
    const onLoaded = () => {
      setDuration(video.duration);
      applyResume();
      setIsLive(video.duration === Infinity);
      pokeControls();
    };
    const onVolume = () => { setVolume(video.volume); setMutedState(video.muted); };
    const onSpeed = () => setSpeed(video.playbackRate);
    const onVideoError = () => setError("Impossible de charger cette source.");
    const onEnded = () => {
      setPlaying(false);
      setShowControls(true);
      setEnded(true);
      trackProgress(true);
      if (upNext && onUpNext && !upNextCancelled) onUpNext();
    };
    const onEnterPip = () => setIsPip(true);
    const onLeavePip = () => setIsPip(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("volumechange", onVolume);
    video.addEventListener("ratechange", onSpeed);
    video.addEventListener("error", onVideoError);
    video.addEventListener("ended", onEnded);
    video.addEventListener("enterpictureinpicture", onEnterPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);

    const onOffline = () => { onlineRef.current = false; setOffline(true); };
    const onOnline = () => { onlineRef.current = true; setOffline(false); };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    const updateFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    const saveBeforeLeaving = () => trackProgress(true);
    const saveWhenHidden = () => { if (document.visibilityState === "hidden") trackProgress(true); };
    window.addEventListener("pagehide", saveBeforeLeaving);
    document.addEventListener("visibilitychange", saveWhenHidden);

    return () => {
      trackProgress(true);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("volumechange", onVolume);
      video.removeEventListener("ratechange", onSpeed);
      video.removeEventListener("error", onVideoError);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("enterpictureinpicture", onEnterPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("fullscreenchange", updateFullscreen);
      window.removeEventListener("pagehide", saveBeforeLeaving);
      document.removeEventListener("visibilitychange", saveWhenHidden);
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId, profileId, resumePercent, resumePositionSeconds, upNext?.id]);

  useEffect(() => () => {
    if (hlsRef.current) hlsRef.current.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isCinema) return;
    const onResize = () => { if (window.innerWidth <= 760) setIsCinema(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isCinema]);

  useEffect(() => {
    document.body.classList.toggle("isCinematic", isCinema);
    return () => document.body.classList.remove("isCinematic");
  }, [isCinema]);

  const live = isLive;
  const VolumeIcon = mutedState || volume === 0 ? VolumeX : volume < 0.55 ? Volume1 : Volume2;
  const isSeekable = !live && duration > 0 && Number.isFinite(duration);
  const progressPercent = isSeekable ? (currentTime / duration) * 100 : 0;
  const introEnd = Math.min(duration, introEndSeconds);
  const remainingSeconds = duration > 0 ? duration - currentTime : Infinity;
  const upNextLead = Math.min(30, duration || 0);
  const showUpNext = Boolean(
    controls && !ended && !error && !offline && upNext && onUpNext && isSeekable && !upNextCancelled
    && remainingSeconds > 0.5 && remainingSeconds <= upNextLead
  );
  const upNextCountdownDisplay = Math.max(1, Math.ceil(remainingSeconds));
  const upNextProgress = upNextLead > 0 ? Math.min(1, Math.max(0, (upNextLead - remainingSeconds) / upNextLead)) : 0;
  const canSkipIntro = controls
    && isSeekable
    && introStartSeconds >= 0
    && introEnd > introStartSeconds
    && currentTime >= introStartSeconds
    && currentTime < introEnd;

  return (
    <div
      ref={containerRef}
      className={`mediaPlayer ${isCinema ? "isCinema" : ""} ${controls && showControls ? "hasControls" : ""} ${className ?? ""}`}
      onKeyDown={handleKey}
      onMouseMove={pokeControls}
      onTouchStart={pokeControls}
      onMouseLeave={() => { if (playing && !isPip) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        controls={false}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        poster={poster ? api.assetUrl(poster) ?? undefined : undefined}
        onClick={controls || tapToToggle ? togglePlay : undefined}
        onDoubleClick={() => { if (controls) void toggleFullscreen(); }}
      />

      {!ready && !error ? (
        <div className="playerState"><Loader2 className="spin" size={42} aria-hidden="true" /><span>{decision.mode === "hls" ? "Chargement du flux HLS…" : "Chargement de la vidéo…"}</span></div>
      ) : null}

      {buffering && ready && playing ? (
        <div className="playerState isBuffering"><Loader2 className="spin" size={32} aria-hidden="true" /><span>Mise en mémoire tampon…</span></div>
      ) : null}

      {offline ? (
        <div className="playerState isOffline" role="alert">
          <Radio size={34} aria-hidden="true" />
          <span>Connexion perdue. Nouvelle tentative automatique…</span>
        </div>
      ) : null}

      {error ? (
        <div className="playerState isError" role="alert">
          <span>{error}</span>
          <button className="secondaryButton" type="button" onClick={() => resetAndResolveSource()}><RotateCw size={16} aria-hidden="true" />Réessayer</button>
        </div>
      ) : null}

      {controls && ended && ready ? (
      <div className="playerEnded" role="dialog" aria-label="Fin de lecture">
        <div className="playerEndedCard">
          {upNext && !upNextCancelled ? (
            <>
              <span className="playerEndedLabel"><Play size={14} fill="currentColor" aria-hidden="true" />À suivre</span>
              <strong className="playerEndedTitle">{upNext.title}</strong>
              <div className="playerEndedActions">
                <button className="primaryButton" type="button" onClick={onUpNext ? onUpNext : replayFromEnd}><Play size={16} fill="currentColor" aria-hidden="true" />Lire maintenant</button>
                <button className="secondaryButton" type="button" onClick={replayFromEnd}><RotateCw size={16} aria-hidden="true" />Revoir la fin</button>
              </div>
            </>
          ) : (
            <>
              <span className="playerEndedLabel">Lecture terminée</span>
              <strong className="playerEndedTitle">Merci d’avoir regardé ce contenu.</strong>
              <div className="playerEndedActions">
                <button className="primaryButton" type="button" onClick={replayFromEnd}><RotateCw size={16} aria-hidden="true" />Revoir</button>
              </div>
            </>
          )}
        </div>
      </div>
    ) : null}

    {showUpNext ? (
      <div
        className="playerUpNext"
        role="dialog"
        aria-label="Épisode suivant"
        style={{ '--upnext-progress': `${upNextProgress * 100}%` } as React.CSSProperties}
      >
        <div className="playerUpNextInner">
          <div className="playerUpNextLabel"><Play size={13} fill="currentColor" aria-hidden="true" />Épisode suivant</div>
          <div className="playerUpNextTimer" aria-live="polite">dans {upNextCountdownDisplay}</div>
          <strong className="playerUpNextTitle">{upNext!.title}</strong>
        </div>
        <div className="playerUpNextActions">
          <button className="primaryButton" type="button" onClick={onUpNext}><Play size={16} fill="currentColor" aria-hidden="true" />Lire maintenant</button>
          <button className="secondaryButton" type="button" onClick={() => setUpNextCancelled(true)}>Annuler</button>
        </div>
      </div>
    ) : null}

      {(controls || tapToToggle) && ready && !error && !offline && !playing && !ended ? (
        <div className="playerBigPlay" role="presentation">
          <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Lecture"}><Play size={26} fill="currentColor" aria-hidden="true" /></button>
        </div>
      ) : null}

      {canSkipIntro ? (
        <button className="playerSkipIntro" type="button" onClick={skipIntro} onFocus={pokeControls}>
          Passer l’intro <SkipForward size={18} aria-hidden="true" />
        </button>
      ) : null}

      {controls ? (
        <div className="playerControls">
          {live ? <span className="playerLiveBadge"><Radio size={14} aria-hidden="true" /> EN DIRECT</span> : null}

          <div className="playerSeek">
            <input
              type="range"
              min={0}
              max={isSeekable ? Math.floor(duration) : 100}
              step={1}
              value={isSeekable ? Math.min(currentTime, duration) : 0}
              onChange={(event) => { if (videoRef.current) videoRef.current.currentTime = Number(event.target.value); }}
              onInput={(event) => setCurrentTime(Number((event.target as HTMLInputElement).value))}
              disabled={!isSeekable}
              aria-label="Position de lecture"
              style={{ "--progress": `${progressPercent}%` } as React.CSSProperties}
            />
          </div>

          <div className="playerBar">
            <div className="playerBarLeft">
              <button className="playerBtn" type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Lecture"}>{playing ? <Pause size={19} fill="currentColor" aria-hidden="true" /> : <Play size={19} fill="currentColor" aria-hidden="true" />}</button>
              <button className="playerBtn" type="button" onClick={() => seekBy(-seekStep)} aria-label={`Reculer de ${seekStep} secondes`}><SkipBack size={18} aria-hidden="true" /></button>
              <button className="playerBtn" type="button" onClick={() => seekBy(seekStep)} aria-label={`Avancer de ${seekStep} secondes`}><SkipForward size={18} aria-hidden="true" /></button>
              {!live ? (
                <span className="playerTime">{formatTime(currentTime)}<em>/</em>{formatTime(duration)}</span>
              ) : null}
              <div className="playerVolume">
                <button className="playerBtn" type="button" onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; setMutedState(videoRef.current?.muted ?? true); }} aria-label={mutedState ? "Activer le son" : "Couper le son"}><VolumeIcon size={18} aria-hidden="true" /></button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={mutedState ? 0 : volume}
                  onChange={(event) => { const v = videoRef.current; if (v) { v.volume = Number(event.target.value); v.muted = Number(event.target.value) === 0; } setVolume(Number(event.target.value)); setMutedState(Number(event.target.value) === 0); }}
                  aria-label="Volume"
                />
              </div>
            </div>

            <div className="playerBarRight">
              {qualities.length > 1 ? (
                <div className="playerMenuWrap">
                  <button className="playerBtn" type="button" onClick={() => setShowQualityMenu((c) => !c)} aria-label="Qualité" aria-expanded={showQualityMenu}><Gauge size={18} aria-hidden="true" />{quality === -1 ? "Auto" : `${qualities.find((q) => q.index === quality)?.label ?? ""}`}</button>
                  {showQualityMenu ? (
                    <div className="playerMenu" role="menu" aria-label="Qualité">
                      <button type="button" role="menuitem" onClick={() => changeQuality(-1)} className={quality === -1 ? "isActive" : undefined}><Check size={15} aria-hidden="true" />Auto</button>
                      {qualities.map((q) => (
                        <button key={q.index} type="button" role="menuitem" className={quality === q.index ? "isActive" : undefined} onClick={() => changeQuality(q.index)}><Check size={15} aria-hidden="true" />{q.label}</button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="playerMenuWrap">
                <button className="playerBtn" type="button" onClick={() => setShowSpeedMenu((c) => !c)} aria-label="Vitesse de lecture" aria-expanded={showSpeedMenu}>{speed}x</button>
                {showSpeedMenu ? (
                  <div className="playerMenu" role="menu" aria-label="Vitesse de lecture">
                    {SPEED_OPTIONS.map((rate) => (
                      <button key={rate} type="button" role="menuitem" className={speed === rate ? "isActive" : undefined} onClick={() => { setPlaybackRate(rate); setShowSpeedMenu(false); }}><Check size={15} aria-hidden="true" />{rate}x</button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button className="playerBtn playerCinemaBtn" type="button" onClick={toggleCinema} aria-label={isCinema ? "Quitter le mode cinéma" : "Mode cinéma"}><RectangleHorizontal size={18} aria-hidden="true" /></button>
              <button className="playerBtn playerPipBtn" type="button" onClick={() => void togglePip()} aria-label={isPip ? "Quitter le PiP" : "Image dans l’image"}><PictureInPicture size={18} aria-hidden="true" /></button>
              <button className="playerBtn" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}>{isFullscreen ? <Minimize size={18} aria-hidden="true" /> : <Maximize size={18} aria-hidden="true" />}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
