"use client";

import type { ApiResponse, HomePayload, MediaItem, NotificationItem, Profile, StreamDecision, TokenPair, User } from "@/types/nino";
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

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers
    }
  });
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
  login: (identifier: string, password: string) =>
    request<TokenPair>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: identifier, password })
    }, false),
  me: () => request<User>("/api/v1/me"),
  profiles: () => request<Profile[]>("/api/v1/profiles"),
  home: (profileId?: string | null) => request<HomePayload>(`/api/v1/home${profileId ? `?profile_id=${profileId}` : ""}`),
  media: (kind?: string, profileId?: string | null) => {
    const params = new URLSearchParams();
    if (kind) params.set("kind", kind);
    if (profileId) params.set("profile_id", profileId);
    return request<MediaItem[]>(`/api/v1/media?${params.toString()}`);
  },
  mediaDetail: (id: string, profileId?: string | null) =>
    request<MediaItem>(`/api/v1/media/${id}${profileId ? `?profile_id=${profileId}` : ""}`),
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
  adminStats: () =>
    request<{ users: number; libraries: number; media: number; transcode_jobs: number; scan_jobs: number }>("/api/v1/admin/stats")
};
