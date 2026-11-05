"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/icons";
import { api } from "@/lib/api";
import { Alert, Button, Loader, UiTheme } from "@/components/ui";
import styles from "./login.module.css";
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
    <UiTheme>
      <main className={styles.screen}>
        <header className={styles.brand}><Image src="/logo_nino.png" alt="Nino" width={139} height={53} priority /></header>
        <div className={styles.content}>
          <div className={styles.intro}>
            <h1>Vos programmes. Votre moment.</h1>
            <p>Retrouvez vos séries, vos vidéos et la suite de vos découvertes dans votre espace Nino.</p>
          </div>
          <section className={styles.panel} aria-labelledby="login-title" aria-busy={configLoading || ssoLoading}>
            <h2 id="login-title">Bienvenue chez vous.</h2>
            <p>Connectez-vous pour retrouver votre profil et reprendre votre lecture.</p>
            {configLoading ? <Loader label="Préparation de la connexion…" /> : null}
            {config?.sso_enabled ? (
              <Button onClick={startSso} busy={ssoLoading} disabled={configLoading}>
                <Icon name="shield-check" size={19} />
                {ssoLoading ? "Redirection vers Kyros…" : "Continuer avec Kyros"}
              </Button>
            ) : null}
            {!configLoading && config && !config.sso_enabled ? <Alert title="Connexion indisponible" tone="warning">L’accès n’est pas encore configuré. Contactez l’administrateur de Nino.</Alert> : null}
            {error ? <Alert title={config ? "La connexion n’a pas pu démarrer" : "Nino est momentanément inaccessible"} tone="warning" urgent>{error}</Alert> : null}
            {error && !config ? <Button variant="secondary" onClick={loadConfig} disabled={configLoading}>Réessayer</Button> : null}
          </section>
        </div>
        <footer className={styles.footer}>Votre espace privé, à partager avec vos proches.</footer>
      </main>
    </UiTheme>
  );
}
