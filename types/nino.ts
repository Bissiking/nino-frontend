import type { ApiSchemas } from "./nino-api.generated";

export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

export type ApiResponse<T> =
  | { success: true; data: T; meta: Record<string, unknown> }
  | { success: false; error: ApiError };

export type TokenPair = Required<ApiSchemas["TokenPair"]>;

export type AuthConfig = Required<ApiSchemas["AuthConfigOut"]>;

export type User = Required<ApiSchemas["UserOut"]>;

export type Profile = Required<ApiSchemas["ProfileOut"]>;

export type MediaItem = Required<ApiSchemas["MediaOut"]> &
  Partial<Pick<ApiSchemas["AdminMediaOut"], "notify_discord" | "discord_notified_at" | "source_origin" | "hls_variants">>;

export const CATEGORIES: Record<string, string> = {
  gaming: "Gaming",
  letsplay: "Let's Play",
  defi: "Défi",
  tutoriel: "Tutoriel",
  vlog: "Vlog",
  life: "Life",
  talk: "Talk / Réaction",
  documentaire: "Documentaire",
  autre: "Autre"
};

export const CONTENT_FLAGS: Record<string, string> = {
  drug: "Drogue",
  fear: "Horreur",
  gore: "Gore",
  language: "Langage",
  sex: "Sexe",
  violence: "Violence"
};

export const VISIBILITY_LABELS: Record<string, string> = {
  public: "Publique",
  private: "Privé",
  unlisted: "Unlisted",
  draft: "Brouillon",
  development: "Développement"
};

export type HlsVariant = {
  path: string;
  label: string;
  resolution: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  bandwidth: number | null;
  segments_count: number;
  size_bytes: number;
};

export type StorageIndexReport = {
  discovered: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ media_id: string; message: string }>;
};

export type MediaWritePayload = {
  kind: "movie" | "short" | "series";
  title: string;
  synopsis: string;
  description: string;
  category: string | null;
  tags: string[];
  year: number | null;
  duration_seconds: number;
  intro_start_seconds: number;
  intro_end_seconds: number;
  genres: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
  visibility: string;
  publish_at: string | null;
  is_available: boolean;
  notify_discord: boolean;
  no_spoil: boolean;
  is_adult: boolean;
  content_flags: string[];
  series_source_id: string | null;
  season_number: number | null;
  episode_number: number | null;
};

export type SeriesEpisodeEntry = {
  id: string;
  title: string;
  episode_number: number;
  duration_seconds: number;
  progress_percent: number;
  is_released: boolean;
  publish_at: string | null;
};

export type SeriesSeason = {
  season_number: number;
  episodes: SeriesEpisodeEntry[];
};

export type SeriesPage = {
  series: MediaItem;
  seasons: SeriesSeason[];
};

export type AdminEpisodes = {
  series_id: string;
  episodes: MediaItem[];
  seasons: Array<{ season_number: number; episode_ids: string[] }>;
};

export type PublishSweepResult = {
  notified: string[];
  failed: string[];
  skipped?: string;
};

export type HomeRail = {
  id: string;
  title: string;
  items: MediaItem[];
};

export type HomePayload = {
  hero: MediaItem | null;
  rails: HomeRail[];
};

export type StreamDecision = Required<ApiSchemas["StreamDecision"]>;

export type NotificationItem = Required<ApiSchemas["NotificationOut"]>;

export type InteractionsState = Required<ApiSchemas["InteractionsState"]>;

export type LikeToggleResult = Required<ApiSchemas["LikeOut"]>;

export type FavoriteToggleResult = Required<ApiSchemas["FavoriteOut"]>;

export type CommentItem = Required<ApiSchemas["CommentOut"]>;

export type CommentList = Required<ApiSchemas["CommentsOut"]>;

export type CommentCreateResult = Required<ApiSchemas["CommentCreatedOut"]>;

export type TranscodeJob = Required<ApiSchemas["TranscodeJobOut"]>;

export type TranscodeWorkerControl = Required<ApiSchemas["WorkerControlOut"]>;

export type TranscodeConfig = Required<ApiSchemas["TranscodeConfigOut"]>;

export type TranscodeSnapshot = {
  worker_enabled: boolean;
  worker: {
    name: string;
    heartbeat_at: string;
    age_seconds: number;
    alive: boolean;
  } | null;
  window: { start: string; end: string };
  poll_seconds: number;
  max_concurrency: number;
  max_attempts: number;
  stale_threshold_seconds: number;
  counts: { pending: number; running: number; failed: number; done: number };
  running: {
    id: string;
    media_id: string;
    worker: string | null;
    progress: number | null;
    stage: string | null;
    started_at: string | null;
    last_heartbeat: string | null;
    heartbeat_age_seconds: number | null;
    stale: boolean | null;
  } | null;
  worker_alive: boolean;
  jobs: TranscodeJob[];
};
