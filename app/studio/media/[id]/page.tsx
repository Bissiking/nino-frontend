"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleOff } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import { MediaEditor } from "@/components/studio/MediaEditor";
import { api } from "@/lib/api";
import type { MediaItem, StreamDecision } from "@/types/nino";

export default function StudioMediaEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [decision, setDecision] = useState<StreamDecision | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPreview = useCallback(async (mediaId: string) => {
    setPreviewError(null);
    try {
      setDecision(await api.adminMediaStreamDecision(mediaId));
    } catch (reason) {
      setDecision(null);
      setPreviewError(reason instanceof Error ? reason.message : "Le flux de prévisualisation est indisponible.");
    }
  }, []);

  const load = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    setAccessDenied(false);
    try {
      const user = await api.me();
      if (!user.is_admin) {
        setAccessDenied(true);
        setMedia(null);
        return;
      }
      const nextMedia = await api.adminMediaDetail(params.id);
      setMedia(nextMedia);
      await loadPreview(nextMedia.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de charger ce média.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadPreview, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      {loading ? <LoadingState label="Chargement de l’éditeur" /> : null}
      {error && !loading ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {accessDenied && !loading ? <div className="studioAccessDenied"><CircleOff size={30} aria-hidden="true" /><h1>Accès administrateur requis</h1><p>Ce média peut être regardé, mais sa fiche ne peut être modifiée qu’avec un compte administrateur.</p></div> : null}
      {!loading && !error && !accessDenied && media ? (
        <MediaEditor
          variant="page"
          kind={media.kind === "short" ? "short" : "movie"}
          media={media}
          decision={decision}
          previewError={previewError}
          refreshing={refreshing}
          onRefresh={() => void load(true)}
          onCancel={() => router.push("/studio#videos")}
          onSaved={(saved) => {
            setMedia(saved);
            void loadPreview(saved.id);
          }}
        />
      ) : null}
    </AppShell>
  );
}
