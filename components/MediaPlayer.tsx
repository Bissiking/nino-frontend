"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { api } from "@/lib/api";
import type { StreamDecision } from "@/types/nino";

type Props = {
  decision: StreamDecision;
  poster?: string | null;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
};

export function MediaPlayer({ decision, poster, controls = true, autoPlay = false, muted = false, loop = false, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const source = api.assetUrl(decision.url);
    if (!video || !source) return;
    setError(false);

    if (decision.mode === "hls" && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError(true);
      });
      return () => hls.destroy();
    }

    video.src = source;
    return () => {
      video.removeAttribute("src");
      video.load();
    };
  }, [decision.mode, decision.url]);

  return (
    <div className={`mediaPlayer ${className ?? ""}`}>
      <video ref={videoRef} controls={controls} autoPlay={autoPlay} muted={muted} loop={loop} playsInline poster={poster ? api.assetUrl(poster) ?? undefined : undefined} onError={() => setError(true)} />
      {error ? <p role="alert">Ce flux ne peut pas être lu sur cet appareil.</p> : null}
    </div>
  );
}
