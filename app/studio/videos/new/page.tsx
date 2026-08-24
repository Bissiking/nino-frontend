"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MediaEditor } from "@/components/studio/MediaEditor";
import { StudioShell } from "@/components/studio/StudioShell";

function NewVideoEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const seriesId = searchParams.get("series") ?? "";
  const season = Math.max(1, Number(searchParams.get("season") ?? 1) || 1);

  return (
    <StudioShell>
      <div className="studioCreateStage">
        <MediaEditor
          kind="movie"
          initialSeriesId={seriesId}
          initialSeasonNumber={season}
          onCancel={() => router.push(seriesId ? `/studio/series/${encodeURIComponent(seriesId)}` : "/studio/videos")}
          onSaved={(media) => router.push(seriesId ? `/studio/series/${encodeURIComponent(seriesId)}` : `/studio/media/${encodeURIComponent(media.id)}`)}
        />
      </div>
    </StudioShell>
  );
}

export default function NewVideoPage() {
  return <Suspense fallback={<div className="studioControlSkeleton" aria-label="Chargement" aria-busy="true"><span /><span /><span /></div>}><NewVideoEditor /></Suspense>;
}
