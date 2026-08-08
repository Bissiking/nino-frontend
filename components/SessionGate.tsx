"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getAccessToken, redirectToLogin } from "@/lib/session";

const PUBLIC_ROUTES = new Set(["/login", "/auth/callback"]);

export function SessionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [authorizedPath, setAuthorizedPath] = useState<string | null>(null);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

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
    return <div className="sessionGate" aria-label="Redirection vers la connexion" aria-busy="true" />;
  }

  return children;
}
