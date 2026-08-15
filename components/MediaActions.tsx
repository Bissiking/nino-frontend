"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Loader2, ThumbsUp } from "lucide-react";
import { NinoApiError, api } from "@/lib/api";
import { getProfileId } from "@/lib/session";

type Props = {
  mediaId: string;
  initialLiked?: boolean;
  initialFavorited?: boolean;
  initialLikeCount?: number;
};

export function MediaActions({ mediaId, initialLiked = false, initialFavorited = false, initialLikeCount = 0 }: Props) {
  const profileId = useMemo(() => getProfileId(), []);
  const [liked, setLiked] = useState(initialLiked);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [busy, setBusy] = useState<"like" | "favorite" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profileId) return;
    let cancelled = false;
    api.mediaInteractions(mediaId, profileId)
      .then((state) => {
        if (cancelled) return;
        setLiked(state.liked);
        setFavorited(state.favorited);
        setLikeCount(state.like_count);
      })
      .catch(() => { /* silencieux, on garde les valeurs initiales */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId, profileId]);

  async function run(kind: "like" | "favorite") {
    if (!profileId || busy) return;
    setBusy(kind);
    setMessage(null);
    try {
      if (kind === "like") {
        const result = await api.toggleLike(mediaId, profileId);
        setLiked(result.liked);
        setLikeCount(result.like_count);
      } else {
        const result = await api.toggleFavorite(mediaId, profileId);
        setFavorited(result.favorited);
      }
    } catch (error) {
      const fallback = error instanceof NinoApiError ? error.message : "Action impossible. Vérifiez votre connexion.";
      setMessage(error instanceof NinoApiError && error.code === "PROFILE_NOT_FOUND" ? "Sélectionnez d'abord un profil." : fallback);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mediaActions">
      <button
        className={`mediaActionBtn ${liked ? "isLiked" : ""}`}
        type="button"
        onClick={() => void run("like")}
        disabled={busy !== null}
        aria-pressed={liked}
      >
        {busy === "like" ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <ThumbsUp size={18} aria-hidden="true" />}
        <span>{liked ? "Je n'aime plus la vidéo" : "J'aime la vidéo"}</span>
        <em className="mediaActionCount">{likeCount || ""}</em>
      </button>
      <button
        className={`mediaActionBtn ${favorited ? "isFavorited" : ""}`}
        type="button"
        onClick={() => void run("favorite")}
        disabled={busy !== null}
        aria-pressed={favorited}
      >
        {busy === "favorite" ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Heart size={18} aria-hidden="true" />}
        <span>{favorited ? "Retirer des favoris" : "Ajouter aux favoris"}</span>
      </button>
      {message ? <p className="mediaActionMessage" role="alert">{message}</p> : null}
    </div>
  );
}