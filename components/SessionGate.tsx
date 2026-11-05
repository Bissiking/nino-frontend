"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LoadingState } from "./StateBlock";
import { getAccessToken, redirectToLogin } from "@/lib/session";

const PUBLIC_ROUTES = new Set(["/login", "/auth/callback"]);

export function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authorizedPath, setAuthorizedPath] = useState<string | null>(null);
  // The isolated UI workshop is public only in next dev; its server page is 404 in production.
  const isPublicRoute = PUBLIC_ROUTES.has(pathname) || (process.env.NODE_ENV === "development" && pathname === "/dev/ui");

  useEffect(() => {
    if (isPublicRoute) {
      setAuthorizedPath(null);
      return;
    }

    if (!getAccessToken()) {
      setAuthorizedPath(null);
      redirectToLogin();
      return;
    }

    setAuthorizedPath(pathname);
  }, [isPublicRoute, pathname]);

  if (isPublicRoute) return children;
  if (authorizedPath !== pathname) {
    return <LoadingState label="Ouverture de votre espace…" fullScreen />;
  }

  return children;
}
