"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { saveTokens } from "@/lib/session";

export default function AuthCallbackPage() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setError("Kyros n’a pas renvoyé les informations nécessaires. Recommencez la connexion.");
      return;
    }

    void api.completeSso(code, state)
      .then((tokens) => {
        saveTokens(tokens.access_token, tokens.refresh_token);
        window.history.replaceState({}, "", "/auth/callback");
        router.replace("/profiles");
      })
      .catch((err) => {
        window.history.replaceState({}, "", "/auth/callback");
        setError(err instanceof Error ? err.message : "La connexion SSO n’a pas pu être finalisée.");
      });
  }, [router]);

  return (
    <main className="authScreen">
      <section className="authPanel authCallbackPanel" aria-busy={!error}>
        <div className="authBrand"><Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority /></div>
        <ShieldCheck className="authCallbackIcon" size={34} aria-hidden="true" />
        <div className="authIntro">
          <h1>{error ? "Connexion interrompue" : "Connexion en cours"}</h1>
          <p>{error ?? "Nous vérifions votre session Kyros avant d’ouvrir Nino."}</p>
        </div>
        {error ? <Link className="primaryButton wide" href="/login">Revenir à la connexion</Link> : <p className="authStatus" role="status">Finalisation sécurisée…</p>}
      </section>
    </main>
  );
}
