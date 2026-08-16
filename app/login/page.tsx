"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { AuthConfig } from "@/types/nino";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [config, setConfig] = useState<AuthConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    setError(null);
    try {
      setConfig(await api.authConfig());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les options de connexion.");
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function startSso() {
    setSsoLoading(true);
    setError(null);
    try {
      const { authorize_url: authorizeUrl } = await api.startSso();
      window.location.assign(authorizeUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "La connexion Kyros n’a pas pu démarrer.");
      setSsoLoading(false);
    }
  }

  return (
    <main className="authScreen">
      <section className="authPanel" aria-busy={configLoading || ssoLoading}>
        <div className="authBrand"><Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority /></div>
        <div className="authIntro"><h1>Bon retour sur Nino</h1><p>Connectez-vous pour retrouver vos programmes et votre profil.</p></div>
        {config?.sso_enabled ? (
          <button className="primaryButton wide" type="button" onClick={startSso} disabled={ssoLoading || configLoading}>
            <ShieldCheck size={19} aria-hidden="true" />
            {ssoLoading ? "Redirection vers Kyros…" : "Continuer avec Kyros"}
          </button>
        ) : null}
        {!configLoading && config && !config.sso_enabled ? <p className="formError" role="alert">Aucune méthode de connexion disponible. Contactez l’administrateur.</p> : null}
        {error ? <p className="formError" role="alert">{error}</p> : null}
        {error && !config ? <button className="secondaryButton wide" type="button" onClick={loadConfig} disabled={configLoading}>Réessayer</button> : null}
        {configLoading ? <p className="authStatus" role="status">Chargement des options de connexion…</p> : null}
      </section>
    </main>
  );
}