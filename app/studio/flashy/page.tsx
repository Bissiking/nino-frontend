"use client";

import { useState } from "react";
import { StudioShell } from "@/components/studio/StudioShell";
import { StudioLibrary } from "@/components/studio/StudioLibrary";
import { useStudioData } from "@/hooks/useStudioData";

export default function FlashyPage() {
  const { media, loading, error, accessDenied, refresh } = useStudioData();
  const [creating, setCreating] = useState(false);

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
                items={media.filter((item) => item.kind === "short")}
                kind="flashy"
                onCreate={() => setCreating(true)}
                onDeleted={handleDeleted}
              />
            </main>
          ) : null}
        </div>
      </div>
    </StudioShell>
  );
}