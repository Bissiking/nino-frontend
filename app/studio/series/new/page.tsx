"use client";

import { useRouter } from "next/navigation";
import { StudioShell } from "@/components/studio/StudioShell";
import { MediaEditor } from "@/components/studio/MediaEditor";

export default function NewSeriesPage() {
  const router = useRouter();

  return (
    <StudioShell>
      <div className="studioSeriesPage">
        <MediaEditor
          kind="series"
          onCancel={() => router.push("/studio/series")}
          onSaved={(media) => router.push(`/studio/series/${encodeURIComponent(media.id)}`)}
        />
      </div>
    </StudioShell>
  );
}