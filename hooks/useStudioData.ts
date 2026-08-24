"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MediaItem } from "@/types/nino";

type Stats = {
  users: number;
  libraries: number;
  media: number;
  transcode_jobs: number;
  scan_jobs: number;
};

type StudioData = {
  media: MediaItem[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  accessDenied: boolean;
  refresh: () => void;
};

export function useStudioData(): StudioData {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    setAccessDenied(false);
    api.me().then((user) => {
      if (!user.is_admin) {
        setAccessDenied(true);
        return null;
      }
      return Promise.all([api.adminMedia(), api.adminStats()]);
    }).then((payload) => {
      if (payload) {
        setMedia(payload[0]);
        setStats(payload[1]);
      }
    })
      .then(() => api.adminPublishSweep().catch(() => null))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Nino Studio est indisponible."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return { media, stats, loading, error, accessDenied, refresh: load };
}

export type { Stats, StudioData };