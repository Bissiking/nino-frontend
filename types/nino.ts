export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

export type ApiResponse<T> =
  | { success: true; data: T; meta: Record<string, unknown> }
  | { success: false; error: ApiError };

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
};

export type User = {
  id: string;
  email: string;
  display_name: string;
  is_admin: boolean;
};

export type Profile = {
  id: string;
  name: string;
  avatar: string | null;
  maturity_level: string;
  language: string;
};

export type MediaItem = {
  id: string;
  kind: "movie" | "series" | "short" | "live" | string;
  title: string;
  synopsis: string;
  year: number | null;
  duration_seconds: number;
  genres: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  rating: number | null;
  is_available: boolean;
  progress_percent: number;
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

export type StreamDecision = {
  media_id: string;
  mode: string;
  url: string;
  mime_type: string;
  expires_in: number;
  reason: string;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  level: string;
  is_read: boolean;
  created_at: string;
};

export type V7MigrationSnapshot = {
  id: string;
  status: "pending" | "ready" | "failed" | string;
  source_url: string;
  source_version: string | null;
  table_count: number;
  row_count: number;
  video_count: number;
  error_code: string | null;
  error_message: string | null;
  created_at: string | null;
  completed_at: string | null;
};

export type V7MigrationSnapshotDetail = V7MigrationSnapshot & {
  payload: unknown | null;
};

export type V7ImportVideo = {
  source_id: string;
  status: "ready" | "existing" | "invalid" | string;
  title: string;
  description: string;
  legacy_user_id: string | null;
  series_source_id: string | null;
  season_number: number | null;
  episode_number: number | null;
  duration_seconds: number;
  publish_at: string | null;
  visibility: string;
  encoding_status: string | null;
  hls_status: string | null;
  has_subtitles: boolean;
  source_path: string | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  warnings: string[];
};

export type V7ImportUser = {
  id: string;
  email: string;
  display_name: string;
  profiles: Profile[];
};

export type V7ImportPreview = {
  snapshot_id: string;
  source_version: string | null;
  videos: V7ImportVideo[];
  legacy_user_ids: string[];
  users: V7ImportUser[];
  counts: { total: number; ready: number; existing: number; invalid: number };
};

export type V7ImportResult = {
  snapshot_id: string;
  imported: Array<{ source_id: string; media_id: string; title: string }>;
  skipped: Array<{ source_id: string; reason: string; media_id: string }>;
  counts: { requested: number; imported: number; skipped: number; progress: number; favorites: number };
};
