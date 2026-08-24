"use client";

import { useRouter } from "next/navigation";
import { StudioShell } from "@/components/studio/StudioShell";
import { StudioLibrary } from "@/components/studio/StudioLibrary";
import { useStudioData } from "@/hooks/useStudioData";

export default function VideosPage() {
  const router = useRouter();
  const { media, loading, error, accessDenied, refresh } = useStudioData();

  function handleDeleted(mediaId: string) {
    refresh();
  }

  return (
    <StudioShell>
      <div className="studioControlRoom studioModernControlRoom">
        <div className="studioControlMain">
          {loading && <div className="studioControlSkeleton" aria-label="Chargement" aria-busy="true"><span /><span /><span /><span /></div>}
          {error && !loading && <div className="studioAccessDenied"><p role="alert">{error}</p><button type="button" onClick={() => refresh()}>Réessayer</button></div>}
          {accessDenied && !loading && <div className="studioAccessDenied"><h1>Accès administrateur requis</h1><p>Votre compte peut regarder Nino, mais il ne peut pas ouvrir la régie éditoriale.</p></div>}

          {!loading && !error && !accessDenied ? (
            <main className="studioControlContent">
              <StudioLibrary
                items={media.filter((item) => !["series", "short", "live"].includes(item.kind))}
                kind="videos"
                onCreate={() => router.push("/studio/videos/new")}
                onDeleted={handleDeleted}
              />
            </main>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}
