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

export type AuthConfig = {
  provider: "local" | "kyros" | "hybrid" | string;
  kyros_login_mode: "sso" | "direct" | "hybrid" | null;
  sso_enabled: boolean;
  password_enabled: boolean;
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
  visibility: "public" | "private" | "draft" | string;
  publish_at: string | null;
  source_kind: "file" | "hls" | null;
  source_filename: string | null;
  file_size_bytes: number | null;
  source_origin: "upload" | "luma_storage" | string | null;
  hls_variants: HlsVariant[];
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
  kind: "movie" | "short";
  title: string;
  synopsis: string;
  year: number | null;
  duration_seconds: number;
  genres: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  visibility: string;
  publish_at: string | null;
  is_available: boolean;
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
