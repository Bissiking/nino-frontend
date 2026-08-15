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
  sso_version: string | null;
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
  description: string;
  category: string | null;
  tags: string[];
  year: number | null;
  duration_seconds: number;
  genres: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
  rating: number | null;
  is_available: boolean;
  is_adult: boolean;
  content_flags: string[];
  no_spoil: boolean;
  series_source_id: string | null;
  season_number: number | null;
  episode_number: number | null;
  notify_discord?: boolean;
  progress_percent: number;
  position_seconds?: number | null;
  visibility: "public" | "private" | "unlisted" | "draft" | string;
  publish_at: string | null;
  source_kind: "file" | "hls" | null;
  source_filename: string | null;
  file_size_bytes: number | null;
  source_origin: "upload" | "luma_storage" | "transcode" | string | null;
  hls_variants: HlsVariant[];
  encoding_status?: "pending" | "running" | "ready" | "failed" | null;
  hls_status?: "ready" | null;
  liked?: boolean;
  favorited?: boolean;
  like_count?: number;
};

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
  draft: "Brouillon"
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

export type InteractionsState = {
  media_id: string;
  liked: boolean;
  favorited: boolean;
  like_count: number;
  comment_count: number;
};

export type LikeToggleResult = {
  media_id: string;
  liked: boolean;
  like_count: number;
};

export type FavoriteToggleResult = {
  media_id: string;
  favorited: boolean;
};

export type CommentItem = {
  id: string;
  media_id: string;
  profile_id: string;
  parent_id: string | null;
  content: string;
  author_name: string;
  created_at: string | null;
};

export type CommentList = {
  media_id: string;
  comments: CommentItem[];
};

export type CommentCreateResult = {
  comment: CommentItem;
  comment_count: number;
};
