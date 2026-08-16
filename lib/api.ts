"use client";

import type { AdminEpisodes, ApiResponse, AuthConfig, CommentCreateResult, CommentList, FavoriteToggleResult, HomePayload, InteractionsState, LikeToggleResult, MediaItem, MediaWritePayload, NotificationItem, Profile, PublishSweepResult, SeriesPage, StorageIndexReport, StreamDecision, TokenPair, User } from "@/types/nino";
import { getAccessToken, redirectToLogin } from "./session";

const API_URL = process.env.NEXT_PUBLIC_NINO_API_URL ?? "http://localhost:8000";

export class NinoApiError extends Error {
  code: string;
  details: Record<string, unknown>;
  status: number;

  constructor(code: string, message: string, details: Record<string, unknown> = {}, status = 0) {
    super(message);
    this.name = "NinoApiError";
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = true): Promise<T> {
  const token = getAccessToken();
  if (requiresAuth && !token) {
    redirectToLogin();
    throw new NinoApiError("AUTH_REQUIRED", "Connexion requise.", {}, 401);
  }

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers
      }
    });
  } catch (error) {
    throw new NinoApiError(
      "NETWORK_ERROR",
      "Impossible de contacter le serveur. Vérifiez votre connexion.",
      { cause: error instanceof Error ? error.message : String(error) },
      0
    );
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (requiresAuth && response.status === 401) {
    redirectToLogin();
  }

  if (!body.success) {
    throw new NinoApiError(body.error.code, body.error.message, body.error.details, response.status);
  }
  return body.data;
}

export const api = {
  authConfig: () => request<AuthConfig>("/api/v1/auth/config", {}, false),
  startSso: () => request<{ authorize_url: string }>("/api/v1/auth/sso/start", { method: "POST" }, false),
  completeSso: (code: string, state: string) =>
    request<TokenPair>("/api/v1/auth/sso/callback", {
      method: "POST",
      body: JSON.stringify({ code, state })
    }, false),
  login: (identifier: string, password: string) =>
    request<TokenPair>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: identifier, password })
    }, false),
  logout: (refreshToken: string) =>
    request<{ revoked: boolean }>("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken })
    }, false),
  me: () => request<User>("/api/v1/me"),
  profiles: () => request<Profile[]>("/api/v1/profiles"),
  createProfile: (payload: { name: string; maturity_level: string; language: string }) =>
    request<Profile>("/api/v1/profiles", { method: "POST", body: JSON.stringify(payload) }),
  updateProfile: (profileId: string, payload: { name?: string; maturity_level?: string; language?: string }) =>
    request<Profile>(`/api/v1/profiles/${encodeURIComponent(profileId)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteProfile: (profileId: string) =>
    request<{ deleted: boolean; profile_id: string }>(`/api/v1/profiles/${encodeURIComponent(profileId)}`, { method: "DELETE" }),
  uploadProfileAvatar: (profileId: string, avatar: File) => {
    const form = new FormData();
    form.append("avatar", avatar);
    return request<Profile>(`/api/v1/profiles/${encodeURIComponent(profileId)}/avatar`, { method: "POST", body: form });
  },
  home: (profileId?: string | null) => request<HomePayload>(`/api/v1/home${profileId ? `?profile_id=${profileId}` : ""}`),
  media: (kind?: string, profileId?: string | null) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (profileId) params.set("profile_id", profileId);
    return request<MediaItem[]>(`/api/v1/media?${params.toString()}`);
  },
  mediaDetail: (id: string, profileId?: string | null) =>
    request<MediaItem>(`/api/v1/media/${id}${profileId ? `?profile_id=${profileId}` : ""}`),
  seriesDetail: (id: string, profileId?: string | null) =>
    request<SeriesPage>(`/api/v1/media/${id}/series${profileId ? `?profile_id=${profileId}` : ""}`),
  search: (query: string) => request<{ query: string; items: MediaItem[] }>(`/api/v1/search?q=${encodeURIComponent(query)}`),
  streamDecision: (id: string) => request<StreamDecision>(`/api/v1/stream/${id}/decision`),
  progress: (id: string, profileId: string, positionSeconds: number, durationSeconds: number) =>
    request<{ media_id: string; profile_id: string; percent: number }>(`/api/v1/media/${id}/progress`, {
      method: "POST",
      body: JSON.stringify({
        profile_id: profileId,
        position_seconds: positionSeconds,
        duration_seconds: durationSeconds,
        device: "web"
      })
    }),
  notifications: (profileId?: string | null) =>
    request<NotificationItem[]>(`/api/v1/notifications${profileId ? `?profile_id=${profileId}` : ""}`),
  mediaInteractions: (mediaId: string, profileId?: string | null) =>
    request<InteractionsState>(`/api/v1/media/${mediaId}/interactions${profileId ? `?profile_id=${profileId}` : ""}`),
  toggleLike: (mediaId: string, profileId: string) =>
    request<LikeToggleResult>(`/api/v1/media/${mediaId}/like`, {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId })
    }),
  toggleFavorite: (mediaId: string, profileId: string) =>
    request<FavoriteToggleResult>(`/api/v1/media/${mediaId}/favorite`, {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId })
    }),
  likedMedia: (profileId: string) => request<MediaItem[]>(`/api/v1/likes?profile_id=${encodeURIComponent(profileId)}`),
  favoritedMedia: (profileId: string) => request<MediaItem[]>(`/api/v1/favorites?profile_id=${encodeURIComponent(profileId)}`),
  comments: (mediaId: string) => request<CommentList>(`/api/v1/media/${mediaId}/comments`),
  createComment: (mediaId: string, profileId: string, content: string, parentId?: string | null) =>
    request<CommentCreateResult>(`/api/v1/media/${mediaId}/comments`, {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId, content, ...(parentId ? { parent_id: parentId } : {}) })
    }),
  deleteComment: (mediaId: string, commentId: string) =>
    request<{ deleted: boolean; comment_id: string }>(`/api/v1/media/${mediaId}/comments/${commentId}`, { method: "DELETE" }),
  adminStats: () =>
    request<{ users: number; libraries: number; media: number; transcode_jobs: number; scan_jobs: number }>("/api/v1/admin/stats"),
  adminMedia: () => request<MediaItem[]>("/api/v1/admin/media"),
  indexMediaStorage: () => request<StorageIndexReport>("/api/v1/admin/media/index-storage", { method: "POST" }),
  adminMediaDetail: (mediaId: string) =>
    request<MediaItem>(`/api/v1/admin/media/${encodeURIComponent(mediaId)}`),
  adminMediaStreamDecision: (mediaId: string) =>
    request<StreamDecision>(`/api/v1/admin/media/${encodeURIComponent(mediaId)}/stream-decision`),
  adminMediaEpisodes: (mediaId: string) =>
    request<AdminEpisodes>(`/api/v1/admin/media/${encodeURIComponent(mediaId)}/episodes`),
  adminReorderEpisodes: (mediaId: string, season: number, episodeIds: string[]) =>
    request<{ series_id: string; season: number; reordered: string[]; kept: string[] }>(
      `/api/v1/admin/media/${encodeURIComponent(mediaId)}/episodes/reorder`,
      { method: "POST", body: JSON.stringify({ season, episode_ids: episodeIds }) }
    ),
  adminPublishSweep: () =>
    request<PublishSweepResult>("/api/v1/admin/media/publish-sweep", { method: "POST" }),
  createAdminMedia: (payload: MediaWritePayload & { source_mode: "file" | "hls" }, files: File[]) => {
    const form = new FormData();
    form.append("payload", JSON.stringify(payload));
    files.forEach((file) => {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      form.append("files", file, file.name);
      form.append("asset_paths", relativePath);
    });
    return request<MediaItem>("/api/v1/admin/media", { method: "POST", body: form });
  },
  updateAdminMedia: (mediaId: string, payload: Partial<MediaWritePayload>) =>
    request<MediaItem>(`/api/v1/admin/media/${encodeURIComponent(mediaId)}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  deleteAdminMedia: (mediaId: string) =>
    request<{ deleted: boolean; media_id: string; deleted_count: number; freed_bytes: number }>(
      `/api/v1/admin/media/${encodeURIComponent(mediaId)}`,
      { method: "DELETE" }
    ),
  uploadMediaImage: (mediaId: string, field: string, file: File) => {
    const form = new FormData();
    form.append("field", field);
    form.append("file", file);
    return request<MediaItem>(`/api/v1/admin/media/${encodeURIComponent(mediaId)}/image`, { method: "POST", body: form });
  },
  deleteMediaImage: (mediaId: string, field: string) =>
    request<MediaItem>(`/api/v1/admin/media/${encodeURIComponent(mediaId)}/image?field=${encodeURIComponent(field)}`, { method: "DELETE" }),
  assetUrl: (path: string | null) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) return path;
    return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  }
};
