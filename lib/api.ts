"use client";

import type { AdminEpisodes, ApiResponse, AuthConfig, CommentCreateResult, CommentList, FavoriteToggleResult, HomePayload, InteractionsState, LikeToggleResult, MediaItem, MediaWritePayload, NotificationItem, Profile, PublishSweepResult, SeriesPage, StorageIndexReport, StreamDecision, TokenPair, TranscodeJob, TranscodeSnapshot, TranscodeWorkerControl, User } from "@/types/nino";
import { getAccessToken, getRefreshToken, redirectToLogin, saveTokens } from "./session";

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

async function doFetch(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  try {
    return await fetch(`${API_URL}${path}`, {
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
}

let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new NinoApiError("AUTH_REQUIRED", "Connexion requise.", {}, 401);
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }
  refreshInFlight = (async () => {
    try {
      const tokens = await request<TokenPair>(
        "/api/v1/auth/refresh",
        { method: "POST", body: JSON.stringify({ refresh_token: refreshToken }) },
        false
      );
      saveTokens(tokens.access_token, tokens.refresh_token);
      return tokens.access_token;
    } catch (error) {
      redirectToLogin();
      throw error;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit = {}, requiresAuth = true): Promise<T> {
  const token = getAccessToken();
  if (requiresAuth && !token) {
    redirectToLogin();
    throw new NinoApiError("AUTH_REQUIRED", "Connexion requise.", {}, 401);
  }

  let response = await doFetch(path, init, token);

  if (requiresAuth && response.status === 401) {
    let fresh: string | null = null;
    try {
      fresh = await refreshAccessToken();
    } catch {
      fresh = null;
    }
    if (fresh) {
      response = await doFetch(path, init, fresh);
    }
  }

  if (requiresAuth && response.status === 401) {
    redirectToLogin();
  }

  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const responseText = await response.text();
  let body: ApiResponse<T> | null = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText) as ApiResponse<T>;
    } catch {
      body = null;
    }
  }

  if (!body) {
    const status = response.status || 0;
    const statusLabel = status ? ` (HTTP ${status})` : "";
    const message = status === 413
      ? "Le fichier dépasse la taille autorisée par le serveur ou son proxy."
      : status === 400 && isFormData
        ? "Le serveur a refusé les données de l’upload. Vérifiez la taille du fichier et la configuration du proxy."
        : status >= 500
          ? "Le serveur a rencontré une erreur pendant la requête."
          : "Le serveur a renvoyé une réponse illisible.";
    throw new NinoApiError(
      "INVALID_SERVER_RESPONSE",
      `${message}${statusLabel}`,
      { contentType, responsePreview: responseText.slice(0, 300) },
      status
    );
  }

  if (!body.success) {
    throw new NinoApiError(body.error.code, body.error.message, body.error.details, response.status);
  }
  return body.data;
}

async function uploadWithProgress<T>(
  path: string,
  body: FormData,
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<T> {
  let token = getAccessToken();
  if (!token) {
    redirectToLogin();
    throw new NinoApiError("AUTH_REQUIRED", "Connexion requise.", {}, 401);
  }

  const upload = (authToken: string) =>
    new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}${path}`);
      xhr.withCredentials = true;
      xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress({ loaded: event.loaded, total: event.total });
          }
        };
      }

      xhr.onload = () => {
        let body: ApiResponse<T> | null = null;
        if (xhr.responseText) {
          try {
            body = JSON.parse(xhr.responseText) as ApiResponse<T>;
          } catch {
            body = null;
          }
        }

        if (!body) {
          const status = xhr.status || 0;
          const statusLabel = status ? ` (HTTP ${status})` : "";
          const message = status === 413
            ? "Le fichier dépasse la taille autorisée par le serveur ou son proxy."
            : status === 400
              ? "Le serveur a refusé les données de l’upload. Vérifiez la taille du fichier et la configuration du proxy."
              : status >= 500
                ? "Le serveur a rencontré une erreur pendant la requête."
                : "Le serveur a renvoyé une réponse illisible.";
          reject(new NinoApiError("INVALID_SERVER_RESPONSE", `${message}${statusLabel}`, {
            contentType: xhr.getResponseHeader("content-type") ?? "",
            responsePreview: xhr.responseText.slice(0, 300)
          }, status));
          return;
        }

        if (!body.success) {
          reject(new NinoApiError(body.error.code, body.error.message, body.error.details, xhr.status));
          return;
        }
        resolve(body.data);
      };

      xhr.onerror = () => {
        reject(new NinoApiError("NETWORK_ERROR", "Impossible de contacter le serveur. Vérifiez votre connexion.", { cause: "network" }, 0));
      };

      xhr.send(body);
    });

  try {
    return await upload(token);
  } catch (error) {
    if (error instanceof NinoApiError && error.status === 401) {
      try {
        token = await refreshAccessToken();
        return await upload(token);
      } catch (refreshError) {
        redirectToLogin();
        throw refreshError;
      }
    }
    throw error;
  }
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
  media: (kind?: string, profileId?: string | null, pageSize = 24, page = 1) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (profileId) params.set("profile_id", profileId);
    params.set("page_size", String(pageSize));
    params.set("page", String(page));
    return request<MediaItem[]>(`/api/v1/media?${params.toString()}`);
  },
  mediaDetail: (id: string, profileId?: string | null) =>
    request<MediaItem>(`/api/v1/media/${id}${profileId ? `?profile_id=${profileId}` : ""}`),
  mediaThumbnail: (id: string) =>
    request<MediaItem>(`/api/v1/media/${encodeURIComponent(id)}/thumbnail`, { method: "POST" }),
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
  adminTranscodeWorkerStatus: () => request<TranscodeWorkerControl>("/api/v1/admin/transcode/worker"),
  adminTranscodeWorkerStart: () => request<TranscodeWorkerControl>("/api/v1/admin/transcode/worker/start", { method: "POST" }),
  adminTranscodeWorkerStop: () => request<TranscodeWorkerControl>("/api/v1/admin/transcode/worker/stop", { method: "POST" }),
  adminTranscodeRetry: (jobId: string) =>
    request<TranscodeJob>(`/api/v1/admin/transcode/jobs/${encodeURIComponent(jobId)}/retry`, { method: "POST" }),
  adminTranscodeLive: (onSnapshot: (data: TranscodeSnapshot) => void, onError?: () => void): (() => void) => {
    const token = getAccessToken();
    if (!token) {
      redirectToLogin();
      return () => {};
    }
    const controller = new AbortController();
    const consume = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/transcode/live`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!response.body) {
          onError?.();
          return;
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            if (!controller.signal.aborted) onError?.();
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const raw = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const dataLine = raw.split("\n").find((line) => line.startsWith("data: "));
            if (dataLine) {
              try {
                const payload = JSON.parse(dataLine.slice(6)) as ApiResponse<TranscodeSnapshot>;
                if (payload.success) onSnapshot(payload.data);
              } catch {
                // frame ignoré
              }
            }
            boundary = buffer.indexOf("\n\n");
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) onError?.();
      }
    };
    void consume();
    return () => controller.abort();
  },
  createAdminMedia: (
    payload: MediaWritePayload & { source_mode: "file" | "hls" },
    files: File[],
    onProgress?: (progress: { loaded: number; total: number }) => void
  ) => {
    const form = new FormData();
    form.append("payload", JSON.stringify(payload));
    files.forEach((file) => {
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      form.append("files", file, file.name);
      form.append("asset_paths", relativePath);
    });
    return uploadWithProgress<MediaItem>("/api/v1/admin/media", form, onProgress);
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
