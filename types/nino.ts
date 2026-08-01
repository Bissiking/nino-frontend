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

