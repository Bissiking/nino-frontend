"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { NinoApiError, api } from "@/lib/api";
import { getProfileId } from "@/lib/session";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateBlock";
import type { CommentItem } from "@/types/nino";

type Props = {
  mediaId: string;
};

function formatDate(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function CommentsSection({ mediaId }: Props) {
  const profileId = useMemo(() => getProfileId(), []);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const confirmTimerRef = useRef<number | null>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement | null>(null);
  const deleteTriggerRefs = useRef(new Map<string, HTMLButtonElement>());

  function cancelConfirm(restoreFocus = true) {
    const commentId = confirmingId;
    if (confirmTimerRef.current !== null) window.clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = null;
    setConfirmingId(null);
    if (restoreFocus && commentId) {
      window.requestAnimationFrame(() => deleteTriggerRefs.current.get(commentId)?.focus());
    }
  }

  function armConfirm(commentId: string) {
    setError(null);
    setConfirmingId(commentId);
    if (confirmTimerRef.current !== null) window.clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = window.setTimeout(() => {
      confirmTimerRef.current = null;
      setConfirmingId((current) => {
        if (current !== commentId) return current;
        window.requestAnimationFrame(() => deleteTriggerRefs.current.get(commentId)?.focus());
        return null;
      });
    }, 5000);
  }

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.comments(mediaId)
      .then((payload) => setComments(payload.comments))
      .catch((err) => setError(err instanceof NinoApiError ? err.message : "Impossible de charger les commentaires."))
      .finally(() => setLoading(false));
  }, [mediaId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => () => {
    if (confirmTimerRef.current !== null) window.clearTimeout(confirmTimerRef.current);
  }, []);

  useEffect(() => {
    if (confirmingId) cancelDeleteRef.current?.focus();
  }, [confirmingId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (content.length < 2 || sending || !profileId) return;
    setSending(true);
    setError(null);
    try {
      await api.createComment(mediaId, profileId, content);
      setDraft("");
      load();
    } catch (err) {
      const message = err instanceof NinoApiError ? err.message : "Erreur lors de l'envoi du commentaire.";
      setError(err instanceof NinoApiError && err.code === "PROFILE_NOT_FOUND" ? "Sélectionnez d'abord un profil." : message);
    } finally {
      setSending(false);
    }
  }

  async function remove(commentId: string) {
    if (!profileId || deletingId) return;
    cancelConfirm(false);
    setDeletingId(commentId);
    setError(null);
    try {
      await api.deleteComment(mediaId, commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof NinoApiError ? err.message : "Impossible de supprimer ce commentaire.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="commentsSection" aria-label="Commentaires">
      <div className="commentsHeader">
        <h2>Commentaires</h2>
        <span className="commentsCount">{comments.length}</span>
      </div>

      <form className="commentForm" onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={1200}
          placeholder="Écrire un commentaire..."
          aria-label="Votre commentaire"
          rows={3}
        />
        <div className="commentFormFooter">
          <small>Les commentaires peuvent passer en vérification.</small>
          <button className="primaryButton" type="submit" disabled={sending || draft.trim().length < 2}>
            {sending ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}Publier
          </button>
        </div>
      </form>

      {loading ? <LoadingState label="Chargement des commentaires" /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && comments.length === 0 ? (
        <EmptyState title="Aucun commentaire" message="Soyez le premier à réagir à cette vidéo." />
      ) : null}
      {!loading && !error && comments.length > 0 ? (
        <ul className="commentList">
          {comments.map((comment) => (
            <li className="commentCard" key={comment.id}>
              <div className="commentMeta">
                <strong className="commentAuthor">{comment.author_name}</strong>
                <time className="commentDate">{formatDate(comment.created_at)}</time>
                {comment.profile_id === profileId ? (
                  <span
                    className="commentDeleteWrap"
                    role="group"
                    aria-label="Suppression du commentaire"
                    onKeyDown={(event) => {
                      if (event.key !== "Escape") return;
                      event.preventDefault();
                      cancelConfirm();
                    }}
                  >
                    {confirmingId === comment.id ? (
                      <>
                        <span className="commentDeletePrompt" aria-live="polite">Supprimer ce commentaire ?</span>
                        <button
                          className="commentDeleteBtn isDanger"
                          type="button"
                          onClick={() => void remove(comment.id)}
                          disabled={deletingId !== null}
                        >
                          {deletingId === comment.id ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <Trash2 size={14} aria-hidden="true" />}Supprimer
                        </button>
                        <button ref={cancelDeleteRef} className="commentDeleteBtn" type="button" onClick={() => cancelConfirm()} disabled={deletingId !== null}>Annuler</button>
                      </>
                    ) : (
                      <button
                        ref={(node) => {
                          if (node) deleteTriggerRefs.current.set(comment.id, node);
                          else deleteTriggerRefs.current.delete(comment.id);
                        }}
                        className="commentDelete"
                        type="button"
                        onClick={() => armConfirm(comment.id)}
                        disabled={deletingId !== null}
                        aria-label="Supprimer mon commentaire"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                ) : null}
              </div>
              <p className="commentContent">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
