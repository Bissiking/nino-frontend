"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudioPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/studio/overview");
  }, [router]);

  return (
    <div className="studioControlRoom studioModernControlRoom">
      <div className="studioControlMain">
        <div className="studioControlSkeleton" aria-label="Redirection" aria-busy="true">
          <span /><span /><span /><span />
        </div>
      </div>
    </div>
  );
}