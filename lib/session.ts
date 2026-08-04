"use client";

const ACCESS_KEY = "nino.access";
const REFRESH_KEY = "nino.refresh";
const PROFILE_KEY = "nino.profile";

export function getAccessToken() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_KEY);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  window.localStorage.setItem(ACCESS_KEY, accessToken);
  window.localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  clearSession();
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

export function getProfileId() {
  return typeof window === "undefined" ? null : window.localStorage.getItem(PROFILE_KEY);
}

export function saveProfileId(profileId: string) {
  window.localStorage.setItem(PROFILE_KEY, profileId);
}
